import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { dossierService } from '@/lib/extraction/dossierService';
import { ingestCandidates } from '@/lib/system/systemAdmin';

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
    const file = (formData.get('dossier') ||
      formData.get('file') ||
      formData.get('cv') ||
      formData.get('document')) as File | null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = buffer.toString('utf-8');
      candidatesToIngest = dossierService.parseCombinedDossierText(text);
    }
  } else if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    if (body?.rawText) {
      candidatesToIngest = dossierService.parseCombinedDossierText(body.rawText);
    }
  }

  const result = await ingestCandidates(params.jobId, candidatesToIngest);

  return apiSuccess(
    {
      message: `Successfully ingested and screened ${result.total} candidates into "${result.jobTitle}"`,
      count: result.total,
      outcomes: result.outcomes,
      statuses: result.statuses,
    },
    undefined,
    requestId
  );
}
