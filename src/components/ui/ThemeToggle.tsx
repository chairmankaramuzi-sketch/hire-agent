'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer select-none ${
        theme === 'dark'
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-slate-600'
          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle visual theme (light or dark mode)"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          <span className={showLabel ? 'inline' : 'hidden sm:inline'}>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className={showLabel ? 'inline' : 'hidden sm:inline'}>Dark Mode</span>
        </>
      )}
    </button>
  );
}
