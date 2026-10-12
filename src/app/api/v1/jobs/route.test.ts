import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getJobs, POST as createJob } from '@/app/api/v1/jobs/route';
import { GET as getJobDetail, PATCH as updateJob } from '@/app/api/v1/jobs/[jobId]/route';
import { POST as publishJob } from '@/app/api/v1/jobs/[jobId]/publish/route';
import { POST as closeJob } from '@/app/api/v1/jobs/[jobId]/close/route';
import { prisma } from '@/lib/prisma';
import { JobStatus, CriterionKind, UserRole } from '@prisma/client';

// Mock Prisma for unit/integration testing the route handlers
vi.mock('@prisma/prisma', () => ({}));

describe('Phase 3 Jobs & Criteria APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/jobs', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        body: JSON.stringify({ title: 'Engineer', description: 'Sample description' }),
      });

      const res = await createJob(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects applicant role with 403 FORBIDDEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_applicant',
          'x-user-role': 'APPLICANT',
        },
        body: JSON.stringify({ title: 'Engineer', description: 'Sample description' }),
      });

      const res = await createJob(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('rejects weighted criteria whose weights do not sum to 100', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_hr_1',
          'x-user-role': 'HR',
        },
        body: JSON.stringify({
          title: 'Senior Full Stack Engineer',
          description: 'A great role for full stack engineers.',
          criteria: [
            {
              name: 'React Experience',
              description: 'At least 3 years',
              kind: CriterionKind.WEIGHTED,
              weight: 30,
            },
            {
              name: 'Node Experience',
              description: 'At least 2 years',
              kind: CriterionKind.WEIGHTED,
              weight: 40,
            },
          ],
        }),
      });

      const res = await createJob(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates job and criteria with version 1 when payload is valid', async () => {
      const mockCreatedJob = {
        id: 'job-123',
        title: 'Senior Full Stack Engineer',
        description: 'A great role for full stack engineers.',
        status: JobStatus.DRAFT,
        createdBy: 'usr_hr_1',
        criteria: [
          {
            id: 'crit-1',
            version: 1,
            name: 'Bachelor Degree',
            description: 'Degree in CS',
            kind: CriterionKind.MANDATORY,
            weight: null,
          },
          {
            id: 'crit-2',
            version: 1,
            name: 'React Experience',
            description: 'At least 3 years',
            kind: CriterionKind.WEIGHTED,
            weight: 100,
          },
        ],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          appUser: { upsert: vi.fn().mockResolvedValue({}) },
          job: { create: vi.fn().mockResolvedValue(mockCreatedJob) },
        });
      });

      const req = new NextRequest('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_hr_1',
          'x-user-role': 'HR',
          'x-user-name': 'HR Person',
          'x-user-email': 'hr@example.com',
        },
        body: JSON.stringify({
          title: 'Senior Full Stack Engineer',
          description: 'A great role for full stack engineers.',
          criteria: [
            {
              name: 'Bachelor Degree',
              description: 'Degree in CS',
              kind: CriterionKind.MANDATORY,
            },
            {
              name: 'React Experience',
              description: 'At least 3 years',
              kind: CriterionKind.WEIGHTED,
              weight: 100,
            },
          ],
        }),
      });

      const res = await createJob(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.id).toBe('job-123');
      expect(json.data.criteria.length).toBe(2);
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('returns paginated job list', async () => {
      vi.spyOn(prisma.job, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.job, 'findMany').mockResolvedValue([
        {
          id: 'job-1',
          title: 'Designer',
          description: 'Product designer',
          status: JobStatus.PUBLISHED,
          department: 'Design',
          location: 'Remote',
          createdBy: 'hr-1',
          publishedAt: new Date(),
          closesAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          criteria: [],
          _count: { applications: 3 },
        } as any,
      ]);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs?page=1&limit=10');
      const res = await getJobs(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(1);
      expect(json.data[0].applicationCount).toBe(3);
      expect(json.meta.total).toBe(1);
    });
  });

  describe('Job Publish & Close Transitions', () => {
    it('publishes DRAFT job successfully', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue({
        id: 'job-1',
        status: JobStatus.DRAFT,
      } as any);

      vi.spyOn(prisma.job, 'update').mockResolvedValue({
        id: 'job-1',
        status: JobStatus.PUBLISHED,
        criteria: [],
      } as any);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/job-1/publish', {
        method: 'POST',
        headers: {
          'x-user-id': 'hr-1',
          'x-user-role': 'HR',
        },
      });

      const res = await publishJob(req, { params: { jobId: 'job-1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('PUBLISHED');
    });

    it('rejects closing a job that is not found with 404', async () => {
      vi.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/jobs/job-not-found/close', {
        method: 'POST',
        headers: {
          'x-user-id': 'hr-1',
          'x-user-role': 'HR',
        },
      });

      const res = await closeJob(req, { params: { jobId: 'job-not-found' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });
});
