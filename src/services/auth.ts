import { User } from '@/types';

export const defaultHeaders: Record<string, string> = {
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
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export const activeUser: User = {
  id: 'usr-hr-001',
  name: 'Jane Doe - HR Director',
  email: 'hr@company.com',
  role: 'HR',
};

const USER_STORAGE_KEY = 'talentscreen_auth_user';

export const authService = {
  async getCurrentUser(): Promise<User> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) return parsed;
        }
      } catch {}
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const user: User = {
            id: json.data.id,
            name: json.data.displayName || json.data.name || activeUser.name,
            email: json.data.email || activeUser.email,
            role: json.data.role || activeUser.role,
          };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            } catch {}
          }
          return user;
        }
      }
    } catch {
      // offline/fallback
    }

    return activeUser;
  },

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: usernameOrEmail, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Invalid username or password');
    }

    const json = await res.json();
    const user: User = {
      id: json.data.user.id,
      name: json.data.user.displayName || json.data.user.name,
      email: json.data.user.email,
      role: json.data.user.role,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {}
    }

    return user;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: 'POST',
      });
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {}
      window.location.href = '/login';
    }
  },
};
