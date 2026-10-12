import { NextRequest } from 'next/server';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { listJobApplicationsQuerySchema } from '@/lib/validators/reviewValidators';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const url = new URL(request.url);
  const queryResult = listJobApplicationsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!queryResult.success) {
    return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, requestId, queryResult.error.format());
  }

  const { page, limit, status } = queryResult.data;
  const skip = (page - 1) * limit;

  const where = {
    jobId: params.jobId,
    ...(status ? { status: status as ApplicationStatus } : {}),
  };

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        screenings: {
          orderBy: { criteriaVersion: 'desc' },
          take: 1,
        },
        decisions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            decider: {
              select: { id: true, displayName: true, email: true },
            },
          },
        },
      },
    }),
  ]);

  return apiSuccess(
    applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      applicantName: app.applicantName,
      applicantEmail: app.applicantEmail,
      status: app.status,
      submittedAt: app.submittedAt,
      latestScreening: app.screenings[0] ?? null,
      latestDecision: app.decisions[0] ?? null,
    })),
    {
      total,
      page,
      limit,
    },
    requestId
  );
}
