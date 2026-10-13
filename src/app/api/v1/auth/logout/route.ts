import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { generateRequestId } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  const response = NextResponse.json({
    success: true,
    data: { message: 'Logged out successfully' },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });

  // Clear session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
