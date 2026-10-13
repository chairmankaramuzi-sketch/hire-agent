import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { SESSION_COOKIE_NAME, serializeSession, AuthSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

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

  if (!password || password.length < 3) {
    return apiError('INVALID_PASSWORD', 'Password is required and must be at least 3 characters', 400, requestId);
  }

  // Find user in database or demo defaults
  let matchedUser = await prisma.appUser.findFirst({
    where: {
      email: { equals: rawUsername, mode: 'insensitive' },
    },
  });

  // If not found by exact email, allow standard login aliases
  if (!matchedUser) {
    if (rawUsername.includes('admin')) {
      matchedUser = await prisma.appUser.findUnique({ where: { id: 'usr-admin-001' } });
      if (!matchedUser) {
        matchedUser = await prisma.appUser.upsert({
          where: { email: 'admin@company.com' },
          update: {},
          create: {
            id: 'usr-admin-001',
            email: 'admin@company.com',
            displayName: 'System Admin',
            role: UserRole.ADMIN,
          },
        });
      }
    } else if (rawUsername.includes('hr') || rawUsername.includes('jane')) {
      matchedUser = await prisma.appUser.findUnique({ where: { id: 'usr-hr-001' } });
      if (!matchedUser) {
        matchedUser = await prisma.appUser.upsert({
          where: { email: 'hr@company.com' },
          update: {},
          create: {
            id: 'usr-hr-001',
            email: 'hr@company.com',
            displayName: 'Jane Doe - HR Director',
            role: UserRole.HR,
          },
        });
      }
    }
  }

  if (!matchedUser) {
    return apiError(
      'INVALID_CREDENTIALS',
      'Invalid username or password. Use hr@company.com or admin@company.com',
      401,
      requestId
    );
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
