'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  UserCog,
  Eye,
  EyeOff,
  Database,
  LayoutGrid,
  List,
  Search,
  Check,
  X,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { applicationsService, jobsService, systemService } from '@/services';
import type { SystemCounts } from '@/services/system';
import { staffAccounts } from '@/lib/data/staffAccounts';
import { authService, activeUser } from '@/services/auth';
import { DashboardMetrics, Job, Application, User } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User>(activeUser);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Hybrid View Controls
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'needs_review' | 'eligible' | 'high_score'>('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [inlineActionId, setInlineActionId] = useState<string | null>(null);

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
        applicationsService.getApplications({ pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setMetrics(m);
      setJobs(j);
      setAllApplications(apps.items);
    } finally {
      setLoading(false);
    }
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadData();
    authService.getCurrentUser().then(setCurrentUser);
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

  const handleInlineDecision = async (applicationId: string, decision: 'SHORTLIST' | 'REJECT') => {
    setInlineActionId(applicationId);
    try {
      await applicationsService.addReviewDecision({
        applicationId,
        reviewerId: currentUser.id || 'usr-hr-001',
        reviewerName: currentUser.name || 'Jane Doe',
        decision,
        reason: decision === 'SHORTLIST' ? 'Shortlisted via Hybrid Kanban Board' : 'Rejected via Hybrid Kanban Board',
      });
      setDangerFeedback({
        type: 'success',
        message: `Candidate ${decision === 'SHORTLIST' ? 'shortlisted' : 'rejected'} successfully`,
      });
      await loadData();
    } catch (err: any) {
      setDangerFeedback({ type: 'error', message: err?.message || 'Failed to update candidate status' });
    } finally {
      setInlineActionId(null);
    }
  };

  // Filtered applications based on search, filterTag, and selectedJobId
  const filteredApplications = useMemo(() => {
    return allApplications.filter((app) => {
      // 1. Job Filter
      if (selectedJobId !== 'ALL' && app.jobId !== selectedJobId) {
        return false;
      }

      // 2. Search Query (name, email, or job title)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = app.applicant.fullName.toLowerCase().includes(query);
        const emailMatch = app.applicant.email.toLowerCase().includes(query);
        const job = jobs.find((j) => j.id === app.jobId);
        const jobMatch = job?.title.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !jobMatch) {
          return false;
        }
      }

      // 3. Filter Tag
      if (filterTag === 'needs_review') {
        const isNeedsReview =
          app.status === 'NEEDS_REVIEW' ||
          app.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
          app.candidateProfile?.needsReview === true;
        if (!isNeedsReview) return false;
      } else if (filterTag === 'eligible') {
        if (app.screeningRun?.mandatoryStatus !== 'MEETS') return false;
      } else if (filterTag === 'high_score') {
        const score = app.screeningRun?.totalScore ?? 0;
        if (score < 80) return false;
      }

      return true;
    });
  }, [allApplications, searchQuery, filterTag, selectedJobId, jobs]);

  // Derived metrics for the Funnel Velocity Bar
  const totalAppsCount = metrics?.totalApplications ?? allApplications.length;
  const awaitingReviewCount =
    metrics?.awaitingReview ??
    allApplications.filter(
      (a) =>
        a.status === 'NEEDS_REVIEW' ||
        a.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
        a.candidateProfile?.needsReview === true
    ).length;
  const eligibleCount =
    metrics?.recommendedApplications ??
    allApplications.filter((a) => a.screeningRun?.mandatoryStatus === 'MEETS').length;
  const shortlistedCount = allApplications.filter((a) => a.status === 'SHORTLISTED').length;
  const passRate = totalAppsCount > 0 ? Math.round((eligibleCount / totalAppsCount) * 100) : 0;

  // Kanban Columns Data
  const kanbanStages = useMemo(() => {
    const incoming: Application[] = [];
    const needsReview: Application[] = [];
    const eligible: Application[] = [];
    const interview: Application[] = [];

    filteredApplications.forEach((app) => {
      if (app.status === 'SHORTLISTED') {
        interview.push(app);
      } else if (
        app.status === 'NEEDS_REVIEW' ||
        app.screeningRun?.mandatoryStatus === 'UNKNOWN' ||
        app.candidateProfile?.needsReview === true
      ) {
        needsReview.push(app);
      } else if (app.screeningRun?.mandatoryStatus === 'MEETS') {
        eligible.push(app);
      } else {
        incoming.push(app);
      }
    });

    return { incoming, needsReview, eligible, interview };
  }, [filteredApplications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-indigo-600 animate-ping"></div>
          <span className="text-sm font-medium">Loading Command Center metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* =========================================================================
          TOP COMMAND HEADER & ACTIONS
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Hybrid Command Center
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Deterministic Screening</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Recruitment Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AI-assisted fact extraction with human HR decision-support and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleAction('seed-users')}
            disabled={dangerLoading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold text-xs shadow-sm transition-colors"
          >
            <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {dangerLoading === 'seed-users' ? 'Restoring Users...' : 'Restore Test Users'}
          </button>
          <a
            href="#danger-zone"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-semibold text-xs shadow-sm transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Testing & Danger Zone
          </a>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create Vacancy
          </Link>
        </div>
      </div>

      {/* =========================================================================
          EXECUTIVE PIPELINE FUNNEL VELOCITY BAR (Concept 4 Feature)
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recruitment Funnel Velocity & Conversion
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live progression of {totalAppsCount} candidate dossiers across intake, AI check, and HR review stages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {passRate}% Shortlist Pass Rate
            </span>
            {awaitingReviewCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTag('needs_review')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              >
                <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                ⚡ {awaitingReviewCount} Awaiting Decision
              </button>
            )}
          </div>
        </div>

        {/* Funnel Segmented Ribbon */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
          <div
            className="bg-indigo-500 rounded-l-full h-full transition-all duration-500"
            style={{ width: `${Math.max(15, (eligibleCount / (totalAppsCount || 1)) * 100)}%` }}
            title={`Eligible Shortlist: ${eligibleCount}`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${Math.max(10, (awaitingReviewCount / (totalAppsCount || 1)) * 100)}%` }}
            title={`Awaiting HR Audit: ${awaitingReviewCount}`}
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.max(10, (shortlistedCount / (totalAppsCount || 1)) * 100)}%` }}
            title={`Shortlisted / Interview: ${shortlistedCount}`}
          />
          <div
            className="bg-slate-300 dark:bg-slate-700 rounded-r-full h-full flex-1"
            title="Processing & Intake"
          />
        </div>

        {/* Funnel Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Eligible Pool ({eligibleCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Needs HR Audit ({awaitingReviewCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Shortlisted ({shortlistedCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            Total Applications ({totalAppsCount})
          </span>
        </div>
      </div>

      {/* =========================================================================
          KEY EXECUTIVE METRIC CARDS (4 TILES)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Vacancies
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {metrics?.activeVacancies ?? jobs.length}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Currently open for candidate intake</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{totalAppsCount}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Across all published vacancies</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Awaiting Review
            </span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-900 dark:text-amber-200 mt-3">{awaitingReviewCount}</p>
          <div className="w-full bg-amber-100 dark:bg-amber-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (awaitingReviewCount / (totalAppsCount || 1)) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">Requires human HR confirmation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Eligible Pool
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200 mt-3">{eligibleCount}</p>
          <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (eligibleCount / (totalAppsCount || 1)) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">100% mandatory criteria satisfied</p>
        </div>
      </div>

      {/* =========================================================================
          HYBRID VIEW SWITCHER & FILTER CONTROLS BAR (Concept 4 Feature)
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        {/* Left: View Switcher (Table vs Kanban) */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban Board
            </button>
          </div>

          {/* Quick Tag Filters */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTag === 'all'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({allApplications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('needs_review')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTag === 'needs_review'
                  ? 'bg-amber-500 text-white font-semibold'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Needs Review ({awaitingReviewCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('eligible')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTag === 'eligible'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Eligible ({eligibleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('high_score')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTag === 'high_score'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              Score &gt;80%
            </button>
          </div>
        </div>

        {/* Right: Search Input & Role Selector */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, email, or skill..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Vacancies</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          DYNAMIC VIEW: TABLE VIEW vs KANBAN BOARD
      ========================================================================= */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Vacancies Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Vacancies</h2>
              <Link href="/jobs" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View all ({jobs.length})
              </Link>
            </div>

            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                  No active vacancies found.
                </div>
              ) : (
                jobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {job.department ?? 'General'}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mt-1">{job.title}</h3>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{job.applicationCount ?? 0} applications</span>
                      <Link
                        href={`/jobs/${job.id}/applications`}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Pipeline <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Candidates Directory Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Candidate Screenings Directory ({filteredApplications.length})
              </h2>
              <Link
                href="/applications"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all directory
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No matching applications found. Use the Danger Zone below to ingest candidates or clear your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="px-5 py-3.5">Candidate</th>
                        <th className="px-5 py-3.5">Mandatory Check</th>
                        <th className="px-5 py-3.5">AI Match Score</th>
                        <th className="px-5 py-3.5">Decision State</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApplications.slice(0, 10).map((app) => {
                        const score = app.screeningRun?.totalScore ?? 0;
                        const job = jobs.find((j) => j.id === app.jobId);
                        const initials = app.applicant.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <tr
                            key={app.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {app.applicant.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {job?.title ?? app.applicant.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              {app.screeningRun ? (
                                <div className="flex items-center gap-1.5 font-medium">
                                  {app.screeningRun.mandatoryStatus === 'MEETS' && (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      <span className="text-emerald-700 dark:text-emerald-300">Meets All</span>
                                    </>
                                  )}
                                  {app.screeningRun.mandatoryStatus === 'DOES_NOT_MEET' && (
                                    <>
                                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                      <span className="text-rose-700 dark:text-rose-300">Fails Check</span>
                                    </>
                                  )}
                                  {app.screeningRun.mandatoryStatus === 'UNKNOWN' && (
                                    <>
                                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                      <span className="text-amber-700 dark:text-amber-300">Uncertain</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              {app.screeningRun ? (
                                <div className="space-y-1">
                                  <div className="flex items-baseline gap-1">
                                    <span
                                      className={`font-mono font-bold text-sm ${
                                        score >= 80
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : score >= 60
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {score}%
                                    </span>
                                  </div>
                                  <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        score >= 80
                                          ? 'bg-emerald-500'
                                          : score >= 60
                                          ? 'bg-amber-400'
                                          : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, score)}%` }}
                                    ></div>
                                  </div>
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                              >
                                Review <ArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive Kanban Stage Board
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Move and verify candidates through continuous hiring stages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Column 1: Incoming & Screened */}
            <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Incoming & Screened
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {kanbanStages.incoming.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {kanbanStages.incoming.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No candidates in this stage</div>
                ) : (
                  kanbanStages.incoming.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {app.applicant.fullName}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {app.screeningRun?.totalScore ?? '-'}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{app.applicant.email}</p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <StatusBadge status={app.status} />
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          Review &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Requires HR Audit (With 1-click Approve/Reject buttons) */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200 dark:border-amber-900/60 mb-3">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Requires HR Audit
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                  {kanbanStages.needsReview.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {kanbanStages.needsReview.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No audits pending</div>
                ) : (
                  kanbanStages.needsReview.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {app.applicant.fullName}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {app.screeningRun?.totalScore ?? '-'}%
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1">
                        Requires human verification of criteria evidence.
                      </p>

                      {/* 1-Click Inline Action Buttons */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={inlineActionId === app.id}
                          onClick={() => handleInlineDecision(app.id, 'SHORTLIST')}
                          className="flex-1 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={inlineActionId === app.id}
                          onClick={() => handleInlineDecision(app.id, 'REJECT')}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          Deny
                        </button>
                        <Link
                          href={`/applications/${app.id}`}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Open Full Dossier"
                        >
                          &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Eligible Shortlist */}
            <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-3.5 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200 dark:border-indigo-900/60 mb-3">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Eligible & Verified
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-800 dark:text-indigo-300">
                  {kanbanStages.eligible.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {kanbanStages.eligible.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No eligible candidates</div>
                ) : (
                  kanbanStages.eligible.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {app.applicant.fullName}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {app.screeningRun?.totalScore ?? '-'}%
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All mandatory criteria met</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Ready for Interview</span>
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-slate-600 dark:text-slate-400 font-semibold hover:underline"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 4: Interview Stage */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-900/60 mb-3">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Interview Stage
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {kanbanStages.interview.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {kanbanStages.interview.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No interviews scheduled yet</div>
                ) : (
                  kanbanStages.interview.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {app.applicant.fullName}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {app.screeningRun?.totalScore ?? '-'}%
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Interview scheduled with HR team
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <StatusBadge status="SHORTLISTED" />
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          Dossier &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DANGER FEEDBACK NOTICES
      ========================================================================= */}
      {dangerFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-colors ${
            dangerFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {dangerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
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

      {/* =========================================================================
          DANGER ZONE & SYSTEM INITIALIZATION (Admin Only)
      ========================================================================= */}
      {currentUser.role === 'ADMIN' && (
        <div
          id="danger-zone"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm overflow-hidden scroll-mt-6 transition-colors"
        >
          <div className="p-5 bg-gradient-to-r from-rose-50/80 dark:from-rose-950/30 via-white dark:via-slate-900 to-amber-50/40 dark:to-amber-950/20 border-b border-rose-100 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  System Testing & Danger Zone
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingest 30 test CV dossiers, verify deterministic extraction, or restore user logins.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={loadCounts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm transition-colors"
                title="Refresh database counts"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Refresh Counts
              </button>
              <a
                href="/sample_docs/Combined_30_Candidates_Dossier.txt"
                download="Combined_30_Candidates_Dossier.txt"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Master 30-CV Dossier (.txt)
              </a>
            </div>
          </div>

          {/* Live Database Counts Bar */}
          {systemCounts && (
            <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Live DB State:
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">{systemCounts.users}</strong> Users (
                {systemCounts.staff} Staff)
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">{systemCounts.jobs}</strong> Vacancies
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">{systemCounts.applications}</strong> Applications
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">{systemCounts.cvAssets}</strong> CV Files
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">{systemCounts.screenings}</strong> Screenings
              </span>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Action 1: Load 30 Candidates Batch */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-950 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Ingest 30 Real CVs
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Processes 30 realistic candidates from the combined dossier into the Senior Full-Stack role with fact extraction & scoring.
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
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-950 dark:text-emerald-200">
                  <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Restore Test Users
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Restores 5 staff logins (Jane Doe, Admin, Recruiter) and candidate credentials with verified passwords.
                </p>
              </div>

              <button
                type="button"
                disabled={dangerLoading !== null}
                onClick={() => handleAction('seed-users')}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 border border-emerald-300 dark:border-emerald-700 transition-all disabled:opacity-50"
              >
                {dangerLoading === 'seed-users' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <UserCog className="w-3.5 h-3.5" />
                    Restore Test Users
                  </>
                )}
              </button>
            </div>

            {/* Action 3: Purge Applications */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
                  <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Remove All CVs & Apps
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
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
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/50 border border-amber-300 dark:border-amber-700 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Applications
              </button>
            </div>

            {/* Action 4: Reset Entire System */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900 dark:text-rose-200">
                  <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Reset System to Baseline
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
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
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-800/50 border border-rose-300 dark:border-rose-700 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Everything
              </button>
            </div>

            {/* Action 5: Remove Vacancies */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Remove All Vacancies
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
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
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Vacancies
              </button>
            </div>
          </div>

          {/* Test Accounts & Credentials Accordion */}
          <div className="px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Active Staff Test Accounts
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {staffAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{account.displayName}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {account.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{account.email}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Username: <span className="font-mono text-slate-600 dark:text-slate-300">{account.username}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">Password:</span>
                    <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                      {showPasswords ? account.password : '••••••••••••'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL
      ========================================================================= */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danger zone confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="space-y-1.5 bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
              <label className="text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                Type <span className="font-mono bg-rose-200/70 dark:bg-rose-900 px-1 py-0.5 rounded">{confirmModal.keyword}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmModal.keyword}
                className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-md focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 dark:text-white"
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
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
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
