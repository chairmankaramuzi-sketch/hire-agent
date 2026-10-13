import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { dossierService } from '@/lib/extraction/dossierService';
import { sample30Candidates } from '@/lib/data/sampleCandidates';
import { JobStatus, UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  try {
    // 1. Ensure target job exists (job-001 or first published job)
    let targetJob = await prisma.job.findFirst({
      where: { id: 'job-001', status: JobStatus.PUBLISHED },
    });

    if (!targetJob) {
      targetJob = await prisma.job.findFirst({
        where: { status: JobStatus.PUBLISHED },
      });
    }

    if (!targetJob) {
      // Recreate default job-001 if none exists
      const hrUser = await prisma.appUser.upsert({
        where: { email: 'hr@company.com' },
        update: {},
        create: {
          id: 'usr-hr-001',
          email: 'hr@company.com',
          displayName: 'Jane Doe - HR Director',
          role: UserRole.HR,
        },
      });

      targetJob = await prisma.job.create({
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
    }

    const actorUserId = session?.userId || 'usr-hr-001';

    // 2. Ingest all 30 realistic candidates
    const result = await dossierService.ingestCandidateBatch(
      targetJob.id,
      sample30Candidates,
      actorUserId,
      requestId
    );

    return apiSuccess(
      {
        message: `Successfully ingested and screened ${result.total} real candidate CVs into "${targetJob.title}"`,
        total: result.total,
        jobId: targetJob.id,
        jobTitle: targetJob.title,
      },
      undefined,
      requestId
    );
  } catch (err: any) {
    return apiError('SEED_BATCH_FAILED', err?.message || 'Failed to seed candidate batch', 500, requestId);
  }
}
