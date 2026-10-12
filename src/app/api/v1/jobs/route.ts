import { NextRequest } from 'next/server';
import { UserRole, JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { createJobSchema, listJobsQuerySchema } from '@/lib/validators/jobValidators';
import { recordAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const url = new URL(request.url);
  const queryResult = listJobsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!queryResult.success) {
    return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, requestId, queryResult.error.format());
  }

  const { page, limit, status, department } = queryResult.data;
  const skip = (page - 1) * limit;

  // If unauthenticated or applicant, only allow viewing PUBLISHED jobs
  const isHrOrAdmin = session && (session.role === UserRole.HR || session.role === UserRole.ADMIN);
  const statusFilter = isHrOrAdmin
    ? status ? (status as JobStatus) : undefined
    : JobStatus.PUBLISHED;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(department ? { department: { contains: department, mode: 'insensitive' as const } } : {}),
  };

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        criteria: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  return apiSuccess(
    jobs.map(j => ({
      ...j,
      applicationCount: j._count.applications,
    })),
    {
      total,
      page,
      limit,
    },
    requestId
  );
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Malformed JSON in request body', 400, requestId);
  }

  const parseResult = createJobSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('VALIDATION_ERROR', 'Invalid job payload', 400, requestId, parseResult.error.format());
  }

  const data = parseResult.data;

  // Create job and initial criteria version (v1)
  const job = await prisma.$transaction(async tx => {
    // Ensure creator user exists in DB or create placeholder
    await tx.appUser.upsert({
      where: { id: session!.userId },
      update: {},
      create: {
        id: session!.userId,
        email: session!.email,
        displayName: session!.displayName,
        role: session!.role,
      },
    });

    const createdJob = await tx.job.create({
      data: {
        title: data.title,
        description: data.description,
        department: data.department ?? null,
        location: data.location ?? null,
        status: JobStatus.DRAFT,
        createdBy: session!.userId,
        criteria: {
          create: data.criteria.map(c => ({
            version: 1,
            name: c.name,
            description: c.description,
            kind: c.kind,
            weight: c.weight ?? null,
            configuration: c.configuration ? JSON.parse(JSON.stringify(c.configuration)) : {},
            active: true,
            createdBy: session!.userId,
          })),
        },
      },
      include: {
        criteria: true,
      },
    });

    return createdJob;
  });

  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'JOB_CREATED',
    resourceType: 'JOB',
    resourceId: job.id,
    requestId,
    metadata: { title: job.title, criteriaCount: job.criteria.length },
  });

  return apiSuccess(job, undefined, requestId, 201);
}
