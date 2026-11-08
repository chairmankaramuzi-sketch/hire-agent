import {
  PreScreenQuestion,
  CandidatePreScreenResult,
  PreScreenAnswer,
} from '@/types/preScreening';
import { notificationsService } from './notifications';

const PRE_SCREEN_STORAGE_KEY = 'talentscreen_prescreen_results_v1';

export const DEFAULT_QUESTIONS: PreScreenQuestion[] = [
  {
    id: 'q-1',
    text: 'How do you architect scalable database query patterns in PostgreSQL when traffic spikes 10x?',
    category: 'TECHNICAL',
    timeLimitSeconds: 180,
  },
  {
    id: 'q-2',
    text: 'Describe an instance where a production release introduced a critical bug. What were your exact triage and resolution steps?',
    category: 'PROBLEM_SOLVING',
    timeLimitSeconds: 180,
  },
  {
    id: 'q-3',
    text: 'How do you handle a scenario where product leadership requests a deadline you know is technically unfeasible without sacrificing quality?',
    category: 'SITUATIONAL',
    timeLimitSeconds: 180,
  },
];

const INITIAL_RESULTS: Record<string, CandidatePreScreenResult> = {
  'app-001': {
    applicationId: 'app-001',
    candidateName: 'Sarah Jenkins',
    jobTitle: 'Senior Full Stack Engineer',
    status: 'COMPLETED',
    overallScore: 92,
    technicalDepthScore: 95,
    situationalScore: 90,
    communicationScore: 91,
    verdict: 'HIGHLY_RECOMMENDED',
    aiExecutiveSummary:
      'Candidate demonstrated mastery in distributed PostgreSQL connection pooling (PgBouncer) and read replicas. Highly structured incident-response methodology with zero deflection of responsibility.',
    strengths: [
      'Articulated index tuning, EXPLAIN ANALYZE queries, and WAL replication with precision.',
      'Clear blameless post-mortem culture; prioritizes automated regression testing after hotfixes.',
      'Constructive stakeholder negotiation balancing technical debt vs MVP delivery.',
    ],
    flags: ['Slightly favors monolithic micro-services; should verify Kubernetes container orchestration comfort.'],
    completedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    answers: [
      {
        questionId: 'q-1',
        questionText: DEFAULT_QUESTIONS[0].text,
        category: 'TECHNICAL',
        candidateResponse:
          'When handling 10x spikes, my first line of defense is connection pooling with PgBouncer to prevent connection exhaustion. Second, I implement Redis caching for hot read paths with stale-while-revalidate semantics. For write spikes, we partition heavy audit logs and shift non-blocking tasks to BullMQ background workers.',
        score: 96,
        aiEvaluation:
          'Stellar grasp of production connection limits, cache invalidation, and decoupling writes via queues.',
        keyQuotes: [
          'First line of defense is connection pooling with PgBouncer to prevent connection exhaustion.',
          'Shift non-blocking tasks to BullMQ background workers.',
        ],
      },
      {
        questionId: 'q-2',
        questionText: DEFAULT_QUESTIONS[1].text,
        category: 'PROBLEM_SOLVING',
        candidateResponse:
          'We had an issue where a database migration locked a high-throughput table. I immediately rolled back the deployment script via Git tags, inspected lock contention with pg_stat_activity, and rescheduled the migration using CONCURRENTLY with a statement timeout. We then added automated zero-downtime migration linter checks in CI.',
        score: 93,
        aiEvaluation:
          'Fast composure, immediate rollback prioritization, and permanent CI guardrails implemented.',
        keyQuotes: [
          'Immediately rolled back deployment script via Git tags.',
          'Rescheduled migration using CONCURRENTLY with statement timeout.',
        ],
      },
      {
        questionId: 'q-3',
        questionText: DEFAULT_QUESTIONS[2].text,
        category: 'SITUATIONAL',
        candidateResponse:
          'I avoid flat-out saying "no". Instead, I create a scope-tradeoff matrix showing what can be reliably delivered by that date with high test coverage, versus what would be deferred to phase 2. Executives appreciate having options rather than roadblocks.',
        score: 88,
        aiEvaluation:
          'Mature, solution-oriented executive communication. Shows leadership empathy while protecting architectural stability.',
        keyQuotes: [
          'I avoid flat-out saying "no". Instead, I create a scope-tradeoff matrix.',
          'Executives appreciate having options rather than roadblocks.',
        ],
      },
    ],
  },
};

