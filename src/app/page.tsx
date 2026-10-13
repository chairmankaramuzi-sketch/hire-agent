'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-base font-bold text-slate-900">TalentScreen AI</h1>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Redirecting to recruitment dashboard...
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors w-full"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
}
