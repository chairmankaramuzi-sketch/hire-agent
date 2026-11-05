'use client';

import React from 'react';
import { ShieldCheck, Database, Lock, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Settings & Privacy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          How your recruitment data is protected, scored, and kept private.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Fair AI & Human-Led Hiring
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              The AI acts strictly as an assistant to read resumes and highlight key qualifications. <strong className="font-semibold text-slate-800 dark:text-slate-100">It never automatically rejects candidates on its own.</strong> Every score comes directly from real sentences in the resume with clear proof you can verify yourself.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-xs text-slate-600 dark:text-slate-400">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Resume Storage & Security
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Private Resume Storage
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Uploaded resumes are stored in private secure cloud storage. Temporary download links expire after 15 minutes to prevent unauthorized sharing.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Permanent Decision History
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Every score, review note, and hiring choice is safely linked in the database so your team always knows why a candidate was shortlisted or hired.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
            System Reliability Guarantees
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Clean separation of data: your browser never handles raw passwords or private database credentials.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>High data accuracy: scores are deterministic calculations, not random guesses.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Smooth page transitions with built-in dark and light mode support.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
