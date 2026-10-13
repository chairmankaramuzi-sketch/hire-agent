import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';
import { UserRole, JobStatus, CriterionKind } from '@prisma/client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  try {
    // 1. Delete all application-related records
    await prisma.hrDecision.deleteMany({});
    await prisma.reviewNote.deleteMany({});
    await prisma.screeningResult.deleteMany({});
    await prisma.extractedEvidence.deleteMany({});
    await prisma.extractionRun.deleteMany({});
    await prisma.cvAsset.deleteMany({});
    await prisma.application.deleteMany({});

    // 2. Delete all non-seed criteria and jobs
    await prisma.screeningCriteria.deleteMany({});
    await prisma.job.deleteMany({});

    // 3. Ensure base users exist
    const hrUser = await prisma.appUser.upsert({
      where: { email: 'hr@company.com' },
      update: { displayName: 'Jane Doe - HR Director', role: UserRole.HR },
      create: {
        id: 'usr-hr-001',
        email: 'hr@company.com',
        displayName: 'Jane Doe - HR Director',
        role: UserRole.HR,
      },
    });

    await prisma.appUser.upsert({
      where: { email: 'admin@company.com' },
      update: { displayName: 'System Admin', role: UserRole.ADMIN },
      create: {
        id: 'usr-admin-001',
        email: 'admin@company.com',
        displayName: 'System Admin',
        role: UserRole.ADMIN,
      },
    });

    // 4. Re-create clean baseline vacancies
    const job1 = await prisma.job.create({
      data: {
        id: 'job-001',
        title: 'Senior Full-Stack Engineer',
        description: 'Lead development of cloud applications using Next.js, Node.js, and PostgreSQL.',
        department: 'Engineering',
        location: 'Remote',
        status: JobStatus.PUBLISHED,
        createdBy: hrUser.id,
        publishedAt: new Date(),
      },
    });

    await prisma.job.create({
      data: {
        id: 'job-002',
        title: 'Product Manager - AI Platform',
        description: 'Drive strategy, PRDs, and cross-functional execution for AI decision-support tools.',
        department: 'Product',
        location: 'London / Hybrid',
        status: JobStatus.PUBLISHED,
        createdBy: hrUser.id,
        publishedAt: new Date(),
      },
    });

    // 5. Seed 4 clean criteria for Senior Full-Stack Engineer
    const criteriaData = [
      {
        name: 'Computer Science Degree',
        description: 'BSc or MSc degree in Computer Science, Software Engineering, or equivalent accredited qualification.',
        kind: CriterionKind.MANDATORY,
        weight: null,
      },
      {
        name: 'Minimum 3 Years Experience',
        description: 'At least 3 years of commercial production experience in full-stack web applications.',
        kind: CriterionKind.MANDATORY,
        weight: null,
      },
      {
        name: 'Modern Web Stack (TypeScript, React, Node.js)',
        description: 'Demonstrated mastery of TypeScript, modern React hooks, and Node.js server architectures.',
        kind: CriterionKind.WEIGHTED,
        weight: 60,
      },
      {
        name: 'Database & Testing Quality',
        description: 'Relational PostgreSQL design, Prisma ORM, and comprehensive unit/integration testing with Vitest/Jest.',
        kind: CriterionKind.WEIGHTED,
        weight: 40,
      },
    ];

    for (const c of criteriaData) {
      await prisma.screeningCriteria.create({
        data: {
          jobId: job1.id,
          version: 1,
          name: c.name,
          description: c.description,
          kind: c.kind,
          weight: c.weight,
          active: true,
          createdBy: hrUser.id,
        },
      });
    }

    await recordAuditEvent({
      actorUserId: session?.userId || hrUser.id,
      action: 'SYSTEM_RESET',
      resourceType: 'SYSTEM',
      resourceId: 'all',
      requestId,
      metadata: { initializedAt: new Date().toISOString() },
    });

    return apiSuccess(
      { message: 'System successfully reset to clean baseline state', vacancies: 2 },
      undefined,
      requestId
    );
  } catch (err: any) {
    return apiError('RESET_FAILED', err?.message || 'Failed to reset system', 500, requestId);
  }
}
