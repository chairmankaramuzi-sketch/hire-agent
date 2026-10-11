import { Job, JobStatus, JobCriterion } from '@/types';
import { mockJobs } from './mockData';

// In-memory clone to simulate persistence during user session
let jobsState: Job[] = JSON.parse(JSON.stringify(mockJobs));

export interface GetJobsFilter {
  search?: string;
  status?: JobStatus | 'ALL';
  sortBy?: 'createdAt' | 'title' | 'applicationCount';
  sortOrder?: 'asc' | 'desc';
}

export const jobsService = {
  async getJobs(filter?: GetJobsFilter): Promise<Job[]> {
    // Simulate slight asynchronous delay
    await new Promise((resolve) => setTimeout(resolve, 60));

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
    await new Promise((resolve) => setTimeout(resolve, 40));
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
    await new Promise((resolve) => setTimeout(resolve, 80));

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
    await new Promise((resolve) => setTimeout(resolve, 80));

    const index = jobsState.findIndex((j) => j.id === jobId);
    if (index === -1) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    if (updates.criteria) {
      const scored = updates.criteria.filter((c) => c.criterionType === 'SCORED');
      if (scored.length > 0) {
        const total = scored.reduce((sum, c) => sum + (c.weight || 0), 0);
        if (total !== 100) {
          throw new Error(`Scored criteria weights must sum to exactly 100% (currently ${total}%).`);
        }
      }
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
