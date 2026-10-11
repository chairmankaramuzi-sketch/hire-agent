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
} from 'lucide-react';
import { applicationsService, jobsService } from '@/services';
import { DashboardMetrics, Job, Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-300"></div>
          <span>Loading dashboard metrics from mock data services...</span>
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
          <p className="text-3xl font-bold text-amber-900 mt-3">{metrics?.awaitingReview ?? 0}</p>
          <p className="text-xs text-amber-700 mt-1">Pending HR decision or uncertain data</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Processing Failures</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-bold text-rose-900 mt-3">{metrics?.processingFailures ?? 0}</p>
          <p className="text-xs text-rose-700 mt-1">Retryable document parsing issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Vacancies */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Current Vacancies</h2>
            <Link href="/jobs" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {jobs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No vacancies defined yet.</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/jobs/${job.id}/applications`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>{job.department}</span>
                    <span className="font-medium text-slate-700">{job.applicationCount} applications</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Candidate Activity</h2>
            <Link href="/applications" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Full Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Mandatory</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{app.applicant.fullName}</div>
                      <div className="text-xs text-slate-500">{app.cvDocument.fileName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {app.screeningRun ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
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
          </div>
        </div>
      </div>
    </div>
  );
}
