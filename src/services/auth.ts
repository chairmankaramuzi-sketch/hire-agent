import { User } from '@/types';

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-user-id': 'usr-hr-001',
  'x-user-role': 'HR',
  'x-user-email': 'hr@company.com',
  'x-user-name': 'Jane Doe - HR Director',
};

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export const activeUser: User = {
  id: 'usr-hr-001',
  name: 'Jane Doe - HR Director',
  email: 'hr@company.com',
  role: 'HR',
};

export const authService = {
  async getCurrentUser(): Promise<User> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return {
            id: json.data.id,
            name: json.data.displayName || json.data.name || activeUser.name,
            email: json.data.email || activeUser.email,
            role: json.data.role || activeUser.role,
          };
        }
      }
    } catch {
      // offline/fallback
    }

    return activeUser;
  },
};
