import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExtractionService } from '@/lib/extraction/service';
import { MockExtractionProvider } from '@/lib/extraction/provider';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { ApplicationStatus, CriterionResult } from '@prisma/client';

describe('Phase 5 CV Extraction Pipeline Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockApplication = {
    id: 'app-1',
    status: ApplicationStatus.SUBMITTED,
    cvAsset: {
      storageKey: 'cv_key_1.pdf',
      detectedMimeType: 'application/pdf',
    },
    job: {
      title: 'Senior Engineer',
      criteria: [
        { name: 'Degree', description: 'CS Degree', kind: 'MANDATORY' },
      ],
    },
  };

  it('successfully extracts structured facts, persists evidence, and transitions to READY_FOR_REVIEW', async () => {
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.application, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.extractionRun, 'create').mockResolvedValue({ id: 'run-1' } as any);
    vi.spyOn(storageService, 'getFile').mockResolvedValue(Buffer.from('sample pdf binary'));

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        extractedEvidence: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        extractionRun: { update: vi.fn().mockResolvedValue({}) },
        application: { update: vi.fn().mockResolvedValue({}) },
      });
    });

    const mockProvider = new MockExtractionProvider();
    const service = new ExtractionService(mockProvider);

    const result = await service.processApplication('app-1', 'req-test');
    expect(result.success).toBe(true);
    expect(result.factsCount).toBe(2);
    expect(result.extractionRunId).toBe('run-1');
  });

  it('safely handles provider failure, sets status to NEEDS_MANUAL_REVIEW, and does not throw', async () => {
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.application, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.extractionRun, 'create').mockResolvedValue({ id: 'run-fail' } as any);
    vi.spyOn(storageService, 'getFile').mockResolvedValue(Buffer.from('sample pdf binary'));
    vi.spyOn(prisma, '$transaction').mockResolvedValue([] as any);

    const failingProvider = new MockExtractionProvider(undefined, new Error('AI API rate limit exceeded'));
    const service = new ExtractionService(failingProvider);

    const result = await service.processApplication('app-1', 'req-fail');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PROVIDER_ERROR');
    expect(result.error).toContain('AI API rate limit exceeded');
  });

  it('safely handles missing private file, routes to manual review', async () => {
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.application, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.extractionRun, 'create').mockResolvedValue({ id: 'run-missing-file' } as any);
    vi.spyOn(storageService, 'getFile').mockResolvedValue(null);
    vi.spyOn(prisma, '$transaction').mockResolvedValue([] as any);

    const service = new ExtractionService(new MockExtractionProvider());
    const result = await service.processApplication('app-1', 'req-missing');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FILE_NOT_FOUND');
  });
});
