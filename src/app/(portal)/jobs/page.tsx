'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Filter, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react';
import { jobsService } from '@/services';
import { Job, JobStatus } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function JobsListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const data = await jobsService.getJobs({
          search,
          status: statusFilter,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        setJobs(data);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs group shrink-0"
            title="Return to Executive Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Job Openings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your job openings, required qualifications, and candidate scoring rules.
            </p>
          </div>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Post a New Job
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'ALL')}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No jobs found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click below to create a new job opening.
          </p>
          <div className="mt-5">
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Post a New Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const mandatoryCount = job.criteria.filter((c) => c.criterionType === 'MANDATORY').length;
            const scoredCount = job.criteria.filter((c) => c.criterionType === 'SCORED').length;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {job.department}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{job.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{mandatoryCount}</span> mandatory •{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{scoredCount}</span> scored criteria
                    </div>
                    <div>Threshold: {job.scoreThreshold ?? 70}%</div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {job.applicationCount} applications
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/jobs/${job.id}/applications`}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      Shortlist <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
