import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { id: true, title: true },
  });

  if (!job) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  // Fetch job applications and latest screening outcomes
  const applications = await prisma.application.findMany({
    where: { jobId: params.jobId },
    select: {
      id: true,
      status: true,
      screenings: {
        orderBy: { criteriaVersion: 'desc' },
        take: 1,
        select: {
          outcome: true,
          totalScore: true,
          maxScore: true,
        },
      },
    },
  });

  const totalApplications = applications.length;
  let recommendedCount = 0;
  let notRecommendedCount = 0;
  let needsReviewCount = 0;
  let pendingScreeningCount = 0;
  let scoreSum = 0;
  let scoredCount = 0;

  for (const app of applications) {
    const screening = app.screenings[0];
    if (!screening) {
      pendingScreeningCount++;
      continue;
    }

    if (screening.outcome === 'RECOMMENDED') recommendedCount++;
    else if (screening.outcome === 'NOT_RECOMMENDED') notRecommendedCount++;
    else if (screening.outcome === 'NEEDS_MANUAL_REVIEW') needsReviewCount++;

    if (screening.totalScore !== null) {
      scoreSum += Number(screening.totalScore);
      scoredCount++;
    }
  }

  const averageScore = scoredCount > 0 ? Number((scoreSum / scoredCount).toFixed(2)) : 0;

  return apiSuccess(
    {
      jobId: job.id,
      jobTitle: job.title,
      totalApplications,
      screeningSummary: {
        recommended: recommendedCount,
        notRecommended: notRecommendedCount,
        needsManualReview: needsReviewCount,
        pendingScreening: pendingScreeningCount,
        averageScore,
      },
    },
    undefined,
    requestId
  );
}
