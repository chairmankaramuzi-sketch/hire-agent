'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Stamp,
  Sparkles,
  MapPin,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { offerService } from '@/services/offerService';
import { OfferPackage } from '@/types/offer';
import { User } from '@/types';

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  currentUser: User;
}

export function OfferLetterModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  currentUser,
}: OfferLetterModalProps) {
  const [offer, setOffer] = useState<OfferPackage>(() =>
    offerService.createOrUpdateOffer({
      applicationId,
      candidateName,
      candidateEmail,
      jobTitle,
      issuedBy: currentUser.name || 'MR. KALAMUZI (Executive Admin)',
    })
  );

  const [annualSalary, setAnnualSalary] = useState(offer.annualSalary);
  const [signingBonus, setSigningBonus] = useState(offer.signingBonus);
  const [equityShares, setEquityShares] = useState(offer.equityShares || '10,000 ISO Shares');
  const [startDate, setStartDate] = useState(offer.startDate);
  const [probationMonths, setProbationMonths] = useState(offer.probationMonths);
  const [reportingManager, setReportingManager] = useState(offer.reportingManager);
  const [workLocation, setWorkLocation] = useState(offer.workLocation);

  const [isIssuing, setIsIssuing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = offerService.getOfferByApplicationId(applicationId);
      if (existing) {
        setOffer(existing);
        setAnnualSalary(existing.annualSalary);
        setSigningBonus(existing.signingBonus);
        setEquityShares(existing.equityShares || '');
        setStartDate(existing.startDate);
        setProbationMonths(existing.probationMonths);
        setReportingManager(existing.reportingManager);
        setWorkLocation(existing.workLocation);
      } else {
        const created = offerService.createOrUpdateOffer({
          applicationId,
          candidateName,
          candidateEmail,
          jobTitle,
          issuedBy: currentUser.name || 'MR. KALAMUZI (Executive Admin)',
        });
        setOffer(created);
      }
    }
  }, [isOpen, applicationId, candidateName, candidateEmail, jobTitle, currentUser]);

  if (!isOpen) return null;

  const signingLink = offerService.generateSigningLink(offer.contractToken);

  const handleSaveChanges = () => {
    const updated = offerService.createOrUpdateOffer({
      applicationId,
      candidateName,
      candidateEmail,
      jobTitle,
      annualSalary: Number(annualSalary),
      signingBonus: Number(signingBonus),
      equityShares,
      startDate,
      probationMonths: Number(probationMonths),
      reportingManager,
      workLocation,
      issuedBy: currentUser.name || 'MR. KALAMUZI (Executive Admin)',
    });
    setOffer(updated);
    setFeedback('Offer terms updated in real-time!');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleIssueOffer = () => {
    setIsIssuing(true);
    handleSaveChanges();

    setTimeout(() => {
      const issued = offerService.issueOffer(
        applicationId,
        currentUser.name || 'MR. KALAMUZI (Executive Admin)'
      );
      setOffer(issued);
      setIsIssuing(false);
      setFeedback('✅ Official offer package issued! Digital signing link dispatched to candidate email.');
      setTimeout(() => setFeedback(null), 4000);
    }, 1000);
  };

  const handleCopySigningLink = () => {
    navigator.clipboard.writeText(signingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isSigned = offer.status === 'SIGNED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-indigo-50/40 to-white dark:from-emerald-950/40 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Automated Package Assembly
                </span>
                <span
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    isSigned
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : offer.status === 'ISSUED'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Status: {offer.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Executive Appointment Offer: {candidateName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="opacity-80 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Modal Body: Left = Terms Editor, Right = Live Letterhead Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 text-xs">
          {/* Left Column: Form Controls (5 cols) */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
                Customize Compensation &amp; Terms
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjust figures before dispatching the legal signing link.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Base Salary ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={annualSalary}
                    onChange={(e) => setAnnualSalary(Number(e.target.value))}
                    onBlur={handleSaveChanges}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Signing Bonus ($)
                  </label>
                  <input
                    type="number"
                    value={signingBonus}
                    onChange={(e) => setSigningBonus(Number(e.target.value))}
                    onBlur={handleSaveChanges}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Probation Period
                  </label>
                  <select
                    value={probationMonths}
                    onChange={(e) => {
                      setProbationMonths(Number(e.target.value));
                      handleSaveChanges();
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months (Standard)</option>
                    <option value={6}>6 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equity / Stock Options
                </label>
                <input
                  type="text"
                  value={equityShares}
                  onChange={(e) => setEquityShares(e.target.value)}
                  onBlur={handleSaveChanges}
                  placeholder="e.g. 10,000 ISO Shares"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleSaveChanges();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direct Reporting Line
                </label>
                <input
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  onBlur={handleSaveChanges}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Location &amp; Arrangement
                </label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  onBlur={handleSaveChanges}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Candidate Public Signing Link Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 mt-4">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Candidate Digital e-Signature Portal
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Share this secure link for the candidate to review &amp; sign directly on their smartphone or laptop:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={signingLink}
                  className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
                />
                <button
                  type="button"
                  onClick={handleCopySigningLink}
                  className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <a
                href={`/offers/${offer.contractToken}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
              >
                <span>Preview Candidate Signing Screen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Letterhead Preview (7 cols) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Live Document Preview (Official Executive Letterhead)
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 flex items-center gap-1 text-[11px]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>

            {/* Letterhead Preview Sheet */}
            <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-5 font-sans">
              <div className="border-b pb-4 flex items-center justify-between border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    TalentScreen Global Inc.
                  </span>
                  <p className="text-[10px] text-slate-400">Executive Appointment • Ref: {offer.offerId}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold">
                  CONFIDENTIAL
                </span>
              </div>

              <div className="text-[11px] space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Candidate:</strong> {candidateName} ({candidateEmail || 'sarah.jenkins@example.com'})
                </p>
                <p>
                  <strong>Role:</strong> {jobTitle} • <strong>Department:</strong> {offer.department}
                </p>
                <p className="pt-1">
                  We are delighted to formally offer you the position of <strong>{jobTitle}</strong>. Your compensation package includes an annual base salary of{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    ${annualSalary.toLocaleString()} {offer.currency}
                  </strong>
                  , a signing bonus of{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    ${signingBonus.toLocaleString()}
                  </strong>
                  , and equity participation of <strong>{equityShares}</strong>.
                </p>
                <p>
                  Your anticipated start date is <strong>{new Date(startDate).toLocaleDateString()}</strong> under the supervision of <strong>{reportingManager}</strong>.
                </p>
              </div>

              {/* Benefits Checklist in Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <span className="font-bold block text-slate-800 dark:text-slate-200">Executive Benefits Package:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 dark:text-slate-400">
                  {offer.benefits.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Signatures in Preview */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">Executive Sign-Off:</span>
                  <p className="font-serif italic text-sm text-indigo-900 dark:text-indigo-300">Mr. Kalamuzi</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">MR. KALAMUZI</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Authorized &amp; Sealed</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">Candidate Acceptance:</span>
                  {isSigned ? (
                    <div>
                      <p className="font-serif italic text-sm text-emerald-900 dark:text-emerald-300">
                        {offer.candidateSignature || candidateName}
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{candidateName}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Signed on {new Date(offer.signedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 text-amber-600 font-semibold italic">
                      Pending candidate digital signature
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Cryptographically Sealed Agreement</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleIssueOffer}
              disabled={isIssuing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all flex-1 sm:flex-initial"
            >
              {isIssuing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Issuing &amp; Dispatching Legal Offer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{offer.status === 'ISSUED' ? 'Re-Issue & Send Email Link' : 'Issue & Send Digital Signing Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
