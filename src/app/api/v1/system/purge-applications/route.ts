import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  try {
    const deletedDecisions = await prisma.hrDecision.deleteMany({});
    const deletedNotes = await prisma.reviewNote.deleteMany({});
    const deletedScreenings = await prisma.screeningResult.deleteMany({});
    const deletedEvidence = await prisma.extractedEvidence.deleteMany({});
    const deletedRuns = await prisma.extractionRun.deleteMany({});
    const deletedAssets = await prisma.cvAsset.deleteMany({});
    const deletedApplications = await prisma.application.deleteMany({});

    await recordAuditEvent({
      actorUserId: session?.userId || 'usr-hr-001',
      action: 'APPLICATIONS_PURGED',
      resourceType: 'APPLICATION',
      resourceId: 'all',
      requestId,
      metadata: { deletedCount: deletedApplications.count },
    });

    return apiSuccess(
      {
        message: `Purged ${deletedApplications.count} applications and all associated CV data. Vacancies preserved.`,
        deletedCount: deletedApplications.count,
      },
      undefined,
      requestId
    );
  } catch (err: any) {
    return apiError('PURGE_FAILED', err?.message || 'Failed to purge applications', 500, requestId);
  }
}
