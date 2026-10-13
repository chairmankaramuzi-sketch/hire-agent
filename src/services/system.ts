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

const defaultHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': 'usr-hr-001',
  'x-user-role': 'HR',
  'x-user-email': 'hr@company.com',
  'x-user-name': 'Jane Doe - HR Director',
};

export const systemService = {
  async resetSystem(): Promise<{ message: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/system/reset`, {
      method: 'POST',
      headers: defaultHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to reset system');
    }
    const json = await res.json();
    return json.data;
  },

  async purgeApplications(): Promise<{ message: string; deletedCount: number }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/system/purge-applications`, {
      method: 'POST',
      headers: defaultHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to purge applications');
    }
    const json = await res.json();
    return json.data;
  },

  async purgeJobs(): Promise<{ message: string; deletedCount: number }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/system/purge-jobs`, {
      method: 'POST',
      headers: defaultHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to remove vacancies');
    }
    const json = await res.json();
    return json.data;
  },

  async seedCandidateBatch(): Promise<{ message: string; total: number; jobId: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/system/seed-batch`, {
      method: 'POST',
      headers: defaultHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to load candidate batch');
    }
    const json = await res.json();
    return json.data;
  },
};
