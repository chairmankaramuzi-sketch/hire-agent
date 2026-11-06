'use client';

import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Application, Job } from '@/types';

interface InterviewQuestionGeneratorProps {
  candidateName: string;
  jobTitle: string;
  missingOrBorderlineCriteria?: string[];
  skills?: string[];
}

export function InterviewQuestionGenerator({
  candidateName,
  jobTitle,
  missingOrBorderlineCriteria = [],
  skills = [],
}: InterviewQuestionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Generate dynamic, realistic questions tailored to candidate
  const questions = [
    {
      question: `Can you walk us through an architectural challenge you faced when scaling systems in ${jobTitle}, specifically regarding database performance and state consistency?`,
      intent: 'Tests real depth of production systems experience versus theoretical knowledge.',
      lookFor: 'Look for mentions of indexing, read replicas, transaction isolation, or caching patterns.',
    },
    {
      question: missingOrBorderlineCriteria.length > 0
        ? `In your resume, you have strong background in ${skills.slice(0, 2).join(' and ') || 'modern engineering'}. How would you bridge your experience to meet our requirement for ${missingOrBorderlineCriteria[0]}?`
        : `How do you approach writing automated integration and end-to-end tests when shipping fast-moving features?`,
      intent: 'Evaluates adaptability and proactive self-learning on missing stack requirements.',
      lookFor: 'Honesty about gaps, clear plan for ramp-up, and prior examples of quick skill acquisition.',
    },
    {
      question: `Tell us about a time when you had to disagree with a technical decision made by a team lead or product manager. How did you present your counter-evidence and reach consensus?`,
      intent: 'Assesses cross-functional communication and leadership alignment without ego.',
      lookFor: 'Data-driven persuasion, professional maturity, and focus on company goals.',
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 p-5 shadow-sm space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI-Tailored Interview Questions
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Co-Pilot
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customized prompts to verify {candidateName.split(' ')[0]}&apos;s background in {jobTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-1">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    Q{idx + 1}.
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(q.question, idx)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 shrink-0"
                  title="Copy question"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Target Capability:</span>
                  <p className="text-slate-700 dark:text-slate-300">{q.intent}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Green Flags:</span>
                  <p className="text-slate-700 dark:text-slate-300">{q.lookFor}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
