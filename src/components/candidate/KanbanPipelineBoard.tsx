'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  Calendar,
  Smartphone,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MoreVertical,
  Plus,
  Stamp,
} from 'lucide-react';
import { Application } from '@/types';
import { useBlindScreening } from '@/context/BlindScreeningContext';

interface KanbanPipelineBoardProps {
  applications: Application[];
  onStageChange?: (applicationId: string, newStage: string) => void;
  onOpenSchedule?: (application: Application) => void;
  onOpenWhatsApp?: (application: Application) => void;
  onOpenBoardPack?: (application: Application) => void;
  onOpenPreScreen?: (application: Application) => void;
  onOpenOffer?: (application: Application) => void;
}

interface ColumnDef {
  id: string;
  title: string;
  badgeColor: string;
  filter: (app: Application) => boolean;
}

export function KanbanPipelineBoard({
  applications,
  onStageChange,
  onOpenSchedule,
  onOpenWhatsApp,
  onOpenBoardPack,
  onOpenPreScreen,
  onOpenOffer,
}: KanbanPipelineBoardProps) {
  const { maskName } = useBlindScreening();

  const columns: ColumnDef[] = [
    {
      id: 'NEW',
      title: 'New Ingested',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      filter: (app) =>
        app.status === 'RECEIVED' ||
        app.status === 'PROCESSING' ||
        app.processingStatus === 'QUEUED',
    },
    {
      id: 'QUALIFIED',
      title: 'AI Screened (Qualified)',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
      filter: (app) =>
        app.status !== 'SHORTLISTED' &&
        app.status !== 'REJECTED_AFTER_REVIEW' &&
        app.screeningRun?.mandatoryStatus === 'MEETS' &&
        (app.screeningRun?.totalScore ?? 0) >= 80,
    },
    {
      id: 'BORDERLINE',
      title: 'Needs Review / Borderline',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
      filter: (app) =>
        app.status === 'NEEDS_REVIEW' ||
        (app.status !== 'SHORTLISTED' &&
          app.status !== 'REJECTED_AFTER_REVIEW' &&
          ((app.screeningRun?.totalScore ?? 0) < 80 ||
            app.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET')),
    },
    {
      id: 'INTERVIEW',
      title: 'Interview Scheduled',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
      filter: (app) => app.status === 'SHORTLISTED',
    },
    {
      id: 'DIRECTOR_REVIEW',
      title: 'Director Final Review',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
      filter: (app) =>
        app.reviewDecisions.some((d) => d.decision === 'ADVANCE'),
    },
    {
      id: 'OFFER_STAGE',
      title: 'Offer Extended',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
      filter: (app) =>
        app.reviewDecisions.some((d) => d.decision === 'SHORTLIST' && d.reason.toLowerCase().includes('offer')),
    },
  ];

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1300px]">
        {columns.map((col) => {
          const colApps = applications.filter(col.filter);

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[78vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {col.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}
                  >
                    {colApps.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="overflow-y-auto space-y-3 flex-1 pr-1 scrollbar-thin">
                {colApps.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No candidates currently in this stage
                  </div>
                ) : (
                  colApps.map((app) => {
                    const score = app.screeningRun?.totalScore ?? 0;
                    const isFailing = app.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET';
                    const hasAnomaly =
                      isFailing ||
                      app.candidateProfile?.employmentHistory.some(
                        (e, i) => i > 0 && e.yearsExperience === 0
                      );

                    return (
                      <div
                        key={app.id}
                        className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                      >
                        {/* Candidate Identity */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/applications/${app.id}`}
                              className="font-bold text-xs text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                            >
                              {maskName(app.applicant.fullName, app.id)}
                            </Link>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {app.jobTitle || 'Engineering Role'}
                            </span>
                          </div>

                          <span
                            className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg border ${
                              score >= 85
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                                : score >= 70
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                            }`}
                          >
                            {score}%
                          </span>
                        </div>

                        {/* Anomaly & Mandatory Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {hasAnomaly ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                              Anomaly
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                              Clean
                            </span>
                          )}

                          <span className="text-slate-400 font-medium">
                            {app.candidateProfile?.skills.slice(0, 2).join(', ')}
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <Link
                            href={`/applications/${app.id}`}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open X-Ray</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-1">
                            {onOpenPreScreen && (
                              <button
                                type="button"
                                onClick={() => onOpenPreScreen(app)}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="AI Pre-Screening Interview & Scorecard"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              </button>
                            )}

                            {onOpenSchedule && (
                              <button
                                type="button"
                                onClick={() => onOpenSchedule(app)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Schedule Interview Link"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenWhatsApp && (
                              <button
                                type="button"
                                onClick={() => onOpenWhatsApp(app)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="WhatsApp Outreach"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenBoardPack && (
                              <button
                                type="button"
                                onClick={() => onOpenBoardPack(app)}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Executive Board Pack Dossier"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenOffer && (
                              <button
                                type="button"
                                onClick={() => onOpenOffer(app)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Official Appointment Offer Letter & e-Signature"
                              >
                                <Stamp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              </button>
                            )}

                            {onStageChange && (
                              <button
                                type="button"
                                onClick={() => onStageChange(app.id, col.id)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Advance to Next Stage"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
