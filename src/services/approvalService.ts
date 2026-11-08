import { ApprovalStage, CandidateApprovalState, ApprovalRecord } from '@/types/approval';
import { notificationsService } from './notifications';

const APPROVALS_STORAGE_KEY = 'talentscreen_candidate_approvals_v1';

// Seed initial approval states for realism
const INITIAL_APPROVALS: Record<string, CandidateApprovalState> = {
  'app-001': {
    applicationId: 'app-001',
    currentStage: 'DIRECTOR_APPROVED',
    history: [
      {
        stage: 'RECRUITER_PROPOSED',
        approverName: 'MRS. ROSE',
        approverRole: 'RECRUITER',
        approvedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        comments: 'Verified 8 years of technical experience in PostgreSQL and React. Recommending for Director review.',
        signatureHash: 'SIG-ROSE-892F1',
      },
      {
        stage: 'DIRECTOR_APPROVED',
        approverName: 'MR. NAHURIRA',
        approverRole: 'HR_DIRECTOR',
        approvedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        comments: 'Technical evaluation confirmed at 94%. Approved for final executive interview with Mr. Kalamuzi.',
        signatureHash: 'SIG-NAHURIRA-431A8',
      },
    ],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  'app-002': {
    applicationId: 'app-002',
    currentStage: 'RECRUITER_PROPOSED',
    history: [
      {
        stage: 'RECRUITER_PROPOSED',
        approverName: 'MRS. ROSE',
        approverRole: 'RECRUITER',
        approvedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        comments: 'Matches mandatory qualifications. Awaiting HR Director review.',
        signatureHash: 'SIG-ROSE-712B4',
      },
    ],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
};

const approvalListeners = new Set<() => void>();

function notifyApprovalListeners() {
  approvalListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

function loadAllApprovals(): Record<string, CandidateApprovalState> {
  if (typeof window === 'undefined') return INITIAL_APPROVALS;
  try {
    const raw = localStorage.getItem(APPROVALS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(INITIAL_APPROVALS));
  } catch {}
  return INITIAL_APPROVALS;
}

function saveApprovals(data: Record<string, CandidateApprovalState>) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
  notifyApprovalListeners();
}

export const approvalService = {
  subscribe(callback: () => void): () => void {
    approvalListeners.add(callback);
    return () => approvalListeners.delete(callback);
  },

  getApprovalState(applicationId: string): CandidateApprovalState {
    const all = loadAllApprovals();
    if (all[applicationId]) {
      return all[applicationId];
    }
    // Default fresh candidate state
    return {
      applicationId,
      currentStage: 'RECRUITER_SCREENING',
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Recruiter (MRS. ROSE) submits candidate for Director approval
   */
  submitForDirectorApproval(
    applicationId: string,
    recruiterName: string,
    candidateName: string,
    notes: string
  ): CandidateApprovalState {
    const all = loadAllApprovals();
    const current = this.getApprovalState(applicationId);

    const record: ApprovalRecord = {
      stage: 'RECRUITER_PROPOSED',
      approverName: recruiterName || 'MRS. ROSE',
      approverRole: 'RECRUITER',
      approvedAt: new Date().toISOString(),
      comments: notes || 'Screening passed. Submitted for Director evaluation.',
      signatureHash: `SIG-${Date.now().toString(36).toUpperCase()}`,
    };

    const updated: CandidateApprovalState = {
      applicationId,
      currentStage: 'RECRUITER_PROPOSED',
      history: [record, ...current.history],
      lastUpdated: new Date().toISOString(),
    };

    all[applicationId] = updated;
    saveApprovals(all);

    // Notify HR Director (MR. NAHURIRA)
    notificationsService.addNotification({
      type: 'CANDIDATE_SHORTLISTED',
      title: `Recruiter Proposed Candidate: ${candidateName}`,
      message: `${recruiterName} submitted candidate for HR Director interview sign-off. Note: "${notes}"`,
      actorName: recruiterName,
      actorRole: 'RECRUITER',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'HIGH',
      metadata: { candidateName, stage: 'RECRUITER_PROPOSED' },
    });

    return updated;
  },

  /**
   * HR Director (MR. NAHURIRA) approves candidate for technical interview
   */
  directorApprove(
    applicationId: string,
    directorName: string,
    candidateName: string,
    notes: string
  ): CandidateApprovalState {
    const all = loadAllApprovals();
    const current = this.getApprovalState(applicationId);

    const record: ApprovalRecord = {
      stage: 'DIRECTOR_APPROVED',
      approverName: directorName || 'MR. NAHURIRA',
      approverRole: 'HR_DIRECTOR',
      approvedAt: new Date().toISOString(),
      comments: notes || 'Director approval granted. Candidate advanced to technical interview stage.',
      signatureHash: `SIG-${Date.now().toString(36).toUpperCase()}`,
    };

    const updated: CandidateApprovalState = {
      applicationId,
      currentStage: 'DIRECTOR_APPROVED',
      history: [record, ...current.history],
      lastUpdated: new Date().toISOString(),
    };

    all[applicationId] = updated;
    saveApprovals(all);

    // Notify Executive Admin (MR. KALAMUZI)
    notificationsService.addNotification({
      type: 'CANDIDATE_SHORTLISTED',
      title: `HR Director Approved: ${candidateName}`,
      message: `${directorName} granted Director approval for ${candidateName}. Candidate placed in executive review queue.`,
      actorName: directorName,
      actorRole: 'HR',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'HIGH',
      metadata: { candidateName, stage: 'DIRECTOR_APPROVED' },
    });

    return updated;
  },

  /**
   * Executive / Administrator (MR. KALAMUZI) gives final hiring sign-off & offer authorization
   */
  executiveAuthorize(
    applicationId: string,
    executiveName: string,
    candidateName: string,
    notes: string
  ): CandidateApprovalState {
    const all = loadAllApprovals();
    const current = this.getApprovalState(applicationId);

    const record: ApprovalRecord = {
      stage: 'EXECUTIVE_AUTHORIZED',
      approverName: executiveName || 'MR. KALAMUZI',
      approverRole: 'EXECUTIVE_ADMIN',
      approvedAt: new Date().toISOString(),
      comments: notes || 'Final executive authorization signed. Employment offer approved for issuance.',
      signatureHash: `EXEC-SIG-${Date.now().toString(36).toUpperCase()}`,
    };

    const updated: CandidateApprovalState = {
      applicationId,
      currentStage: 'EXECUTIVE_AUTHORIZED',
      history: [record, ...current.history],
      lastUpdated: new Date().toISOString(),
    };

    all[applicationId] = updated;
    saveApprovals(all);

    // Broadcast system alert across all staff
    notificationsService.addNotification({
      type: 'CANDIDATE_SHORTLISTED',
      title: `Executive Sign-off: ${candidateName} Approved for Offer`,
      message: `${executiveName} granted final executive authorization. Board Pack signed off.`,
      actorName: executiveName,
      actorRole: 'ADMIN',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'HIGH',
      metadata: { candidateName, stage: 'EXECUTIVE_AUTHORIZED' },
    });

    return updated;
  },

  /**
   * Request revisions or additional checks
   */
  requestRevisions(
    applicationId: string,
    reviewerName: string,
    candidateName: string,
    notes: string
  ): CandidateApprovalState {
    const all = loadAllApprovals();
    const current = this.getApprovalState(applicationId);

    const record: ApprovalRecord = {
      stage: 'REVISION_REQUESTED',
      approverName: reviewerName,
      approverRole: 'HR_DIRECTOR',
      approvedAt: new Date().toISOString(),
      comments: notes || 'Revisions requested. Please verify background or gather extra references.',
      signatureHash: `REV-${Date.now().toString(36).toUpperCase()}`,
    };

    const updated: CandidateApprovalState = {
      applicationId,
      currentStage: 'REVISION_REQUESTED',
      history: [record, ...current.history],
      lastUpdated: new Date().toISOString(),
    };

    all[applicationId] = updated;
    saveApprovals(all);

    notificationsService.addNotification({
      type: 'DECISION_HOLD',
      title: `Revisions Requested for ${candidateName}`,
      message: `${reviewerName} requested additional verification before advancing candidate: "${notes}"`,
      actorName: reviewerName,
      actorRole: 'HR',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'NORMAL',
    });

    return updated;
  },
};
