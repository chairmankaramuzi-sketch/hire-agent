import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const token = url.searchParams.get('token');
  const expires = url.searchParams.get('expires');

  // Verify signed token presence and expiration
  if (!token || !expires || Date.now() > Number(expires)) {
    return apiError('UNAUTHORIZED', 'Invalid or expired download token', 401, requestId);
  }

  if (!key) {
    return apiError('BAD_REQUEST', 'Missing storage key parameter', 400, requestId);
  }

  const cvAsset = await prisma.cvAsset.findUnique({
    where: { storageKey: key },
  });

  if (!cvAsset) {
    return apiError('NOT_FOUND', 'CV file asset not found', 404, requestId);
  }

  const buffer = await storageService.getFile(cvAsset.storageKey);
  if (!buffer) {
    return apiError('NOT_FOUND', 'CV file binary missing from storage', 404, requestId);
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': cvAsset.detectedMimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(cvAsset.originalFilename)}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
