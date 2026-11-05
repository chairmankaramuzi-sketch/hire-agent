'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Download } from 'lucide-react';
import { applicationsService } from '@/services';
import { Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'>('ALL');

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

  const handleExportCsv = () => {
    if (applications.length === 0) return;
    const headers = ['Candidate Name', 'Email', 'Job Reference', 'Mandatory Check', 'Score', 'Status'];
    const rows = applications.map((a) => [
      `"${a.applicant.fullName}"`,
      `"${a.applicant.email}"`,
      `"${a.jobId}"`,
      `"${a.screeningRun?.mandatoryStatus ?? 'N/A'}"`,
      a.screeningRun?.totalScore ?? 'N/A',
      `"${a.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `applications_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Candidate Applications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View all job applicants in one place and download reports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Export CSV Report
        </button>
      </div>

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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">No applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Candidate</th>
                  <th className="px-6 py-3.5 font-medium">Position</th>
                  <th className="px-6 py-3.5 font-medium">Mandatory Check</th>
                  <th className="px-6 py-3.5 font-medium">Score</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{app.applicant.fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{app.applicant.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">{app.jobTitle || app.jobId}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {app.screeningRun?.mandatoryStatus ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {app.screeningRun?.totalScore ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} type="decision" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                      >
                        Review <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
