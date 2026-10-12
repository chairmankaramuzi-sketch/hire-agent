import { NextResponse, NextRequest } from 'next/server';

// Lightweight memory-based sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  limit = 30, // 30 requests
  windowMs = 60 * 1000 // per 60 seconds
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply strict security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none';"
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Rate limiting for public submission endpoints
  if (
    request.method === 'POST' &&
    request.nextUrl.pathname.startsWith('/api/v1/jobs/') &&
    request.nextUrl.pathname.includes('/applications')
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const { allowed, remaining } = checkRateLimit(ip, 20, 60 * 1000);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            requestId: crypto.randomUUID ? crypto.randomUUID() : 'rate_limited',
          },
        },
        { status: 429, headers: response.headers }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
