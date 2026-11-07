'use client';

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileText,
  Sliders,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  LayoutGrid,
  List,
  Calendar,
  Smartphone,
} from 'lucide-react';
import { jobsService, applicationsService } from '@/services';
import { Job, Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { CvUploadPrototypeModal } from '@/components/cv/CvUploadPrototypeModal';
import { CandidateComparisonModal } from '@/components/candidate/CandidateComparisonModal';
import {
  CriteriaWeightSliders,
  CriteriaWeights,
  DEFAULT_WEIGHTS,
} from '@/components/candidate/CriteriaWeightSliders';
import { SelfSchedulingModal } from '@/components/candidate/SelfSchedulingModal';
import { ExecutiveBoardPackModal } from '@/components/candidate/ExecutiveBoardPackModal';
import { WhatsAppSmsOutreachModal } from '@/components/candidate/WhatsAppSmsOutreachModal';
import { KanbanPipelineBoard } from '@/components/candidate/KanbanPipelineBoard';
import { BlindScreeningToggle } from '@/components/candidate/BlindScreeningToggle';
import { useBlindScreening } from '@/context/BlindScreeningContext';

export default function JobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }> | { jobId: string };
}) {
  const unwrappedParams = 'then' in params ? use(params as Promise<{ jobId: string }>) : params;
  const jobId = unwrappedParams.jobId;

  const { isBlindMode, maskName, maskEmail } = useBlindScreening();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queueTab, setQueueTab] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'>('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // View Mode: Table vs Visual Kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Selection & Comparison states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Criteria Weight Sliders state
  const [slidersOpen, setSlidersOpen] = useState(false);
  const [criteriaWeights, setCriteriaWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);

  // Action Modals state (Self-Scheduling, Board Pack, WhatsApp)
  const [schedulingCandidate, setSchedulingCandidate] = useState<Application | null>(null);
  const [boardPackCandidate, setBoardPackCandidate] = useState<Application | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Application | null>(null);

  const fetchJobAndApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const [j, apps] = await Promise.all([
        jobsService.getJobById(jobId),
        applicationsService.getApplications({
          jobId,
          search,
          queue: queueTab,
          sortBy: 'score',
          sortOrder: 'desc',
        }),
      ]);
      setJob(j);
      setApplications(apps.items);
    } finally {
      setLoading(false);
    }
  }, [jobId, search, queueTab]);

  useEffect(() => {
    fetchJobAndApps();
  }, [fetchJobAndApps]);

  // Dynamic score re-calculation engine based on custom weights
  const calculateDynamicScore = (app: Application, w: CriteriaWeights): number => {
    const baseScore = app.screeningRun?.totalScore ?? 70;
    const skills = (app.candidateProfile?.skills || []).map((s) => s.toLowerCase());
    const expYears =
      app.candidateProfile?.employmentHistory.reduce(
        (acc, h) => acc + (h.yearsExperience || 0),
        0
      ) || 4;

    const hasCloud = skills.some(
      (s) =>
        s.includes('aws') ||
        s.includes('cloud') ||
        s.includes('docker') ||
        s.includes('kubernetes')
    );
    const hasCoreStack = skills.some(
      (s) =>
        s.includes('react') ||
        s.includes('typescript') ||
        s.includes('node') ||
        s.includes('python')
    );

    let delta = 0;
    if (hasCloud) delta += (w.cloudDevOps - 20) * 0.45;
    if (expYears >= 5) delta += (w.experience - 25) * 0.4;
    if (hasCoreStack) delta += (w.techStack - 35) * 0.35;

    return Math.max(15, Math.min(99, Math.round(baseScore + delta)));
  };

  // Live re-ranking
  const displayedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      const scoreA = calculateDynamicScore(a, criteriaWeights);
      const scoreB = calculateDynamicScore(b, criteriaWeights);
      return scoreB - scoreA;
    });
  }, [applications, criteriaWeights]);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedApplications.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedCandidatesList = useMemo(() => {
    return displayedApplications.filter((a) => selectedIds.has(a.id));
  }, [displayedApplications, selectedIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors">
      {/* Back button and job header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {job?.department ?? 'Engineering'}
              </span>
              <StatusBadge status={job?.status ?? 'PUBLISHED'} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {job?.title ?? 'Job Applications'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher: Table vs Visual Kanban */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <BlindScreeningToggle />

          <button
            type="button"
            onClick={() => setSlidersOpen(!slidersOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border shadow-sm transition-all ${
              slidersOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Criteria Sliders</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Batch CV Dropzone (50+)
          </button>
        </div>
      </div>

      {/* Feature 7: Custom Job Criteria Sliders Drawer */}
      {slidersOpen && (
        <CriteriaWeightSliders
          isOpen={slidersOpen}
          onClose={() => setSlidersOpen(false)}
          weights={criteriaWeights}
          onChange={setCriteriaWeights}
          onReset={() => setCriteriaWeights(DEFAULT_WEIGHTS)}
        />
      )}

      {/* Floating Compare Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 bg-slate-950 text-white rounded-2xl shadow-xl border border-indigo-900 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span>candidates selected</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size >= 2 && (
              <button
                type="button"
                onClick={() => setComparisonOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Compare ({selectedIds.size}) Head-to-Head
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Mandatory screening explanation banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-950 dark:text-indigo-200 transition-colors">
        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900 dark:text-indigo-300">How Resumes Are Evaluated</p>
          <p className="text-indigo-800 dark:text-indigo-200/80 leading-relaxed">
            Candidates must meet all must-have requirements to qualify. If any requirement is missing or unclear, they are placed in <strong>NEEDS REVIEW</strong> so you can inspect them personally.
          </p>
        </div>
      </div>

      {/* Queue Tabs and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none whitespace-nowrap border-b md:border-b-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
          {(
            [
              { key: 'ALL', label: 'All Applicants' },
              { key: 'ELIGIBLE', label: 'Qualified Candidates' },
              { key: 'NEEDS_REVIEW', label: 'Needs Review' },
              { key: 'INELIGIBLE', label: 'Did Not Qualify' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setQueueTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
                queueTab === tab.key
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Main Views: Table View vs Option 3 Visual Kanban Board */}
      {viewMode === 'kanban' ? (
        <KanbanPipelineBoard
          applications={displayedApplications}
          onOpenSchedule={(app) => setSchedulingCandidate(app)}
          onOpenWhatsApp={(app) => setWhatsAppCandidate(app)}
          onOpenBoardPack={(app) => setBoardPackCandidate(app)}
        />
      ) : (
        /* Applications Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading applications queue...</div>
          ) : displayedApplications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No applicants match this queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Switch filter tabs or upload new CV documents to populate this vacancy shortlist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {selectedIds.size === displayedApplications.length &&
                        displayedApplications.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3.5 w-12 font-medium text-center">Rank</th>
                    <th className="px-6 py-3.5 font-medium">Candidate</th>
                    <th className="px-6 py-3.5 font-medium">Mandatory Criteria</th>
                    <th className="px-6 py-3.5 font-medium">Weighted Score</th>
                    <th className="px-6 py-3.5 font-medium">Red Flag Radar</th>
                    <th className="px-6 py-3.5 font-medium">System Recommendation</th>
                    <th className="px-6 py-3.5 font-medium">HR Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedApplications.map((app, index) => {
                    const mandatoryStatus = app.screeningRun?.mandatoryStatus ?? 'UNKNOWN';
                    const dynamicScore = calculateDynamicScore(app, criteriaWeights);
                    const isEligible = mandatoryStatus === 'MEETS';
                    const isFailing = mandatoryStatus === 'DOES_NOT_MEET';
                    const isUncertain = mandatoryStatus === 'UNKNOWN' || app.status === 'NEEDS_REVIEW';
                    const isChecked = selectedIds.has(app.id);

                    const hasAnomaly =
                      isFailing ||
                      app.candidateProfile?.employmentHistory.some(
                        (e, i) => i > 0 && e.yearsExperience === 0
                      );

                    return (
                      <tr
                        key={app.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(app.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            #{index + 1}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {maskName(app.applicant.fullName, app.id)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{maskEmail(app.applicant.email)}</span>
                            <span>•</span>
                            <span>{app.cvDocument.fileName}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {app.processingStatus === 'FAILED' ? (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Extraction Error
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              {isEligible && (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Passes All Checks</span>
                                </>
                              )}
                              {isFailing && (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                  <span className="text-rose-700 dark:text-rose-300 font-semibold">Fails Mandatory Check</span>
                                </>
                              )}
                              {isUncertain && (
                                <>
                                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-amber-800 dark:text-amber-300 font-semibold">Ambiguous / Review</span>
                                </>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-slate-900 dark:text-white text-lg">{dynamicScore}</span>
                              <span className="text-xs text-slate-400">/ 100</span>
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isEligible ? 'bg-emerald-500' : isFailing ? 'bg-rose-400' : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(dynamicScore, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {hasAnomaly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Anomaly Flag
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Clean
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {app.screeningRun ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                app.screeningRun.overallStatus === 'ELIGIBLE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : app.screeningRun.overallStatus === 'INELIGIBLE'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {app.screeningRun.overallStatus}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} type="decision" />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Schedule Button */}
                            <button
                              type="button"
                              onClick={() => setSchedulingCandidate(app)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Generate Interview Self-Scheduling Link"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => setWhatsAppCandidate(app)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Send WhatsApp or SMS Alert"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                            </button>

                            {/* Board Pack Button */}
                            <button
                              type="button"
                              onClick={() => setBoardPackCandidate(app)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Generate Executive Board Pack Dossier"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/applications/${app.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors ml-1"
                            >
                              Inspect <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Feature 5: Head-to-Head Candidate Matrix Modal */}
      <CandidateComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        candidates={selectedCandidatesList}
      />

      {/* Feature 1: Batch CV Dropzone (50+ Resumes) */}
      <CvUploadPrototypeModal
        jobId={jobId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchJobAndApps();
        }}
      />

      {/* Option 1: Self-Scheduling Modal */}
      {schedulingCandidate && (
        <SelfSchedulingModal
          isOpen={!!schedulingCandidate}
          onClose={() => setSchedulingCandidate(null)}
          candidateName={schedulingCandidate.applicant.fullName}
          candidateEmail={schedulingCandidate.applicant.email}
          candidatePhone={schedulingCandidate.applicant.phone}
          jobTitle={job?.title || 'Job Position'}
        />
      )}

      {/* Option 2: Executive Board Pack Modal */}
      {boardPackCandidate && (
        <ExecutiveBoardPackModal
          isOpen={!!boardPackCandidate}
          onClose={() => setBoardPackCandidate(null)}
          application={boardPackCandidate}
          jobTitle={job?.title}
          department={job?.department}
        />
      )}

      {/* Option 4: WhatsApp & SMS Outreach Modal */}
      {whatsAppCandidate && (
        <WhatsAppSmsOutreachModal
          isOpen={!!whatsAppCandidate}
          onClose={() => setWhatsAppCandidate(null)}
          candidateName={whatsAppCandidate.applicant.fullName}
          candidatePhone={whatsAppCandidate.applicant.phone}
          jobTitle={job?.title || 'Job Position'}
        />
      )}
    </div>
  );
}
