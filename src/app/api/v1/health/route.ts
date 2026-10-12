import { NextRequest } from 'next/server';
import { apiSuccess, generateRequestId } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { getEnv } from '@/lib/env';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const env = getEnv();

  logger.info('Health check requested', { path: '/api/v1/health' }, requestId);

  return apiSuccess(
    {
      status: 'healthy',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    undefined,
    requestId,
    200
  );
}
