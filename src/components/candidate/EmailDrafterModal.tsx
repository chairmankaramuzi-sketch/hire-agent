'use client';

import React, { useState } from 'react';
import { Mail, Check, Copy, ExternalLink, X, Sparkles } from 'lucide-react';

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

  if (!isOpen) return null;

  const templates = {
    interview: {
      subject: `Interview Invitation: ${jobTitle} at HIRE~Agent Team`,
      body: `Hi ${candidateName.split(' ')[0]},

Thank you for applying for the ${jobTitle} position.

Our hiring team has thoroughly reviewed your resume and credentials (Match Rating: ${score}%), and we are very impressed with your background. We would love to invite you for an initial 45-minute technical conversation to discuss your experience and share more details about the role and our roadmap.

Please let us know your availability for a call over the next few business days.

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

  const mailtoUrl = `mailto:${candidateEmail}?subject=${encodeURIComponent(currentEmail.subject)}&body=${encodeURIComponent(currentEmail.body)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Draft Candidate Outreach Email
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To: {candidateName} ({candidateEmail})
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
        <div className="flex gap-2">
          {(
            [
              { key: 'interview', label: 'Interview Invitation' },
              { key: 'info', label: 'Request Additional Info' },
              { key: 'feedback', label: 'Polite Status Update' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTemplate(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                template === tab.key
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email Preview Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Automatically personalized by HIRE~Agent AI
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Email'}
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Mail Client
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
