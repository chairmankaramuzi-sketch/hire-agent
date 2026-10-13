export type UserRole = 'ADMIN' | 'HR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type CriterionType = 'MANDATORY' | 'SCORED';

export interface JobCriterion {
  id: string;
  jobId: string;
  name: string;
  description: string;
  criterionType: CriterionType;
  weight?: number; // Present and sums to 100 for scored criteria; undefined for mandatory
  ruleConfig?: {
    requiredYearsOfExperience?: number;
    requiredDegree?: string;
    acceptedKeywords?: string[];
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  status: JobStatus;
  scoreThreshold?: number;
  createdBy: string;
  criteria: JobCriterion[];
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'NEEDS_REVIEW'
  | 'SCREENED'
  | 'SHORTLISTED'
  | 'REJECTED_AFTER_REVIEW'
  | 'WITHDRAWN'
  | 'FAILED';

export type ProcessingStatus =
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'NEEDS_REVIEW'
  | 'FAILED';

export interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  createdAt: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
  isCompleted: boolean;
}

export interface EmploymentEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string; // empty or undefined if current
  isCurrentRole: boolean;
  yearsExperience: number;
  description: string;
  technologiesUsed: string[];
}

export interface CandidateProfile {
  id: string;
  applicationId: string;
  education: EducationEntry[];
  employmentHistory: EmploymentEntry[];
  skills: string[];
  certifications: string[];
  extractionVersion: string;
  needsReview: boolean;
  uncertaintyNotes?: string[];
  rawTextExcerpt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CriterionResultStatus = 'MEETS' | 'DOES_NOT_MEET' | 'PARTIAL' | 'UNKNOWN';

export interface CriterionResult {
  id: string;
  screeningRunId: string;
  criterionId: string;
  criterionName: string;
  criterionType: CriterionType;
  status: CriterionResultStatus;
  pointsEarned?: number;
  pointsPossible?: number;
  weight?: number;
  explanation: string;
  evidenceText?: string;
  evidenceReference?: string;
  needsReview: boolean;
  confidenceScore?: number; // 0-1 confidence from parsing model
}

export interface ScreeningRun {
  id: string;
  applicationId: string;
  criteriaVersion: number;
  mandatoryStatus: 'MEETS' | 'DOES_NOT_MEET' | 'UNKNOWN';
  totalScore: number; // 0 - 100 based on scored criteria
  overallStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';
  scoreExplanation: {
    summary: string;
    mandatoryPassed: boolean;
    scoredBreakdown: string;
  };
  scoringVersion: string;
  criterionResults: CriterionResult[];
  createdAt: string;
}

export type ReviewDecisionType = 'SHORTLIST' | 'HOLD' | 'REJECT' | 'ADVANCE';

export interface ReviewDecision {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  decision: ReviewDecisionType;
  reason: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  applicant: Applicant;
  source: 'APPLICANT_PORTAL' | 'HR_UPLOAD';
  status: ApplicationStatus;
  processingStatus: ProcessingStatus;
  processingError?: string;
  cvDocument: {
    id: string;
    fileName: string;
    fileSize: number; // in bytes
    mimeType: string;
    uploadedAt: string;
  };
  candidateProfile?: CandidateProfile;
  screeningRun?: ScreeningRun;
  reviewDecisions: ReviewDecision[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  activeVacancies: number;
  totalApplications: number;
  awaitingReview: number;
  processingFailures: number;
  pendingReviews?: number;
  recommendedApplications?: number;
}
