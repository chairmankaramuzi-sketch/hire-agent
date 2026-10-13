import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { getSystemCounts } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);
  const denied = requireRole([UserRole.ADMIN, UserRole.HR], session, requestId);
  if (denied) return denied;

  try {
    return apiSuccess(await getSystemCounts(), undefined, requestId);
  } catch (err: unknown) {
    return apiError('STATUS_FAILED', err instanceof Error ? err.message : 'Failed to load status', 500, requestId);
  }
}
