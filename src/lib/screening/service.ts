import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { evaluateScreening, CriterionEvaluationInput, FactEvidenceInput } from './engine';
import { ApplicationStatus, CriterionKind } from '@prisma/client';

export class ScreeningService {
  async runScreening(applicationId: string, requestId?: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            criteria: { where: { active: true } },
          },
        },
        extractions: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            evidence: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const latestRun = application.extractions[0];
    if (!latestRun) {
      throw new Error(`No completed extraction run found for application ${applicationId}`);
    }

    const criteriaList: CriterionEvaluationInput[] = application.job.criteria.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      kind: c.kind,
      weight: c.weight ? Number(c.weight) : null,
      configuration: (c.configuration as Record<string, unknown>) ?? {},
    }));

    const evidenceList: FactEvidenceInput[] = latestRun.evidence.map(e => ({
      fieldKey: e.fieldKey,
      normalizedValue: e.normalizedValue,
      evidenceText: e.evidenceText,
      confidence: e.confidence ? Number(e.confidence) : null,
      evidenceStatus: e.evidenceStatus,
    }));

    const criteriaVersion = application.job.criteria[0]?.version ?? 1;

    // Run pure deterministic evaluation
    const evaluation = evaluateScreening(criteriaVersion, criteriaList, evidenceList);

    // Save or update screening result for this criteria version
    const screeningRecord = await prisma.$transaction(async tx => {
      const result = await tx.screeningResult.upsert({
        where: {
          applicationId_criteriaVersion: {
            applicationId,
            criteriaVersion,
          },
        },
        create: {
          applicationId,
          criteriaVersion,
          totalScore: evaluation.totalScore,
          maxScore: evaluation.maxScore,
          outcome: evaluation.outcome,
          breakdown: JSON.parse(JSON.stringify(evaluation.breakdown)),
        },
        update: {
          totalScore: evaluation.totalScore,
          maxScore: evaluation.maxScore,
          outcome: evaluation.outcome,
          breakdown: JSON.parse(JSON.stringify(evaluation.breakdown)),
        },
      });

      // Update application status based on recommendation
      const nextStatus =
        evaluation.outcome === 'NEEDS_MANUAL_REVIEW'
          ? ApplicationStatus.NEEDS_MANUAL_REVIEW
          : ApplicationStatus.READY_FOR_REVIEW;

      await tx.application.update({
        where: { id: applicationId },
        data: { status: nextStatus },
      });

      return result;
    });

    logger.info(
      'Deterministic screening completed',
      {
        applicationId,
        criteriaVersion,
        outcome: evaluation.outcome,
        totalScore: evaluation.totalScore,
      },
      requestId
    );

    return {
      screeningId: screeningRecord.id,
      evaluation,
    };
  }
}

export const screeningService = new ScreeningService();
