'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Send,
  Calendar,
  Download,
  CheckCircle2,
  CalendarCheck,
  ArrowLeft,
} from 'lucide-react';
import { emailService } from '@/services/emailService';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
  CalendarEvent,
} from '@/services/calendarService';

interface EmailDrafterModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  reviewerName: string;
  score: number;
}

export function EmailDrafterModal({
  isOpen,
  onClose,
  candidateName,
  candidateEmail,
  jobTitle,
  reviewerName,
  score,
}: EmailDrafterModalProps) {
  const [template, setTemplate] = useState<'interview' | 'info' | 'feedback'>('interview');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<string | null>(null);

  if (!isOpen) return null;

  // Next business day at 10:00 AM
  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 2);
  interviewDate.setHours(10, 0, 0, 0);

  const interviewEndDate = new Date(interviewDate);
  interviewEndDate.setMinutes(interviewEndDate.getMinutes() + 45);

  const calendarEvent: CalendarEvent = {
    title: `Interview: ${jobTitle} - ${candidateName}`,
    description: `Technical interview conversation between ${reviewerName} and ${candidateName} for the ${jobTitle} opening.\nMatch score: ${score}%\nVideo Room: https://meet.google.com/hrc-screen-live`,
    location: 'Google Meet (https://meet.google.com/hrc-screen-live)',
    startTime: interviewDate,
    endTime: interviewEndDate,
    organizerName: reviewerName,
    organizerEmail: 'hr@company.com',
    candidateName,
    candidateEmail,
  };

  const templates = {
    interview: {
      subject: `Interview Invitation: ${jobTitle} at HIRE~Agent Team`,
      body: `Hi ${candidateName.split(' ')[0]},

Thank you for applying for the ${jobTitle} position.

Our hiring team has thoroughly reviewed your resume and credentials (Match Rating: ${score}%), and we are very impressed with your background. We would love to invite you for an initial 45-minute technical conversation to discuss your experience and share more details about the role and our roadmap.

Proposed Time: ${interviewDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at 10:00 AM (45 Mins)
Video Room: https://meet.google.com/hrc-screen-live

A calendar invitation (.ics) is attached to this email. You can also accept directly using Google Calendar or Outlook.

Best regards,
${reviewerName}
Recruitment & Talent Team
HIRE~Agent`,
    },
    info: {
      subject: `Follow-up regarding your ${jobTitle} application`,
      body: `Hi ${candidateName.split(' ')[0]},

Thank you for your interest in the ${jobTitle} opening with our team.

We are currently reviewing your background and would appreciate it if you could share a few additional details or portfolio links regarding your recent work.

Looking forward to hearing from you.

Best regards,
${reviewerName}
HIRE~Agent`,
    },
    feedback: {
      subject: `Update on your application for ${jobTitle}`,
      body: `Hi ${candidateName.split(' ')[0]},

Thank you for taking the time to apply for the ${jobTitle} role and for your interest in our company.

After careful review by our hiring team, we have decided to move forward with other candidates whose skillsets align more closely with our immediate requirements for this specific opening.

We truly appreciate the time and effort you put into your application, and we wish you the very best in your job search.

Warm regards,
${reviewerName}
HIRE~Agent`,
    },
  };

  const currentEmail = templates[template];

  const handleCopy = () => {
    const fullText = `Subject: ${currentEmail.subject}\n\n${currentEmail.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRealEmail = async () => {
    setIsSending(true);
    setDeliveryResult(null);

    try {
      const res = await emailService.sendInterviewEmail({
        toEmail: candidateEmail,
        toName: candidateName,
        fromName: reviewerName,
        fromEmail: 'hr@company.com',
        subject: currentEmail.subject,
        body: currentEmail.body,
        calendarEvent: template === 'interview' ? calendarEvent : undefined,
      });

      if (res.success) {
        setDeliveryResult(`✅ Email sent to ${candidateEmail}! Delivery ID: ${res.messageId}`);
      }
    } catch {
      setDeliveryResult('Error sending email. Please try again or open in mail client.');
    } finally {
      setIsSending(false);
    }
  };

  const mailtoUrl = `mailto:${candidateEmail}?subject=${encodeURIComponent(currentEmail.subject)}&body=${encodeURIComponent(currentEmail.body)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-5 transition-colors max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Corporate Email & Calendar Dispatcher
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To: <span className="font-semibold text-slate-700 dark:text-slate-200">{candidateName}</span> ({candidateEmail})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none whitespace-nowrap">
          {(
            [
              { key: 'interview', label: 'Interview Invitation + Calendar Event' },
              { key: 'info', label: 'Request Additional Info' },
              { key: 'feedback', label: 'Polite Status Update' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setTemplate(tab.key);
                setDeliveryResult(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
                template === tab.key
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Sync Bar (for interview template) */}
        {template === 'interview' && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong className="font-semibold">Interactive Calendar Sync:</strong> Real .ics invite attached
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={generateGoogleCalendarUrl(calendarEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-50 transition-colors text-[11px]"
              >
                + Google Cal
              </a>

              <a
                href={generateOutlookCalendarUrl(calendarEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-50 transition-colors text-[11px]"
              >
                + Outlook
              </a>

              <button
                type="button"
                onClick={() => downloadICSFile(calendarEvent)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors text-[11px] flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>.ics File</span>
              </button>
            </div>
          </div>
        )}

        {/* Email Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Subject:</span>
            <p className="font-bold text-slate-900 dark:text-white">{currentEmail.subject}</p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/80 pt-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Message:</span>
            <pre className="font-sans text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {currentEmail.body}
            </pre>
          </div>
        </div>

        {/* Delivery Feedback Banner */}
        {deliveryResult && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{deliveryResult}</span>
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

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-slate-400">
            Automated corporate delivery with calendar sync
          </span>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mail Client</span>
            </a>

            <button
              type="button"
              disabled={isSending}
              onClick={handleSendRealEmail}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Real Email Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
