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
} from 'lucide-react';
import { authService } from '@/services/auth';
import { systemService } from '@/services/system';
import { staffAccounts } from '@/lib/data/staffAccounts';

export default function LoginPage() {
  const router = useRouter();
  const defaultStaff = staffAccounts[1]; // Jane Doe - HR Director
  const [username, setUsername] = useState(defaultStaff?.email ?? 'hr@company.com');
  const [password, setPassword] = useState(defaultStaff?.password ?? 'HrDirector@2026');
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

  const fillCredentials = (emailVal: string, passVal: string) => {
    setUsername(emailVal);
    setPassword(passVal);
    setError(null);
    setSeedSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FileCheck2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TalentScreen AI</h1>
            <p className="text-xs text-indigo-300 font-medium">Enterprise HR Decision Support</p>
          </div>
        </div>

        {/* Human-in-the-loop notice */}
        <div className="mt-6 mx-4 sm:mx-0 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Decision-Support Mode: Human HR review with deterministic scoring.</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/60">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Sign In to Enterprise Portal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to manage vacancies and candidates
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="hr@company.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember this workstation</span>
              </label>
              <span className="text-slate-500">GDPR Compliant</span>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Test Credentials</span>
              </div>
              <span className="text-[10px] text-slate-500 lowercase">Click to fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {staffAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => fillCredentials(account.email, account.password)}
                  className="p-2.5 text-left rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 transition-all text-xs group"
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      {account.role === 'ADMIN' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">{account.displayName.split(' - ')[0]}</span>
                    </span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-indigo-300">
                      {account.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{account.email}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">pwd: {account.password}</div>
                </button>
              ))}
            </div>

            {/* Direct Restore Test Users button right on login screen */}
            <div className="mt-4 pt-3 border-t border-slate-700/40">
              <button
                type="button"
                onClick={handleRestoreUsers}
                disabled={seedLoading}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {seedLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring Test Users in Database...</span>
                  </>
                ) : (
                  <>
                    <UserCog className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore Test Users in DB</span>
                  </>
                )}
              </button>

              {seedSuccess && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{seedSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
