import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { getSession, requireRole, canAccessApplication, AuthSession } from '@/lib/auth';

describe('Phase 2 Authorization and Access Control Tests', () => {
  describe('getSession', () => {
    it('returns null if headers are missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs');
      const session = await getSession(req);
      expect(session).toBeNull();
    });

    it('returns null if role is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        headers: {
          'x-user-id': 'usr_1',
          'x-user-role': 'SUPERUSER_INVALID',
        },
      });
      const session = await getSession(req);
      expect(session).toBeNull();
    });

    it('returns valid session for authenticated HR user', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        headers: {
          'x-user-id': 'usr_hr_1',
          'x-user-role': 'HR',
          'x-user-email': 'hr@example.com',
          'x-user-name': 'HR Manager',
        },
      });
      const session = await getSession(req);
      expect(session).toEqual({
        userId: 'usr_hr_1',
        email: 'hr@example.com',
        role: UserRole.HR,
        displayName: 'HR Manager',
      });
    });
  });

  describe('requireRole', () => {
    it('returns 401 UNAUTHORIZED when session is missing', async () => {
      const err = requireRole([UserRole.HR, UserRole.ADMIN], null, 'req_test_1');
      expect(err).not.toBeNull();
      expect(err?.status).toBe(401);

      const json = await err?.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 FORBIDDEN when user role is not allowed', async () => {
      const applicantSession: AuthSession = {
        userId: 'app_1',
        email: 'applicant@example.com',
        role: UserRole.APPLICANT,
        displayName: 'Candidate',
      };

      const err = requireRole([UserRole.HR, UserRole.ADMIN], applicantSession, 'req_test_2');
      expect(err).not.toBeNull();
      expect(err?.status).toBe(403);

      const json = await err?.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns null when user role is allowed', () => {
      const hrSession: AuthSession = {
        userId: 'hr_1',
        email: 'hr@example.com',
        role: UserRole.HR,
        displayName: 'HR User',
      };

      const err = requireRole([UserRole.HR, UserRole.ADMIN], hrSession, 'req_test_3');
      expect(err).toBeNull();
    });
  });

  describe('canAccessApplication (Resource-Level Access)', () => {
    const hrSession: AuthSession = {
      userId: 'hr_1',
      email: 'hr@example.com',
      role: UserRole.HR,
      displayName: 'HR User',
    };

    const adminSession: AuthSession = {
      userId: 'admin_1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      displayName: 'Admin User',
    };

    const applicant1Session: AuthSession = {
      userId: 'usr_app_1',
      email: 'jane@example.com',
      role: UserRole.APPLICANT,
      displayName: 'Jane Doe',
    };

    const applicant2Session: AuthSession = {
      userId: 'usr_app_2',
      email: 'john@example.com',
      role: UserRole.APPLICANT,
      displayName: 'John Smith',
    };

    const applicationJane = {
      applicantUserId: 'usr_app_1',
      applicantEmail: 'jane@example.com',
    };

    it('allows HR and ADMIN to access any application', () => {
      expect(canAccessApplication(hrSession, applicationJane)).toBe(true);
      expect(canAccessApplication(adminSession, applicationJane)).toBe(true);
    });

    it('allows Applicant to access their own application', () => {
      expect(canAccessApplication(applicant1Session, applicationJane)).toBe(true);
    });

    it('denies Applicant from accessing another applicant application', () => {
      expect(canAccessApplication(applicant2Session, applicationJane)).toBe(false);
    });
  });
});
