import { NextRequest } from 'next/server';
import { runSystemAction } from '@/lib/system/runSystemAction';
import { seedUsers } from '@/lib/system/systemAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return runSystemAction(
    request,
    'USERS_SEEDED',
    () => seedUsers(),
    r => `Restored ${r.staff} staff accounts and ${r.applicants} applicant accounts with their default passwords.`,
    { requireAuth: false }
  );
}
