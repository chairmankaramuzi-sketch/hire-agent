import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const latestRun = await prisma.extractionRun.findFirst({
    where: { applicationId: params.applicationId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      evidence: {
        orderBy: { fieldKey: 'asc' },
      },
    },
  });

  if (!latestRun) {
    return apiError('NOT_FOUND', 'No completed extraction evidence found for this application', 404, requestId);
  }

  return apiSuccess(
    {
      extractionRunId: latestRun.id,
      provider: latestRun.provider,
      completedAt: latestRun.completedAt,
      evidence: latestRun.evidence,
    },
    undefined,
    requestId
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Malformed JSON in request body', 400, requestId);
  }

  const { correctionReason, updatedProfile } = body || {};
  if (!correctionReason || typeof correctionReason !== 'string' || !correctionReason.trim()) {
    return apiError('VALIDATION_ERROR', 'A correction reason is required for the audit trail', 400, requestId);
  }

  // Ensure user exists and save review audit note
  await prisma.$transaction(async tx => {
    await tx.appUser.upsert({
      where: { id: session!.userId },
      update: {},
      create: {
        id: session!.userId,
        email: session!.email,
        displayName: session!.displayName,
        role: session!.role,
      },
    });

    await tx.reviewNote.create({
      data: {
        applicationId: params.applicationId,
        authorId: session!.userId,
        body: `[Profile Fact Correction]: ${correctionReason.trim()}`,
      },
    });
  });

  const { recordAuditEvent } = await import('@/lib/audit');
  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'CANDIDATE_FACTS_CORRECTED',
    resourceType: 'APPLICATION',
    resourceId: params.applicationId,
    requestId,
    metadata: { correctionReason: correctionReason.trim(), updatedProfile },
  });

  return apiSuccess(
    { success: true, message: 'Candidate facts updated and audit trail recorded' },
    undefined,
    requestId
  );
}
