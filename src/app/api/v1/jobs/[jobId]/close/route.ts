import { NextRequest } from 'next/server';
import { UserRole, JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
  });

  if (!job) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  if (job.status === JobStatus.CLOSED) {
    return apiError('CONFLICT', 'Job is already closed', 409, requestId);
  }

  const updatedJob = await prisma.job.update({
    where: { id: params.jobId },
    data: {
      status: JobStatus.CLOSED,
      closesAt: new Date(),
    },
    include: {
      criteria: { where: { active: true } },
    },
  });

  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'JOB_CLOSED',
    resourceType: 'JOB',
    resourceId: job.id,
    requestId,
  });

  return apiSuccess(updatedJob, undefined, requestId);
}
