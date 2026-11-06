'use client';

import React from 'react';

interface HireAgentLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function HireAgentLogo({ size = 'md', showText = false, className = '' }: HireAgentLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 28,
    xl: 36,
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Geometric Emblem */}
      <div
        className={`${sizeClasses} rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 text-white relative overflow-hidden group shrink-0`}
      >
        {/* Subtle ambient light reflection */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

        <svg
          width={iconSizes}
          height={iconSizes}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform group-hover:scale-105"
        >
          {/* Stylized 'H' Left Pillar */}
          <rect x="6" y="6" width="4.5" height="20" rx="2.25" fill="white" fillOpacity="0.95" />
          
          {/* Stylized 'H' Right Pillar */}
          <rect x="21.5" y="6" width="4.5" height="20" rx="2.25" fill="white" fillOpacity="0.95" />

          {/* AI Bridge & Spark Node */}
          <rect x="10.5" y="14" width="11" height="4" rx="2" fill="url(#spark-grad)" />

          {/* Central AI Spark Core */}
          <circle cx="16" cy="16" r="3" fill="#67E8F9" />
          <circle cx="16" cy="16" r="1.5" fill="white" />

          {/* Defs for gradients */}
          <defs>
            <linearGradient id="spark-grad" x1="10.5" y1="16" x2="21.5" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            HIRE<span className="text-indigo-600 dark:text-indigo-400 font-black">~</span>Agent
          </span>
          <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            AI Screening Suite
          </span>
        </div>
      )}
    </div>
  );
}
