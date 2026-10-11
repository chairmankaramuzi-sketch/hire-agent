'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Filter, Briefcase, FileText, ChevronRight } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Vacancies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage job definitions, mandatory criteria, and scored evaluation criteria.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Vacancy
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'ALL')}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
        <div className="p-12 text-center text-slate-500">Loading vacancies...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No vacancies found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click below to create a new job opening.
          </p>
          <div className="mt-5">
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              <PlusCircle className="w-4 h-4" />
              Create Vacancy
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
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {job.department}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{job.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-700">{mandatoryCount}</span> mandatory •{' '}
                      <span className="font-semibold text-slate-700">{scoredCount}</span> scored criteria
                    </div>
                    <div>Threshold: {job.scoreThreshold ?? 70}%</div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {job.applicationCount} applications
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/jobs/${job.id}/applications`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
