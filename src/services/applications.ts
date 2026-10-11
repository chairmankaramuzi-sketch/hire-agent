import {
  Application,
  ApplicationStatus,
  ProcessingStatus,
  ReviewDecision,
  ReviewDecisionType,
  DashboardMetrics,
  CandidateProfile,
} from '@/types';
import { mockApplications, mockJobs } from './mockData';

// In-memory clone to simulate live interaction
let applicationsState: Application[] = JSON.parse(JSON.stringify(mockApplications));

export interface GetApplicationsFilter {
  jobId?: string;
  search?: string;
  status?: ApplicationStatus | 'ALL';
  processingStatus?: ProcessingStatus | 'ALL';
  mandatoryStatus?: 'MEETS' | 'DOES_NOT_MEET' | 'UNKNOWN' | 'ALL';
  minScore?: number;
  queue?: 'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';
  sortBy?: 'score' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedApplications {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const applicationsService = {
  async getApplications(filter?: GetApplicationsFilter): Promise<PaginatedApplications> {
    await new Promise((resolve) => setTimeout(resolve, 60));

    let items = [...applicationsState];

    if (filter?.jobId) {
      items = items.filter((a) => a.jobId === filter.jobId);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.applicant.fullName.toLowerCase().includes(q) ||
          a.applicant.email.toLowerCase().includes(q) ||
          a.cvDocument.fileName.toLowerCase().includes(q)
      );
    }

    if (filter?.status && filter.status !== 'ALL') {
      items = items.filter((a) => a.status === filter.status);
    }

    if (filter?.processingStatus && filter.processingStatus !== 'ALL') {
      items = items.filter((a) => a.processingStatus === filter.processingStatus);
    }

    if (filter?.mandatoryStatus && filter.mandatoryStatus !== 'ALL') {
      items = items.filter((a) => a.screeningRun?.mandatoryStatus === filter.mandatoryStatus);
    }

    if (filter?.minScore !== undefined) {
      items = items.filter((a) => (a.screeningRun?.totalScore ?? 0) >= (filter.minScore ?? 0));
    }

    // Queue filtering: ELIGIBLE vs INELIGIBLE vs NEEDS_REVIEW
    if (filter?.queue && filter.queue !== 'ALL') {
      if (filter.queue === 'ELIGIBLE') {
        items = items.filter((a) => a.screeningRun?.mandatoryStatus === 'MEETS');
      } else if (filter.queue === 'INELIGIBLE') {
        items = items.filter((a) => a.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET');
      } else if (filter.queue === 'NEEDS_REVIEW') {
        items = items.filter(
          (a) =>
            a.status === 'NEEDS_REVIEW' ||
            a.processingStatus === 'NEEDS_REVIEW' ||
            a.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
            a.candidateProfile?.needsReview === true
        );
      }
    }

    // Sorting
    if (filter?.sortBy) {
      items.sort((a, b) => {
        let cmp = 0;
        if (filter.sortBy === 'score') {
          const scoreA = a.screeningRun?.totalScore ?? -1;
          const scoreB = b.screeningRun?.totalScore ?? -1;
          cmp = scoreA - scoreB;
        } else if (filter.sortBy === 'name') {
          cmp = a.applicant.fullName.localeCompare(b.applicant.fullName);
        } else {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return filter.sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    const total = items.length;
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: JSON.parse(JSON.stringify(paginatedItems)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getApplicationById(id: string): Promise<Application | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const app = applicationsState.find((a) => a.id === id);
    return app ? JSON.parse(JSON.stringify(app)) : null;
  },

  async addReviewDecision(params: {
    applicationId: string;
    reviewerId: string;
    reviewerName: string;
    decision: ReviewDecisionType;
    reason: string;
  }): Promise<Application> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    if (!params.reason.trim()) {
      throw new Error('A detailed explanation reason is required for every HR decision');
    }

    const appIndex = applicationsState.findIndex((a) => a.id === params.applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${params.applicationId} not found`);
    }

    const decision: ReviewDecision = {
      id: `rev-${Date.now()}`,
      applicationId: params.applicationId,
      reviewerId: params.reviewerId,
      reviewerName: params.reviewerName,
      decision: params.decision,
      reason: params.reason.trim(),
      createdAt: new Date().toISOString(),
    };

    const target = applicationsState[appIndex];
    let nextStatus: ApplicationStatus = target.status;

    if (params.decision === 'SHORTLIST') nextStatus = 'SHORTLISTED';
    else if (params.decision === 'REJECT') nextStatus = 'REJECTED_AFTER_REVIEW';
    else if (params.decision === 'HOLD') nextStatus = 'NEEDS_REVIEW';
    else if (params.decision === 'ADVANCE') nextStatus = 'SHORTLISTED';

    target.status = nextStatus;
    target.reviewDecisions.unshift(decision);
    target.updatedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(target));
  },

  async correctCandidateProfile(params: {
    applicationId: string;
    reviewerName: string;
    correctionReason: string;
    updatedProfile: Partial<CandidateProfile>;
  }): Promise<Application> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    if (!params.correctionReason.trim()) {
      throw new Error('An audit reason is required when correcting candidate facts');
    }

    const appIndex = applicationsState.findIndex((a) => a.id === params.applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${params.applicationId} not found`);
    }

    const target = applicationsState[appIndex];
    if (!target.candidateProfile) {
      throw new Error('No candidate profile available to edit');
    }

    target.candidateProfile = {
      ...target.candidateProfile,
      ...params.updatedProfile,
      updatedAt: new Date().toISOString(),
    };

    target.updatedAt = new Date().toISOString();

    // Log this change into reviews timeline
    target.reviewDecisions.unshift({
      id: `audit-${Date.now()}`,
      applicationId: params.applicationId,
      reviewerId: 'usr-hr-001',
      reviewerName: params.reviewerName,
      decision: 'HOLD',
      reason: `[Profile Fact Correction]: ${params.correctionReason}`,
      createdAt: new Date().toISOString(),
    });

    return JSON.parse(JSON.stringify(target));
  },

  async retryProcessing(applicationId: string): Promise<Application> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const appIndex = applicationsState.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const target = applicationsState[appIndex];
    target.processingStatus = 'PROCESSING';
    delete target.processingError;

    // Simulate recovery to completed screening
    target.processingStatus = 'COMPLETED';
    target.status = 'SCREENED';
    target.updatedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(target));
  },

  async simulateBatchUpload(
    jobId: string,
    files: { fileName: string; fileSize: number; mimeType: string }[]
  ): Promise<{ succeeded: Application[]; failedCount: number }> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const created: Application[] = [];
    let failed = 0;

    files.forEach((f, idx) => {
      // Simulate that files named "corrupted" or "encrypted" fail
      const isBad = f.fileName.toLowerCase().includes('corrupted') || f.fileName.toLowerCase().includes('encrypted');
      const appId = `app-upload-${Date.now()}-${idx}`;
      const now = new Date().toISOString();

      if (isBad) {
        failed += 1;
        const failedApp: Application = {
          id: appId,
          jobId,
          applicantId: `usr-new-${idx}`,
          source: 'HR_UPLOAD',
          status: 'FAILED',
          processingStatus: 'FAILED',
          processingError: 'Simulated parser failure: Unreadable binary header format.',
          cvDocument: {
            id: `doc-${appId}`,
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            uploadedAt: now,
          },
          applicant: {
            id: `usr-new-${idx}`,
            fullName: f.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            email: `applicant.${idx}@example.com`,
            phone: '+44 7700 900000',
            createdAt: now,
          },
          reviewDecisions: [],
          createdAt: now,
          updatedAt: now,
        };
        applicationsState.unshift(failedApp);
        created.push(failedApp);
      } else {
        const successApp: Application = {
          id: appId,
          jobId,
          applicantId: `usr-new-${idx}`,
          source: 'HR_UPLOAD',
          status: 'SCREENED',
          processingStatus: 'COMPLETED',
          cvDocument: {
            id: `doc-${appId}`,
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            uploadedAt: now,
          },
          applicant: {
            id: `usr-new-${idx}`,
            fullName: f.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            email: `applicant.${idx}@example.com`,
            phone: '+44 7700 900000',
            createdAt: now,
          },
          candidateProfile: {
            id: `prof-${appId}`,
            applicationId: appId,
            education: [
              {
                institution: 'State Technical University',
                degree: 'BSc Computer Science',
                fieldOfStudy: 'Software Engineering',
                isCompleted: true,
              },
            ],
            employmentHistory: [
              {
                company: 'Tech Solutions Ltd',
                title: 'Software Developer',
                startDate: '2021-01',
                isCurrentRole: true,
                yearsExperience: 5.5,
                description: 'Full stack development with Next.js and SQL.',
                technologiesUsed: ['TypeScript', 'Next.js', 'PostgreSQL'],
              },
            ],
            skills: ['TypeScript', 'Next.js', 'PostgreSQL'],
            certifications: [],
            extractionVersion: 'v1.4-json',
            needsReview: false,
            createdAt: now,
            updatedAt: now,
          },
          screeningRun: {
            id: `run-${appId}`,
            applicationId: appId,
            criteriaVersion: 1,
            mandatoryStatus: 'MEETS',
            totalScore: 85,
            overallStatus: 'ELIGIBLE',
            scoringVersion: 'rules-v1.0',
            scoreExplanation: {
              summary: 'Meets mandatory requirements from uploaded CV.',
              mandatoryPassed: true,
              scoredBreakdown: 'Technical skills: 85/100',
            },
            criterionResults: [],
            createdAt: now,
          },
          reviewDecisions: [],
          createdAt: now,
          updatedAt: now,
        };
        applicationsState.unshift(successApp);
        created.push(successApp);
      }
    });

    return { succeeded: created, failedCount: failed };
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const activeVacancies = mockJobs.filter((j) => j.status === 'PUBLISHED').length;
    const totalApplications = applicationsState.length;
    const awaitingReview = applicationsState.filter(
      (a) =>
        a.status === 'NEEDS_REVIEW' ||
        a.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
        (a.status === 'SCREENED' && a.reviewDecisions.length === 0)
    ).length;
    const processingFailures = applicationsState.filter((a) => a.processingStatus === 'FAILED').length;

    return {
      activeVacancies,
      totalApplications,
      awaitingReview,
      processingFailures,
    };
  },

  resetState() {
    applicationsState = JSON.parse(JSON.stringify(mockApplications));
  },
};
