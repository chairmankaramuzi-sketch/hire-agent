'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileCheck2,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { mockCurrentUser } from '@/services/mockData';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Vacancies', icon: Briefcase },
  { href: '/applications', label: 'All Applications', icon: Users },
  { href: '/settings', label: 'System & Retention', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
          <FileCheck2 className="w-6 h-6 text-indigo-600" />
          <span className="font-semibold text-base tracking-tight text-slate-900">
            TalentScreen AI
          </span>
        </div>

        <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200/60 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            Decision-Support Mode
          </div>
          <p className="text-[11px] leading-tight text-amber-800">
            Human-in-the-loop screening: AI assists fact extraction; HR makes final decisions.
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Current User Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
              {mockCurrentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {mockCurrentUser.name}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">{mockCurrentUser.role} Role</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded">Mock Auth</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium text-slate-900">Enterprise HR Portal</span>
            <span>/</span>
            <span>Fictional Demonstration Dataset</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              Mock Services Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
