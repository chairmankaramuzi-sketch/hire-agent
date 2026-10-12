import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { storageService } from '@/lib/storage';
import { recordAuditEvent } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const cvAsset = await prisma.cvAsset.findUnique({
    where: { applicationId: params.applicationId },
  });

  if (!cvAsset) {
    return apiError('NOT_FOUND', 'CV asset not found for this application', 404, requestId);
  }

  // Issue short-lived private access URL (expires in 5 minutes)
  const accessUrl = await storageService.generateSignedUrl(cvAsset.storageKey, 300);

  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'CV_ACCESSED',
    resourceType: 'CV_ASSET',
    resourceId: cvAsset.id,
    requestId,
    metadata: {
      applicationId: params.applicationId,
      originalFilename: cvAsset.originalFilename,
    },
  });

  return apiSuccess(
    {
      applicationId: params.applicationId,
      filename: cvAsset.originalFilename,
      mimeType: cvAsset.detectedMimeType,
      accessUrl,
      expiresInSeconds: 300,
    },
    undefined,
    requestId
  );
}
