'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  KeyRound,
  AlertCircle,
  UserCog,
  CheckCircle2,
  RefreshCw,
  Crown,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { authService } from '@/services/auth';
import { systemService } from '@/services/system';
import { staffAccounts } from '@/lib/data/staffAccounts';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();

  // Default to Karamuzi Chairman (Admin)
  const adminAccount = staffAccounts[0]; // Karamuzi Chairman
  const [username, setUsername] = useState('Karamuzi chairman');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore users state
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(username, password);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUsers = async () => {
    setSeedLoading(true);
    setSeedSuccess(null);
    setError(null);
    try {
      const res = await systemService.seedUsers();
      setSeedSuccess(res.message);
    } catch (err: any) {
      setError(err?.message || 'Failed to restore test users in database');
    } finally {
      setSeedLoading(false);
    }
  };

  const fillCredentials = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
    setSeedSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Top Navbar / Brand & Theme Switcher */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <FileCheck2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              TalentScreen AI
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 ml-2">
              Enterprise Recruitment
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors">
        {/* Left Hero Feature Showcase Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous Screening Suite
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              AI Decision Support with Deterministic Audit Trail.
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Assists HR teams with zero-hallucination fact verification, native DOCX/PDF extractions, and human-in-the-loop candidate screening.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-white">Zero Hallucination</span>
                  <span className="text-indigo-200/70 text-[11px]">Strict proof excerpts extracted directly from CVs</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-white">Executive Admin Access</span>
                  <span className="text-indigo-200/70 text-[11px]">Full control over danger zone, test batches & settings</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-white">Hybrid Command Center</span>
                  <span className="text-indigo-200/70 text-[11px]">Switch between Table View & Kanban Board in 1-click</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-indigo-800/50 flex items-center justify-between text-xs text-indigo-300/70">
            <span>Enterprise Edition v2.5</span>
            <span>GDPR & ISO-27001 Ready</span>
          </div>
        </div>

        {/* Right Authentication Form Panel (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign In to Enterprise Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials or select an account below to sign in.
              </p>
            </div>

            {/* Role Quick Selector Pills */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Quick Select User Role:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('Karamuzi chairman', 'Admin@2026')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    username.toLowerCase().includes('karamuzi')
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Karamuzi chairman</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Role: ADMIN</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('hr@company.com', 'HrDirector@2026')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    username === 'hr@company.com'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Jane Doe</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Role: HR Director</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('marcus.sterling@company.com', 'Recruiter@2026')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    username === 'marcus.sterling@company.com'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Marcus Sterling</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Role: Recruiter</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Username, Email, or Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Karamuzi chairman or karamuzi@company.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Input <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Karamuzi chairman</strong> for full Administrator privileges.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember session on this device</span>
                </label>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">SSL Encrypted</span>
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in as {username || 'user'}...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Database Test Users Restoration Tool */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleRestoreUsers}
              disabled={seedLoading}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {seedLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Syncing Karamuzi Chairman & Staff in DB...</span>
                </>
              ) : (
                <>
                  <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ensure Test Accounts & Admin Exist in DB</span>
                </>
              )}
            </button>

            {seedSuccess && (
              <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{seedSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
