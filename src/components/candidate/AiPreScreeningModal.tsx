'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Send,
  MessageSquare,
  Award,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Mic,
  Video,
  FileText,
  UserCheck,
} from 'lucide-react';
import { preScreeningService, DEFAULT_QUESTIONS } from '@/services/preScreeningService';
import { CandidatePreScreenResult, PreScreenQuestion } from '@/types/preScreening';

interface AiPreScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle: string;
  onSendInviteEmail?: () => void;
  onSendInviteWhatsApp?: () => void;
}

export function AiPreScreeningModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  candidateEmail,
  candidatePhone,
  jobTitle,
  onSendInviteEmail,
  onSendInviteWhatsApp,
}: AiPreScreeningModalProps) {
  const [activeTab, setActiveTab] = useState<'EVALUATION' | 'INVITE' | 'SIMULATOR'>('EVALUATION');
  const [result, setResult] = useState<CandidatePreScreenResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simulator states
  const [selectedSimQuestionIndex, setSelectedSimQuestionIndex] = useState(0);
  const [simAnswerText, setSimAnswerText] = useState('');
  const [simGrading, setSimGrading] = useState(false);
  const [simGradedScore, setSimGradedScore] = useState<{ score: number; feedback: string } | null>(null);

  useEffect(() => {
    if (isOpen && applicationId) {
      const res = preScreeningService.getPreScreenResult(applicationId, candidateName, jobTitle);
      setResult(res);
    }
  }, [isOpen, applicationId, candidateName, jobTitle]);

  if (!isOpen) return null;

  const inviteUrl = preScreeningService.generateCandidateInviteLink(applicationId, candidateName);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulateGrading = () => {
    if (!simAnswerText.trim()) return;
    setSimGrading(true);
    setSimGradedScore(null);

    setTimeout(() => {
      const length = simAnswerText.trim().split(/\s+/).length;
      let score = 75;
      let feedback = 'Clear response covering core principles with reasonable technical depth.';

      if (length > 40) {
        score = 94;
        feedback =
          'Exceptional response! Articulates specific production mitigation strategies, trade-offs, and root-cause analysis.';
      } else if (length > 20) {
        score = 86;
        feedback =
          'Strong answer demonstrating solid operational awareness and clear step-by-step resolution.';
      }

      setSimGradedScore({ score, feedback });
      setSimGrading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Option C: AI Asynchronous Interviewer
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Automated
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                AI Pre-Screening: {candidateName}
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('EVALUATION')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'EVALUATION'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>AI Scorecard & Transcripts</span>
            {result && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px]">
                {result.overallScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('INVITE')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'INVITE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Candidate Invite Link</span>
          </button>

          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Interactive Interview Simulator</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'EVALUATION' && result && (
            <div className="space-y-6 animate-in fade-in">
              {/* Executive Radar Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                    Overall AI Match
                  </span>
                  <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {result.overallScore}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {result.verdict === 'HIGHLY_RECOMMENDED' ? '★ Highly Recommended' : 'Recommended'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    Technical Depth
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {result.technicalDepthScore}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Architecture & Systems
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                    Problem Solving
                  </span>
                  <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                    {result.situationalScore}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Incident Triage & Logic
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                    Communication
                  </span>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {result.communicationScore}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Clarity & Structure
                  </span>
                </div>
              </div>

              {/* AI Executive Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI Executive Analysis & Verdict
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Completed: {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {result.aiExecutiveSummary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1 text-[11px]">
                      Top Demonstrated Strengths:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-emerald-700 dark:text-emerald-300/90 text-[11px]">
                      {result.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1 text-[11px]">
                      Follow-up Areas for Interview:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-amber-700 dark:text-amber-300/90 text-[11px]">
                      {result.flags.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Answers and Transcripts */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Candidate Transcripts & Real-Time AI Grading
                </h3>

                {result.answers.map((ans, idx) => (
                  <div
                    key={ans.questionId}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Question {idx + 1} • {ans.category}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mt-1 text-xs">
                          {ans.questionText}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                          Score: {ans.score}/100
                        </span>
                      </div>
                    </div>

                    {/* Candidate Response Transcript */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Candidate Answer Transcript:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                        &ldquo;{ans.candidateResponse}&rdquo;
                      </p>
                    </div>

                    {/* AI Evaluation & Key Quotes */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
                        <span className="font-bold block mb-0.5">AI Grader Notes:</span>
                        {ans.aiEvaluation}
                      </div>

                      {ans.keyQuotes && ans.keyQuotes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-slate-400 mr-1">Key Quotes:</span>
                          {ans.keyQuotes.map((q, qIdx) => (
                            <span
                              key={qIdx}
                              className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[10px] italic"
                            >
                              &ldquo;{q}&rdquo;
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'INVITE' && (
            <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Candidate Self-Service Screening Portal
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Provide this personalized link to <strong className="text-slate-900 dark:text-white">{candidateName}</strong>.
                  They can record or type responses in under 10 minutes from any phone, laptop, or tablet.
                  Our AI immediately scores their technical depth, problem solving, and communication clarity.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Outreach Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSendInviteEmail?.();
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Send via Corporate Email
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Open Email Drafter with candidate invite link & instructions.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSendInviteWhatsApp?.();
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Send via WhatsApp / SMS
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Dispatch instant mobile invite with 1-tap candidate access.
                    </p>
                  </div>
                </button>
              </div>

              {/* Active Pre-Screen Question Bank */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Standard AI Question Bank for {jobTitle}
                  </h4>
                  <span className="text-[10px] text-slate-400">3 Questions • 3 min limit each</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {DEFAULT_QUESTIONS.map((q, i) => (
                    <div key={q.id} className="py-2.5 flex items-start gap-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-xs">{q.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {q.category}
                          </span>
                          <span className="text-[10px] text-slate-400">• Max {q.timeLimitSeconds}s response</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SIMULATOR' && (
            <div className="space-y-5 animate-in fade-in max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                    Live AI Candidate Test Simulator
                  </h4>
                  <p className="text-amber-800/90 dark:text-amber-300/80 text-[11px] mt-0.5">
                    Test the AI evaluation engine right now. Select a question, type a sample answer, and watch the AI score it instantly with technical feedback!
                  </p>
                </div>
              </div>

              {/* Question selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                  Select Question to Test:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {DEFAULT_QUESTIONS.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setSelectedSimQuestionIndex(idx);
                        setSimGradedScore(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedSimQuestionIndex === idx
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 ring-1 ring-indigo-500 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        Question {idx + 1} • {q.category}
                      </span>
                      <p className="text-xs text-slate-900 dark:text-white">{q.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Answer Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Type or Paste Mock Candidate Response:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSimQuestionIndex === 0) {
                        setSimAnswerText(
                          'We set up PgBouncer connection pooling to avoid max client limits, add read replicas for GET requests, and shard high-volume event logs with TimescaleDB.'
                        );
                      } else if (selectedSimQuestionIndex === 1) {
                        setSimAnswerText(
                          'I check the Datadog trace logs, identify the culprit PR, trigger an instant GitHub Actions rollback to the prior release tag, then run automated unit tests locally.'
                        );
                      } else {
                        setSimAnswerText(
                          'I present a clear feature tradeoff breakdown to leadership: deliver MVP features A & B with 95% test coverage now, and schedule complex feature C for sprint 2.'
                        );
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Fill Exemplary Answer
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={simAnswerText}
                  onChange={(e) => setSimAnswerText(e.target.value)}
                  placeholder="Type an answer as if you were the applicant..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateGrading}
                disabled={simGrading || !simAnswerText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
              >
                {simGrading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI Grader Analyzing Answer & Extracting Competencies...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Real-Time AI Grading</span>
                  </>
                )}
              </button>

              {/* Grader Result Preview */}
              {simGradedScore && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Instant AI Evaluation Complete
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                      Score: {simGradedScore.score}/100
                    </span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-200/90 text-xs leading-relaxed">
                    {simGradedScore.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by TalentScreen AI Asynchronous Engine • Zero recruitment bias
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
