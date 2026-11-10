'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Smartphone,
  Scale,
  DollarSign,
  Sparkles,
  Users,
  Mic,
  ShieldCheck,
  Award,
  FileSignature,
  Volume2,
  Info,
} from 'lucide-react';

interface PresentationTourBannerProps {
  onOpenPhoneTest: (tab?: 'prescreen' | 'offer') => void;
  onOpenFairnessAudit: () => void;
  onOpenRoiCalculator?: () => void;
}

interface TourStep {
  id: number;
  title: string;
  shortLabel: string;
  route?: string;
  icon: any;
  cueTitle: string;
  cueScript: string;
  quickAction?: {
    label: string;
    action: () => void;
  };
}

export function PresentationTourBanner({
  onOpenPhoneTest,
  onOpenFairnessAudit,
  onOpenRoiCalculator,
}: PresentationTourBannerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showCueScript, setShowCueScript] = useState(true);

  const steps: TourStep[] = [
    {
      id: 1,
      title: 'Batch CV Screening & Scoring',
      shortLabel: '1. AI Screening',
      route: '/applications',
      icon: Users,
      cueTitle: 'Opening Pitch & Ingestion Speed',
      cueScript:
        '"Judges, traditional recruitment wastes 25 hours per job filtering resumes. With HIRE~Agent, 30 candidate CVs are processed in 3 seconds. Every qualification is deterministically matched against mandatory and weighted criteria."',
      quickAction: {
        label: 'View Shortlisted Candidates',
        action: () => router.push('/applications?status=SHORTLISTED'),
      },
    },
    {
      id: 2,
      title: 'Candidate Voice Pre-Screening',
      shortLabel: '2. Voice Pre-Screen',
      icon: Mic,
      cueTitle: 'Zero-Login Candidate Experience',
      cueScript:
        '"Recruiters no longer waste 7.5 hours on 15-minute phone screens. Candidates receive a secure mobile link, record their voice or video, and our AI grades Technical and Communication skills within 10 seconds."',
      quickAction: {
        label: '📱 Show Scannable QR Code',
        action: () => onOpenPhoneTest('prescreen'),
      },
    },
    {
      id: 3,
      title: '3-Tier Executive Approval Hierarchy',
      shortLabel: '3. Executive Hierarchy',
      route: '/applications',
      icon: ShieldCheck,
      cueTitle: 'Enterprise Human-in-the-Loop Governance',
      cueScript:
        '"AI advises, but executives decide. We enforce an institutional 3-tier workflow: Recruiter proposes -> HR Director reviews -> Admin (Mr. Kalamuzi) grants final hiring authorization with cryptographic audit logging."',
      quickAction: {
        label: 'Inspect Executive Workflow',
        action: () => router.push('/applications'),
      },
    },
    {
      id: 4,
      title: 'Official Offer Letter & Mobile Finger e-Sign',
      shortLabel: '4. Instant Contract',
      icon: FileSignature,
      cueTitle: 'Closing the Candidate Instantly',
      cueScript:
        '"The second Admin grants authorization, a branded executive offer letter is assembled. Candidates review and sign with their finger directly on their phone screen, sealing a legally binding contract."',
      quickAction: {
        label: '✍️ Test Finger Sign on Phone',
        action: () => onOpenPhoneTest('offer'),
      },
    },
    {
      id: 5,
      title: 'Algorithmic Fairness Audit & Board ROI',
      shortLabel: '5. Fairness & ROI',
      icon: Scale,
      cueTitle: 'Compliance & Boardroom Economics',
      cueScript:
        '"We solve the two biggest executive questions: First, our AI is audited 100% bias-free under EEOC and EU AI Act standards. Second, we slash hiring costs by 92%, saving $115,000 annually per 30 hires."',
      quickAction: {
        label: '🛡️ View Compliance Certificate',
        action: onOpenFairnessAudit,
      },
    },
  ];

  const currentStep = steps[currentStepIdx];
  const StepIcon = currentStep.icon;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer border border-white/20"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>🎬 Start Presentation Tour</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 inset-x-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border-b border-indigo-500/40 shadow-2xl animate-in slide-in-from-top-4 duration-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-2.5">
        
        {/* Top Control Bar: Step Pills & Dismiss */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600/80 text-[11px] font-extrabold uppercase tracking-wider text-indigo-100 border border-indigo-400/40">
              <Play className="w-3 h-3 fill-white" />
              Demo Story Mode
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Step {currentStep.id} of {steps.length}
            </span>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {steps.map((st, idx) => {
              const isActive = idx === currentStepIdx;
              const isPast = idx < currentStepIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    if (st.route) router.push(st.route);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                      : isPast
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                  <span>{st.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCueScript(!showCueScript)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700"
              title="Toggle Speaker Script"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">{showCueScript ? 'Hide Script' : 'Speaker Script'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close presentation tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Step Action Ribbon & Speaker Cue */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/40 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>{currentStep.title}</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {currentStep.cueTitle}
              </p>
            </div>
          </div>

          {/* Quick Action Button & Navigation Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {currentStep.quickAction && (
              <button
                type="button"
                onClick={currentStep.quickAction.action}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>{currentStep.quickAction.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={() => {
                const prev = Math.max(0, currentStepIdx - 1);
                setCurrentStepIdx(prev);
                if (steps[prev].route) router.push(steps[prev].route!);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentStepIdx === steps.length - 1}
              onClick={() => {
                const next = Math.min(steps.length - 1, currentStepIdx + 1);
                setCurrentStepIdx(next);
                if (steps[next].route) router.push(steps[next].route!);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Speaker Cue Card */}
        {showCueScript && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                Recommended 20-Second Presentation Pitch:
              </span>
              <p className="italic text-slate-200 leading-snug">
                {currentStep.cueScript}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
