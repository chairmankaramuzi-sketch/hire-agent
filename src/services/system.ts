function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export interface SystemActionResult {
  message: string;
  durationMs: number;
  [key: string]: unknown;
}

export interface SystemCounts {
  users: number;
  staff: number;
  jobs: number;
  applications: number;
  cvAssets: number;
  screenings: number;
  decisions: number;
  auditEvents: number;
}

async function callSystem<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/v1/system/${path}`, {
      method,
      // Authenticates with the ts_session cookie set at login
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error – the server could not be reached.');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) throw new Error('Your session has expired. Please sign in again.');
    if (res.status === 403) throw new Error('Only HR or Admin accounts can run Danger Zone actions.');
    if (res.status === 504) throw new Error('The operation timed out on the server. Please try again.');
    throw new Error(json?.error?.message || `Request failed (${res.status})`);
  }

  return json.data as T;
}

export const systemService = {
  getStatus: () => callSystem<SystemCounts>('status', 'GET'),
  resetSystem: () => callSystem<SystemActionResult>('reset', 'POST'),
  purgeApplications: () => callSystem<SystemActionResult>('purge-applications', 'POST'),
  purgeJobs: () => callSystem<SystemActionResult>('purge-jobs', 'POST'),
  seedUsers: () => callSystem<SystemActionResult>('seed-users', 'POST'),
  seedCandidateBatch: (jobId?: string) => callSystem<SystemActionResult>('seed-batch', 'POST', jobId ? { jobId } : {}),
};
