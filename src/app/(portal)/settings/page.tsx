'use client';

import React from 'react';
import { ShieldCheck, Database, FileText, Lock, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System, Retention & Compliance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Architectural rules, data minimization policies, and backend handoff specifications.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Responsible AI & Decision-Support Policy</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              In compliance with architectural guidelines, the system operates strictly in a <strong>decision-support capacity</strong>.
              Automated rejections based solely on AI inference are blocked. All scoring criteria are deterministic, explainable, and traceable to original CV excerpts.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4 text-xs text-slate-600">
          <h3 className="font-semibold text-sm text-slate-900">Data Minimization & Storage Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Lock className="w-4 h-4 text-indigo-600" /> Private Object Storage
              </div>
              <p>CVs are stored in private object storage; short-lived signed URLs expire after 15 minutes.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Database className="w-4 h-4 text-emerald-600" /> Relational Traceability
              </div>
              <p>PostgreSQL maintains foreign key relationships between job criteria versions and scoring runs.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-sm text-slate-900 mb-2">Frontend Handoff Readiness</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All UI components interface exclusively through the service layer (<code>src/services</code>).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No secrets or credentials present in browser bundles.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Loading, empty, error, and recovery states fully supported across all routes.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
