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
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'mandatory') {
    if (status === 'MEETS') {
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (status === 'DOES_NOT_MEET') {
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
    } else {
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  } else if (type === 'decision') {
    if (status === 'SHORTLIST' || status === 'ADVANCE' || status === 'SHORTLISTED') {
      colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (status === 'REJECT' || status === 'REJECTED_AFTER_REVIEW') {
      colorStyles = 'bg-rose-50 text-rose-800 border-rose-300';
    } else {
      colorStyles = 'bg-amber-50 text-amber-800 border-amber-300';
    }
  } else {
    // General application / job status
    switch (status) {
      case 'PUBLISHED':
      case 'COMPLETED':
      case 'SCREENED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'DRAFT':
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
      case 'FAILED':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'NEEDS_REVIEW':
      case 'UNKNOWN':
        colorStyles = 'bg-amber-50 text-amber-800 border-amber-300';
        break;
      default:
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        colorStyles
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
