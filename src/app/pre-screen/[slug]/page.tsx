'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Square,
  Play,
  FileText,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Send,
  Zap,
  Award,
  AlertCircle,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { preScreeningService, DEFAULT_QUESTIONS } from '@/services/preScreeningService';

export default function CandidatePreScreenPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const unwrapped = 'then' in params ? use(params as Promise<{ slug: string }>) : params;
  const slug = unwrapped.slug;

  const [candidateInfo, setCandidateInfo] = useState<{
    applicationId: string;
    candidateName: string;
    jobTitle: string;
  }>({
    applicationId: 'app-001',
    candidateName: 'Candidate',
    jobTitle: 'Senior Full Stack Engineer',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'q-1': '',
    'q-2': '',
    'q-3': '',
  });

  // Audio recording simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeInputMode, setActiveInputMode] = useState<'text' | 'voice'>('text');

  // Submission & AI grading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgressStep, setSubmitProgressStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submissionReference, setSubmissionReference] = useState('');

  useEffect(() => {
    if (slug) {
      const info = preScreeningService.getPreScreenBySlug(slug);
      setCandidateInfo(info);
    }
  }, [slug]);

  // Voice recording simulation timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const currentQuestion = DEFAULT_QUESTIONS[currentStep];

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Populate simulated audio transcript if empty
    const currentQId = currentQuestion.id;
    if (!answers[currentQId]) {
      let sample = '';
      if (currentQId === 'q-1') {
        sample =
          'To scale PostgreSQL queries under 10x traffic spikes, I prioritize connection pooling with PgBouncer, add read replicas for analytical read queries, index frequently filtered columns using B-Tree and BRIN indexes, and offload cache-friendly queries to Redis.';
      } else if (currentQId === 'q-2') {
        sample =
          'When a critical bug hit production, I checked our Sentry telemetry, quickly identified the offending migration, executed an automated rollback to the prior release tag, and added regression unit tests to prevent recurrence.';
      } else {
        sample =
          'When facing an unfeasible deadline, I create an objective trade-off matrix showing core MVP deliverables versus nice-to-haves, ensuring we protect code quality and testing standards while still delivering executive value.';
      }
      setAnswers((prev) => ({ ...prev, [currentQId]: sample }));
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    setSubmitProgressStep(1);

    setTimeout(() => {
      setSubmitProgressStep(2);
    }, 1200);

    setTimeout(() => {
      setSubmitProgressStep(3);
    }, 2400);

    setTimeout(() => {
      const responsesPayload = DEFAULT_QUESTIONS.map((q) => ({
        questionId: q.id,
        responseText:
          answers[q.id]?.trim() ||
          'Candidate completed pre-screening and demonstrated solid working knowledge of engineering principles.',
      }));

      preScreeningService.submitCandidateAnswers({
        applicationId: candidateInfo.applicationId,
        candidateName: candidateInfo.candidateName,
        jobTitle: candidateInfo.jobTitle,
        responses: responsesPayload,
      });

      setSubmissionReference(`TS-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitting(false);
      setIsCompleted(true);
    }, 3600);
  };

  const currentAnswer = answers[currentQuestion?.id] || '';
  const currentWordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-10 flex flex-col justify-between transition-colors">
      {/* Brand Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              TalentScreen <span className="text-indigo-600 dark:text-indigo-400">AI Assessment</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-Bias Asynchronous Candidate Interview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Candidate Session
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-3xl w-full mx-auto my-8 flex-1 flex flex-col justify-center">
        {isCompleted ? (
          /* Congratulatory Completion View */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Evaluation Received & Scored
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Thank You, {candidateInfo.candidateName}!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                Your pre-screening responses for the <strong className="text-slate-900 dark:text-white">{candidateInfo.jobTitle}</strong> position have been recorded, evaluated by our AI, and delivered straight to the Executive Hiring Team (Mrs. Rose & Mr. Nahurira).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Assessment Reference ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{submissionReference}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Completed At:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Next Step:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">HR Director Review</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              You may safely close this browser window. You will receive an email update regarding interview scheduling.
            </p>
          </div>
        ) : isSubmitting ? (
          /* Live AI Evaluation Progress Screen */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-12 text-center space-y-8 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Zap className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                AI Engine Evaluating Your Responses...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Processing your answers against role criteria with zero human bias.
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3 max-w-md mx-auto text-left text-xs">
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  submitProgressStep >= 1
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    submitProgressStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  1
                </div>
                <span>Validating response integrity & transcripts</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  submitProgressStep >= 2
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    submitProgressStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  2
                </div>
                <span>Analyzing technical depth & query architecture</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  submitProgressStep >= 3
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    submitProgressStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  3
                </div>
                <span>Calibrating communication clarity & incident composure</span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Question Step Card */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Question Header & Stepper */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Question {currentStep + 1} of {DEFAULT_QUESTIONS.length}
                </span>
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Max ~{currentQuestion.timeLimitSeconds}s per question
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / DEFAULT_QUESTIONS.length) * 100}%` }}
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {currentQuestion.category} COMPETENCY
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-1">
                  {currentQuestion.text}
                </h2>
              </div>
            </div>

            {/* Answer Input Area */}
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('text')}
                    className={`px-3 py-1.5 rounded-xl border transition-all ${
                      activeInputMode === 'text'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Type Written Answer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('voice')}
                    className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                      activeInputMode === 'voice'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Audio Response</span>
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  {currentWordCount} words
                </span>
              </div>

              {/* Voice recording UI */}
              {activeInputMode === 'voice' && (
                <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-center space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                      }`}
                    >
                      {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                    </button>
                  </div>

                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {isRecording ? `Recording audio answer... (${recordingSeconds}s)` : 'Click microphone to record your voice answer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isRecording ? 'Speak clearly. Click stop when finished to auto-transcribe.' : 'Voice answers are automatically converted into text and evaluated.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Response Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Response:
                </label>
                <textarea
                  rows={6}
                  value={currentAnswer}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: e.target.value,
                    }))
                  }
                  placeholder="Explain your approach, technical tradeoffs, and specific actions..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed transition-colors"
                />
              </div>

              {/* Helpful Exemplary Guidance Pill */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Tip: Provide concrete technical examples and describe your rationale.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    let example = '';
                    if (currentQuestion.id === 'q-1') {
                      example =
                        'When handling 10x spikes, my first line of defense is connection pooling with PgBouncer to prevent connection exhaustion. Second, I implement Redis caching for hot read paths. For write spikes, we partition heavy audit logs and shift non-blocking tasks to BullMQ background workers.';
                    } else if (currentQuestion.id === 'q-2') {
                      example =
                        'We had an issue where a database migration locked a high-throughput table. I immediately rolled back the deployment script via Git tags, inspected lock contention with pg_stat_activity, and rescheduled the migration using CONCURRENTLY with a statement timeout.';
                    } else {
                      example =
                        'I avoid flat-out saying "no". Instead, I create a scope-tradeoff matrix showing what can be reliably delivered by that date with high test coverage, versus what would be deferred to phase 2. Executives appreciate having options rather than roadblocks.';
                    }
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: example }));
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Sample Response
                </button>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep < DEFAULT_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(DEFAULT_QUESTIONS.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAssessment}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Pre-Screening Assessment</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-3xl w-full mx-auto text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
        TalentScreen Enterprise Autonomous Screening • Encrypted &amp; Confidential
      </footer>
    </div>
  );
}
