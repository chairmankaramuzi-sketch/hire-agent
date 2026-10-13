import { NextRequest } from 'next/server';
import { runSystemAction } from '@/lib/system/runSystemAction';
import { purgeJobs } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return runSystemAction(
    request,
    'JOBS_PURGED',
    () => purgeJobs(),
    r => `Removed ${r.deletedJobs} vacancies and ${r.deletedApplications} attached applications. Users kept.`
  );
}
