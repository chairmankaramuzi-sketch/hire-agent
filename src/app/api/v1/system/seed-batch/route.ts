import { NextRequest } from 'next/server';
import { runSystemAction } from '@/lib/system/runSystemAction';
import { ingestCandidates } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  try {
    const body = await request.clone().json();
    if (typeof body?.jobId === 'string' && body.jobId) jobId = body.jobId;
  } catch {
    // No body – default to the baseline vacancy
  }

  return runSystemAction(
    request,
    'CANDIDATE_BATCH_SEEDED',
    () => ingestCandidates(jobId),
    r => {
      const o = r.outcomes as Record<string, number>;
      return `Ingested ${r.total} real CVs into "${r.jobTitle}": ${o.RECOMMENDED ?? 0} recommended, ${
        o.NEEDS_MANUAL_REVIEW ?? 0
      } need review, ${o.NOT_RECOMMENDED ?? 0} not recommended.`;
    }
  );
}
