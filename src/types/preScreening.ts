export interface PreScreenQuestion {
  id: string;
  text: string;
  category: 'TECHNICAL' | 'SITUATIONAL' | 'PROBLEM_SOLVING';
  timeLimitSeconds: number;
}

export interface PreScreenAnswer {
  questionId: string;
  questionText: string;
  category: 'TECHNICAL' | 'SITUATIONAL' | 'PROBLEM_SOLVING';
  candidateResponse: string;
  score: number; // 0-100
  aiEvaluation: string;
  keyQuotes: string[];
}

export interface CandidatePreScreenResult {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  status: 'COMPLETED' | 'INVITATION_SENT' | 'PENDING';
  overallScore: number;
  technicalDepthScore: number;
  situationalScore: number;
  communicationScore: number;
  verdict: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'BORDERLINE' | 'UNSATISFACTORY';
  aiExecutiveSummary: string;
  strengths: string[];
  flags: string[];
  answers: PreScreenAnswer[];
  completedAt: string;
}
