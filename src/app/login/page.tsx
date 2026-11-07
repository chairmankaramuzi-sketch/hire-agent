'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
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

  // Selected account state - empty by default so KALAMUZI, NAHURIRA, and ROSE can type manually
  const [selectedRole, setSelectedRole] = useState<RoleKey>('custom');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot credentials modal state
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Background DB sync state
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
    const cleaned = val.trim().toLowerCase();
    if (cleaned.includes('kalamuzi') || cleaned.includes('karamuzi') || cleaned === 'admin') {
      setSelectedRole('kalamuzi');
    } else if (cleaned.includes('nahurira') || cleaned.includes('nahirira') || cleaned === 'hr') {
      setSelectedRole('nahurira');
    } else if (cleaned.includes('rose') || cleaned === 'recruiter') {
      setSelectedRole('rose');
    } else {
      setSelectedRole('custom');
    }
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 transition-colors relative">
      {/* Floating Theme Switcher */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
        <ThemeToggle />
      </div>

      {/* Main Bordered Card Container */}
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-2xl dark:shadow-black/50 space-y-5 transition-colors">
        
        {/* Startup Logo & Heading */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mx-auto mb-2">
            <HireAgentLogo size="xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            HIRE~Agent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Smarter Hiring. Better Teams.
          </p>
        </div>

        {/* Team Divider & Quick-Switch Role Selector */}
        <div className="space-y-2.5">
          <div className="relative flex items-center justify-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <div className="flex-shrink px-3 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Quick-switch team accounts pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {ACCOUNTS.map((acc) => {
              const isSelected = selectedRole === acc.key;
              return (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                  }`}
                  title={`Quick switch to ${acc.name} (${acc.role})`}
                >
                  {acc.name}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email or Username input with left icon */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="username-input"
              type="text"
              required
              value={username}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Email or Username"
              className="w-full pl-10 pr-3.5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>

          {/* Password input with left lock and right eye toggle */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember me and Forgot password row */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Gradient Primary Log In Button */}
          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* 'or' Separator Line */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">or</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={() => {
            // Instant sign-in with active demo account
            handleSubmit({ preventDefault: () => {} } as any);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer: Don't have an account? Sign Up */}
        <div className="text-center pt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors"
          >
            Sign Up
          </button>
        </div>

        {/* Discreet Database Sync Link */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
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