'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Award,
  Clock,
  ShieldCheck,
  Edit3,
  RefreshCw,
  Send,
  Download,
} from 'lucide-react';
import { applicationsService, jobsService } from '@/services';
import { Application, Job, ReviewDecisionType, User } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { InterviewQuestionGenerator } from '@/components/candidate/InterviewQuestionGenerator';
import { EmailDrafterModal } from '@/components/candidate/EmailDrafterModal';
import { ExecutiveXRayCard } from '@/components/candidate/ExecutiveXRayCard';
import { SelfSchedulingModal } from '@/components/candidate/SelfSchedulingModal';
import { ExecutiveBoardPackModal } from '@/components/candidate/ExecutiveBoardPackModal';
import { WhatsAppSmsOutreachModal } from '@/components/candidate/WhatsAppSmsOutreachModal';
import { ExecutiveApprovalWorkflow } from '@/components/candidate/ExecutiveApprovalWorkflow';
import { AiPreScreeningModal } from '@/components/candidate/AiPreScreeningModal';
import { BlindScreeningToggle } from '@/components/candidate/BlindScreeningToggle';
import { useBlindScreening } from '@/context/BlindScreeningContext';
import { Mail, Printer, Sparkles, Calendar, Smartphone } from 'lucide-react';
import { authService, activeUser } from '@/services/auth';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }> | { applicationId: string };
}) {
  const unwrapped = 'then' in params ? use(params as Promise<{ applicationId: string }>) : params;
  const applicationId = unwrapped.applicationId;

  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision form states
  const [currentUser, setCurrentUser] = useState<User>(activeUser);
  const [decision, setDecision] = useState<ReviewDecisionType>('SHORTLIST');
  const [reason, setReason] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
  }, []);

  // CV download states
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Blind Screening context
  const { isBlindMode, maskName, maskEmail, maskPhone, maskInstitution } = useBlindScreening();

  // AI Outreach & Workbench states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState(false);
  const [boardPackModalOpen, setBoardPackModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [preScreenModalOpen, setPreScreenModalOpen] = useState(false);
  const [highlightedEvidence, setHighlightedEvidence] = useState<string | null>(null);

  const handleDownloadCv = async () => {
    setDownloadingCv(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/cv-access`, {
        headers: {
          'x-user-id': currentUser.id || 'usr-hr-001',
          'x-user-role': currentUser.role || 'HR',
          'x-user-email': currentUser.email || 'hr@company.com',
          'x-user-name': currentUser.name || 'Jane Doe - HR Director',
        },
      });
      if (!res.ok) {
        throw new Error('Could not retrieve authorized CV access link');
      }
      const json = await res.json();
      if (json.data?.accessUrl) {
        window.open(json.data.accessUrl, '_blank');
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingCv(false);
    }
  };

  // Correction form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [editedSkills, setEditedSkills] = useState('');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const app = await applicationsService.getApplicationById(applicationId);
      setApplication(app);
      if (app) {
        const j = await jobsService.getJobById(app.jobId);
        setJob(j);
        setEditedSkills(app.candidateProfile?.skills.join(', ') || '');
      }
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click-to-Proof Verification handler
  const handleProofClick = (evidenceText: string) => {
    setHighlightedEvidence(evidenceText);
    const el = document.getElementById('click-to-proof-viewer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const fallback = document.getElementById('candidate-profile-summary');
      if (fallback) fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Quick Executive Decision handler from X-Ray
  const handleQuickAction = async (actionType: 'SHORTLIST' | 'ADVANCE' | 'REJECT') => {
    setDecision(actionType);
    const generatedReason = `Executive ${actionType.toLowerCase()} decision recorded via 30-Second X-Ray on ${new Date().toLocaleDateString()}`;
    setReason(generatedReason);
    setDecisionSubmitting(true);
    setDecisionError(null);
    setDecisionSuccess(null);

    try {
      const updated = await applicationsService.addReviewDecision({
        applicationId,
        reviewerId: currentUser.id || 'usr-hr-001',
        reviewerName: currentUser.name || 'Jane Doe',
        decision: actionType,
        reason: generatedReason,
      });
      setApplication(updated);
      setDecisionSuccess(`Candidate marked as '${actionType}'!`);
    } catch (err: unknown) {
      setDecisionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecisionError(null);
    setDecisionSuccess(null);

    if (!reason.trim()) {
      setDecisionError('An explicit rationale is required for all human review decisions.');
      return;
    }

    setDecisionSubmitting(true);
    try {
      const updated = await applicationsService.addReviewDecision({
        applicationId,
        reviewerId: currentUser.id || 'usr-hr-001',
        reviewerName: currentUser.name || 'Jane Doe',
        decision,
        reason,
      });
      setApplication(updated);
      setDecisionSuccess(`Decision '${decision}' recorded successfully.`);
      setReason('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDecisionError(err.message);
      } else {
        setDecisionError('An error occurred recording the decision.');
      }
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleProfileCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) return;

    try {
      const skillsArray = editedSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await applicationsService.correctCandidateProfile({
        applicationId,
        reviewerName: currentUser.name || 'Jane Doe - HR Director',
        correctionReason,
        updatedProfile: {
          skills: skillsArray,
        },
      });
      setApplication(updated);
      setIsEditingProfile(false);
      setCorrectionReason('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save correction.');
    }
  };

  const handleRetryProcessing = async () => {
    try {
      const updated = await applicationsService.retryProcessing(applicationId);
      setApplication(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to retry extraction.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading candidate evaluation...</div>;
  }

  if (!application) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Application Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">The requested application could not be found.</p>
        <Link href="/jobs" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">
          Return to Vacancies
        </Link>
      </div>
    );
  }

  const run = application.screeningRun;
  const profile = application.candidateProfile;

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors">
      {/* Top Bar Navigation & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${application.jobId}/applications`}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {job?.title ?? 'Position Application'}
              </span>
              <StatusBadge status={application.status} type="decision" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {maskName(application.applicant.fullName, application.id)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Blind Screening Toggle */}
          <BlindScreeningToggle />

          {/* Option C: AI Pre-Screening Interview */}
          <button
            type="button"
            onClick={() => setPreScreenModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold shadow-sm transition-all"
            title="View AI Asynchronous Pre-Screening interview answers & invite link"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Pre-Screen</span>
          </button>

          {/* Option 1: Self-Scheduling Interview Link */}
          <button
            type="button"
            onClick={() => setSchedulingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold shadow-sm transition-all"
            title="Generate personalized self-service scheduling link"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Self-Schedule</span>
          </button>

          {/* Option 4: WhatsApp & SMS Mobile Outreach */}
          <button
            type="button"
            onClick={() => setWhatsAppModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold shadow-sm transition-all"
            title="Send WhatsApp or SMS message"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Option 2: Executive Board Pack */}
          <button
            type="button"
            onClick={() => setBoardPackModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold shadow-sm transition-all"
            title="Generate Board Dossier for Directors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Board Pack</span>
          </button>

          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all"
            title="Draft email invitation or feedback to candidate"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Email Draft</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all"
            title="Print or export candidate brief"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {run && (
            <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 text-xs transition-colors">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Mandatory Check</span>
                <span className="font-bold text-slate-900 dark:text-white">{run.mandatoryStatus}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="text-slate-500 dark:text-slate-400 block">Total Score</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{run.totalScore}/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing failure recovery banner */}
      {application.processingStatus === 'FAILED' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Processing Failure Detected</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{application.processingError}</p>
            </div>
          </div>
          <button
            onClick={handleRetryProcessing}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Extraction Task
          </button>
        </div>
      )}

      {/* 30-Second Executive X-Ray Snapshot */}
      <ExecutiveXRayCard
        application={application}
        onProofClick={handleProofClick}
        onQuickAction={handleQuickAction}
      />

      {/* Main Grid: Left = Evaluation & Profile, Right = Decision & CV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Criterion-by-Criterion Results Breakdown */}
          {run && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Resume Screening Results</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Detailed evaluation showing exact proof found in the resume.
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {run.scoringVersion}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {run.criterionResults.map((result) => (
                  <div key={result.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              result.criterionType === 'MANDATORY'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            {result.criterionType}
                          </span>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{result.criterionName}</h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{result.explanation}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <StatusBadge status={result.status} type="mandatory" />
                        {result.criterionType === 'SCORED' && (
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                            {result.pointsEarned} / {result.pointsPossible} pts ({result.weight}%)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supporting Evidence Excerpt */}
                    {result.evidenceText && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Proof Found in Resume ({result.evidenceReference ?? 'Source document'}):
                        </span>
                        <blockquote className="italic text-slate-600 dark:text-slate-300 border-l-2 border-indigo-400 pl-2">
                          &ldquo;{result.evidenceText}&rdquo;
                        </blockquote>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleProofClick(result.evidenceText || '')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <span>🔍 Click-to-Proof: Highlight exact sentence in resume</span>
                          </button>
                        </div>
                        {result.confidenceScore && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                            AI Confidence: {(result.confidenceScore * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI-Tailored Interview Question Generator */}
          <InterviewQuestionGenerator
            candidateName={application.applicant.fullName}
            jobTitle={job?.title ?? 'Engineering Role'}
            missingOrBorderlineCriteria={
              run?.criterionResults
                .filter((r) => r.status === 'DOES_NOT_MEET' || r.status === 'UNKNOWN')
                .map((r) => r.criterionName) || []
            }
            skills={profile?.skills || []}
          />

          {/* Extracted Candidate Profile */}
          {profile && (
            <div
              id="candidate-profile-summary"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5 transition-colors"
            >
              {/* Click-to-Proof Verification Panel (Zero Second-Guessing) */}
              {highlightedEvidence && (
                <div
                  id="click-to-proof-viewer"
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50/70 dark:from-amber-950/50 dark:to-indigo-950/50 border-2 border-amber-400 dark:border-amber-500 shadow-md text-xs space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200 uppercase tracking-wide text-[11px]">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Click-to-Proof Verification (Zero Second-Guessing)
                    </span>
                    <button
                      onClick={() => setHighlightedEvidence(null)}
                      className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 px-2 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    >
                      Dismiss Highlight
                    </button>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 shadow-inner">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-semibold">
                      Exact sentence verified from candidate CV:
                    </p>
                    <mark className="bg-amber-200 dark:bg-amber-500/40 text-slate-950 dark:text-white px-2 py-1 rounded-md font-semibold text-xs leading-relaxed inline-block">
                      &ldquo;{highlightedEvidence}&rdquo;
                    </mark>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>The Director never has to manually Ctrl+F through a PDF—the proof is right in front of you.</span>
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Resume Information Summary</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Information extracted from candidate resume (Version {profile.extractionVersion})
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingProfile ? 'Cancel Edit' : 'Edit Information'}
                </button>
              </div>

              {/* Profile Correction Form */}
              {isEditingProfile && (
                <form onSubmit={handleProfileCorrection} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3 text-xs">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-300">Correct Resume Information</p>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Extracted Skills (comma-separated):</label>
                    <input
                      type="text"
                      value={editedSkills}
                      onChange={(e) => setEditedSkills(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Reason for change (required):</label>
                    <input
                      type="text"
                      required
                      placeholder="Explain what needed to be corrected in the resume..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                    >
                      Save Correction
                    </button>
                  </div>
                </form>
              )}

              {/* Employment History */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Employment History
                </h3>
                <div className="space-y-3">
                  {profile.employmentHistory.map((emp, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <div className="flex justify-between items-start font-semibold text-slate-900 dark:text-white">
                        <span>{emp.title} • {emp.company}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">{emp.startDate} to {emp.endDate || 'Present'} ({emp.yearsExperience} yrs)</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{emp.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.technologiesUsed.map((tech) => (
                          <span key={tech} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <GraduationCap className="w-4 h-4 text-slate-400" /> Education & Qualifications
                </h3>
                <div className="space-y-2">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{edu.degree}</p>
                        <p className="text-slate-500 dark:text-slate-400">{edu.institution} • {edu.fieldOfStudy}</p>
                      </div>
                      <span className="text-slate-400">{edu.endDate || 'Completed'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-slate-400" /> Extracted Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col) - Review Decision & Original Document */}
        <div className="space-y-6">
          {/* Option B: Multi-Stage Executive Approval Workflow */}
          <ExecutiveApprovalWorkflow
            applicationId={application.id}
            candidateName={application.applicant.fullName}
            jobTitle={job?.title ?? 'Engineering Role'}
            score={run?.totalScore ?? 0}
            currentUser={currentUser}
          />

          {/* HR Decision Action Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Record Human Review Decision</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The final hiring determination is strictly human-controlled.
              </p>
            </div>

            {decisionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs">
                {decisionError}
              </div>
            )}

            {decisionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs">
                {decisionSuccess}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Your Hiring Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { val: 'SHORTLIST', label: 'Shortlist', color: 'border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300' },
                      { val: 'HOLD', label: 'Hold / Review', color: 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300' },
                      { val: 'REJECT', label: 'Reject Candidate', color: 'border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300' },
                      { val: 'ADVANCE', label: 'Advance Stage', color: 'border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300' },
                    ] as const
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => setDecision(opt.val)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        decision === opt.val
                          ? `ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/60 ${opt.color}`
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Why did you make this decision? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write a brief explanation for your choice..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={decisionSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {decisionSubmitting ? 'Recording Decision...' : 'Save Decision'}
              </button>
            </form>
          </div>

          {/* Candidate Resume File Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Candidate Resume File
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl text-xs space-y-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white truncate">{application.cvDocument.fileName}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Size: {(application.cvDocument.fileSize / 1024).toFixed(1)} KB • Uploaded:{' '}
                  {new Date(application.cvDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadCv}
                  disabled={downloadingCv}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingCv ? 'Generating Access URL...' : 'Download Resume'}
                </button>
                {downloadError && (
                  <p className="text-[11px] text-red-600 mt-1.5">{downloadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Audit & Decision History
            </h3>

            {application.reviewDecisions.length === 0 ? (
              <p className="text-xs text-slate-400">No human decisions or corrections logged yet.</p>
            ) : (
              <div className="space-y-3">
                {application.reviewDecisions.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                      <span>{rev.reviewerName}</span>
                      <StatusBadge status={rev.decision} type="decision" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{rev.reason}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                      {new Date(rev.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Email Drafter Modal */}
      <EmailDrafterModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        candidateName={application.applicant.fullName}
        candidateEmail={application.applicant.email}
        jobTitle={job?.title ?? 'Engineering Role'}
        reviewerName={currentUser.name}
        score={run?.totalScore ?? 0}
      />

      {/* Option 1: Self-Scheduling Modal */}
      <SelfSchedulingModal
        isOpen={schedulingModalOpen}
        onClose={() => setSchedulingModalOpen(false)}
        candidateName={application.applicant.fullName}
        candidateEmail={application.applicant.email}
        candidatePhone={application.applicant.phone}
        jobTitle={job?.title ?? 'Engineering Role'}
        onScheduleConfirmed={(slot) => {
          setDecisionSuccess(`Interview confirmed with candidate for ${slot}!`);
        }}
      />

      {/* Option 2: Executive Board Pack Modal */}
      <ExecutiveBoardPackModal
        isOpen={boardPackModalOpen}
        onClose={() => setBoardPackModalOpen(false)}
        application={application}
        jobTitle={job?.title}
        department={job?.department}
      />

      {/* Option 4: WhatsApp & SMS Outreach Modal */}
      <WhatsAppSmsOutreachModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        candidateName={application.applicant.fullName}
        candidatePhone={application.applicant.phone}
        jobTitle={job?.title ?? 'Engineering Role'}
      />

      {/* Option C: AI Pre-Screening Modal */}
      <AiPreScreeningModal
        isOpen={preScreenModalOpen}
        onClose={() => setPreScreenModalOpen(false)}
        applicationId={application.id}
        candidateName={application.applicant.fullName}
        candidateEmail={application.applicant.email}
        candidatePhone={application.applicant.phone}
        jobTitle={job?.title ?? 'Engineering Role'}
        onSendInviteEmail={() => setEmailModalOpen(true)}
        onSendInviteWhatsApp={() => setWhatsAppModalOpen(true)}
      />
    </div>
  );
}
