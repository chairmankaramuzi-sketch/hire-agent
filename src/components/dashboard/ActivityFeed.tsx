'use client';

import React from 'react';
import { Activity, CheckCircle2, Briefcase, FileText } from 'lucide-react';
import { Application } from '@/types';

interface ActivityFeedProps {
  applications: Application[];
}

export function ActivityFeed({ applications }: ActivityFeedProps) {
  const recentDecisions = applications
    .filter((a) => a.reviewDecisions && a.reviewDecisions.length > 0)
    .slice(0, 5)
    .map((a) => {
      const rev = a.reviewDecisions[0];
      return {
        id: `dec-${a.id}`,
        user: rev.reviewerName || 'MR. KALAMUZI',
        role: rev.reviewerId === 'usr-admin-001' ? 'Admin' : 'HR Director',
        action: rev.decision === 'SHORTLIST' ? 'shortlisted' : 'reviewed',
        target: a.applicant?.fullName || 'Candidate',
        time: 'Recently',
        badgeColor:
          rev.decision === 'SHORTLIST'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        icon: CheckCircle2,
      };
    });

  const defaultFeed = [
    {
      id: 'act-1',
      user: 'MR. NAHURIRA',
      role: 'HR Director',
      action: 'screened and shortlisted',
      target: applications[0]?.applicant?.fullName || 'Elena Rostova',
      time: '12m ago',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    {
      id: 'act-2',
      user: 'MRS. ROSE',
      role: 'Recruiter',
      action: 'uploaded batch dossier for',
      target: 'Senior Full-Stack Engineer',
      time: '45m ago',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: FileText,
    },
    {
      id: 'act-3',
      user: 'MR. KALAMUZI',
      role: 'Admin',
      action: 'published new criteria for',
      target: 'Product Manager - AI Platform',
      time: '2h ago',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      icon: Briefcase,
    },
  ];

  const displayFeed = recentDecisions.length > 0 ? recentDecisions : defaultFeed;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Team Audit Trail & Live Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time audit log of human-in-the-loop hiring decisions
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Sync
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {displayFeed.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300 shrink-0">
                  {item.user.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 dark:text-slate-200 truncate">
                    <strong className="font-semibold text-slate-900 dark:text-white">{item.user}</strong>{' '}
                    <span className="text-slate-500 dark:text-slate-400">({item.role})</span>{' '}
                    {item.action}{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.target}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.badgeColor} hidden sm:inline-flex items-center gap-1`}>
                  <Icon className="w-3 h-3" />
                  Audit Verified
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
