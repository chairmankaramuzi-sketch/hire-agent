import { NextRequest } from 'next/server';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId') || undefined;
  const search = url.searchParams.get('search')?.trim() || undefined;
  const statusParam = url.searchParams.get('status') || undefined;
  const queue = url.searchParams.get('queue') || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: any = {};

  if (jobId) {
    where.jobId = jobId;
  }

  if (statusParam && Object.values(ApplicationStatus).includes(statusParam as ApplicationStatus)) {
    where.status = statusParam as ApplicationStatus;
  }

  if (search) {
    where.OR = [
      { applicantName: { contains: search, mode: 'insensitive' } },
      { applicantEmail: { contains: search, mode: 'insensitive' } },
      { job: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }

  try {
    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              status: true,
            },
          },
          cvAsset: true,
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
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              author: {
                select: { id: true, displayName: true, email: true },
              },
            },
          },
          extractions: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              evidence: {
                orderBy: { fieldKey: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    let activeVacancies = 0;
    try {
      activeVacancies = await prisma.job.count({ where: { status: 'PUBLISHED' } });
    } catch {}

    const awaitingReviewCount = applications.filter(
      (a) =>
        a.decisions.length === 0 &&
        ['SUBMITTED', 'PROCESSING', 'NEEDS_MANUAL_REVIEW', 'READY_FOR_REVIEW'].includes(a.status)
    ).length;

    const failedExtractions = applications.filter(
      (a) => a.status === 'NEEDS_MANUAL_REVIEW'
    ).length;

    let filteredApplications = applications;

    // Filter by queue if requested
    if (queue && queue !== 'ALL') {
      if (queue === 'ELIGIBLE') {
        filteredApplications = applications.filter(
          (a) =>
            a.screenings[0]?.outcome === 'RECOMMENDED' ||
            a.status === 'SHORTLISTED' ||
            a.status === 'READY_FOR_REVIEW'
        );
      } else if (queue === 'INELIGIBLE') {
        filteredApplications = applications.filter(
          (a) =>
            a.screenings[0]?.outcome === 'NOT_RECOMMENDED' ||
            a.status === 'REJECTED'
        );
      } else if (queue === 'NEEDS_REVIEW') {
        filteredApplications = applications.filter(
          (a) =>
            a.status === 'NEEDS_MANUAL_REVIEW' ||
            a.screenings[0]?.outcome === 'NEEDS_MANUAL_REVIEW' ||
            a.screenings[0]?.outcome === 'NEEDS_REVIEW' ||
            !a.screenings[0]
        );
      }
    }

    const serializedApplications = filteredApplications.map((app) => ({
      ...app,
      cvAsset: app.cvAsset
        ? {
            ...app.cvAsset,
            sizeBytes: app.cvAsset.sizeBytes.toString(),
          }
        : null,
    }));

    return apiSuccess(
      serializedApplications,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        metrics: {
          totalApplications: total,
          activeVacancies,
          awaitingReview: awaitingReviewCount,
          processingFailures: failedExtractions,
        },
      },
      requestId
    );
  } catch (err: any) {
    return apiError('INTERNAL_ERROR', err?.message || 'Failed to list applications', 500, requestId);
  }
}
