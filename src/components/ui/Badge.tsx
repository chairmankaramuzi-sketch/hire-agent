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
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'mandatory') {
    if (norm === 'MEETS' || norm === 'MET') {
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (norm === 'DOES_NOT_MEET' || norm === 'NOT_MET') {
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
    } else {
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  } else if (type === 'decision') {
    if (norm === 'SHORTLIST' || norm === 'ADVANCE' || norm === 'SHORTLISTED') {
      colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
    } else if (norm === 'REJECT' || norm === 'REJECTED' || norm === 'REJECTED_AFTER_REVIEW') {
      colorStyles = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
    } else if (norm === 'READY_FOR_REVIEW' || norm === 'SCREENED') {
      colorStyles = 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
    } else if (norm === 'PROCESSING') {
      colorStyles = 'bg-sky-50 text-sky-800 border-sky-300 animate-pulse font-semibold';
    } else if (norm === 'SUBMITTED' || norm === 'RECEIVED') {
      colorStyles = 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    } else {
      colorStyles = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    }
  } else {
    // General application / job status
    switch (norm) {
      case 'SHORTLISTED':
      case 'SHORTLIST':
      case 'ADVANCE':
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'REJECTED':
      case 'REJECT':
      case 'REJECTED_AFTER_REVIEW':
      case 'FAILED':
        colorStyles = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
        break;
      case 'READY_FOR_REVIEW':
      case 'SCREENED':
      case 'PUBLISHED':
      case 'COMPLETED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
        break;
      case 'PROCESSING':
        colorStyles = 'bg-sky-50 text-sky-800 border-sky-300 animate-pulse font-semibold';
        break;
      case 'SUBMITTED':
      case 'RECEIVED':
      case 'DRAFT':
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
        break;
      case 'NEEDS_MANUAL_REVIEW':
      case 'NEEDS_REVIEW':
      case 'UNKNOWN':
      case 'HOLD':
        colorStyles = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
        break;
      default:
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
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
