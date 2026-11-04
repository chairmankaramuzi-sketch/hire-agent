import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function StatusBadge({
  status,
  type = 'general',
}: {
  status: string;
  type?: 'general' | 'mandatory' | 'decision';
}) {
  const norm = (status || '').toUpperCase().trim();
  let colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (type === 'mandatory') {
    if (norm === 'MEETS' || norm === 'MET') {
      colorStyles = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
    } else if (norm === 'DOES_NOT_MEET' || norm === 'NOT_MET') {
      colorStyles = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70';
    } else {
      colorStyles = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70';
    }
  } else if (type === 'decision') {
    if (norm === 'SHORTLIST' || norm === 'ADVANCE' || norm === 'SHORTLISTED') {
      colorStyles = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold';
    } else if (norm === 'REJECT' || norm === 'REJECTED' || norm === 'REJECTED_AFTER_REVIEW') {
      colorStyles = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold';
    } else if (norm === 'READY_FOR_REVIEW' || norm === 'SCREENED') {
      colorStyles = 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-semibold';
    } else if (norm === 'PROCESSING') {
      colorStyles = 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 animate-pulse font-semibold';
    } else if (norm === 'SUBMITTED' || norm === 'RECEIVED') {
      colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold';
    } else {
      colorStyles = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold';
    }
  } else {
    // General application / job status
    switch (norm) {
      case 'SHORTLISTED':
      case 'SHORTLIST':
      case 'ADVANCE':
        colorStyles = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold';
        break;
      case 'REJECTED':
      case 'REJECT':
      case 'REJECTED_AFTER_REVIEW':
      case 'FAILED':
        colorStyles = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold';
        break;
      case 'READY_FOR_REVIEW':
      case 'SCREENED':
      case 'PUBLISHED':
      case 'COMPLETED':
        colorStyles = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 font-semibold';
        break;
      case 'PROCESSING':
        colorStyles = 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 animate-pulse font-semibold';
        break;
      case 'SUBMITTED':
      case 'RECEIVED':
      case 'DRAFT':
        colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold';
        break;
      case 'NEEDS_MANUAL_REVIEW':
      case 'NEEDS_REVIEW':
      case 'UNKNOWN':
      case 'HOLD':
        colorStyles = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold';
        break;
      default:
        colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

  const label =
    norm === 'REJECTED_AFTER_REVIEW'
      ? 'REJECTED'
      : status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        colorStyles
      )}
    >
      {label}
    </span>
  );
}
