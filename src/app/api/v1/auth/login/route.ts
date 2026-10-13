import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { SESSION_COOKIE_NAME, serializeSession, AuthSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Request body must be valid JSON', 400, requestId);
  }

  const rawUsername = (body.email || body.username || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  if (!rawUsername) {
    return apiError('MISSING_CREDENTIALS', 'Email or username is required', 400, requestId);
  }

  if (!password) {
    return apiError('INVALID_PASSWORD', 'Password is required', 400, requestId);
  }

  // Look up by email or username
  const matchedUser = await prisma.appUser.findFirst({
    where: {
      OR: [
        { email: { equals: rawUsername, mode: 'insensitive' } },
        { username: { equals: rawUsername, mode: 'insensitive' } },
      ],
    },
  });

  const passwordOk = await verifyPassword(password, matchedUser?.passwordHash);

  if (!matchedUser || !passwordOk) {
    return apiError(
      'INVALID_CREDENTIALS',
      matchedUser && !matchedUser.passwordHash
        ? 'This account has no password set. Run "npm run db:seed" to restore the seeded test users.'
        : 'Invalid username or password.',
      401,
      requestId
    );
  }

  if (matchedUser.role === UserRole.APPLICANT) {
    return apiError('FORBIDDEN', 'Applicant accounts do not have access to the HR portal.', 403, requestId);
  }

  const session: AuthSession = {
    userId: matchedUser.id,
    email: matchedUser.email,
    role: matchedUser.role,
    displayName: matchedUser.displayName,
  };

  const token = serializeSession(session);

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.displayName,
        displayName: matchedUser.displayName,
        role: matchedUser.role,
      },
      token,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });

  // Set auth cookie
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
