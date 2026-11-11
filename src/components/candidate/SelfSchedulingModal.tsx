'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  User,
  Share2,
  CalendarCheck,
  Send,
  Mail,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';

interface SelfSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  onScheduleConfirmed?: (slotInfo: string) => void;
}

export function SelfSchedulingModal({
  isOpen,
  onClose,
  candidateName,
  candidateEmail,
  candidatePhone = '+256 700 892 411',
  jobTitle,
  onScheduleConfirmed,
}: SelfSchedulingModalProps) {
  const [platform, setPlatform] = useState<'Google Meet' | 'Microsoft Teams' | 'Office In-Person'>('Google Meet');
  const [interviewer, setInterviewer] = useState('MR. KALAMUZI (Lead Reviewer)');
  const [duration, setDuration] = useState('45');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'candidateView'>('config');

  // Candidate simulation slot
  const [selectedSimSlot, setSelectedSimSlot] = useState<string | null>('Tomorrow, 10:30 AM');
  const [simConfirmed, setSimConfirmed] = useState(false);

  if (!isOpen) return null;

  const mockBookingLink = `https://hire-agent-rk6w.vercel.app/book/${encodeURIComponent(
    candidateName.toLowerCase().replace(/\s+/g, '-')
  )}-${Date.now().toString().slice(-4)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mockBookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulateCandidateBooking = () => {
    if (!selectedSimSlot) return;
    setSimConfirmed(true);
    if (onScheduleConfirmed) {
      onScheduleConfirmed(selectedSimSlot);
    }
  };

  const availableSlots = [
    { date: 'Tomorrow', time: '10:30 AM', zone: 'GMT+3 (East Africa)' },
    { date: 'Tomorrow', time: '02:00 PM', zone: 'GMT+3 (East Africa)' },
    { date: 'Day After Tomorrow', time: '11:15 AM', zone: 'GMT+3 (East Africa)' },
    { date: 'Day After Tomorrow', time: '03:30 PM', zone: 'GMT+3 (East Africa)' },
    { date: 'Next Monday', time: '09:00 AM', zone: 'GMT+3 (East Africa)' },
    { date: 'Next Monday', time: '01:30 PM', zone: 'GMT+3 (East Africa)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Self-Scheduling Interview Links
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Google & Outlook Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero back-and-forth emails. Candidates pick a time slot directly from the interviewer's calendar.
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

        {/* View Switcher: Recruiter Setup vs Candidate Booking Experience */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Recruiter Link Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('candidateView')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'candidateView'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            2. Candidate Booking Preview
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'config' ? (
            <>
              {/* Candidate Info Summary */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                    Interviewing Candidate
                  </span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{candidateName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{jobTitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{candidateEmail}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{candidatePhone}</span>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Lead Interviewer / Panel
                  </label>
                  <select
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="MR. KALAMUZI (Lead Reviewer)">MR. KALAMUZI (Lead Reviewer)</option>
                    <option value="MR. NAHURIRA (HR Specialist)">MR. NAHURIRA (HR Specialist)</option>
                    <option value="MRS. ROSE (Senior Recruiter)">MRS. ROSE (Senior Recruiter)</option>
                    <option value="Technical Panel (Engineering Leads)">Technical Panel (Engineering Leads)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Meeting Platform
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Google Meet', 'Microsoft Teams', 'Office In-Person'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-all ${
                          platform === p
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p === 'Google Meet' ? 'Meet' : p === 'Microsoft Teams' ? 'Teams' : 'In-Person'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Session Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: '30', label: '30 Mins' },
                      { val: '45', label: '45 Mins' },
                      { val: '60', label: '60 Mins' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.val}
                        onClick={() => setDuration(d.val)}
                        className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                          duration === d.val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Calendar Synchronization
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Google & Office 365 Connected
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Generated Self-Scheduling Link */}
              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Personalized Candidate Self-Service Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mockBookingLink}
                    className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Instant Communication Dispatch Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Dispatch Link Directly to Candidate:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`mailto:${candidateEmail}?subject=Interview%20Invitation:%20${encodeURIComponent(
                      jobTitle
                    )}&body=Dear%20${encodeURIComponent(
                      candidateName
                    )},%0A%0AWe%20are%20pleased%20to%20invite%20you%20for%20an%20interview.%20Please%20select%20your%20preferred%20time%20slot%20here:%0A${encodeURIComponent(
                      mockBookingLink
                    )}%0A%0ABest%20regards,%0A${encodeURIComponent(interviewer)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Send via Email
                  </a>

                  <a
                    href={`https://wa.me/${candidatePhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                      candidateName
                    )},%20congratulations%20on%20shortlisting%20for%20${encodeURIComponent(
                      jobTitle
                    )}!%20Please%20pick%20an%20interview%20time%20slot%20here:%20${encodeURIComponent(
                      mockBookingLink
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    Send via WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveTab('candidateView')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    Simulate Booking Flow
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Candidate Booking Simulator */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Candidate Self-Service Booking View
                </span>
                <h3 className="text-base font-bold">Pick an Interview Slot with {interviewer}</h3>
                <p className="text-xs text-indigo-100">
                  Position: <strong>{jobTitle}</strong> • Duration: <strong>{duration} minutes</strong> ({platform})
                </p>
              </div>

              {simConfirmed ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                      Interview Confirmed!
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      Scheduled for <strong>{selectedSimSlot}</strong> via <strong>{platform}</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Calendar invites dispatched to <strong>{candidateEmail}</strong> and <strong>{interviewer}</strong>.
                    </p>
                  </div>

                  {/* One-click Calendar Sync Buttons */}
                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        `Interview: ${jobTitle} - ${candidateName}`
                      )}&details=${encodeURIComponent(
                        `Technical conversation with ${interviewer}.\nPlatform: ${platform}`
                      )}&location=${encodeURIComponent(platform)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add to Google Cal</span>
                    </a>

                    <a
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(
                        `Interview: ${jobTitle} - ${candidateName}`
                      )}&body=${encodeURIComponent(
                        `Technical conversation with ${interviewer}.\nPlatform: ${platform}`
                      )}&location=${encodeURIComponent(platform)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Add to Outlook</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2 justify-center flex-wrap pt-2">
                    <Link
                      href="/dashboard"
                      onClick={onClose}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSimConfirmed(false);
                        onClose();
                      }}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs hover:bg-slate-300 transition-colors"
                    >
                      Done & Return
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Select an open slot that fits your schedule:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableSlots.map((slot, i) => {
                      const label = `${slot.date}, ${slot.time}`;
                      const isSelected = selectedSimSlot === label;
                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedSimSlot(label)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 ring-2 ring-indigo-500 text-indigo-950 dark:text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{slot.date}</span>
                            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {slot.time}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">{slot.zone}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateCandidateBooking}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Confirm Interview Time ({selectedSimSlot})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Synced with Google Calendar & Outlook. Automatic reminders sent 24h prior.</span>
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
