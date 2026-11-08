export type NotificationType =
  | 'VACANCY_PUBLISHED'
  | 'CANDIDATE_SHORTLISTED'
  | 'BATCH_CV_SCREENED'
  | 'CANDIDATE_REJECTED'
  | 'DECISION_HOLD'
  | 'CRITERIA_UPDATED'
  | 'ANOMALY_FLAGGED';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actorName: string;
  actorRole: 'HR' | 'ADMIN' | 'RECRUITER' | 'SYSTEM_AI';
  targetId?: string;
  targetUrl?: string;
  createdAt: string;
  readBy: string[];
  priority: 'HIGH' | 'NORMAL' | 'URGENT';
  metadata?: {
    jobTitle?: string;
    candidateName?: string;
    candidateCount?: number;
    score?: number;
    department?: string;
    reason?: string;
    [key: string]: unknown;
  };
}
