export type ApprovalStage =
  | 'RECRUITER_SCREENING'
  | 'RECRUITER_PROPOSED'
  | 'DIRECTOR_APPROVED'
  | 'EXECUTIVE_AUTHORIZED'
  | 'REVISION_REQUESTED';

export interface ApprovalRecord {
  stage: ApprovalStage;
  approverName: string;
  approverRole: 'RECRUITER' | 'HR_DIRECTOR' | 'EXECUTIVE_ADMIN';
  approvedAt: string;
  comments: string;
  signatureHash: string;
}

export interface CandidateApprovalState {
  applicationId: string;
  currentStage: ApprovalStage;
  history: ApprovalRecord[];
  lastUpdated: string;
}
