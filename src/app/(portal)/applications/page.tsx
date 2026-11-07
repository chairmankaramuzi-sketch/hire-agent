'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  Download,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Award,
  Sliders,
  Sparkles,
  Mail,
  Send,
  ShieldCheck,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { applicationsService } from '@/services';
import { Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { CandidateComparisonModal } from '@/components/candidate/CandidateComparisonModal';
import {
  CriteriaWeightSliders,
  CriteriaWeights,
  DEFAULT_WEIGHTS,
} from '@/components/candidate/CriteriaWeightSliders';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Comparison Matrix state
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Criteria Weight Sliders state
  const [slidersOpen, setSlidersOpen] = useState(false);
  const [criteriaWeights, setCriteriaWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);

  // Batch communication confirmation state
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);

  useEffect(() => {
    async function fetchApps() {
      setLoading(true);
      try {
        const res = await applicationsService.getApplications({
          search,
          queue: queueFilter,
          sortBy: 'score',
          sortOrder: 'desc',
        });
        setApplications(res.items);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, [search, queueFilter]);

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

    const reRanked = Math.max(15, Math.min(99, Math.round(baseScore + delta)));
    return reRanked;
  };

  // Re-rank candidates in real time whenever weights change
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

  // One-Click Mass Decision Selection Presets
  const handleSelectPreset = (type: 'QUALIFIED' | 'BORDERLINE' | 'INELIGIBLE') => {
    const matched = new Set<string>();
    displayedApplications.forEach((app) => {
      const score = calculateDynamicScore(app, criteriaWeights);
      const meetsMandatory = app.screeningRun?.mandatoryStatus === 'MEETS';
      if (type === 'QUALIFIED' && score >= 85 && meetsMandatory) {
        matched.add(app.id);
      } else if (type === 'BORDERLINE' && score >= 60 && score < 85 && meetsMandatory) {
        matched.add(app.id);
      } else if (type === 'INELIGIBLE' && (score < 60 || !meetsMandatory)) {
        matched.add(app.id);
      }
    });
    setSelectedIds(matched);
  };

  const handleBulkDecision = async (
    decision: 'SHORTLISTED' | 'REJECTED',
    withEmailNotification = false
  ) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    setBulkFeedback(null);

    const idsToUpdate = Array.from(selectedIds);
    try {
      await Promise.all(
        idsToUpdate.map((appId) =>
          applicationsService.addReviewDecision({
            applicationId: appId,
            reviewerId: 'usr-admin-001',
            reviewerName: 'MR. KALAMUZI',
            decision: decision === 'SHORTLISTED' ? 'SHORTLIST' : 'REJECT',
            reason: withEmailNotification
              ? `One-Click Mass Action: ${decision === 'SHORTLISTED' ? 'Shortlisted and dispatched interview invitations' : 'Polite update dispatched'}`
              : `Bulk decision applied by reviewer on ${new Date().toLocaleDateString()}`,
          })
        )
      );

      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          selectedIds.has(app.id)
            ? {
                ...app,
                status:
                  decision === 'SHORTLISTED'
                    ? ('SHORTLISTED' as any)
                    : ('REJECTED_AFTER_REVIEW' as any),
                reviewDecisions: [
                  {
                    id: 'bulk-' + Date.now(),
                    applicationId: app.id,
                    reviewerId: 'usr-admin-001',
                    reviewerName: 'MR. KALAMUZI',
                    decision: decision === 'SHORTLISTED' ? 'SHORTLIST' : 'REJECT',
                    reason: withEmailNotification
                      ? 'Mass Decision & Dispatched Communication'
                      : 'Bulk action applied',
                    createdAt: new Date().toISOString(),
                  },
                  ...(app.reviewDecisions || []),
                ],
              }
            : app
        )
      );

      setBulkFeedback(
        withEmailNotification
          ? `⚡ Success! Shortlisted ${selectedIds.size} candidates and dispatched formal interview invitations!`
          : `Successfully marked ${selectedIds.size} candidates as ${decision.toLowerCase()}.`
      );
      setSelectedIds(new Set());
    } catch {
      setBulkFeedback('Failed to update some candidates. Please try again.');
    } finally {
      setBulkActionLoading(false);
      setTimeout(() => setBulkFeedback(null), 5000);
    }
  };

  const handleExportCsv = () => {
    const targetApps =
      selectedIds.size > 0
        ? displayedApplications.filter((a) => selectedIds.has(a.id))
        : displayedApplications;
    if (targetApps.length === 0) return;

    const headers = [
      'Rank',
      'Candidate Name',
      'Email',
      'Position',
      'Mandatory Check',
      'Weighted Match Score',
      'Status',
    ];
    const rows = targetApps.map((a, i) => [
      `"#${i + 1}"`,
      `"${a.applicant.fullName}"`,
      `"${a.applicant.email}"`,
      `"${a.jobTitle || a.jobId}"`,
      `"${a.screeningRun?.mandatoryStatus ?? 'N/A'}"`,
      `${calculateDynamicScore(a, criteriaWeights)}%`,
      `"${a.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hire_agent_candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCandidatesList = useMemo(() => {
    return displayedApplications.filter((a) => selectedIds.has(a.id));
  }, [displayedApplications, selectedIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Candidate Applications & Screening
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review applicant qualifications, compare candidates head-to-head, and execute 1-click batch decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSlidersOpen(!slidersOpen)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border shadow-sm transition-all ${
              slidersOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Criteria Sliders & Re-Ranking</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Export CSV ({selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'All'})
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

      {/* Bulk Feedback Banner */}
      {bulkFeedback && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between shadow-md animate-in fade-in">
          <span className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {bulkFeedback}
          </span>
          <button
            onClick={() => setBulkFeedback(null)}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Feature 6: One-Click Mass Decision & Communication Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 p-4 bg-slate-950 text-white rounded-2xl shadow-2xl border border-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <div>
              <p className="font-bold text-white">Candidates Selected for Action</p>
              <p className="text-[11px] text-slate-400">Execute mass decision or head-to-head comparison</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Feature 5: Head-to-Head Comparison Button */}
            {selectedIds.size >= 2 && (
              <button
                type="button"
                onClick={() => setComparisonOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Users className="w-4 h-4" />
                Compare ({selectedIds.size}) Head-to-Head
              </button>
            )}

            {/* Mass Shortlist & Send Invites */}
            <button
              onClick={() => handleBulkDecision('SHORTLISTED', true)}
              disabled={bulkActionLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              Batch Shortlist & Send Invites
            </button>

            {/* Mass Polite Update */}
            <button
              onClick={() => handleBulkDecision('REJECTED', true)}
              disabled={bulkActionLoading}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Batch Send Polite Update
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter Presets + Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none whitespace-nowrap border-b md:border-b-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
            {(
              [
                { key: 'ALL', label: 'All Candidates' },
                { key: 'ELIGIBLE', label: 'Qualified Only' },
                { key: 'NEEDS_REVIEW', label: 'Needs Review' },
                { key: 'INELIGIBLE', label: 'Did Not Qualify' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setQueueFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
                  queueFilter === tab.key
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Feature 6: One-Click Quick Selection Filter Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            1-Click Selection Presets:
          </span>
          <button
            type="button"
            onClick={() => handleSelectPreset('QUALIFIED')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px] hover:bg-emerald-100 transition-colors"
          >
            ⭐ Select All Qualified (&gt;85%)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('BORDERLINE')}
            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold text-[11px] hover:bg-amber-100 transition-colors"
          >
            ⚠️ Select Borderline (60-84%)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('INELIGIBLE')}
            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-[11px] hover:bg-rose-100 transition-colors"
          >
            ❌ Select Ineligible (&lt;60% or Failed)
          </button>
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Loading applications...
          </div>
        ) : displayedApplications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No applications found matching the selected filter.
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
                  <th className="px-6 py-3.5 font-medium">Position</th>
                  <th className="px-6 py-3.5 font-medium">Mandatory Check</th>
                  <th className="px-6 py-3.5 font-medium">Weighted Match</th>
                  <th className="px-6 py-3.5 font-medium">Red Flag Radar</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedApplications.map((app, index) => {
                  const isChecked = selectedIds.has(app.id);
                  const dynamicScore = calculateDynamicScore(app, criteriaWeights);
                  const scoreColor =
                    dynamicScore >= 85
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                      : dynamicScore >= 70
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                      : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';

                  // Anomaly detection check
                  const hasAnomaly =
                    app.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET' ||
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
                          {app.applicant.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {app.applicant.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {app.jobTitle || app.jobId}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {app.screeningRun?.mandatoryStatus === 'MEETS' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                          </span>
                        ) : app.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> Does Not Meet
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending Review</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${scoreColor}`}
                        >
                          {dynamicScore}%
                        </span>
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
                        <StatusBadge status={app.status} type="decision" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all"
                        >
                          Review <ChevronRight className="w-3 h-3" />
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

      {/* Feature 5: Head-to-Head Comparison Modal */}
      <CandidateComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        candidates={selectedCandidatesList}
        onShortlistCandidate={(id) => {
          setSelectedIds(new Set([id]));
          handleBulkDecision('SHORTLISTED', false);
        }}
      />
    </div>
  );
}
