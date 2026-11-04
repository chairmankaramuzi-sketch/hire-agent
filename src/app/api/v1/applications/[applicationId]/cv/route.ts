import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { storageService, verifyDownloadToken } from '@/lib/storage';
import { getSession, requireRole, canAccessApplication } from '@/lib/auth';
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

  const cvAsset = await prisma.cvAsset.findUnique({
    where: { applicationId: params.applicationId },
  });

  if (!cvAsset) {
    return apiError('NOT_FOUND', 'CV file not found', 404, requestId);
  }

  const expiresNum = Number(expires);
  // Cryptographically verify signed HMAC token and expiration
  if (!token || !expires || isNaN(expiresNum) || !verifyDownloadToken(cvAsset.storageKey, expiresNum, token)) {
    return apiError('UNAUTHORIZED', 'Invalid or expired download token', 401, requestId);
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
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN, UserRole.APPLICANT], session, requestId);
  if (authError) return authError;

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { cvAsset: true },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  if (!canAccessApplication(session!, application)) {
    return apiError('FORBIDDEN', 'Insufficient permissions to delete this application', 403, requestId);
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
    actorUserId: session!.userId,
    action: 'APPLICATION_DELETED',
    resourceType: 'APPLICATION',
    resourceId: params.applicationId,
    requestId,
    metadata: { reason: 'Applicant GDPR / Data Retention purge' },
  });

  return apiSuccess({ deleted: true }, undefined, requestId);
}
