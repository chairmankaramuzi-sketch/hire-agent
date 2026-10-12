import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { extractionService } from '@/lib/extraction/service';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  try {
    const result = await extractionService.processApplication(params.applicationId, requestId);

    await recordAuditEvent({
      actorUserId: session!.userId,
      action: 'EXTRACTION_TRIGGERED',
      resourceType: 'APPLICATION',
      resourceId: params.applicationId,
      requestId,
      metadata: { success: result.success },
    });

    if (!result.success) {
      return apiError(
        result.errorCode ?? 'EXTRACTION_FAILED',
        'CV extraction encountered an error and was marked for manual review',
        422,
        requestId,
        result
      );
    }

    return apiSuccess(result, undefined, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing error';
    return apiError('PROCESSING_ERROR', message, 500, requestId);
  }
}
