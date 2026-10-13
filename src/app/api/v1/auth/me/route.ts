import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);
  if (!session) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401, requestId);
  }

  try {
    const user = await prisma.appUser.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
    });

    return apiSuccess(
      user || {
        id: session.userId,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
      undefined,
      requestId
    );
  } catch {
    return apiSuccess(
      {
        id: session.userId,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
      undefined,
      requestId
    );
  }
}
