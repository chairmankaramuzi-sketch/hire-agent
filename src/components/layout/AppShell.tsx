'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { authService, activeUser } from '@/services/auth';
import { User } from '@/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { HireAgentLogo } from '@/components/brand/HireAgentLogo';
import { CommandPalette } from '@/components/navigation/CommandPalette';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Openings', icon: Briefcase },
  { href: '/applications', label: 'Candidates', icon: Users },
  { href: '/settings', label: 'System Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(activeUser);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((u) => setCurrentUser(u));
  }, []);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Role color helper
  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          avatar: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30',
          pill: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60',
        };
      case 'HR':
        return {
          avatar: 'bg-violet-600 text-white shadow-sm shadow-violet-600/30',
          pill: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/60',
        };
      default:
        return {
          avatar: 'bg-slate-700 text-white',
          pill: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const roleStyles = getRoleBadgeClasses(currentUser.role);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <HireAgentLogo size="sm" showText={true} />
          </Link>
        </div>

        {/* AI Assistant Mode Info Banner */}
        <div className="px-4 py-3 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            AI Assistant Mode
          </div>
          <p className="text-[11px] leading-tight text-amber-800/90 dark:text-amber-300/80">
            AI helps review resumes. You make all final hiring decisions.
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Current User Card & Log Out */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${roleStyles.avatar}`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${roleStyles.pill}`}
                  >
                    {currentUser.role}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <button
              id="logout-btn"
              type="button"
              title="Sign Out"
              onClick={() => authService.logout()}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">Recruitment Portal</span>
            <span>/</span>
            <span>Hiring Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search & Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 transition-all shadow-sm group"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              <span className="hidden sm:inline">Commands & Search</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-indigo-400">
                Ctrl K
              </kbd>
            </button>

            {/* Theme Toggle Button (Light/Dark mode) */}
            <ThemeToggle />

            {/* System Online Badge with glowing pulse */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Online
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
