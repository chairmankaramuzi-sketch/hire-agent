import { Job, JobStatus, JobCriterion } from '@/types';
import { mockJobs } from './mockData';

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

// In-memory clone to simulate persistence during tests or offline mode
let jobsState: Job[] = JSON.parse(JSON.stringify(mockJobs));

export function mapPrismaJobToDomain(item: any): Job {
  return {
    id: item.id,
    title: item.title,
    department: item.department || 'General',
    description: item.description,
    status: item.status,
    scoreThreshold: 70,
    createdBy: item.createdBy || 'usr-hr-001',
    criteria: (item.criteria || []).map((c: any) => ({
      id: c.id,
      jobId: c.jobId,
      name: c.name,
      description: c.description,
      criterionType: c.kind === 'MANDATORY' ? 'MANDATORY' : 'SCORED',
      weight: c.weight ? Number(c.weight) : undefined,
      ruleConfig: c.configuration || undefined,
      version: c.version || 1,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    })),
    applicationCount: item.applicationCount ?? item._count?.applications ?? 0,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export interface GetJobsFilter {
  search?: string;
  status?: JobStatus | 'ALL';
  sortBy?: 'createdAt' | 'title' | 'applicationCount';
  sortOrder?: 'asc' | 'desc';
}

export const jobsService = {
  async getJobs(filter?: GetJobsFilter): Promise<Job[]> {
    // Attempt live API fetch first
    try {
      const query = new URLSearchParams();
      if (filter?.status && filter.status !== 'ALL') {
        query.set('status', filter.status);
      }
      if (filter?.search) {
        query.set('search', filter.search);
      }
      query.set('limit', '50');

      const res = await fetch(`${getApiBaseUrl()}/api/v1/jobs?${query.toString()}`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const fetchedJobs = json.data.map(mapPrismaJobToDomain);

          // Apply client-side sorting if specified
          if (filter?.sortBy) {
            fetchedJobs.sort((a: Job, b: Job) => {
              let cmp = 0;
              if (filter.sortBy === 'title') {
                cmp = a.title.localeCompare(b.title);
              } else if (filter.sortBy === 'applicationCount') {
                cmp = a.applicationCount - b.applicationCount;
              } else {
                cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              }
              return filter.sortOrder === 'asc' ? cmp : -cmp;
            });
          }

          return fetchedJobs;
        }
      }
    } catch {
      // In offline/test environments, proceed to in-memory state
    }

    // In-memory fallback
    await new Promise((resolve) => setTimeout(resolve, 30));

    let results = [...jobsState];

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      results = results.filter(
        (j) => j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q)
      );
    }

    if (filter?.status && filter.status !== 'ALL') {
      results = results.filter((j) => j.status === filter.status);
    }

    if (filter?.sortBy) {
      results.sort((a, b) => {
        let cmp = 0;
        if (filter.sortBy === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (filter.sortBy === 'applicationCount') {
          cmp = a.applicationCount - b.applicationCount;
        } else {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return filter.sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return results;
  },

  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return mapPrismaJobToDomain(json.data);
        }
      }
    } catch {
      // fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 30));
    const job = jobsState.find((j) => j.id === jobId);
    return job ? JSON.parse(JSON.stringify(job)) : null;
  },

  async createJob(params: {
    title: string;
    department: string;
    description: string;
    status: JobStatus;
    scoreThreshold?: number;
    criteria: Omit<JobCriterion, 'id' | 'jobId' | 'version' | 'createdAt' | 'updatedAt'>[];
  }): Promise<Job> {
    if (!params.title.trim()) {
      throw new Error('Job title is required');
    }

    // Validate scored criteria weights sum to 100
    const scoredCriteria = params.criteria.filter((c) => c.criterionType === 'SCORED');
    if (scoredCriteria.length > 0) {
      const totalWeight = scoredCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
      if (totalWeight !== 100) {
        throw new Error(`Scored criteria weights must sum to exactly 100% (currently ${totalWeight}%).`);
      }
    }

    // Attempt live API creation
    try {
      const criteriaPayload = params.criteria.map((c) => ({
        name: c.name,
        description: c.description,
        kind: c.criterionType === 'MANDATORY' ? 'MANDATORY' : 'WEIGHTED',
        weight: c.weight,
      }));

      const res = await fetch(`${getApiBaseUrl()}/api/v1/jobs`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          title: params.title.trim(),
          department: params.department.trim() || 'General',
          description: params.description.trim(),
          criteria: criteriaPayload,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const createdJob = mapPrismaJobToDomain(json.data);

        // If requested status is PUBLISHED, call publish endpoint
        if (params.status === 'PUBLISHED') {
          try {
            await fetch(`${getApiBaseUrl()}/api/v1/jobs/${createdJob.id}/publish`, {
              method: 'POST',
              headers: defaultHeaders,
            });
            createdJob.status = 'PUBLISHED';
          } catch {}
        }

        jobsState.unshift(createdJob);
        return createdJob;
      }
    } catch {
      // In-memory fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 40));

    const newJobId = `job-${Date.now()}`;
    const now = new Date().toISOString();

    const createdCriteria: JobCriterion[] = params.criteria.map((c, idx) => ({
      ...c,
      id: `crit-${newJobId}-${idx + 1}`,
      jobId: newJobId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }));

    const newJob: Job = {
      id: newJobId,
      title: params.title.trim(),
      department: params.department.trim() || 'General',
      description: params.description.trim(),
      status: params.status,
      scoreThreshold: params.scoreThreshold ?? 70,
      createdBy: 'usr-hr-001',
      criteria: createdCriteria,
      applicationCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    jobsState.unshift(newJob);
    return JSON.parse(JSON.stringify(newJob));
  },

  async updateJob(
    jobId: string,
    updates: Partial<Omit<Job, 'id' | 'createdAt' | 'applicationCount'>>
  ): Promise<Job> {
    if (updates.criteria) {
      const scored = updates.criteria.filter((c) => c.criterionType === 'SCORED');
      if (scored.length > 0) {
        const total = scored.reduce((sum, c) => sum + (c.weight || 0), 0);
        if (total !== 100) {
          throw new Error(`Scored criteria weights must sum to exactly 100% (currently ${total}%).`);
        }
      }
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}`, {
        method: 'PATCH',
        headers: defaultHeaders,
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          department: updates.department,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return mapPrismaJobToDomain(json.data);
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 40));

    const index = jobsState.findIndex((j) => j.id === jobId);
    if (index === -1) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const existing = jobsState[index];
    const updated: Job = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    jobsState[index] = updated;
    return JSON.parse(JSON.stringify(updated));
  },

  resetState() {
    jobsState = JSON.parse(JSON.stringify(mockJobs));
  },
};
