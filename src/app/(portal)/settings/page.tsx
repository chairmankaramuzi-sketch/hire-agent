'use client';

import React from 'react';
import { ShieldCheck, Database, FileText, Lock, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System, Retention & Compliance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Architectural rules, data minimization policies, and backend handoff specifications.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Responsible AI & Decision-Support Policy
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              In compliance with architectural guidelines, the system operates strictly in a <strong className="font-semibold text-slate-800 dark:text-slate-100">decision-support capacity</strong>.
              Automated rejections based solely on AI inference are blocked. All scoring criteria are deterministic, explainable, and traceable to original CV excerpts.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-xs text-slate-600 dark:text-slate-400">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Data Minimization & Storage Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Private Object Storage
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                CVs are stored in private object storage; short-lived signed URLs expire after 15 minutes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Relational Traceability
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                PostgreSQL maintains foreign key relationships between job criteria versions and scoring runs.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
            Frontend Handoff Readiness
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>All UI components interface exclusively through the service layer (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]">src/services</code>).</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>No secrets or credentials present in browser bundles.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Loading, empty, error, and recovery states fully supported across all routes.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
