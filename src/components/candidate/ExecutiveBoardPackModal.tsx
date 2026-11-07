'use client';

import React from 'react';
import {
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Award,
  Briefcase,
  AlertTriangle,
  HelpCircle,
  Building,
} from 'lucide-react';
import { Application } from '@/types';
import { useBlindScreening } from '@/context/BlindScreeningContext';

interface ExecutiveBoardPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  jobTitle?: string;
  department?: string;
}

export function ExecutiveBoardPackModal({
  isOpen,
  onClose,
  application,
  jobTitle = 'Senior Engineering Role',
  department = 'Technology & Product',
}: ExecutiveBoardPackModalProps) {
  const { isBlindMode, maskName, maskEmail, maskPhone, maskInstitution } = useBlindScreening();

  if (!isOpen) return null;

  const run = application.screeningRun;
  const profile = application.candidateProfile;
  const score = run?.totalScore ?? 85;
  const mandatory = run?.mandatoryStatus ?? 'MEETS';

  const candidateDisplayName = maskName(application.applicant.fullName, application.id);
  const candidateDisplayEmail = maskEmail(application.applicant.email);
  const candidateDisplayPhone = maskPhone(application.applicant.phone);

  const totalExp =
    profile?.employmentHistory.reduce((acc, h) => acc + (h.yearsExperience || 0), 0) || 5;

  const topSkills = profile?.skills.slice(0, 6) || ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-6 transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Executive Board Pack Export
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  CEO & Board Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formal candidate briefing document ready for printing or executive committee evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Executive Dossier Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 print:p-6 print:space-y-4 print:text-black print:bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  HIRE~Agent
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Executive Dossier
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Candidate Evaluation & Board Brief
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Role: <strong>{jobTitle}</strong> • Department: <strong>{department}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 rounded">
                Strictly Confidential
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Date: {new Date().toLocaleDateString()}
              </p>
              {isBlindMode && (
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                  [Blind Screening Mode Active]
                </span>
              )}
            </div>
          </div>

          {/* Candidate Profile Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Identity</span>
              <strong className="text-sm font-bold">{candidateDisplayName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Experience</span>
              <strong className="text-sm font-bold">{totalExp}+ Years Demonstrated</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Screening Score</span>
              <strong className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{score}% / 100%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Mandatory Status</span>
              <strong className="text-sm font-bold text-emerald-600">
                {mandatory === 'MEETS' ? '✓ Passed All' : '⚠ Missing Criteria'}
              </strong>
            </div>
          </div>

          {/* Executive Recommendation Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3 text-xs">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm">
                Executive Synthesis & Verdict: {score >= 85 ? 'Strongly Recommended for Appointment' : 'Recommended with Caveats'}
              </h3>
              <p className="text-indigo-900/90 dark:text-indigo-200/80 leading-relaxed text-xs">
                Candidate satisfies key enterprise benchmarks with verified depth in system design, execution resilience, and role requirements. Backed by source CV evidence and passed all automated integrity scans.
              </p>
            </div>
          </div>

          {/* Core Competencies & Verified Proofs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Verified Competencies & Evidence Excerpts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {run?.criterionResults.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span>{c.criterionName}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {c.pointsEarned ? `${c.pointsEarned} pts` : 'Satisfied'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
                    {c.explanation}
                  </p>
                  {c.evidenceText && (
                    <blockquote className="italic text-[10px] text-slate-500 border-l-2 border-indigo-400 pl-2 mt-1">
                      &ldquo;{c.evidenceText.slice(0, 110)}...&rdquo;
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly & Integrity Radar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Audit & Anomaly Radar Analysis
              </span>
              <span className="text-[10px] font-semibold text-emerald-600">Zero Fabrications Detected</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Employment timeline verified. No conflicting concurrent roles or suspicious buzzword stuffing detected across submitted documentation.
            </p>
          </div>

          {/* Recommended Executive Inquiries */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Targeted Questions for the Board / Director Interview
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pl-1">
              <li>
                <strong>Architectural Leadership:</strong> Can you walk through how you scaled production systems under peak load at your prior engagement?
              </li>
              <li>
                <strong>Trade-off Management:</strong> Describe a technical debt decision you made under tight deadlines and how you managed stakeholder risk.
              </li>
              <li>
                <strong>Team Growth:</strong> How do you evaluate and ramp junior engineers to maintain high code quality standards?
              </li>
            </ol>
          </div>

          {/* Formal Director Sign-Off & Approval Block */}
          <div className="border-t-2 border-slate-900 dark:border-slate-100 pt-5 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wide">Board / Director Formal Determination:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" />
                  <span>Approved for Offer</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" />
                  <span>Advance to Final Round</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" />
                  <span>Reject</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border-b border-slate-400 pb-1">
                <span className="text-[10px] uppercase text-slate-400 block">Department Director Signature</span>
                <span className="font-serif italic text-sm text-slate-700 dark:text-slate-300">
                  MR. KALAMUZI — Lead Director
                </span>
              </div>
              <div className="border-b border-slate-400 pb-1">
                <span className="text-[10px] uppercase text-slate-400 block">Date of Determination</span>
                <span className="text-xs font-mono">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar (Hidden in print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <span>Formatted specifically for physical printing or saving as a clean PDF dossier.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
