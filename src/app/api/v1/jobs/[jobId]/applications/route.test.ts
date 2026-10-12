import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitApplication } from '@/app/api/v1/jobs/[jobId]/applications/route';
import { GET as getApplicationStatus } from '@/app/api/v1/applications/[applicationId]/status/route';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { JobStatus, ApplicationStatus } from '@prisma/client';
import { validateCvFile } from '@/lib/validators/applicationValidators';

describe('Phase 4 Applications and Private Storage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Validation', () => {
    it('accepts valid PDF within size limit', () => {
      const result = validateCvFile({
        name: 'resume.pdf',
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
      });
      expect(result.valid).toBe(true);
    });

    it('rejects file larger than 10MB', () => {
      const result = validateCvFile({
        name: 'huge_resume.pdf',
        type: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('rejects forbidden file extensions like .exe or .sh', () => {
      const result = validateCvFile({
        name: 'script.exe',
        type: 'application/octet-stream',
        size: 5000,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('POST /api/v1/jobs/:jobId/applications', () => {
    it('returns 404 if job does not exist', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/missing-job/applications', {
        method: 'POST',
      });

      const res = await submitApplication(req, { params: { jobId: 'missing-job' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 if job is DRAFT or CLOSED', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({
        id: 'draft-job',
        status: JobStatus.DRAFT,
      } as any);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/draft-job/applications', {
        method: 'POST',
      });

      const res = await submitApplication(req, { params: { jobId: 'draft-job' } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 409 DUPLICATE_APPLICATION if applicant already applied with same email', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({
        id: 'job-1',
        status: JobStatus.PUBLISHED,
      } as any);

      const mockFile = {
        name: 'cv.pdf',
        type: 'application/pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      };

      const mockFormData = new Map<string, any>();
      mockFormData.set('applicantName', 'Jane Doe');
      mockFormData.set('applicantEmail', 'jane@example.com');
      mockFormData.set('cv', mockFile);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/job-1/applications', {
        method: 'POST',
      });
      vi.spyOn(req, 'formData').mockResolvedValue(mockFormData as any);

      vi.spyOn(prisma.application, 'findFirst').mockResolvedValue({
        id: 'existing-app-1',
        applicantEmail: 'jane@example.com',
      } as any);

      const res = await submitApplication(req, { params: { jobId: 'job-1' } });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe('DUPLICATE_APPLICATION');
    });

    it('submits application, stores CV privately, and returns 201', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({
        id: 'job-1',
        status: JobStatus.PUBLISHED,
      } as any);

      vi.spyOn(prisma.application, 'findFirst').mockResolvedValue(null);

      vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
        storageKey: 'cv_private_test.pdf',
        originalFilename: 'cv.pdf',
        detectedMimeType: 'application/pdf',
        sizeBytes: 1024,
        sha256Hex: 'abcdef123456',
      });

      const mockCreatedApplication = {
        id: 'app-new-1',
        jobId: 'job-1',
        applicantName: 'Jane Doe',
        applicantEmail: 'jane@example.com',
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          application: {
            create: vi.fn().mockResolvedValue(mockCreatedApplication),
          },
        });
      });

      const mockFile = {
        name: 'cv.pdf',
        type: 'application/pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      };

      const mockFormData = new Map<string, any>();
      mockFormData.set('applicantName', 'Jane Doe');
      mockFormData.set('applicantEmail', 'jane@example.com');
      mockFormData.set('cv', mockFile);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/job-1/applications', {
        method: 'POST',
      });
      vi.spyOn(req, 'formData').mockResolvedValue(mockFormData as any);

      const res = await submitApplication(req, { params: { jobId: 'job-1' } });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.id).toBe('app-new-1');
      expect(json.data.status).toBe('SUBMITTED');
    });
  });

  describe('GET /api/v1/applications/:applicationId/status', () => {
    it('returns application status for authorized requester', async () => {
      vi.spyOn(prisma.application, 'findUnique').mockResolvedValue({
        id: 'app-1',
        jobId: 'job-1',
        applicantUserId: 'user-1',
        applicantEmail: 'jane@example.com',
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/v1/applications/app-1/status', {
        headers: {
          'x-user-id': 'user-1',
          'x-user-role': 'APPLICANT',
          'x-user-email': 'jane@example.com',
        },
      });

      const res = await getApplicationStatus(req, { params: { applicationId: 'app-1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('SUBMITTED');
    });
  });
});
