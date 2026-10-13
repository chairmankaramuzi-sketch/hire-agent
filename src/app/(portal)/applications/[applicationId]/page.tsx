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

  const handleDownloadCv = async () => {
    setDownloadingCv(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/cv-access`, {
        headers: {
          'x-user-id': 'usr-hr-001',
          'x-user-role': 'HR',
          'x-user-email': 'hr@company.com',
          'x-user-name': 'Jane Doe - HR Director',
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
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        decision,
        reason,
      });
      setApplication(updated);
      setReason('');
      setDecisionSuccess(`Successfully recorded human review decision: ${decision}.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDecisionError(err.message);
      } else {
        setDecisionError('Failed to record review decision.');
      }
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleProfileCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      alert('Please specify an audit reason for the profile correction.');
      return;
    }

    try {
      const updatedSkillsList = editedSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const updated = await applicationsService.correctCandidateProfile({
        applicationId,
        reviewerName: currentUser.name,
        correctionReason,
        updatedProfile: {
          skills: updatedSkillsList,
          needsReview: false,
        },
      });
      setApplication(updated);
      setIsEditingProfile(false);
      setCorrectionReason('');
      alert('Candidate facts corrected and logged in audit history.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleRetryProcessing = async () => {
    try {
      const recovered = await applicationsService.retryProcessing(applicationId);
      setApplication(recovered);
      alert('Document processing recovered successfully.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading candidate profile and evaluation data...</div>;
  }

  if (!application) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Application not found</h2>
        <Link href="/dashboard" className="text-sm text-indigo-600 mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const profile = application.candidateProfile;
  const run = application.screeningRun;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${application.jobId}/applications`}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {job?.title ?? 'Position Application'}
              </span>
              <StatusBadge status={application.status} type="decision" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              {application.applicant.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {run && (
            <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Mandatory Check</span>
                <span className="font-bold text-slate-900">{run.mandatoryStatus}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block">Total Score</span>
                <span className="text-lg font-extrabold text-indigo-600">{run.totalScore}/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing failure recovery banner */}
      {application.processingStatus === 'FAILED' && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Processing Failure Detected</p>
              <p className="text-xs text-rose-700 mt-1">{application.processingError}</p>
            </div>
          </div>
          <button
            onClick={handleRetryProcessing}
            className="px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Extraction Task
          </button>
        </div>
      )}

      {/* Main Grid: Left = Evaluation & Profile, Right = Decision & CV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Criterion-by-Criterion Results Breakdown */}
          {run && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Deterministic Screening Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Job criteria results with evidence excerpts and extraction confidence.
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {run.scoringVersion}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {run.criterionResults.map((result) => (
                  <div key={result.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              result.criterionType === 'MANDATORY'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            }`}
                          >
                            {result.criterionType}
                          </span>
                          <h3 className="font-semibold text-sm text-slate-900">{result.criterionName}</h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{result.explanation}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <StatusBadge status={result.status} type="mandatory" />
                        {result.criterionType === 'SCORED' && (
                          <div className="text-xs font-bold text-slate-700 mt-1">
                            {result.pointsEarned} / {result.pointsPossible} pts ({result.weight}%)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supporting Evidence Excerpt */}
                    {result.evidenceText && (
                      <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-xs">
                        <span className="font-semibold text-slate-700 block mb-1">
                          CV Evidence Excerpt ({result.evidenceReference ?? 'Source document'}):
                        </span>
                        <blockquote className="italic text-slate-600 border-l-2 border-indigo-400 pl-2">
                          &ldquo;{result.evidenceText}&rdquo;
                        </blockquote>
                        {result.confidenceScore && (
                          <div className="text-[11px] text-slate-400 mt-1.5">
                            Extraction confidence: {(result.confidenceScore * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Candidate Profile */}
          {profile && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Extracted Candidate Facts</h2>
                  <p className="text-xs text-slate-500">
                    Structured information parsed from CV document (Version {profile.extractionVersion})
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingProfile ? 'Cancel Edit' : 'Correct Facts (Audit)'}
                </button>
              </div>

              {/* Profile Correction Form */}
              {isEditingProfile && (
                <form onSubmit={handleProfileCorrection} className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3 text-xs">
                  <p className="font-semibold text-indigo-900">Audit Profile Correction</p>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Extracted Skills (comma-separated):</label>
                    <input
                      type="text"
                      value={editedSkills}
                      onChange={(e) => setEditedSkills(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Correction Audit Reason (required):</label>
                    <input
                      type="text"
                      required
                      placeholder="Explain what was extracted incorrectly from the CV..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1 border border-slate-300 rounded bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700"
                    >
                      Save Correction
                    </button>
                  </div>
                </form>
              )}

              {/* Employment History */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Employment History
                </h3>
                <div className="space-y-3">
                  {profile.employmentHistory.map((emp, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex justify-between items-start font-semibold text-slate-900">
                        <span>{emp.title} • {emp.company}</span>
                        <span className="text-slate-500 font-normal">{emp.startDate} to {emp.endDate || 'Present'} ({emp.yearsExperience} yrs)</span>
                      </div>
                      <p className="text-slate-600 mt-1">{emp.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.technologiesUsed.map((tech) => (
                          <span key={tech} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700 font-medium">
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
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <GraduationCap className="w-4 h-4 text-slate-400" /> Education & Qualifications
                </h3>
                <div className="space-y-2">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">{edu.degree}</p>
                        <p className="text-slate-500">{edu.institution} • {edu.fieldOfStudy}</p>
                      </div>
                      <span className="text-slate-400">{edu.endDate || 'Completed'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-slate-400" /> Extracted Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-800">
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
          {/* HR Decision Action Panel */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Record Human Review Decision</h2>
              <p className="text-xs text-slate-500">
                The final hiring determination is strictly human-controlled.
              </p>
            </div>

            {decisionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs">
                {decisionError}
              </div>
            )}

            {decisionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs">
                {decisionSuccess}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Human Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { val: 'SHORTLIST', label: 'Shortlist', color: 'border-emerald-300 text-emerald-800' },
                      { val: 'HOLD', label: 'Hold / Review', color: 'border-amber-300 text-amber-800' },
                      { val: 'REJECT', label: 'Reject Candidate', color: 'border-rose-300 text-rose-800' },
                      { val: 'ADVANCE', label: 'Advance Stage', color: 'border-blue-300 text-blue-800' },
                    ] as const
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => setDecision(opt.val)}
                      className={`p-2.5 rounded-lg border text-left font-bold transition-all ${
                        decision === opt.val
                          ? `ring-2 ring-indigo-500 bg-indigo-50/50 ${opt.color}`
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Decision Reason & Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mandatory rationale for why this candidate was shortlisted, placed on hold, or rejected..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={decisionSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {decisionSubmitting ? 'Recording Decision...' : 'Finalize Decision'}
              </button>
            </form>
          </div>

          {/* Original CV Document Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Original CV Document
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-3">
              <div>
                <p className="font-semibold text-slate-900 truncate">{application.cvDocument.fileName}</p>
                <p className="text-slate-500 mt-0.5">
                  Size: {(application.cvDocument.fileSize / 1024).toFixed(1)} KB • Uploaded:{' '}
                  {new Date(application.cvDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadCv}
                  disabled={downloadingCv}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingCv ? 'Generating Access URL...' : 'Download Original CV'}
                </button>
                {downloadError && (
                  <p className="text-[11px] text-red-600 mt-1.5">{downloadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Audit & Decision History
            </h3>

            {application.reviewDecisions.length === 0 ? (
              <p className="text-xs text-slate-400">No human decisions or corrections logged yet.</p>
            ) : (
              <div className="space-y-3">
                {application.reviewDecisions.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center font-semibold text-slate-800">
                      <span>{rev.reviewerName}</span>
                      <StatusBadge status={rev.decision} type="decision" />
                    </div>
                    <p className="text-slate-600 mt-1">{rev.reason}</p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      {new Date(rev.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
