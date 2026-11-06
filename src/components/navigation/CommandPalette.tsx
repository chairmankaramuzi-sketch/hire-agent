'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  UserCheck,
  Sparkles,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/auth';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Switch Account' | 'System & AI' | 'Theme';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Hiring Dashboard',
      subtitle: 'Overview of candidate pipeline & statistics',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      badge: 'G D',
    },
    {
      id: 'nav-jobs',
      title: 'Job Openings',
      subtitle: 'Browse & manage all active positions',
      category: 'Navigation',
      icon: Briefcase,
      action: () => {
        router.push('/jobs');
        onClose();
      },
      badge: 'G J',
    },
    {
      id: 'nav-candidates',
      title: 'Candidate Applications',
      subtitle: 'Review candidates and screening results',
      category: 'Navigation',
      icon: Users,
      action: () => {
        router.push('/applications');
        onClose();
      },
      badge: 'G C',
    },
    {
      id: 'nav-new-job',
      title: 'Post a New Job',
      subtitle: 'Create a job opening with custom criteria',
      category: 'Navigation',
      icon: PlusCircle,
      action: () => {
        router.push('/jobs/new');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'System Settings & Privacy',
      subtitle: 'Audit trail, data protection & policies',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        router.push('/settings');
        onClose();
      },
    },

    // Switch Account
    {
      id: 'role-kalamuzi',
      title: 'Switch to MR. KALAMUZI',
      subtitle: 'Role: Executive Admin (Full System Privileges)',
      category: 'Switch Account',
      icon: UserCheck,
      action: async () => {
        try {
          await authService.login('MR. KALAMUZI', 'Admin@2026');
          onClose();
          window.location.reload();
        } catch {
          // ignore
        }
      },
      badge: 'Admin',
    },
    {
      id: 'role-nahurira',
      title: 'Switch to MR. NAHURIRA',
      subtitle: 'Role: HR Director (Review & Decision Authority)',
      category: 'Switch Account',
      icon: UserCheck,
      action: async () => {
        try {
          await authService.login('MR. NAHURIRA', 'HrDirector@2026');
          onClose();
          window.location.reload();
        } catch {
          // ignore
        }
      },
      badge: 'HR Director',
    },
    {
      id: 'role-rose',
      title: 'Switch to MRS. ROSE',
      subtitle: 'Role: Recruiter (Candidate Sourcing & Notes)',
      category: 'Switch Account',
      icon: UserCheck,
      action: async () => {
        try {
          await authService.login('MRS. ROSE', 'Recruiter@2026');
          onClose();
          window.location.reload();
        } catch {
          // ignore
        }
      },
      badge: 'Recruiter',
    },

    // Theme
    {
      id: 'theme-dark',
      title: 'Switch to Dark Mode',
      subtitle: 'High contrast dark theme for low light',
      category: 'Theme',
      icon: Moon,
      action: () => {
        setTheme('dark');
        onClose();
      },
    },
    {
      id: 'theme-light',
      title: 'Switch to Light Mode',
      subtitle: 'Clean white background theme',
      category: 'Theme',
      icon: Sun,
      action: () => {
        setTheme('light');
        onClose();
      },
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm transition-all animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[75vh] z-10 transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page name, or role to switch..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching commands or actions found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-white border border-indigo-200/60 dark:border-indigo-800/60'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">HIRE~Agent Quick Bar</span>
        </div>
      </div>
    </div>
  );
}
