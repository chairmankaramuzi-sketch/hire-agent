'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Send,
  X,
  Copy,
  Check,
  CheckCheck,
  MessageSquare,
  Sparkles,
  Phone,
  Calendar,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { useBlindScreening } from '@/context/BlindScreeningContext';

interface WhatsAppSmsOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePhone?: string;
  jobTitle: string;
}

export function WhatsAppSmsOutreachModal({
  isOpen,
  onClose,
  candidateName,
  candidatePhone = '+256 700 892 411',
  jobTitle,
}: WhatsAppSmsOutreachModalProps) {
  const { isBlindMode, maskName, maskPhone } = useBlindScreening();

  const [phone, setPhone] = useState(candidatePhone);
  const [template, setTemplate] = useState<'interview' | 'clarify' | 'offer'>('interview');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentFeedback, setSentFeedback] = useState(false);

  if (!isOpen) return null;

  const displayName = maskName(candidateName);
  const displayPhone = maskPhone(phone);

  const getMessageContent = () => {
    const bookingLink = `https://hire-agent-rk6w.vercel.app/book/${encodeURIComponent(
      candidateName.toLowerCase().replace(/\s+/g, '-')
    )}`;

    if (template === 'interview') {
      return `Hi ${displayName}! Great news from the hiring team for the ${jobTitle} role. Your resume stood out in our AI screening. Please select an interview time that fits your schedule here: ${bookingLink}. Let us know if you have any questions! — HIRE~Agent Team`;
    }
    if (template === 'clarify') {
      return `Hello ${displayName}, we are currently reviewing your application for the ${jobTitle} position. Could you briefly confirm your current notice period and availability for a technical interview this week? Thank you! — HIRE~Agent HR`;
    }
    return `Dear ${displayName}, congratulations! The Department Director and Hiring Committee have approved your offer for the ${jobTitle} role. Please check your email for the formal offer letter and compensation package. Welcome aboard!`;
  };

  const messageText = getMessageContent() + (customNote ? `\n\nP.S. ${customNote}` : '');

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppOpen = () => {
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    setSentFeedback(true);
  };

  const handleSmsOpen = () => {
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(messageText)}`;
    window.location.href = url;
    setSentFeedback(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                WhatsApp & SMS Fast-Track Outreach
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Instant Response Rate
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reach candidates directly on mobile to eliminate days of email delays.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Form Left + Phone Mockup Right */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 text-xs">
          {/* Left Column: Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Candidate Phone Number:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Template Presets */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Outreach Message Template:
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'interview',
                    title: '📅 Interview Self-Scheduling Invitation',
                    desc: 'Sends candidate instant booking link for calendar slots.',
                  },
                  {
                    id: 'clarify',
                    title: '⚡ Availability & Notice Period Check',
                    desc: 'Requests quick confirmation of start date & salary expectations.',
                  },
                  {
                    id: 'offer',
                    title: '🎉 Formal Job Offer Fast-Track',
                    desc: 'Notifies candidate of board offer approval and email package.',
                  },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      template === t.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs">{t.title}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom addendum note */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Custom Note / Postscript:
              </label>
              <input
                type="text"
                placeholder="e.g. Please bring an updated portfolio or repo link"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleWhatsAppOpen}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all text-xs"
              >
                <Smartphone className="w-4 h-4" />
                Open & Send via WhatsApp Web
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSmsOpen}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Native SMS
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>

              {sentFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Outreach initiated! Candidate response tracked on mobile.</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Dashboard</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Realistic Phone Mockup Preview */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">
              Live WhatsApp Screen Preview
            </span>

            {/* Smartphone Shell */}
            <div className="w-full max-w-[280px] bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Phone Camera Notch */}
              <div className="w-20 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2" />

              {/* Chat Header */}
              <div className="p-2.5 bg-emerald-800 text-white rounded-t-2xl flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  {displayName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate leading-tight text-white">{displayName}</p>
                  <p className="text-[9px] text-emerald-200 truncate">{displayPhone}</p>
                </div>
              </div>

              {/* Chat Bubble Area */}
              <div className="p-3 bg-[#e5ddd5] dark:bg-slate-950 min-h-[220px] rounded-b-2xl flex flex-col justify-end space-y-2">
                {/* Outgoing Message Bubble */}
                <div className="bg-[#d9fdd3] dark:bg-emerald-950/90 text-slate-900 dark:text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-[11px] leading-relaxed relative max-w-[90%] self-end space-y-1">
                  <p className="whitespace-pre-wrap">{messageText}</p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Candidates respond up to 8x faster to mobile WhatsApp alerts than traditional email.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
