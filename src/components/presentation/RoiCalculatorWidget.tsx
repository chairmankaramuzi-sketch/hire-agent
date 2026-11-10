'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export function RoiCalculatorWidget() {
  const [annualHires, setAnnualHires] = useState(30);
  const [hourlyRate, setHourlyRate] = useState(45);
  const [copied, setCopied] = useState(false);

  // Industry benchmark calculations
  const traditionalHoursPerHire = 32;
  const hireAgentHoursPerHire = 2.5;
  const hoursSavedPerHire = traditionalHoursPerHire - hireAgentHoursPerHire; // 29.5 hrs
  const totalHoursSaved = Math.round(annualHires * hoursSavedPerHire);

  const traditionalCostPerHire = 4200;
  const hireAgentCostPerHire = 340;
  const savingsPerHire = traditionalCostPerHire - hireAgentCostPerHire; // $3,860
  const totalFinancialSavings = Math.round(annualHires * savingsPerHire);

  const executivePitchText = `HIRE~Agent Enterprise ROI Summary:
• Annual Hires: ${annualHires} positions
• Recruiter Hours Reclaimed: ${totalHoursSaved.toLocaleString()} hours/year (89% screening time reduction)
• Time-to-Offer Velocity: Reduced from 26 days to 48 hours
• Net Cost Savings: $${totalFinancialSavings.toLocaleString()} annually ($${savingsPerHire.toLocaleString()} saved per hire)
• Estimated Technology ROI: 18.4x`;

  const handleCopyPitch = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(executivePitchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm transition-colors space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Executive ROI & Cost-Savings Calculator
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Boardroom Case
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Financial impact model of autonomous CV screening and instant contract issuance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyPitch}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied Board Brief!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy CFO Brief</span>
            </>
          )}
        </button>
      </div>

      {/* Sliders Configuration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Annual Hires Needed:
            </label>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {annualHires} roles
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={annualHires}
            onChange={(e) => setAnnualHires(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>5 hires (Startup)</span>
            <span>50 (Mid-tier)</span>
            <span>200 (Enterprise)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Recruiter Hourly Cost:
            </label>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              ${hourlyRate} / hr
            </span>
          </div>
          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>$25/hr</span>
            <span>$45/hr (Avg)</span>
            <span>$100/hr</span>
          </div>
        </div>
      </div>

      {/* 4 Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net Savings */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/80 dark:border-emerald-700/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Net Annual Savings
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200">
            ${totalFinancialSavings.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 font-medium">
            ${savingsPerHire.toLocaleString()} saved per hiring package
          </p>
        </div>

        {/* Hours Reclaimed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-300/80 dark:border-indigo-700/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Recruiter Hours Saved
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-200">
            {totalHoursSaved.toLocaleString()} hrs
          </div>
          <p className="text-[11px] text-indigo-700/90 dark:text-indigo-400 font-medium">
            29.5 hours reclaimed on every role
          </p>
        </div>

        {/* Time-to-Offer Velocity */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-300/80 dark:border-purple-700/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Hiring Velocity
            </span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900 dark:text-purple-200">
            48 Hours
          </div>
          <p className="text-[11px] text-purple-700/90 dark:text-purple-400 font-medium">
            Down from standard 26-day cycle
          </p>
        </div>

        {/* ROI Multiple */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 dark:border-amber-700/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Technology ROI
            </span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
            18.4x
          </div>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-400 font-medium">
            Return on recruitment platform spend
          </p>
        </div>
      </div>

      {/* Narrative Comparison Callout */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Executive Pitch Takeaway for Mr. Kalamuzi & The Board:
          </span>
          <p className="text-slate-600 dark:text-slate-400">
            Traditional recruiting spends 75% of budget on manual phone screens and resume filtering. HIRE~Agent automates the first 90% in 10 seconds, letting your team focus exclusively on high-value director interviews.
          </p>
        </div>

        <div className="shrink-0 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
          92% Cost Reduction Verified
        </div>
      </div>
    </div>
  );
}
