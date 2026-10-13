import { NextRequest } from 'next/server';
import { runSystemAction } from '@/lib/system/runSystemAction';
import { resetSystem } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return runSystemAction(
    request,
    'SYSTEM_RESET',
    () => resetSystem(),
    r => `System reset to baseline: ${r.users} users, ${r.vacancies} vacancies and ${r.criteria} criteria restored. All candidates removed.`
  );
}
