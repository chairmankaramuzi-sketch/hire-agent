import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listApplications } from '@/app/api/v1/jobs/[jobId]/applications/list/route';
import { GET as getApplicationDetail } from '@/app/api/v1/applications/[applicationId]/route';
import { POST as recordDecision } from '@/app/api/v1/applications/[applicationId]/decision/route';
import { POST as addNote } from '@/app/api/v1/applications/[applicationId]/notes/route';
import { GET as getCvAccess } from '@/app/api/v1/applications/[applicationId]/cv-access/route';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { UserRole, ApplicationStatus, DecisionKind } from '@prisma/client';

describe('Phase 7 HR Review and Audit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const hrHeaders = {
    'x-user-id': 'hr-user-1',
    'x-user-role': 'HR',
    'x-user-email': 'hr@example.com',
    'x-user-name': 'HR Manager',
  };

  describe('GET /api/v1/jobs/:jobId/applications/list', () => {
    it('returns 403 when called by applicant', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs/j1/applications/list', {
        headers: {
          'x-user-id': 'app-user',
          'x-user-role': 'APPLICANT',
        },
      });

      const res = await listApplications(req, { params: { jobId: 'j1' } });
      expect(res.status).toBe(403);
    });

    it('returns paginated application list for HR', async () => {
      vi.spyOn(prisma.application, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.application, 'findMany').mockResolvedValue([
        {
          id: 'app-1',
          jobId: 'j1',
          applicantName: 'Alice',
          applicantEmail: 'alice@example.com',
          status: ApplicationStatus.SUBMITTED,
          submittedAt: new Date(),
          screenings: [],
          decisions: [],
        } as any,
      ]);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/j1/applications/list', {
        headers: hrHeaders,
      });

      const res = await listApplications(req, { params: { jobId: 'j1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(1);
      expect(json.meta.total).toBe(1);
    });
  });

  describe('GET /api/v1/applications/:applicationId', () => {
    it('restricts applicant to permitted self-view fields only', async () => {
      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue({
        id: 'app-1',
        jobId: 'j1',
        applicantUserId: 'applicant-1',
        applicantName: 'Bob',
        applicantEmail: 'bob@example.com',
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
        withdrawnAt: null,
        job: { title: 'Backend Dev' },
        notes: [{ body: 'Internal sensitive HR note' }],
        screenings: [{ totalScore: 85 }],
      } as any);

      const req = new NextRequest('http://localhost:3000/api/v1/applications/app-1', {
        headers: {
          'x-user-id': 'applicant-1',
          'x-user-role': 'APPLICANT',
          'x-user-email': 'bob@example.com',
        },
      });

      const res = await getApplicationDetail(req, { params: { applicationId: 'app-1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.applicantName).toBe('Bob');
      expect(json.data.notes).toBeUndefined(); // internal HR notes hidden
      expect(json.data.screenings).toBeUndefined(); // internal raw scores hidden
    });
  });

  describe('POST /api/v1/applications/:applicationId/decision', () => {
    it('requires valid decision and reason', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/applications/app-1/decision', {
        method: 'POST',
        headers: hrHeaders,
        body: JSON.stringify({ decision: 'INVALID' }),
      });

      const res = await recordDecision(req, { params: { applicationId: 'app-1' } });
      expect(res.status).toBe(400);
    });

    it('records SHORTLISTED decision and updates application status', async () => {
      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.READY_FOR_REVIEW,
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          appUser: { upsert: vi.fn().mockResolvedValue({}) },
          hrDecision: {
            create: vi.fn().mockResolvedValue({
              id: 'dec-1',
              decision: DecisionKind.SHORTLISTED,
              createdAt: new Date(),
            }),
          },
          application: {
            update: vi.fn().mockResolvedValue({
              id: 'app-1',
              status: ApplicationStatus.SHORTLISTED,
            }),
          },
        });
      });

      const req = new NextRequest('http://localhost:3000/api/v1/applications/app-1/decision', {
        method: 'POST',
        headers: hrHeaders,
        body: JSON.stringify({
          decision: DecisionKind.SHORTLISTED,
          reason: 'Strong performance on all weighted criteria and verified experience',
        }),
      });

      const res = await recordDecision(req, { params: { applicationId: 'app-1' } });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.decision).toBe('SHORTLISTED');
      expect(json.data.status).toBe('SHORTLISTED');
    });
  });

  describe('GET /api/v1/applications/:applicationId/cv-access', () => {
    it('issues short-lived private access URL for authorized HR', async () => {
      vi.spyOn(prisma.cvAsset, 'findUnique').mockResolvedValue({
        id: 'cv-1',
        storageKey: 'cv_private_abc.pdf',
        originalFilename: 'resume.pdf',
        detectedMimeType: 'application/pdf',
      } as any);

      vi.spyOn(storageService, 'generateSignedUrl').mockResolvedValue(
        '/api/v1/cv-download?key=cv_private_abc.pdf&token=xyz'
      );

      const req = new NextRequest('http://localhost:3000/api/v1/applications/app-1/cv-access', {
        headers: hrHeaders,
      });

      const res = await getCvAccess(req, { params: { applicationId: 'app-1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.accessUrl).toContain('/api/v1/cv-download');
      expect(json.data.expiresInSeconds).toBe(300);
    });
  });
});
