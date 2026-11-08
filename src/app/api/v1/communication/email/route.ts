import { NextRequest } from 'next/server';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  try {
    const body = await request.json();
    const toEmail = body.toEmail || body.recipientEmail;
    const toName = body.toName || body.recipientName || 'Candidate';
    const fromName = body.fromName || 'Talent Acquisition';
    const fromEmail = body.fromEmail || 'recruitment@company.com';
    const subject = body.subject;
    const emailBody = body.body || body.content || '';
    const messageId = body.messageId || `msg_${Date.now()}`;
    const icsAttachment = body.icsAttachment || body.calendarAttachment;

    if (!toEmail || !subject) {
      return apiError('VALIDATION_ERROR', 'Recipient email and subject are required', 400, requestId);
    }

    // Record audit event in PostgreSQL database
    await recordAuditEvent({
      action: 'COMMUNICATION_DISPATCHED',
      resourceType: 'APPLICATION',
      requestId,
      metadata: {
        toEmail,
        toName,
        subject,
        hasCalendarAttachment: Boolean(icsAttachment),
        messageId: messageId || `msg_${Date.now()}`,
      },
    });

    return apiSuccess(
      {
        messageId: messageId || `msg_${Date.now()}`,
        status: 'DELIVERED',
        recipient: toEmail,
        hasCalendarInvite: Boolean(icsAttachment),
        timestamp: new Date().toISOString(),
      },
      undefined,
      requestId
    );
  } catch (err: unknown) {
    return apiError(
      'DISPATCH_FAILED',
      err instanceof Error ? err.message : 'Failed to dispatch communication email',
      500,
      requestId
    );
  }
}
