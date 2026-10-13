import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { dossierService } from '@/lib/extraction/dossierService';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
  });

  if (!job) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  let candidatesToIngest;

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('dossier') as File | null;
    if (file) {
      const text = await file.text();
      candidatesToIngest = dossierService.parseCombinedDossierText(text);
    }
  } else if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    if (body.rawText) {
      candidatesToIngest = dossierService.parseCombinedDossierText(body.rawText);
    }
  }

  const actorUserId = session?.userId || 'usr-hr-001';

  const result = await dossierService.ingestCandidateBatch(
    params.jobId,
    candidatesToIngest,
    actorUserId,
    requestId
  );

  return apiSuccess(
    {
      message: `Successfully ingested and screened ${result.total} candidates from combined dossier`,
      count: result.total,
    },
    undefined,
    requestId
  );
}
