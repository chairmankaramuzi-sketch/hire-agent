import { NextRequest } from 'next/server';
import { UserRole, JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { updateJobSchema } from '@/lib/validators/jobValidators';
import { recordAuditEvent } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      criteria: {
        where: { active: true },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!job) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  const isHrOrAdmin = session && (session.role === UserRole.HR || session.role === UserRole.ADMIN);
  // Unauthenticated or applicants can only see PUBLISHED jobs
  if (!isHrOrAdmin && job.status !== JobStatus.PUBLISHED) {
    return apiError('FORBIDDEN', 'This job is not currently accessible', 403, requestId);
  }

  return apiSuccess(
    {
      ...job,
      applicationCount: job._count.applications,
    },
    undefined,
    requestId
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const existingJob = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: { criteria: true },
  });

  if (!existingJob) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Malformed JSON in request body', 400, requestId);
  }

  const parseResult = updateJobSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('VALIDATION_ERROR', 'Invalid update payload', 400, requestId, parseResult.error.format());
  }

  const data = parseResult.data;

  const updatedJob = await prisma.$transaction(async tx => {
    // If criteria are provided, version them up: deactivate old active criteria and insert new version
    if (data.criteria) {
      const latestVersion = existingJob.criteria.reduce(
        (max, c) => (c.version > max ? c.version : max),
        1
      );
      const nextVersion = latestVersion + 1;

      // Deactivate current active criteria
      await tx.screeningCriteria.updateMany({
        where: { jobId: params.jobId, active: true },
        data: { active: false },
      });

      // Insert new criteria version
      await tx.screeningCriteria.createMany({
        data: data.criteria.map(c => ({
          jobId: params.jobId,
          version: nextVersion,
          name: c.name,
          description: c.description,
          kind: c.kind,
          weight: c.weight ?? null,
          configuration: c.configuration ? JSON.parse(JSON.stringify(c.configuration)) : {},
          active: true,
          createdBy: session!.userId,
        })),
      });

      await recordAuditEvent({
        actorUserId: session!.userId,
        action: 'CRITERIA_VERSIONED',
        resourceType: 'JOB',
        resourceId: params.jobId,
        requestId,
        metadata: {
          previousVersion: latestVersion,
          newVersion: nextVersion,
          count: data.criteria.length,
        },
      });
    }

    const jobResult = await tx.job.update({
      where: { id: params.jobId },
      data: {
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        department: data.department !== undefined ? data.department : undefined,
        location: data.location !== undefined ? data.location : undefined,
      },
      include: {
        criteria: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    return jobResult;
  });

  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'JOB_UPDATED',
    resourceType: 'JOB',
    resourceId: params.jobId,
    requestId,
    metadata: { fieldsUpdated: Object.keys(data) },
  });

  return apiSuccess(updatedJob, undefined, requestId);
}
