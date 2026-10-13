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
  UserCog,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { applicationsService, jobsService, systemService } from '@/services';
import type { SystemCounts } from '@/services/system';
import { staffAccounts, APPLICANT_SEED_PASSWORD } from '@/lib/data/staffAccounts';
import { DashboardMetrics, Job, Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Danger zone state
  type DangerAction = 'reset' | 'purge-apps' | 'purge-jobs' | 'seed-batch' | 'seed-users';
  const [dangerLoading, setDangerLoading] = useState<DangerAction | null>(null);
  const [dangerFeedback, setDangerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [systemCounts, setSystemCounts] = useState<SystemCounts | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    action: Exclude<DangerAction, 'seed-batch' | 'seed-users'>;
    title: string;
    description: string;
    keyword: string;
  } | null>(null);

  const loadCounts = React.useCallback(async () => {
    try {
      setSystemCounts(await systemService.getStatus());
    } catch {
      setSystemCounts(null);
    }
  }, []);

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
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: DangerAction) => {
    setDangerLoading(action);
    setDangerFeedback(null);
    try {
      const run = {
        reset: () => systemService.resetSystem(),
        'purge-apps': () => systemService.purgeApplications(),
        'purge-jobs': () => systemService.purgeJobs(),
        'seed-batch': () => systemService.seedCandidateBatch(),
        'seed-users': () => systemService.seedUsers(),
      }[action];
      const res = await run();
      const seconds = (res.durationMs / 1000).toFixed(1);
      setDangerFeedback({ type: 'success', message: `${res.message} (${seconds}s)` });
      await loadData();
    } catch (err: any) {
      setDangerFeedback({ type: 'error', message: err?.message || 'Operation failed' });
    } finally {
      setDangerLoading(null);
      setConfirmModal(null);
      setConfirmText('');
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
                Initialise the environment, test with 30 real CVs, reset test data, or restore test user credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={loadCounts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
              title="Refresh database counts"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Refresh Counts
            </button>
            <a
              href="/sample_docs/Combined_30_Candidates_Dossier.txt"
              download="Combined_30_Candidates_Dossier.txt"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Master 30-CV Dossier (.txt)
            </a>
          </div>
        </div>

        {/* Live Database Counts Bar */}
        {systemCounts && (
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Live DB State:
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              <strong className="text-slate-900">{systemCounts.users}</strong> Users ({systemCounts.staff} Staff)
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              <strong className="text-slate-900">{systemCounts.jobs}</strong> Vacancies
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              <strong className="text-slate-900">{systemCounts.applications}</strong> Applications
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              <strong className="text-slate-900">{systemCounts.cvAssets}</strong> CV Files
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              <strong className="text-slate-900">{systemCounts.screenings}</strong> Screenings
            </span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Load 30 Candidates
                </>
              )}
            </button>
          </div>

          {/* Action 2: Restore Seed Users */}
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                <UserCog className="w-4 h-4 text-emerald-600" />
                Restore Test Users
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Restores the 5 staff logins (Jane Doe, Admin, etc.) and applicant credentials with verified passwords without wiping jobs.
              </p>
            </div>

            <button
              type="button"
              disabled={dangerLoading !== null}
              onClick={() => handleAction('seed-users')}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all disabled:opacity-50"
            >
              {dangerLoading === 'seed-users' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <UserCog className="w-3.5 h-3.5" />
                  Restore Users
                </>
              )}
            </button>
          </div>

          {/* Action 3: Purge Applications */}
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <Trash2 className="w-4 h-4 text-amber-600" />
                Remove All CVs & Apps
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
                  keyword: 'PURGE',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Applications
            </button>
          </div>

          {/* Action 4: Reset Entire System */}
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Reset System to Baseline
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Full factory reset: clears all data and reinitialises default vacancies, criteria, and staff accounts.
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
                    'This will wipe all candidate applications and custom vacancies, then re-seed default demo vacancies, criteria, and staff accounts.',
                  keyword: 'RESET',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Everything
            </button>
          </div>

          {/* Action 5: Remove Vacancies */}
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
                    'This will delete all job definitions, their associated criteria, and candidate applications attached to them.',
                  keyword: 'JOBS',
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Vacancies
            </button>
          </div>
        </div>

        {/* Test Accounts & Credentials Accordion */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Staff Test Accounts
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {staffAccounts.map((account) => (
              <div
                key={account.id}
                className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>{account.displayName}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                      {account.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{account.email}</div>
                  <div className="text-[11px] text-slate-400">Username: <span className="font-mono text-slate-600">{account.username}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Password:</span>
                  <span className="font-mono font-semibold text-indigo-700">
                    {showPasswords ? account.password : '••••••••••••'}
                  </span>
                </div>
              </div>
            ))}
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

            <div className="space-y-1.5 bg-rose-50/50 p-3 rounded-lg border border-rose-100">
              <label className="text-[11px] font-semibold text-rose-900">
                Type <span className="font-mono bg-rose-200/70 px-1 py-0.5 rounded">{confirmModal.keyword}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmModal.keyword}
                className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-white border border-rose-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={dangerLoading !== null}
                onClick={() => {
                  setConfirmModal(null);
                  setConfirmText('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dangerLoading !== null || confirmText.trim().toUpperCase() !== confirmModal.keyword}
                onClick={() => handleAction(confirmModal.action)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center gap-2 disabled:opacity-40"
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
