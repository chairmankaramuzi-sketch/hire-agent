'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { authService } from '@/services/auth';
import { systemService } from '@/services/system';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { HireAgentLogo } from '@/components/brand/HireAgentLogo';

type RoleKey = 'kalamuzi' | 'nahurira' | 'rose' | 'custom';

interface AccountOption {
  key: RoleKey;
  name: string;
  role: string;
  loginInput: string;
  pass: string;
}

const ACCOUNTS: AccountOption[] = [
  {
    key: 'kalamuzi',
    name: 'MR. KALAMUZI',
    role: 'Admin',
    loginInput: 'MR. KALAMUZI',
    pass: 'Admin@2026',
  },
  {
    key: 'nahurira',
    name: 'MR. NAHURIRA',
    role: 'HR Director',
    loginInput: 'MR. NAHURIRA',
    pass: 'HrDirector@2026',
  },
  {
    key: 'rose',
    name: 'MRS. ROSE',
    role: 'Recruiter',
    loginInput: 'MRS. ROSE',
    pass: 'Recruiter@2026',
  },
];

export default function LoginPage() {
  const router = useRouter();

  // Selected account state
  const [selectedRole, setSelectedRole] = useState<RoleKey>('kalamuzi');
  const [username, setUsername] = useState('MR. KALAMUZI');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password notice state
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Background DB sync state (discreet helper)
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleSelectAccount = (acc: AccountOption) => {
    setSelectedRole(acc.key);
    setUsername(acc.loginInput);
    setPassword(acc.pass);
    setError(null);
    setSeedSuccess(null);
  };

  const handleInputChange = (val: string) => {
    setUsername(val);
    const matched = ACCOUNTS.find(
      (a) => a.loginInput.toLowerCase() === val.trim().toLowerCase()
    );
    setSelectedRole(matched ? matched.key : 'custom');
  };

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

  const handleSyncDatabase = async () => {
    setSeedLoading(true);
    setSeedSuccess(null);
    setError(null);
    try {
      const res = await systemService.seedUsers();
      setSeedSuccess(res.message);
    } catch (err: any) {
      setError(err?.message || 'Failed to sync users with database');
    } finally {
      setSeedLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (selectedRole === 'kalamuzi') return 'Sign in as MR. KALAMUZI (Admin)';
    if (selectedRole === 'nahurira') return 'Sign in as MR. NAHURIRA (HR Director)';
    if (selectedRole === 'rose') return 'Sign in as MRS. ROSE (Recruiter)';
    return `Sign in as ${username || 'User'}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 transition-colors relative">
      {/* Floating Theme Switcher in top right corner */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
        <ThemeToggle />
      </div>

      {/* Main Bordered Login Card Container */}
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 space-y-6 transition-colors">
        
        {/* Startup Logo & Title */}
        <div className="text-center space-y-2.5">
          <div className="flex justify-center mx-auto mb-1">
            <HireAgentLogo size="xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              HIRE~Agent
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sign in to your team account
            </p>
          </div>
        </div>

        {/* Quick Switch Account (MR. KALAMUZI, MR. NAHURIRA, MRS. ROSE) */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Quick switch account:
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ACCOUNTS.map((acc) => {
              const isSelected = selectedRole === acc.key;
              return (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 border-2 border-indigo-600 dark:border-indigo-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {acc.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                    {acc.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form with Defined Borders */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="username-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Username or email
            </label>
            <input
              id="username-input"
              type="text"
              required
              value={username}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g. MR. KALAMUZI"
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password-input"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating session...</span>
              </>
            ) : (
              <>
                <span>{getButtonLabel()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer & Border Divider */}
        <div className="text-center pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            HIRE~Agent • Simple & Smart Hiring Assistant
          </p>

          {/* Discreet sync button for test database reassurance */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={seedLoading}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
            >
              {seedLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                  <span>Syncing team accounts in database...</span>
                </>
              ) : (
                <span>Sync team accounts with database</span>
              )}
            </button>

            {seedSuccess && (
              <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{seedSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Team Credentials
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">
                  MR. KALAMUZI (Admin)
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">
                  Password: Admin@2026
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">
                  MR. NAHURIRA (HR Director)
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">
                  Password: HrDirector@2026
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">
                  MRS. ROSE (Recruiter)
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">
                  Password: Recruiter@2026
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
