import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { getSession, requireRole, AuthSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

type SystemHandler<T> = (ctx: { session: AuthSession; requestId: string }) => Promise<T>;

/**
 * Wraps a Danger Zone operation: requires a signed-in ADMIN/HR session,
 * records an audit event, and returns a consistent JSON envelope with timing.
 */
export async function runSystemAction<T extends Record<string, unknown>>(
  request: NextRequest,
  action: string,
  handler: SystemHandler<T>,
  buildMessage: (result: T) => string
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);
  const denied = requireRole([UserRole.ADMIN, UserRole.HR], session, requestId);
  if (denied) return denied;

  const started = Date.now();
  try {
    const result = await handler({ session: session!, requestId });
    const durationMs = Date.now() - started;

    await recordAuditEvent({
      actorUserId: session!.userId,
      action,
      resourceType: 'SYSTEM',
      resourceId: 'all',
      requestId,
      metadata: { ...result, durationMs },
    });

    return apiSuccess({ message: buildMessage(result), durationMs, ...result }, undefined, requestId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    logger.error(`System action ${action} failed`, err, {}, requestId);
    return apiError(`${action}_FAILED`, message, 500, requestId);
  }
}
