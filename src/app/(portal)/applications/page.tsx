'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Download, CheckSquare, Square, CheckCircle2, XCircle, Award } from 'lucide-react';
import { applicationsService } from '@/services';
import { Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

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

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDecision = async (decision: 'SHORTLISTED' | 'REJECTED') => {
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
            reason: `Bulk decision applied by reviewer on ${new Date().toLocaleDateString()}`,
          })
        )
      );

      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          selectedIds.has(app.id)
            ? {
                ...app,
                status: decision === 'SHORTLISTED' ? ('SHORTLISTED' as any) : ('REJECTED_AFTER_REVIEW' as any),
                reviewDecisions: [
                  {
                    id: 'bulk-' + Date.now(),
                    applicationId: app.id,
                    reviewerId: 'usr-admin-001',
                    reviewerName: 'MR. KALAMUZI',
                    decision: decision === 'SHORTLISTED' ? 'SHORTLIST' : 'REJECT',
                    reason: 'Bulk action applied',
                    createdAt: new Date().toISOString(),
                  },
                  ...(app.reviewDecisions || []),
                ],
              }
            : app
        )
      );

      setBulkFeedback(`Successfully marked ${selectedIds.size} candidates as ${decision.toLowerCase()}.`);
      setSelectedIds(new Set());
    } catch {
      setBulkFeedback('Failed to update some candidates. Please try again.');
    } finally {
      setBulkActionLoading(false);
      setTimeout(() => setBulkFeedback(null), 4000);
    }
  };

  const handleExportCsv = () => {
    const targetApps =
      selectedIds.size > 0 ? applications.filter((a) => selectedIds.has(a.id)) : applications;
    if (targetApps.length === 0) return;

    const headers = ['Candidate Name', 'Email', 'Position', 'Mandatory Check', 'Score', 'Status'];
    const rows = targetApps.map((a) => [
      `"${a.applicant.fullName}"`,
      `"${a.applicant.email}"`,
      `"${a.jobTitle || a.jobId}"`,
      `"${a.screeningRun?.mandatoryStatus ?? 'N/A'}"`,
      a.screeningRun?.totalScore ?? 'N/A',
      `"${a.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hire_agent_candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Candidate Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review applicant qualifications, execute bulk screening actions, and download reports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Export CSV ({selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'All'})
        </button>
      </div>

      {/* Bulk Feedback Banner */}
      {bulkFeedback && (
        <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between animate-in fade-in">
          <span>{bulkFeedback}</span>
          <button onClick={() => setBulkFeedback(null)} className="text-indigo-600 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs">
              {selectedIds.size}
            </span>
            <span>candidates selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkDecision('SHORTLISTED')}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              Bulk Shortlist
            </button>
            <button
              onClick={() => handleBulkDecision('REJECTED')}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Bulk Reject
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex items-center gap-1 border-b md:border-b-0 border-slate-100 dark:border-slate-800 pb-2 md:pb-0 w-full md:w-auto">
          {(
            [
              { key: 'ALL', label: 'All' },
              { key: 'ELIGIBLE', label: 'Qualified Candidates' },
              { key: 'NEEDS_REVIEW', label: 'Needs Review' },
              { key: 'INELIGIBLE', label: 'Did Not Qualify' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setQueueFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
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

      {/* Candidates Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
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
                      {selectedIds.size === applications.length && applications.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3.5 font-medium">Candidate</th>
                  <th className="px-6 py-3.5 font-medium">Position</th>
                  <th className="px-6 py-3.5 font-medium">Mandatory Check</th>
                  <th className="px-6 py-3.5 font-medium">Match Score</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => {
                  const isChecked = selectedIds.has(app.id);
                  const score = app.screeningRun?.totalScore ?? 0;
                  const scoreColor =
                    score >= 85
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                      : score >= 70
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                      : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';

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
                          {app.screeningRun?.totalScore != null ? `${app.screeningRun.totalScore}%` : '—'}
                        </span>
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
    </div>
  );
}
