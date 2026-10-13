import { NextRequest } from 'next/server';
import { runSystemAction } from '@/lib/system/runSystemAction';
import { purgeApplications } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return runSystemAction(
    request,
    'APPLICATIONS_PURGED',
    () => purgeApplications(),
    r => `Removed ${r.deletedApplications} applications with their CVs, extractions, scores and decisions. Vacancies and users kept.`
  );
}
