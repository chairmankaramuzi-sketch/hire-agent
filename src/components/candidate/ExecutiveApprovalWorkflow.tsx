'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  AlertCircle,
  FileCheck,
  Send,
  UserCheck,
  Sparkles,
  ChevronRight,
  Stamp,
  Lock,
  FileText,
} from 'lucide-react';
import { approvalService } from '@/services/approvalService';
import { CandidateApprovalState, ApprovalStage } from '@/types/approval';
import { User } from '@/types';
import { OfferLetterModal } from './OfferLetterModal';

interface ExecutiveApprovalWorkflowProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  score: number;
  currentUser: User;
}

export function ExecutiveApprovalWorkflow({
  applicationId,
  candidateName,
  jobTitle,
  score,
  currentUser,
}: ExecutiveApprovalWorkflowProps) {
  const [approvalState, setApprovalState] = useState<CandidateApprovalState>(() =>
    approvalService.getApprovalState(applicationId)
  );
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  useEffect(() => {
    setApprovalState(approvalService.getApprovalState(applicationId));
    const unsubscribe = approvalService.subscribe(() => {
      setApprovalState(approvalService.getApprovalState(applicationId));
    });
    return () => unsubscribe();
  }, [applicationId]);

  const currentStage = approvalState.currentStage;

  const handleRecruiterSubmit = () => {
    setIsSubmitting(true);
    try {
      const res = approvalService.submitForDirectorApproval(
        applicationId,
        currentUser.name || 'RECRUITER',
        candidateName,
        comments || `Verified ${score}% criteria match. Candidate qualified for Director review.`
      );
      setApprovalState(res);
      setComments('');
      setFeedback('✅ Candidate proposed to HR Director (HR. DIRECTOR).');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDirectorApprove = () => {
    setIsSubmitting(true);
    try {
      const res = approvalService.directorApprove(
        applicationId,
        currentUser.name || 'HR. DIRECTOR',
        candidateName,
        comments || `Director review complete. Match confirmed at ${score}%. Advanced to Executive review.`
      );
      setApprovalState(res);
      setComments('');
      setFeedback('✅ HR Director approved. Advanced to Executive Sign-off (ADMIN).');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleExecutiveAuthorize = () => {
    setIsSubmitting(true);
    try {
      const res = approvalService.executiveAuthorize(
        applicationId,
        currentUser.name || 'ADMIN',
        candidateName,
        comments || 'Executive authorization signed. Board Pack reviewed and offer letter approved.'
      );
      setApprovalState(res);
      setComments('');
      setFeedback('🏆 Final Executive Authorization granted by ADMIN! Offer approved.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRequestRevisions = () => {
    if (!comments.trim()) {
      alert('Please enter notes explaining the revision required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = approvalService.requestRevisions(
        applicationId,
        currentUser.name || 'HR. DIRECTOR',
        candidateName,
        comments
      );
      setApprovalState(res);
      setComments('');
      setFeedback('⚠️ Revisions requested. Candidate placed in review queue.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const isStageComplete = (step: 1 | 2 | 3): boolean => {
    if (step === 1) {
      return (
        currentStage === 'RECRUITER_PROPOSED' ||
        currentStage === 'DIRECTOR_APPROVED' ||
        currentStage === 'EXECUTIVE_AUTHORIZED'
      );
    }
    if (step === 2) {
      return currentStage === 'DIRECTOR_APPROVED' || currentStage === 'EXECUTIVE_AUTHORIZED';
    }
    if (step === 3) {
      return currentStage === 'EXECUTIVE_AUTHORIZED';
    }
    return false;
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-5 sm:p-6 space-y-6 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Stage Executive Approval Workflow
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Enterprise Tier
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              3-tier hierarchy: Recruiter Proposal → HR Director Review → Executive Hiring Authorization
            </p>
          </div>
        </div>

        {/* Current Stage Badge */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              currentStage === 'EXECUTIVE_AUTHORIZED'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : currentStage === 'DIRECTOR_APPROVED'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : currentStage === 'RECRUITER_PROPOSED'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : currentStage === 'REVISION_REQUESTED'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {currentStage === 'EXECUTIVE_AUTHORIZED' && <Award className="w-4 h-4 text-emerald-600" />}
            {currentStage === 'DIRECTOR_APPROVED' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            {currentStage === 'RECRUITER_PROPOSED' && <Clock className="w-4 h-4 text-amber-600" />}
            <span>Stage: {currentStage.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* Visual 3-Stage Progression Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Recruiter Rose */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isStageComplete(1)
              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stage 1 • Recruiter
            </span>
            {isStageComplete(1) ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Proposed
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Pending Review</span>
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">RECRUITER</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Technical Recruiter
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            {approvalState.history.find((h) => h.stage === 'RECRUITER_PROPOSED') ? (
              <span className="italic">
                "{approvalState.history.find((h) => h.stage === 'RECRUITER_PROPOSED')?.comments}"
              </span>
            ) : (
              <span>Evaluates technical criteria match & verified experience.</span>
            )}
          </div>
        </div>

        {/* Step 2: HR Director Nahurira */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isStageComplete(2)
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stage 2 • HR Director
            </span>
            {isStageComplete(2) ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Awaiting Director</span>
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">HR. DIRECTOR</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Head of Talent & HR Director
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            {approvalState.history.find((h) => h.stage === 'DIRECTOR_APPROVED') ? (
              <span className="italic">
                "{approvalState.history.find((h) => h.stage === 'DIRECTOR_APPROVED')?.comments}"
              </span>
            ) : (
              <span>Reviews candidate score, salary expectations, and interview readiness.</span>
            )}
          </div>
        </div>

        {/* Step 3: Executive Kalamuzi */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isStageComplete(3)
              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stage 3 • Executive Admin
            </span>
            {isStageComplete(3) ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Award className="w-3.5 h-3.5" /> Authorized
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Final Sign-off</span>
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">ADMIN</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Executive Administrator & Director
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            {approvalState.history.find((h) => h.stage === 'EXECUTIVE_AUTHORIZED') ? (
              <div className="space-y-1">
                <span className="italic block">
                  "{approvalState.history.find((h) => h.stage === 'EXECUTIVE_AUTHORIZED')?.comments}"
                </span>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <Stamp className="w-3 h-3" />
                  {approvalState.history.find((h) => h.stage === 'EXECUTIVE_AUTHORIZED')?.signatureHash}
                </span>
              </div>
            ) : (
              <span>Final executive authorization for formal offer letter issuance.</span>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Instant Contract Generation: Appears when Mr. Kalamuzi grants Final Hiring Authorization */}
      {currentStage === 'EXECUTIVE_AUTHORIZED' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border-2 border-emerald-400 dark:border-emerald-600 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Final Hiring Authorization Granted!
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                  Contract Ready
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                The Executive Administrator (ADMIN) has granted final sign-off. Assemble the package and dispatch the official digital appointment contract.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOfferModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all shrink-0 hover:scale-105"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Official Offer Letter</span>
          </button>
        </div>
      )}

      {/* Action Workbench conditioned on role */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>Executive Review Notes & Comments:</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Will be digitally signed with your account)
            </span>
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Active Reviewer: <strong>{currentUser.name}</strong> ({currentUser.role})
          </span>
        </div>

        <input
          type="text"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="e.g., Criteria verified. Candidate demonstrated stellar architectural understanding..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          {/* Recruiter Rose Action */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRecruiterSubmit}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. Propose to HR Director (RECRUITER)</span>
          </button>

          {/* Director Nahurira Action */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDirectorApprove}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Director Interview Approval (HR. DIRECTOR)</span>
          </button>

          {/* Executive Kalamuzi Action */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExecutiveAuthorize}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 ml-auto"
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Executive Final Offer Sign-off (ADMIN)</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRequestRevisions}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
          >
            Request Revisions
          </button>
        </div>
      </div>

      {/* Offer Letter & Digital Contract Generator Modal */}
      <OfferLetterModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        applicationId={applicationId}
        candidateName={candidateName}
        jobTitle={jobTitle}
        currentUser={currentUser}
      />
    </div>
  );
}
