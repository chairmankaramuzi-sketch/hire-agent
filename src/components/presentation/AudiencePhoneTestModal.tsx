'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  X,
  Mic,
  FileSignature,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface AudiencePhoneTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'prescreen' | 'offer';
}

export function AudiencePhoneTestModal({
  isOpen,
  onClose,
  defaultTab = 'prescreen',
}: AudiencePhoneTestModalProps) {
  const [activeTab, setActiveTab] = useState<'prescreen' | 'offer'>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('https://hire-agent-rk6w.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!isOpen) return null;

  const prescreenUrl = `${origin}/pre-screen/sarah-jenkins-0001`;
  const offerUrl = `${origin}/offers/tok-sarah-jenkins-7782`;
  const currentUrl = activeTab === 'prescreen' ? prescreenUrl : offerUrl;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    currentUrl
  )}&margin=10&format=svg`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg my-auto max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl transition-colors overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 z-20" />

        {/* Modal Sticky Header - Never cut off */}
        <div className="shrink-0 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Live Smartphone Demo
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Live QR
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Scan with your phone to test the candidate portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body - Adapts smoothly on any screen height */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-3.5 text-slate-900 dark:text-slate-100">
          
          {/* Interactive Experience Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl sm:rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('prescreen')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                activeTab === 'prescreen'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1. Voice Pre-Screen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('offer')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                activeTab === 'offer'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Finger Contract Sign</span>
            </button>
          </div>

          {/* Context Banner */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-[11px] sm:text-xs">
            {activeTab === 'prescreen' ? (
              <div className="flex items-start gap-2 text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Zero-Login Candidate Voice Test:</strong> Speak or type into your smartphone mic. AI grades answers in &lt;10 seconds.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Executive Touch Contract Signing:</strong> Draw digital signature with finger on phone screen to seal the legal contract.
                </div>
              </div>
            )}
          </div>

          {/* High-Contrast Responsive QR Code Box */}
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl space-y-2">
            <div className="p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt="Scan QR code with smartphone"
                className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 object-contain mx-auto"
                loading="eager"
              />
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Scan with your phone camera
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Instant access • No login or app download required
              </p>
            </div>
          </div>

          {/* Link Display and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate select-all">
                {currentUrl}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/30"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Speaker Hint Tip */}
          <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 text-center italic pt-0.5">
            💡 Evaluators can point their iPhone or Android camera at the screen to load this live.
          </div>
        </div>

        {/* Modal Sticky Bottom Dismiss Bar for Mobile */}
        <div className="shrink-0 p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
