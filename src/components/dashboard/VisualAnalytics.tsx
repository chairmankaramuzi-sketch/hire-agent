'use client';

import React from 'react';
import { Application } from '@/types';
import { BarChart3, TrendingUp, Award, Printer, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface VisualAnalyticsProps {
  applications: Application[];
}

export function VisualAnalytics({ applications }: VisualAnalyticsProps) {
  const total = applications.length || 1;

  // Score distribution brackets
  const tier90 = applications.filter((a) => (a.screeningRun?.totalScore ?? 0) >= 90).length;
  const tier80 = applications.filter(
    (a) => (a.screeningRun?.totalScore ?? 0) >= 80 && (a.screeningRun?.totalScore ?? 0) < 90
  ).length;
  const tier70 = applications.filter(
    (a) => (a.screeningRun?.totalScore ?? 0) >= 70 && (a.screeningRun?.totalScore ?? 0) < 80
  ).length;
  const tierBelow = applications.filter((a) => (a.screeningRun?.totalScore ?? 0) < 70).length;

  // Funnel calculations
  const meetsMandatory = applications.filter((a) => a.screeningRun?.mandatoryStatus === 'MEETS').length;
  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED' || a.reviewDecisions?.[0]?.decision === 'SHORTLIST').length;
  const needsReview = applications.filter(
    (a) => a.screeningRun?.mandatoryStatus === 'UNKNOWN' || a.reviewDecisions?.length === 0
  ).length;

  const maxScoreCount = Math.max(tier90, tier80, tier70, tierBelow, 1);

  // Print Executive Shortlist Summary
  const handlePrintShortlist = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Funnel Velocity & Conversion (7 cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recruitment Funnel & Conversions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stage progression across all {applications.length} submitted resumes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintShortlist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            title="Print or Export Executive Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Dossier</span>
          </button>
        </div>

        {/* Funnel Progress Bars */}
        <div className="space-y-3.5 pt-1">
          {/* Stage 1: Submitted */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Total Applications Received
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {applications.length} (100%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-slate-400 dark:bg-slate-500 rounded-full w-full" />
            </div>
          </div>

          {/* Stage 2: AI Qualified */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Qualified (Meets Mandatory Criteria)
              </span>
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                {meetsMandatory} ({Math.round((meetsMandatory / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${(meetsMandatory / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Stage 3: Needs Human Review */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Needs Review or Borderline
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {needsReview} ({Math.round((needsReview / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(needsReview / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Stage 4: Shortlisted */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Final Shortlisted by Team
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {shortlisted} ({Math.round((shortlisted / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(shortlisted / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Match Score Distribution (5 cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/40">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Match Score Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Candidate qualification score brackets
            </p>
          </div>
        </div>

        {/* Visual Bar Bracket Chart */}
        <div className="space-y-3 pt-1">
          {/* 90-100% Bracket */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-indigo-700 dark:text-indigo-400">Top Tier (90% – 100%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{tier90} candidates</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${(tier90 / maxScoreCount) * 100}%` }}
              />
            </div>
          </div>

          {/* 80-89% Bracket */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-blue-700 dark:text-blue-400">Strong Match (80% – 89%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{tier80} candidates</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(tier80 / maxScoreCount) * 100}%` }}
              />
            </div>
          </div>

          {/* 70-79% Bracket */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-amber-700 dark:text-amber-400">Moderate Match (70% – 79%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{tier70} candidates</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(tier70 / maxScoreCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Below 70% Bracket */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-600 dark:text-slate-400">Below Threshold (&lt; 70%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{tierBelow} candidates</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
                style={{ width: `${(tierBelow / maxScoreCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
