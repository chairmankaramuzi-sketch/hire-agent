import { prisma } from './prisma';
import { logger } from './logger';

export interface RecordAuditParams {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an immutable audit trail entry for security-relevant HR and system actions.
 */
export async function recordAuditEvent(params: RecordAuditParams) {
  try {
    const event = await prisma.auditEvent.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        requestId: params.requestId ?? null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : {},
      },
    });
    return event;
  } catch (error: unknown) {
    // If foreign key constraint failed on actorUserId (P2003), fallback to unlinked actor
    const prismaErr = error as { code?: string };
    if (params.actorUserId && prismaErr?.code === 'P2003') {
      try {
        return await prisma.auditEvent.create({
          data: {
            actorUserId: null,
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId ?? null,
            requestId: params.requestId ?? null,
            metadata: params.metadata ? { ...params.metadata, unlinkedActorId: params.actorUserId } : {},
          },
        });
      } catch {
        // Fall through to error log
      }
    }

    logger.error('Failed to persist audit event', error, { action: params.action, resourceType: params.resourceType }, params.requestId);
    // Don't throw to avoid breaking primary business flow if audit DB write fails, but log error
    return null;
  }
}
