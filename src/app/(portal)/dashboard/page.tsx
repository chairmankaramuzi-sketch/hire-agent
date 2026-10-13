'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Trash2,
  Download,
  ShieldAlert,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { applicationsService, jobsService, systemService } from '@/services';
import { DashboardMetrics, Job, Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Danger zone state
  const [dangerLoading, setDangerLoading] = useState<string | null>(null);
  const [dangerFeedback, setDangerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: 'reset' | 'purge-apps' | 'purge-jobs';
    title: string;
    description: string;
  } | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [m, j, apps] = await Promise.all([
        applicationsService.getDashboardMetrics(),
        jobsService.getJobs({ sortBy: 'createdAt', sortOrder: 'desc' }),
        applicationsService.getApplications({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setMetrics(m);
      setJobs(j);
      setRecentApplications(apps.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: 'reset' | 'purge-apps' | 'purge-jobs' | 'seed-batch') => {
    setDangerLoading(action);
    setDangerFeedback(null);
    try {
      if (action === 'reset') {
        const res = await systemService.resetSystem();
        setDangerFeedback({ type: 'success', message: res.message });
      } else if (action === 'purge-apps') {
        const res = await systemService.purgeApplications();
        setDangerFeedback({ type: 'success', message: res.message });
      } else if (action === 'purge-jobs') {
        const res = await systemService.purgeJobs();
        setDangerFeedback({ type: 'success', message: res.message });
      } else if (action === 'seed-batch') {
        const res = await systemService.seedCandidateBatch();
        setDangerFeedback({ type: 'success', message: res.message });
      }
      await loadData();
    } catch (err: any) {
      setDangerFeedback({ type: 'error', message: err?.message || 'Operation failed' });
    } finally {
      setDangerLoading(null);
      setConfirmModal(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-300"></div>
          <span>Loading dashboard metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recruitment Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of active vacancies, CV screening runs, and required human reviews.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create Vacancy
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vacancies</span>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{metrics?.activeVacancies ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Currently open for intake</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{metrics?.totalApplications ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Across all vacancies</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Awaiting Review</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900 mt-3">{metrics?.awaitingReview ?? metrics?.pendingReviews ?? 0}</p>
          <p className="text-xs text-amber-700 mt-1">Requires human HR decision</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Eligible Pool</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-900 mt-3">{metrics?.recommendedApplications ?? Math.max(0, (metrics?.totalApplications ?? 0) - (metrics?.awaitingReview ?? 0))}</p>
          <p className="text-xs text-emerald-700 mt-1">Met all mandatory criteria</p>
        </div>
      </div>

      {/* Grid: Active Vacancies & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Vacancies */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Vacancies</h2>
            <Link href="/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View all ({jobs.length})
            </Link>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-sm text-slate-500">
                No active vacancies found.
              </div>
            ) : (
              jobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {job.department ?? 'General'}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mt-1">{job.title}</h3>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>{job.applicationCount ?? 0} applications</span>
                    <Link
                      href={`/jobs/${job.id}/applications`}
                      className="text-indigo-600 font-semibold hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Pipeline <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Candidate Screenings</h2>
            <Link href="/applications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View all candidates
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No applications received yet. Use the Danger Zone below to ingest the 30-candidate test batch.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-5 py-3">Mandatory</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{app.applicant.fullName}</p>
                        <p className="text-[11px] text-slate-400">{app.applicant.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {app.screeningRun ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            {app.screeningRun.mandatoryStatus === 'MEETS' && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">Meets All</span>
                              </>
                            )}
                            {app.screeningRun.mandatoryStatus === 'DOES_NOT_MEET' && (
                              <>
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span className="text-rose-700">Fails Check</span>
                              </>
                            )}
                            {app.screeningRun.mandatoryStatus === 'UNKNOWN' && (
                              <>
                                <HelpCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-700">Uncertain</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {app.screeningRun ? (
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-slate-900 text-base">{app.screeningRun.totalScore}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Danger Feedback Notice */}
      {dangerFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            dangerFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {dangerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{dangerFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDangerFeedback(null)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DANGER ZONE & SYSTEM INITIALIZATION */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/40 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System Testing & Danger Zone</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Initialise the environment, run automated candidate testing batches, or purge test records.
              </p>
            </div>
          </div>

          <a
            href="/sample_docs/Combined_30_Candidates_Dossier.txt"
            download="Combined_30_Candidates_Dossier.txt"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download Master 30-CV Dossier (.txt)
          </a>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Load 30 Candidates Batch */}
          <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Ingest 30 Real CVs
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Processes all 30 realistic candidates from the combined dossier into the Senior Full-Stack role with fact extraction & scoring.
              </p>
            </div>

            <button
              type="button"
              disabled={dangerLoading !== null}
              onClick={() => handleAction('seed-batch')}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
            >
              {dangerLoading === 'seed-batch' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing 30 CVs...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Load & Screen 30 Candidates
                </>
              )}
            </button>
          </div>

          {/* Action 2: Purge Applications */}
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <Trash2 className="w-4 h-4 text-amber-600" />
                Remove All CVs & Applications
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Wipes all candidates, uploaded CV files, extractions, and scores. Preserves job vacancies and criteria.
              </p>
            </div>

            <button
              type="button"
              disabled={dangerLoading !== null}
              onClick={() =>
                setConfirmModal({
                  action: 'purge-apps',
                  title: 'Purge All Applications & CVs?',
                  description:
                    'This will permanently delete all candidate profiles, CV documents, and AI screening runs. Job vacancies will remain intact.',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Applications
            </button>
          </div>

          {/* Action 3: Reset Entire System */}
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Reset System to Baseline
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Clears all data and reinitialises the default vacancies (Senior Full-Stack, Product Manager) and baseline criteria.
              </p>
            </div>

            <button
              type="button"
              disabled={dangerLoading !== null}
              onClick={() =>
                setConfirmModal({
                  action: 'reset',
                  title: 'Reset Entire System to Baseline?',
                  description:
                    'This will reset all vacancies, criteria, candidates, and CV files back to a pristine initial state with default demo roles.',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Everything
            </button>
          </div>

          {/* Action 4: Remove Vacancies */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Briefcase className="w-4 h-4 text-slate-600" />
                Remove All Vacancies
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Removes all job postings and associated criteria rules from the system.
              </p>
            </div>

            <button
              type="button"
              disabled={dangerLoading !== null}
              onClick={() =>
                setConfirmModal({
                  action: 'purge-jobs',
                  title: 'Remove All Vacancies?',
                  description:
                    'This will delete all job definitions, their associated criteria, and candidate applications.',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Vacancies
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Danger zone action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={dangerLoading !== null}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dangerLoading !== null}
                onClick={() => handleAction(confirmModal.action)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {dangerLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Yes, Proceed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
