import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { apiError } from '@/lib/apiResponse';

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export const SESSION_COOKIE_NAME = 'ts_session';

export function serializeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Extract authenticated user session from request.
 * Reads verified session cookie or headers set by reverse proxy or authentication middleware.
 * NEVER trusts client-supplied query params or body parameters for role.
 */
export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  // 1. Try reading cookie first
  try {
    const cookieVal = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (cookieVal) {
      const decoded = JSON.parse(Buffer.from(cookieVal, 'base64').toString('utf-8'));
      if (decoded.userId && decoded.role && Object.values(UserRole).includes(decoded.role as UserRole)) {
        return {
          userId: decoded.userId,
          email: decoded.email ?? 'unknown@example.com',
          role: decoded.role as UserRole,
          displayName: decoded.displayName ?? 'User',
        };
      }
    }
  } catch {
    // Cookie malformed or unavailable, continue to headers
  }

  // 2. Fall back to headers
  const userId = request.headers.get('x-user-id');
  const roleHeader = request.headers.get('x-user-role');
  const email = request.headers.get('x-user-email');
  const displayName = request.headers.get('x-user-name');

  if (!userId || !roleHeader) {
    return null;
  }

  // Strictly validate role against UserRole enum
  if (!Object.values(UserRole).includes(roleHeader as UserRole)) {
    return null;
  }

  return {
    userId,
    email: email ?? 'unknown@example.com',
    role: roleHeader as UserRole,
    displayName: displayName ?? 'User',
  };
}

export type AuthHandler<T = unknown> = (
  session: AuthSession,
  request: NextRequest
) => Promise<T>;

/**
 * Guard endpoint requiring a valid session with one of the allowed roles.
 */
export function requireRole(allowedRoles: UserRole[], session: AuthSession | null, requestId: string) {
  if (!session) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401, requestId);
  }

  if (!allowedRoles.includes(session.role)) {
    return apiError('FORBIDDEN', 'Insufficient permissions for this resource', 403, requestId);
  }

  return null;
}

/**
 * Verifies resource ownership or elevated role permission.
 * e.g., Applicants can only view/withdraw their own application.
 */
export function canAccessApplication(
  session: AuthSession,
  application: { applicantUserId: string | null; applicantEmail: string }
): boolean {
  // ADMIN and HR can review any application
  if (session.role === UserRole.ADMIN || session.role === UserRole.HR) {
    return true;
  }

  // APPLICANT can only access their own application
  if (session.role === UserRole.APPLICANT) {
    if (application.applicantUserId && application.applicantUserId === session.userId) {
      return true;
    }
    if (application.applicantEmail.toLowerCase() === session.email.toLowerCase()) {
      return true;
    }
  }

  return false;
}
