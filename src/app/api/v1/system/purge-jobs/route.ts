import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  try {
    // Delete applications first to prevent foreign key errors
    await prisma.hrDecision.deleteMany({});
    await prisma.reviewNote.deleteMany({});
    await prisma.screeningResult.deleteMany({});
    await prisma.extractedEvidence.deleteMany({});
    await prisma.extractionRun.deleteMany({});
    await prisma.cvAsset.deleteMany({});
    await prisma.application.deleteMany({});

    // Delete criteria and jobs
    await prisma.screeningCriteria.deleteMany({});
    const deletedJobs = await prisma.job.deleteMany({});

    await recordAuditEvent({
      actorUserId: session?.userId || 'usr-hr-001',
      action: 'JOBS_PURGED',
      resourceType: 'JOB',
      resourceId: 'all',
      requestId,
      metadata: { deletedCount: deletedJobs.count },
    });

    return apiSuccess(
      {
        message: `Removed ${deletedJobs.count} job vacancies and all associated criteria.`,
        deletedCount: deletedJobs.count,
      },
      undefined,
      requestId
    );
  } catch (err: any) {
    return apiError('PURGE_FAILED', err?.message || 'Failed to remove vacancies', 500, requestId);
  }
}
