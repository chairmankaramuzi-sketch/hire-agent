'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { jobsService, applicationsService } from '@/services';
import { Job, Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { CvUploadPrototypeModal } from '@/components/cv/CvUploadPrototypeModal';

export default function JobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }> | { jobId: string };
}) {
  const unwrappedParams = 'then' in params ? use(params as Promise<{ jobId: string }>) : params;
  const jobId = unwrappedParams.jobId;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queueTab, setQueueTab] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'>('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button and job header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {job?.department ?? 'Engineering'}
              </span>
              <StatusBadge status={job?.status ?? 'PUBLISHED'} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              {job?.title ?? 'Job Applications'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Candidate CVs
          </button>
        </div>
      </div>

      {/* Mandatory screening explanation banner */}
      <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">Deterministic Screening Rule Enforced</p>
          <p className="text-indigo-800 leading-relaxed">
            Candidates who fail mandatory requirements are classified as <strong>INELIGIBLE</strong> regardless of
            how high their weighted score is. Applications with ambiguous or missing evidence are placed in the{' '}
            <strong>NEEDS REVIEW</strong> queue for human oversight.
          </p>
        </div>
      </div>

      {/* Queue Tabs and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-1 border-b md:border-b-0 border-slate-100 pb-2 md:pb-0 w-full md:w-auto">
          {(
            [
              { key: 'ALL', label: 'All Applicants' },
              { key: 'ELIGIBLE', label: 'Eligible Shortlist' },
              { key: 'NEEDS_REVIEW', label: 'Needs Review' },
              { key: 'INELIGIBLE', label: 'Ineligible' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setQueueTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                queueTab === tab.key
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
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
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading applications queue...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No applicants match this queue</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Switch filter tabs or upload new CV documents to populate this vacancy shortlist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Candidate</th>
                  <th className="px-6 py-3.5 font-medium">Mandatory Criteria</th>
                  <th className="px-6 py-3.5 font-medium">Weighted Score</th>
                  <th className="px-6 py-3.5 font-medium">System Recommendation</th>
                  <th className="px-6 py-3.5 font-medium">HR Review Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const mandatoryStatus = app.screeningRun?.mandatoryStatus ?? 'UNKNOWN';
                  const score = app.screeningRun?.totalScore ?? null;
                  const isEligible = mandatoryStatus === 'MEETS';
                  const isFailing = mandatoryStatus === 'DOES_NOT_MEET';
                  const isUncertain = mandatoryStatus === 'UNKNOWN' || app.status === 'NEEDS_REVIEW';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{app.applicant.fullName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{app.applicant.email}</span>
                          <span>•</span>
                          <span>{app.cvDocument.fileName}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {app.processingStatus === 'FAILED' ? (
                          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Extraction Error
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            {isEligible && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Passes All Checks</span>
                              </>
                            )}
                            {isFailing && (
                              <>
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span className="text-rose-700 font-semibold">Fails Mandatory Check</span>
                              </>
                            )}
                            {isUncertain && (
                              <>
                                <HelpCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-800 font-semibold">Ambiguous / Review</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {score !== null ? (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-slate-900 text-lg">{score}</span>
                              <span className="text-xs text-slate-400">/ 100</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isEligible ? 'bg-emerald-500' : isFailing ? 'bg-rose-400' : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(score, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {app.screeningRun ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              app.screeningRun.overallStatus === 'ELIGIBLE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : app.screeningRun.overallStatus === 'INELIGIBLE'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
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
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          Inspect Detail <ChevronRight className="w-3.5 h-3.5" />
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

      {/* CV Intake Prototype Modal */}
      <CvUploadPrototypeModal
        jobId={jobId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchJobAndApps();
        }}
      />
    </div>
  );
}
