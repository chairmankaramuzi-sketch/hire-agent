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
  CheckCircle2,
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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 transition-colors relative overflow-hidden">
        
        {/* Top Gradient Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Live Audience Smartphone Test
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Demo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Invite judges & audience to scan with their phones to experience the candidate portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Experience Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('prescreen')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'prescreen'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>1. Voice Pre-Screening</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offer')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'offer'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>2. Finger Contract Signing</span>
          </button>
        </div>

        {/* Tab Description Banner */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs">
          {activeTab === 'prescreen' ? (
            <div className="flex items-start gap-2.5 text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Zero-Login Voice Pre-Screening:</strong>
                Audience can speak or type responses into their smartphone mic. The AI grades Technical, Problem-Solving, and Communication competencies in under 10 seconds.
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Digital Finger e-Signature on Letterhead:</strong>
                Audience can draw their digital signature using touch on their phone screen. Sealing creates a cryptographically stamped, legally-binding contract.
              </div>
            </div>
          )}
        </div>

        {/* High-Resolution Scannable QR Code Frame */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="Scan QR code with smartphone"
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
            />
          </div>

          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Point your smartphone camera at this screen
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No app download or password required • Secured by one-time token
            </p>
          </div>
        </div>

        {/* Link Display and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate select-all">
              {currentUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
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

        {/* Speaker Cue Tip */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center italic">
          💡 <strong>Speaker Tip:</strong> Project this modal during your live demo. Evaluators love seeing candidate portals load on their personal phones in real time!
        </div>
      </div>
    </div>
  );
}
