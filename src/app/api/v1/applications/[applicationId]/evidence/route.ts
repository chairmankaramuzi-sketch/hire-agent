import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const latestRun = await prisma.extractionRun.findFirst({
    where: { applicationId: params.applicationId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      evidence: {
        orderBy: { fieldKey: 'asc' },
      },
    },
  });

  if (!latestRun) {
    return apiError('NOT_FOUND', 'No completed extraction evidence found for this application', 404, requestId);
  }

  return apiSuccess(
    {
      extractionRunId: latestRun.id,
      provider: latestRun.provider,
      completedAt: latestRun.completedAt,
      evidence: latestRun.evidence,
    },
    undefined,
    requestId
  );
}
