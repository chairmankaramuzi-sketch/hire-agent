'use client';

import React from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useBlindScreening } from '@/context/BlindScreeningContext';

export function BlindScreeningToggle({ compact = false }: { compact?: boolean }) {
  const { isBlindMode, toggleBlindMode } = useBlindScreening();

  return (
    <button
      type="button"
      onClick={toggleBlindMode}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        isBlindMode
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
      title={
        isBlindMode
          ? 'Blind Screening active: names, demographics, and contact info are masked for unbiased evaluation'
          : 'Enable Blind Screening to anonymize candidate identities for bias-free hiring'
      }
    >
      <Shield className={`w-3.5 h-3.5 ${isBlindMode ? 'text-amber-500' : 'text-slate-400'}`} />
      <span>{isBlindMode ? 'Blind Mode: ON' : 'Blind Mode: OFF'}</span>
      {isBlindMode ? (
        <EyeOff className="w-3 h-3 text-amber-500" />
      ) : (
        <Eye className="w-3 h-3 text-slate-400" />
      )}
    </button>
  );
}
