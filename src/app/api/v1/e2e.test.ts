import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createJob } from '@/app/api/v1/jobs/route';
import { POST as publishJob } from '@/app/api/v1/jobs/[jobId]/publish/route';
import { POST as submitApplication } from '@/app/api/v1/jobs/[jobId]/applications/route';
import { ExtractionService } from '@/lib/extraction/service';
import { MockExtractionProvider } from '@/lib/extraction/provider';
import { ScreeningService } from '@/lib/screening/service';
import { POST as recordDecision } from '@/app/api/v1/applications/[applicationId]/decision/route';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { JobStatus, ApplicationStatus, CriterionKind, CriterionResult, DecisionKind } from '@prisma/client';

describe('Phase 8 End-to-End Recruitment Lifecycle Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValue({ id: 'mock-audit' } as any);
  });

  const hrHeaders = {
    'x-user-id': 'hr-manager-1',
    'x-user-role': 'HR',
    'x-user-email': 'hr@company.com',
    'x-user-name': 'HR Manager',
  };

  it(
    'runs complete lifecycle: create job -> publish -> apply -> extract -> screen -> HR decision',
    async () => {
    // 1. Create Job with mandatory and weighted criteria
    const jobRecord = {
      id: 'job-e2e-1',
      title: 'Senior Software Engineer',
      description: 'Build backend cloud microservices.',
      status: JobStatus.DRAFT,
      createdBy: 'hr-manager-1',
      criteria: [
        {
          id: 'c-degree',
          jobId: 'job-e2e-1',
          version: 1,
          name: 'Computer Science Degree',
          description: 'BSc in CS or related field',
          kind: CriterionKind.MANDATORY,
          weight: null,
          active: true,
        },
        {
          id: 'c-exp',
          jobId: 'job-e2e-1',
          version: 1,
          name: 'Years Experience',
          description: 'At least 3 years',
          kind: CriterionKind.WEIGHTED,
          weight: 100,
          active: true,
        },
      ],
      _count: { applications: 0 },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        appUser: { upsert: vi.fn().mockResolvedValue({}) },
        job: { create: vi.fn().mockResolvedValue(jobRecord) },
      });
    });

    const createReq = new NextRequest('http://localhost:3000/api/v1/jobs', {
      method: 'POST',
      headers: hrHeaders,
      body: JSON.stringify({
        title: 'Senior Software Engineer',
        description: 'Build backend cloud microservices.',
        criteria: [
          {
            name: 'Computer Science Degree',
            description: 'BSc in CS or related field',
            kind: CriterionKind.MANDATORY,
          },
          {
            name: 'Years Experience',
            description: 'At least 3 years',
            kind: CriterionKind.WEIGHTED,
            weight: 100,
          },
        ],
      }),
    });

    const createRes = await createJob(createReq);
    expect(createRes.status).toBe(201);
    const jobData = (await createRes.json()).data;
    expect(jobData.id).toBe('job-e2e-1');

    // 2. Publish Job
    vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(jobRecord as any);
    vi.spyOn(prisma.job, 'update').mockResolvedValue({
      ...jobRecord,
      status: JobStatus.PUBLISHED,
    } as any);

    const publishReq = new NextRequest('http://localhost:3000/api/v1/jobs/job-e2e-1/publish', {
      method: 'POST',
      headers: hrHeaders,
    });
    const publishRes = await publishJob(publishReq, { params: { jobId: 'job-e2e-1' } });
    expect(publishRes.status).toBe(200);

    // 3. Candidate Submits Application with CV
    vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({
      ...jobRecord,
      status: JobStatus.PUBLISHED,
    } as any);
    vi.spyOn(prisma.application, 'findFirst').mockResolvedValue(null);
    vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
      storageKey: 'cv_e2e_storage_key.pdf',
      originalFilename: 'candidate_cv.pdf',
      detectedMimeType: 'application/pdf',
      sizeBytes: 15000,
      sha256Hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    const appRecord = {
      id: 'app-e2e-1',
      jobId: 'job-e2e-1',
      applicantName: 'Sarah Connor',
      applicantEmail: 'sarah@example.com',
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
      cvAsset: {
        storageKey: 'cv_e2e_storage_key.pdf',
        detectedMimeType: 'application/pdf',
      },
      job: {
        title: 'Senior Software Engineer',
        criteria: jobRecord.criteria,
      },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        application: { create: vi.fn().mockResolvedValue(appRecord) },
      });
    });

    const mockFormData = new Map<string, any>();
    mockFormData.set('applicantName', 'Sarah Connor');
    mockFormData.set('applicantEmail', 'sarah@example.com');
    mockFormData.set('cv', {
      name: 'candidate_cv.pdf',
      type: 'application/pdf',
      size: 15000,
      arrayBuffer: async () => new ArrayBuffer(15000),
    });

    const applyReq = new NextRequest('http://localhost:3000/api/v1/jobs/job-e2e-1/applications', {
      method: 'POST',
    });
    vi.spyOn(applyReq, 'formData').mockResolvedValue(mockFormData as any);

    const applyRes = await submitApplication(applyReq, { params: { jobId: 'job-e2e-1' } });
    expect(applyRes.status).toBe(201);
    const appData = (await applyRes.json()).data;
    expect(appData.id).toBe('app-e2e-1');

    // 4. CV Extraction Pipeline
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue(appRecord as any);
    vi.spyOn(prisma.application, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.extractionRun, 'create').mockResolvedValue({ id: 'run-e2e-1' } as any);
    vi.spyOn(storageService, 'getFile').mockResolvedValue(Buffer.from('binary-pdf-content'));

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        extractedEvidence: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        extractionRun: { update: vi.fn().mockResolvedValue({}) },
        application: { update: vi.fn().mockResolvedValue({}) },
      });
    });

    const mockAiProvider = new MockExtractionProvider({
      facts: [
        {
          fieldKey: 'Computer Science Degree',
          normalizedValue: 'BSc Computer Science',
          evidenceText: 'Graduated with BSc in Computer Science',
          confidence: 0.95,
          evidenceStatus: CriterionResult.MET,
        },
        {
          fieldKey: 'Years Experience',
          normalizedValue: 5,
          evidenceText: '5 years of professional software engineering',
          confidence: 0.98,
          evidenceStatus: CriterionResult.MET,
        },
      ],
    });

    const extractionService = new ExtractionService(mockAiProvider);
    const extractionResult = await extractionService.processApplication('app-e2e-1', 'req-e2e');
    expect(extractionResult.success).toBe(true);
    expect(extractionResult.factsCount).toBe(2);

    // 5. Deterministic Screening
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue({
      ...appRecord,
      extractions: [
        {
          id: 'run-e2e-1',
          status: 'COMPLETED',
          evidence: [
            {
              fieldKey: 'Computer Science Degree',
              evidenceText: 'Graduated with BSc in Computer Science',
              confidence: 0.95,
              evidenceStatus: CriterionResult.MET,
            },
            {
              fieldKey: 'Years Experience',
              evidenceText: '5 years of professional software engineering',
              confidence: 0.98,
              evidenceStatus: CriterionResult.MET,
            },
          ],
        },
      ],
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        screeningResult: {
          upsert: vi.fn().mockResolvedValue({ id: 'screen-1' }),
        },
        application: {
          update: vi.fn().mockResolvedValue({}),
        },
      });
    });

    const screeningService = new ScreeningService();
    const screening = await screeningService.runScreening('app-e2e-1', 'req-e2e');
    expect(screening.evaluation.outcome).toBe('RECOMMENDED');
    expect(screening.evaluation.totalScore).toBe(100);
    expect(screening.evaluation.mandatoryPassed).toBe(true);

    // 6. HR Review and Final Hiring Decision
    vi.spyOn(prisma.application, 'findUnique').mockResolvedValue({
      ...appRecord,
      status: ApplicationStatus.READY_FOR_REVIEW,
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb({
        appUser: { upsert: vi.fn().mockResolvedValue({}) },
        hrDecision: {
          create: vi.fn().mockResolvedValue({
            id: 'decision-e2e-1',
            decision: DecisionKind.SHORTLISTED,
            createdAt: new Date(),
          }),
        },
        application: {
          update: vi.fn().mockResolvedValue({
            ...appRecord,
            status: ApplicationStatus.SHORTLISTED,
          }),
        },
      });
    });

    const decisionReq = new NextRequest('http://localhost:3000/api/v1/applications/app-e2e-1/decision', {
      method: 'POST',
      headers: hrHeaders,
      body: JSON.stringify({
        decision: DecisionKind.SHORTLISTED,
        reason: 'Candidate meets all mandatory qualifications and has verified experience.',
      }),
    });

    const decisionRes = await recordDecision(decisionReq, { params: { applicationId: 'app-e2e-1' } });
    expect(decisionRes.status).toBe(201);
    const decisionData = (await decisionRes.json()).data;
    expect(decisionData.decision).toBe('SHORTLISTED');
    expect(decisionData.status).toBe('SHORTLISTED');
  }, 30000);
});
