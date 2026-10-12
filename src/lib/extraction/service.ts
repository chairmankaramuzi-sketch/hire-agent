import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { storageService } from '@/lib/storage';
import { IExtractionProvider, MockExtractionProvider } from './provider';
import { extractionOutputSchema } from './schema';
import { ApplicationStatus, CriterionResult } from '@prisma/client';

export class ExtractionService {
  constructor(private provider: IExtractionProvider = new MockExtractionProvider()) {}

  async processApplication(applicationId: string, requestId?: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        cvAsset: true,
        job: {
          include: {
            criteria: { where: { active: true } },
          },
        },
      },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (!application.cvAsset) {
      throw new Error(`No CV asset found for application ${applicationId}`);
    }

    // 1. Mark application and extraction run as PROCESSING
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.PROCESSING },
    });

    const run = await prisma.extractionRun.create({
      data: {
        applicationId,
        status: 'PROCESSING',
        provider: this.provider.name,
        schemaVersion: 1,
        startedAt: new Date(),
      },
    });

    logger.info(
      'Started CV extraction run',
      { applicationId, extractionRunId: run.id, provider: this.provider.name },
      requestId
    );

    // 2. Load file buffer privately
    const fileBuffer = await storageService.getFile(application.cvAsset.storageKey);
    if (!fileBuffer) {
      await this.recordFailure(run.id, applicationId, 'FILE_NOT_FOUND', 'CV file could not be read from storage', requestId);
      return { success: false, errorCode: 'FILE_NOT_FOUND' };
    }

    // 3. Call AI Provider safely
    let rawOutput: unknown;
    try {
      rawOutput = await this.provider.extract({
        documentBuffer: fileBuffer,
        mimeType: application.cvAsset.detectedMimeType,
        jobTitle: application.job.title,
        criteriaSummary: application.job.criteria.map(c => ({
          name: c.name,
          description: c.description,
          kind: c.kind,
        })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown provider error';
      await this.recordFailure(run.id, applicationId, 'PROVIDER_ERROR', message, requestId);
      return { success: false, errorCode: 'PROVIDER_ERROR', error: message };
    }

    // 4. Validate output against strict Zod schema
    const validation = extractionOutputSchema.safeParse(rawOutput);
    if (!validation.success) {
      await this.recordFailure(run.id, applicationId, 'SCHEMA_VALIDATION_ERROR', 'AI response failed schema validation', requestId);
      return { success: false, errorCode: 'SCHEMA_VALIDATION_ERROR' };
    }

    const data = validation.data;

    // 5. Persist facts and transition application to READY_FOR_REVIEW
    await prisma.$transaction(async tx => {
      // Save all extracted evidence items
      if (data.facts.length > 0) {
        await tx.extractedEvidence.createMany({
          data: data.facts.map(f => ({
            extractionRunId: run.id,
            fieldKey: f.fieldKey,
            normalizedValue: f.normalizedValue ? JSON.parse(JSON.stringify(f.normalizedValue)) : undefined,
            evidenceText: f.evidenceText ?? null,
            pageNumber: f.pageNumber ?? null,
            confidence: f.confidence ?? null,
            evidenceStatus: f.evidenceStatus ?? CriterionResult.UNKNOWN,
          })),
        });
      }

      // Mark run as COMPLETED
      await tx.extractionRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update application status
      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.READY_FOR_REVIEW,
        },
      });
    });

    logger.info(
      'Completed CV extraction run successfully',
      { applicationId, extractionRunId: run.id, factsCount: data.facts.length },
      requestId
    );

    return {
      success: true,
      extractionRunId: run.id,
      factsCount: data.facts.length,
    };
  }

  private async recordFailure(
    runId: string,
    applicationId: string,
    errorCode: string,
    safeMessage: string,
    requestId?: string
  ) {
    logger.warn(
      'Extraction run failed',
      { applicationId, runId, errorCode, safeMessage },
      requestId
    );

    await prisma.$transaction([
      prisma.extractionRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          safeErrorCode: errorCode,
          completedAt: new Date(),
        },
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
        },
      }),
    ]);
  }
}

export const extractionService = new ExtractionService();
