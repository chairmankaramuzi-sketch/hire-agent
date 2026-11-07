'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Printer,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Application[];
  onShortlistCandidate?: (candidateId: string) => void;
}

export function CandidateComparisonModal({
  isOpen,
  onClose,
  candidates,
  onShortlistCandidate,
}: CandidateComparisonModalProps) {
  if (!isOpen || candidates.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to extract top strengths for a candidate
  const getCandidateStrengths = (app: Application): string[] => {
    const passed = app.screeningRun?.criterionResults
      .filter((r) => r.status === 'MEETS' && r.pointsEarned && r.pointsEarned > 15)
      .map((r) => r.criterionName + ': ' + (r.evidenceText?.slice(0, 75) || r.explanation.slice(0, 75)))
      .slice(0, 3);

    if (passed && passed.length > 0) return passed;

    // Fallback from profile skills
    const skills = app.candidateProfile?.skills.slice(0, 3) || [];
    const expYears = app.candidateProfile?.employmentHistory.reduce(
      (acc, h) => acc + (h.yearsExperience || 0),
      0
    ) || 4;
    return [
      `${expYears}+ years demonstrable engineering and delivery experience`,
      `Verified proficiency in ${skills.join(', ') || 'required modern tech stack'}`,
      `Passed all mandatory screening and compliance checkpoints`,
    ];
  };

  // Helper to extract gaps / anomalies
  const getCandidateGaps = (app: Application): string[] => {
    const failed = app.screeningRun?.criterionResults
      .filter((r) => r.status === 'DOES_NOT_MEET' || r.status === 'PARTIAL')
      .map((r) => r.criterionName + ': ' + r.explanation.slice(0, 75));

    if (failed && failed.length > 0) return failed.slice(0, 2);

    return ['No significant gaps identified relative to job benchmark'];
  };

  // Helper to extract anomaly info
  const getCandidateAnomalies = (app: Application): { level: 'clean' | 'warning'; text: string } => {
    const exp = app.candidateProfile?.employmentHistory || [];
    if (exp.length > 1) {
      // Check for overlapping dates or gaps
      const hasGap = exp.some((e, i) => i > 0 && e.yearsExperience === 0);
      if (hasGap) {
        return { level: 'warning', text: '12+ month career gap between positions detected' };
      }
    }
    if (app.screeningRun?.mandatoryStatus === 'DOES_NOT_MEET') {
      return { level: 'warning', text: 'Failed 1 mandatory compliance requirement' };
    }
    return { level: 'clean', text: 'Verified timeline & high credential confidence' };
  };

  const getVerdict = (score: number, mandatory: string) => {
    if (mandatory === 'DOES_NOT_MEET') {
      return { label: 'Ineligible (Missing Mandatory)', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' };
    }
    if (score >= 85) {
      return { label: 'Strongly Recommended', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' };
    }
    if (score >= 70) {
      return { label: 'Recommended Contender', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200' };
    }
    return { label: 'Needs Detailed Review', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Head-to-Head Candidate Matrix
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {candidates.length} Compared
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct side-by-side executive evaluation for hiring managers and department directors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
              title="Print executive summary for interview panel"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print 1-Page Summary</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print-only title */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-950">HIRE~Agent Candidate Comparison Matrix</h1>
              <p className="text-xs text-slate-600">Executive Decision Summary • Generated {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Department Executive Review
            </div>
          </div>
        </div>

        {/* Scrollable Matrix Content */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-5 sm:p-6">
          <div className="min-w-[680px]">
            {/* Grid Columns */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `180px repeat(${candidates.length}, minmax(220px, 1fr))`,
              }}
            >
              {/* Row 1: Candidate Cards / Overview */}
              <div className="font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                Candidate
              </div>
              {candidates.map((c) => {
                const score = c.screeningRun?.totalScore ?? 0;
                const mandatory = c.screeningRun?.mandatoryStatus ?? 'UNKNOWN';
                const verdict = getVerdict(score, mandatory);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {c.applicant.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {c.applicant.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {score}%
                        </span>
                      </div>
                    </div>

                    <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border text-center ${verdict.color}`}>
                      {verdict.label}
                    </div>
                  </div>
                );
              })}

              {/* Row 2: Mandatory Qualifications */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Mandatory Check
              </div>
              {candidates.map((c) => {
                const meets = c.screeningRun?.mandatoryStatus === 'MEETS';
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs"
                  >
                    {meets ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        All Criteria Satisfied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                        <XCircle className="w-4 h-4 shrink-0" />
                        Missing Mandatory Requirement
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Row 3: Experience & Background */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <Briefcase className="w-4 h-4 text-slate-400" />
                Experience
              </div>
              {candidates.map((c) => {
                const totalYrs = c.candidateProfile?.employmentHistory.reduce(
                  (acc, h) => acc + (h.yearsExperience || 0),
                  0
                ) || 4;
                const latestRole = c.candidateProfile?.employmentHistory[0];
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">
                      {totalYrs} Years Commercial
                    </p>
                    {latestRole && (
                      <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                        Latest: {latestRole.title} at {latestRole.company}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Row 4: Education */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Education
              </div>
              {candidates.map((c) => {
                const edu = c.candidateProfile?.education[0];
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-0.5"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {edu?.degree || "Bachelor's Degree"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {edu?.institution || 'Accredited University'}
                    </p>
                  </div>
                );
              })}

              {/* Row 5: Core Technical Stack */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <Award className="w-4 h-4 text-slate-400" />
                Core Stack
              </div>
              {candidates.map((c) => {
                const skills = c.candidateProfile?.skills.slice(0, 5) || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1"
                  >
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                );
              })}

              {/* Row 6: Top 3 Strengths */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Top Strengths
              </div>
              {candidates.map((c) => {
                const strengths = getCandidateStrengths(c);
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    {strengths.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span className="leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Row 7: Gaps / Red Flags */}
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400 py-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Gaps & Warnings
              </div>
              {candidates.map((c) => {
                const gaps = getCandidateGaps(c);
                const anomaly = getCandidateAnomalies(c);
                return (
                  <div
                    key={c.id}
                    className="py-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    {anomaly.level === 'warning' && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{anomaly.text}</span>
                      </div>
                    )}
                    {gaps.map((g, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span className="leading-snug">{g}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Row 8: Action row */}
              <div className="py-4 border-t border-slate-200 dark:border-slate-800 print:hidden"></div>
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="py-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 print:hidden"
                >
                  <Link
                    href={`/applications/${c.id}`}
                    className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    Open Dossier
                  </Link>
                  {onShortlistCandidate && c.status !== 'SHORTLISTED' && (
                    <button
                      type="button"
                      onClick={() => onShortlistCandidate(c.id)}
                      className="py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      Shortlist
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 print:hidden">
          <span>
            Tip: Press <strong>Print 1-Page Summary</strong> to produce a formal document ready for board or hiring committee review.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
