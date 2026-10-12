import { NextRequest } from 'next/server';
import { UserRole, ApplicationStatus, DecisionKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { hrDecisionSchema } from '@/lib/validators/reviewValidators';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Malformed JSON body', 400, requestId);
  }

  const parseResult = hrDecisionSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('VALIDATION_ERROR', 'A valid decision and reason are required', 400, requestId, parseResult.error.format());
  }

  const { decision, reason } = parseResult.data;

  // Determine application status transition
  let nextStatus: ApplicationStatus;
  if (decision === DecisionKind.SHORTLISTED) {
    nextStatus = ApplicationStatus.SHORTLISTED;
  } else if (decision === DecisionKind.REJECTED) {
    nextStatus = ApplicationStatus.REJECTED;
  } else {
    nextStatus = ApplicationStatus.READY_FOR_REVIEW; // HOLD stays in review
  }

  const result = await prisma.$transaction(async tx => {
    // Ensure decider user exists in DB
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

    const hrDecisionRecord = await tx.hrDecision.create({
      data: {
        applicationId: params.applicationId,
        decidedBy: session!.userId,
        decision,
        reason: reason.trim(),
      },
    });

    const updatedApp = await tx.application.update({
      where: { id: params.applicationId },
      data: { status: nextStatus },
    });

    return { hrDecisionRecord, updatedApp };
  });

  await recordAuditEvent({
    actorUserId: session!.userId,
    action: 'HR_DECISION_RECORDED',
    resourceType: 'APPLICATION',
    resourceId: params.applicationId,
    requestId,
    metadata: {
      decision,
      reason: reason.trim(),
      resultingStatus: nextStatus,
    },
  });

  return apiSuccess(
    {
      decisionId: result.hrDecisionRecord.id,
      applicationId: result.updatedApp.id,
      decision,
      status: result.updatedApp.status,
      reason,
      createdAt: result.hrDecisionRecord.createdAt,
    },
    undefined,
    requestId,
    201
  );
}
