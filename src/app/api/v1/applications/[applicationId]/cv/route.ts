import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const expires = url.searchParams.get('expires');

  // Verify signed token presence and expiration
  if (!token || !expires || Date.now() > Number(expires)) {
    return apiError('UNAUTHORIZED', 'Invalid or expired download token', 401, requestId);
  }

  const cvAsset = await prisma.cvAsset.findUnique({
    where: { applicationId: params.applicationId },
  });

  if (!cvAsset) {
    return apiError('NOT_FOUND', 'CV file not found', 404, requestId);
  }

  const buffer = await storageService.getFile(cvAsset.storageKey);
  if (!buffer) {
    return apiError('NOT_FOUND', 'CV file data missing from storage', 404, requestId);
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

/**
 * GDPR / Privacy Compliant applicant data deletion endpoint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { cvAsset: true },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  // Delete physical storage asset
  if (application.cvAsset) {
    await storageService.deleteFile(application.cvAsset.storageKey);
  }

  // Delete application record and cascade children
  await prisma.application.delete({
    where: { id: params.applicationId },
  });

  await recordAuditEvent({
    action: 'APPLICATION_DELETED',
    resourceType: 'APPLICATION',
    resourceId: params.applicationId,
    requestId,
    metadata: { reason: 'Applicant GDPR / Data Retention purge' },
  });

  return apiSuccess({ deleted: true }, undefined, requestId);
}
