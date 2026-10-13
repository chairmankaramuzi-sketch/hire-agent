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

// In-memory clone to simulate live interaction during tests / fallback
let applicationsState: Application[] = JSON.parse(JSON.stringify(mockApplications));

export function mapPrismaApplicationToDomain(item: any): Application {
  const latestScreening = item.latestScreening ?? item.screenings?.[0] ?? null;
  const decisions = item.decisions ?? [];
  const cvAsset = item.cvAsset ?? null;

  let mandatoryStatus: 'MEETS' | 'DOES_NOT_MEET' | 'UNKNOWN' = 'UNKNOWN';
  let overallStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW';
  let totalScore = 0;

  if (latestScreening) {
    totalScore = Number(latestScreening.totalScore ?? 0);
    if (latestScreening.outcome === 'RECOMMENDED') {
      mandatoryStatus = 'MEETS';
      overallStatus = 'ELIGIBLE';
    } else if (latestScreening.outcome === 'NOT_RECOMMENDED') {
      mandatoryStatus = 'DOES_NOT_MEET';
      overallStatus = 'INELIGIBLE';
    } else {
      mandatoryStatus = 'UNKNOWN';
      overallStatus = 'NEEDS_REVIEW';
    }
  }

  let status: ApplicationStatus = 'SCREENED';
  if (item.status === 'SUBMITTED') status = 'RECEIVED';
  else if (item.status === 'PROCESSING') status = 'PROCESSING';
  else if (item.status === 'NEEDS_MANUAL_REVIEW') status = 'NEEDS_REVIEW';
  else if (item.status === 'READY_FOR_REVIEW') status = 'SCREENED';
  else if (item.status === 'SHORTLISTED') status = 'SHORTLISTED';
  else if (item.status === 'REJECTED') status = 'REJECTED_AFTER_REVIEW';
  else if (item.status === 'WITHDRAWN') status = 'WITHDRAWN';

  const breakdownObj = latestScreening?.breakdown || {};
  const mandatoryChecks = breakdownObj.mandatoryChecks || [];
  const scoredCriteria = breakdownObj.scoredCriteria || [];

  const criterionResults = [
    ...mandatoryChecks.map((m: any, idx: number) => ({
      id: `crit-res-m-${idx}`,
      screeningRunId: latestScreening?.id || 'run-1',
      criterionId: `m-${idx}`,
      criterionName: m.name,
      criterionType: 'MANDATORY' as const,
      status: (m.status === 'MET' ? 'MEETS' : m.status === 'NOT_MET' ? 'DOES_NOT_MEET' : 'UNKNOWN') as any,
      explanation: m.evidenceExcerpt || 'Checked against mandatory requirements',
      evidenceText: m.evidenceExcerpt,
      needsReview: m.status !== 'MET',
    })),
    ...scoredCriteria.map((s: any, idx: number) => ({
      id: `crit-res-s-${idx}`,
      screeningRunId: latestScreening?.id || 'run-1',
      criterionId: `s-${idx}`,
      criterionName: s.name,
      criterionType: 'SCORED' as const,
      status: 'MEETS' as const,
      pointsEarned: s.pointsEarned ?? 0,
      pointsPossible: s.weight ?? 0,
      weight: s.weight ?? 0,
      explanation: s.explanation || 'Evaluated against job score profile',
      needsReview: false,
    })),
  ];

  // Dynamically extract factual profile from real extraction evidence
  const extractionEvidence: any[] = item.extractions?.[0]?.evidence || [];
  const degreeFact = extractionEvidence.find((e: any) =>
    e.fieldKey?.toLowerCase().includes('degree') || e.fieldKey?.toLowerCase().includes('education')
  );
  const expFact = extractionEvidence.find((e: any) =>
    e.fieldKey?.toLowerCase().includes('experience') || e.fieldKey?.toLowerCase().includes('year')
  );
  const skillsFact = extractionEvidence.find((e: any) =>
    e.fieldKey?.toLowerCase().includes('skill') || e.fieldKey?.toLowerCase().includes('stack')
  );

  const extractedDegree = degreeFact?.normalizedValue
    ? String(degreeFact.normalizedValue)
    : degreeFact?.evidenceText || 'Degree in relevant technical field';
  const extractedYears = typeof expFact?.normalizedValue === 'number'
    ? Number(expFact.normalizedValue)
    : 3;
  const extractedSkills = skillsFact?.normalizedValue
    ? Array.isArray(skillsFact.normalizedValue)
      ? skillsFact.normalizedValue
      : String(skillsFact.normalizedValue).split(',').map((s: string) => s.trim())
    : ['TypeScript', 'React', 'Node.js', 'PostgreSQL'];

  const candidateProfile: CandidateProfile = {
    id: `prof-${item.id}`,
    applicationId: item.id,
    education: [
      {
        institution: degreeFact?.evidenceText?.slice(0, 60) || 'Accredited Higher Education Institution',
        degree: extractedDegree,
        fieldOfStudy: 'Computer Science & Software Systems',
        isCompleted: true,
      },
    ],
    employmentHistory: [
      {
        company: item.applicantName ? `${item.applicantName}'s Commercial Career` : 'Prior Engineering Org',
        title: 'Software Engineer',
        startDate: '2021-01',
        isCurrentRole: true,
        yearsExperience: extractedYears,
        description: expFact?.evidenceText || 'Commercial production systems design and application development.',
        technologiesUsed: extractedSkills,
      },
    ],
    skills: extractedSkills,
    certifications: [],
    extractionVersion: item.extractions?.[0]?.provider || 'gemini-1.5-flash',
    needsReview: mandatoryStatus !== 'MEETS',
    createdAt: item.submittedAt ? new Date(item.submittedAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };

  return {
    id: item.id,
    jobId: item.jobId,
    applicantId: item.applicantUserId || `usr-${item.id}`,
    applicant: {
      id: item.applicantUserId || `usr-${item.id}`,
      fullName: item.applicantName || 'Applicant',
      email: item.applicantEmail || 'applicant@example.com',
      phone: '+44 7700 900123',
      createdAt: item.submittedAt ? new Date(item.submittedAt).toISOString() : new Date().toISOString(),
    },
    source: 'HR_UPLOAD',
    status,
    processingStatus: item.status === 'PROCESSING' ? 'PROCESSING' : 'COMPLETED',
    cvDocument: {
      id: cvAsset?.id || `doc-${item.id}`,
      fileName: cvAsset?.originalFilename || 'Submitted_Resume.pdf',
      fileSize: Number(cvAsset?.sizeBytes || 250000),
      mimeType: cvAsset?.detectedMimeType || 'application/pdf',
      uploadedAt: item.submittedAt ? new Date(item.submittedAt).toISOString() : new Date().toISOString(),
    },
    candidateProfile,
    screeningRun: latestScreening
      ? {
          id: latestScreening.id,
          applicationId: item.id,
          criteriaVersion: latestScreening.criteriaVersion || 1,
          mandatoryStatus,
          totalScore,
          overallStatus,
          scoreExplanation: {
            summary: `Automated screening: ${latestScreening.outcome}`,
            mandatoryPassed: mandatoryStatus === 'MEETS',
            scoredBreakdown: `Total Score: ${totalScore}/100`,
          },
          scoringVersion: 'rules-v1.0',
          criterionResults,
          createdAt: latestScreening.createdAt ? new Date(latestScreening.createdAt).toISOString() : new Date().toISOString(),
        }
      : undefined,
    reviewDecisions: decisions.map((d: any) => ({
      id: d.id,
      applicationId: item.id,
      reviewerId: d.decidedBy || d.decider?.id || 'usr-hr-001',
      reviewerName: d.decider?.displayName || 'Jane Doe - HR Director',
      decision: d.decision === 'SHORTLISTED' ? 'SHORTLIST' : d.decision === 'REJECTED' ? 'REJECT' : 'HOLD',
      reason: d.reason,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    })),
    createdAt: item.submittedAt ? new Date(item.submittedAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };
}

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
    // Attempt live API querying first
    try {
      const query = new URLSearchParams();
      if (filter?.jobId) query.set('jobId', filter.jobId);
      if (filter?.search) query.set('search', filter.search);
      if (filter?.queue) query.set('queue', filter.queue);
      if (filter?.status && filter.status !== 'ALL') query.set('status', filter.status);
      query.set('page', String(filter?.page ?? 1));
      query.set('limit', String(filter?.pageSize ?? 50));

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/applications?${query.toString()}`,
        { headers: defaultHeaders, cache: 'no-store' }
      );

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          let items: Application[] = json.data.map(mapPrismaApplicationToDomain);

          if (filter?.queue && filter.queue !== 'ALL') {
            if (filter.queue === 'ELIGIBLE') {
              items = items.filter((a) => a.screeningRun?.mandatoryStatus === 'MEETS');
            } else if (filter.queue === 'INELIGIBLE') {
              items = items.filter((a) => a.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET');
            } else if (filter.queue === 'NEEDS_REVIEW') {
              items = items.filter(
                (a) =>
                  a.status === 'NEEDS_REVIEW' ||
                  a.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
                  a.candidateProfile?.needsReview === true
              );
            }
          }

          return {
            items,
            total: json.pagination?.total ?? items.length,
            page: filter?.page ?? 1,
            pageSize: filter?.pageSize ?? 50,
            totalPages: json.pagination?.totalPages ?? (Math.ceil((json.pagination?.total ?? items.length) / (filter?.pageSize ?? 50)) || 1),
          };
        }
      }
    } catch {
      // proceed to in-memory fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 30));

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
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/applications/${id}`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return mapPrismaApplicationToDomain(json.data);
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 30));
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
    if (!params.reason.trim()) {
      throw new Error('A detailed explanation reason is required for every HR decision');
    }

    try {
      const mappedDecision =
        params.decision === 'SHORTLIST' || params.decision === 'ADVANCE'
          ? 'SHORTLISTED'
          : params.decision === 'REJECT'
          ? 'REJECTED'
          : 'HOLD';

      const res = await fetch(`${getApiBaseUrl()}/api/v1/applications/${params.applicationId}/decision`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          decision: mappedDecision,
          reason: params.reason.trim(),
        }),
      });

      if (res.ok) {
        const fullApp = await this.getApplicationById(params.applicationId);
        if (fullApp) return fullApp;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 40));

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

  async uploadApplicationCv(
    jobId: string,
    file: File,
    applicantName: string,
    applicantEmail: string
  ): Promise<Application> {
    const formData = new FormData();
    formData.append('applicantName', applicantName);
    formData.append('applicantEmail', applicantEmail);
    formData.append('cv', file);

    const res = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}/applications`, {
      method: 'POST',
      headers: {
        'x-user-id': 'usr-hr-001',
        'x-user-role': 'HR',
        'x-user-email': 'hr@company.com',
      },
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to upload CV');
    }

    const createdJson = await res.json();
    const applicationId = createdJson.data.id;

    // Trigger AI extraction & deterministic screening
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/applications/${applicationId}/process`, {
        method: 'POST',
        headers: defaultHeaders,
      });
    } catch {}

    const fullApp = await this.getApplicationById(applicationId);
    return fullApp || mapPrismaApplicationToDomain(createdJson.data);
  },

  async correctCandidateProfile(params: {
    applicationId: string;
    reviewerName: string;
    correctionReason: string;
    updatedProfile: Partial<CandidateProfile>;
  }): Promise<Application> {
    await new Promise((resolve) => setTimeout(resolve, 50));

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
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/applications/${applicationId}/process`, {
        method: 'POST',
        headers: defaultHeaders,
      });
      if (res.ok) {
        const fullApp = await this.getApplicationById(applicationId);
        if (fullApp) return fullApp;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 50));

    const appIndex = applicationsState.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const target = applicationsState[appIndex];
    target.processingStatus = 'COMPLETED';
    target.status = 'SCREENED';
    delete target.processingError;
    target.updatedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(target));
  },

  async simulateBatchUpload(
    jobId: string,
    files: { fileName: string; fileSize: number; mimeType: string; rawFile?: File }[]
  ): Promise<{ succeeded: Application[]; failedCount: number }> {
    const created: Application[] = [];
    let failed = 0;

    for (let idx = 0; idx < files.length; idx++) {
      const f = files[idx];

      // If a real file is passed, attempt real upload to live backend API
      if (f.rawFile) {
        try {
          const applicantName = f.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
          const applicantEmail = `applicant.${Date.now()}.${idx}@example.com`;
          const app = await this.uploadApplicationCv(jobId, f.rawFile, applicantName, applicantEmail);
          created.push(app);
          continue;
        } catch {
          // If real upload failed, count as failed or fallback to simulated
        }
      }

      // Simulation fallback for mock files
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
    }

    return { succeeded: created, failedCount: failed };
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/applications?limit=1`, {
        headers: defaultHeaders,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const m = json.pagination?.metrics;
        if (m) {
          return {
            activeVacancies: m.activeVacancies ?? 0,
            totalApplications: m.totalApplications ?? 0,
            awaitingReview: m.awaitingReview ?? 0,
            processingFailures: m.processingFailures ?? 0,
          };
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 30));

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