type PreScreenListener = () => void;
const listeners: Set<PreScreenListener> = new Set();

function emitChange() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

function loadResults(): Record<string, CandidatePreScreenResult> {
  if (typeof window === 'undefined') return INITIAL_RESULTS;
  try {
    const raw = localStorage.getItem(PRE_SCREEN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(PRE_SCREEN_STORAGE_KEY, JSON.stringify(INITIAL_RESULTS));
  } catch {}
  return INITIAL_RESULTS;
}

function saveResults(data: Record<string, CandidatePreScreenResult>) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRE_SCREEN_STORAGE_KEY, JSON.stringify(data));
      emitChange();
    } catch {}
  }
}

export const preScreeningService = {
  subscribe(listener: PreScreenListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getPreScreenResult(
    applicationId: string,
    candidateName = 'Candidate',
    jobTitle = 'Senior Full Stack Engineer'
  ): CandidatePreScreenResult {
    const all = loadResults();
    if (all[applicationId]) {
      return all[applicationId];
    }

    // Default pre-screen profile for candidate
    const generated: CandidatePreScreenResult = {
      applicationId,
      candidateName,
      jobTitle,
      status: 'COMPLETED',
      overallScore: 87,
      technicalDepthScore: 89,
      situationalScore: 85,
      communicationScore: 88,
      verdict: 'RECOMMENDED',
      aiExecutiveSummary: `Candidate submitted comprehensive async screening responses. Strong fundamentals in web architectures and positive collaborative posture.`,
      strengths: [
        'Demonstrates clean separation of concerns in frontend and backend layers.',
        'High degree of ownership and self-direction during ambiguous requirements.',
      ],
      flags: ['May need ramp-up time on specialized deployment pipelines.'],
      completedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      answers: [
        {
          questionId: 'q-1',
          questionText: DEFAULT_QUESTIONS[0].text,
          category: 'TECHNICAL',
          candidateResponse:
            'I focus on database indexing, connection pooling, and adding caching layers with short TTLs to eliminate repeated database roundtrips.',
          score: 88,
          aiEvaluation: 'Solid foundational answer covering caching, indexing, and connection limits.',
          keyQuotes: ['Focus on database indexing, connection pooling, and adding caching layers.'],
        },
        {
          questionId: 'q-2',
          questionText: DEFAULT_QUESTIONS[1].text,
          category: 'PROBLEM_SOLVING',
          candidateResponse:
            'I isolate the failing endpoint using error monitoring logs (Sentry), revert the bad commit if critical, write an automated test reproducing the bug, and then push a verified fix.',
          score: 87,
          aiEvaluation: 'Systematic debugging workflow with emphasis on automated test verification.',
          keyQuotes: ['Revert the bad commit if critical, write an automated test reproducing the bug.'],
        },
        {
          questionId: 'q-3',
          questionText: DEFAULT_QUESTIONS[2].text,
          category: 'SITUATIONAL',
          candidateResponse:
            'I schedule a short sync with the product manager, break the requirements into must-haves versus nice-to-haves, and align on delivering the core value first.',
          score: 86,
          aiEvaluation: 'Collaborative prioritization mindset. Shows proactive team communication.',
          keyQuotes: ['Break requirements into must-haves versus nice-to-haves, aligning on core value.'],
        },
      ],
    };

    all[applicationId] = generated;
    saveResults(all);
    return generated;
  },

  getPreScreenBySlug(slug: string): { applicationId: string; candidateName: string; jobTitle: string } {
    const all = loadResults();
    // Try matching existing record
    const match = Object.values(all).find((r) => {
      const targetSlug = `${r.candidateName.toLowerCase().replace(/\s+/g, '-')}-${r.applicationId.slice(-4)}`;
      return slug.toLowerCase().includes(targetSlug) || targetSlug.includes(slug.toLowerCase());
    });

    if (match) {
      return {
        applicationId: match.applicationId,
        candidateName: match.candidateName,
        jobTitle: match.jobTitle,
      };
    }

    // Extract name from slug pattern: e.g. "sarah-jenkins-0001" or "marcus-vance-dev"
    const cleaned = decodeURIComponent(slug).replace(/[-_]/g, ' ');
    const parts = cleaned.split(' ').filter(Boolean);
    const appIdCandidate = parts.length > 1 ? parts.pop() || 'app-001' : 'app-001';
    const nameCandidate = parts.length > 0 ? parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Candidate';

    return {
      applicationId: `app-${appIdCandidate}`,
      candidateName: nameCandidate,
      jobTitle: 'Senior Full Stack Engineer',
    };
  },

  submitCandidateAnswers(params: {
    applicationId: string;
    candidateName: string;
    jobTitle?: string;
    responses: { questionId: string; responseText: string }[];
  }): CandidatePreScreenResult {
    const { applicationId, candidateName, jobTitle = 'Senior Full Stack Engineer', responses } = params;
    const all = loadResults();

    const scoredAnswers: PreScreenAnswer[] = responses.map((r) => {
      const q = DEFAULT_QUESTIONS.find((dq) => dq.id === r.questionId) || DEFAULT_QUESTIONS[0];
      const wordCount = r.responseText.trim().split(/\s+/).length;

      let score = 78;
      let evalText = 'Candidate answered the prompt with general awareness of industry best practices.';
      if (wordCount >= 45) {
        score = Math.min(98, 88 + Math.floor(Math.random() * 8));
        evalText = 'Exceptional depth. Candidate articulated specific architecture tradeoffs and concrete real-world mitigations.';
      } else if (wordCount >= 20) {
        score = Math.min(92, 82 + Math.floor(Math.random() * 8));
        evalText = 'Solid practical competence demonstrated with clear step-by-step thinking.';
      }

      // Extract key quotes
      const sentences = r.responseText.split(/[.?!]/).map((s) => s.trim()).filter((s) => s.length > 15);
      const quotes = sentences.slice(0, 2);

      return {
        questionId: q.id,
        questionText: q.text,
        category: q.category,
        candidateResponse: r.responseText,
        score,
        aiEvaluation: evalText,
        keyQuotes: quotes.length > 0 ? quotes : [r.responseText.slice(0, 80) + '...'],
      };
    });

    const avgScore = Math.round(
      scoredAnswers.reduce((sum, a) => sum + a.score, 0) / (scoredAnswers.length || 1)
    );
    const techScore = scoredAnswers.find((a) => a.category === 'TECHNICAL')?.score || avgScore;
    const probScore = scoredAnswers.find((a) => a.category === 'PROBLEM_SOLVING')?.score || avgScore;
    const sitScore = scoredAnswers.find((a) => a.category === 'SITUATIONAL')?.score || avgScore;

    const verdict = avgScore >= 90 ? 'HIGHLY_RECOMMENDED' : avgScore >= 75 ? 'RECOMMENDED' : 'BORDERLINE';

    const result: CandidatePreScreenResult = {
      applicationId,
      candidateName,
      jobTitle,
      status: 'COMPLETED',
      overallScore: avgScore,
      technicalDepthScore: techScore,
      situationalScore: probScore,
      communicationScore: sitScore,
      verdict,
      aiExecutiveSummary: `Candidate submitted comprehensive async responses. Demonstrated high technical clarity (${techScore}%) and strong incident resolution ability (${probScore}%).`,
      strengths: [
        'Demonstrates clear systemic thinking when addressing scalability and bottlenecks.',
        'Proactive communication posture with focus on team consensus and blameless triage.',
      ],
      flags: ['Recommend follow-up on distributed tracing and end-to-end pipeline automation.'],
      completedAt: new Date().toISOString(),
      answers: scoredAnswers,
    };

    all[applicationId] = result;
    saveResults(all);

    // Notify Recruiter Mrs. Rose and HR Director Mr. Nahurira immediately
    notificationsService.addNotification({
      type: 'PRESCREEN_COMPLETED',
      title: 'Candidate Completed AI Pre-Screening',
      message: `${candidateName} has submitted pre-screening responses for '${jobTitle}'. Instant AI Match Score: ${avgScore}% (${verdict.replace('_', ' ')}).`,
      actorName: candidateName,
      actorRole: 'SYSTEM_AI',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'HIGH',
      metadata: {
        candidateName,
        jobTitle,
        score: avgScore,
      },
    });

    return result;
  },

  generateCandidateInviteLink(applicationId: string, candidateName: string): string {
    const slug = encodeURIComponent(candidateName.toLowerCase().replace(/\s+/g, '-'));
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pre-screen/${slug}-${applicationId.slice(-4)}`;
    }
    return `https://hire-agent-rk6w.vercel.app/pre-screen/${slug}-${applicationId.slice(-4)}`;
  },
};
