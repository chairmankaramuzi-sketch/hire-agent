import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { hashPassword } from '@/lib/password';
import { evaluateScreening, CriterionEvaluationInput, FactEvidenceInput } from '@/lib/screening/engine';
import { allSeedUsers, seedStaffUsers, SeedUser } from '@/lib/data/seedUsers';
import { sample30Candidates, SampleCandidate } from '@/lib/data/sampleCandidates';
import { ApplicationStatus, CriterionKind, CriterionResult, DecisionKind, JobStatus, Prisma } from '@prisma/client';

/**
 * System administration utilities used by the dashboard Danger Zone.
 *
 * All operations use bulk statements (deleteMany / createMany inside a single
 * transaction) so they complete in a handful of DB round trips. The previous
 * row-by-row approach took several minutes against Supabase/PgBouncer and
 * timed out on Vercel serverless functions.
 */

export const BASELINE_JOB_ID = 'job-001';
export const BASELINE_PM_JOB_ID = 'job-002';
const BASELINE_OWNER_ID = 'usr-hr-001';

// Criterion names double as evidence field keys so the deterministic engine matches them exactly.
export const CRITERIA = {
  degree: 'Computer Science Degree',
  experience: 'Minimum 3 Years Experience',
  stack: 'Modern Web Stack (TypeScript, React, Node.js)',
  testing: 'Database & Testing Quality',
} as const;

const engineeringCriteria = [
  {
    name: CRITERIA.degree,
    description: 'BSc or MSc degree in Computer Science, Software Engineering, or equivalent accredited qualification.',
    kind: CriterionKind.MANDATORY,
    weight: null,
  },
  {
    name: CRITERIA.experience,
    description: 'At least 3 years of commercial production experience in full-stack web applications.',
    kind: CriterionKind.MANDATORY,
    weight: null,
  },
  {
    name: CRITERIA.stack,
    description: 'Demonstrated mastery of TypeScript, modern React hooks, and Node.js server architectures.',
    kind: CriterionKind.WEIGHTED,
    weight: 60,
  },
  {
    name: CRITERIA.testing,
    description: 'Relational PostgreSQL design, Prisma ORM, and comprehensive unit/integration testing with Vitest/Jest.',
    kind: CriterionKind.WEIGHTED,
    weight: 40,
  },
];

const productCriteria = [
  {
    name: 'Product Management Experience',
    description: 'At least 4 years owning roadmaps and shipping B2B or platform products.',
    kind: CriterionKind.MANDATORY,
    weight: null,
  },
  {
    name: 'AI / ML Product Exposure',
    description: 'Hands-on experience defining requirements for AI, ML, or data-driven product features.',
    kind: CriterionKind.WEIGHTED,
    weight: 50,
  },
  {
    name: 'Stakeholder & Delivery Leadership',
    description: 'Evidence of leading cross-functional engineering, design, and go-to-market teams.',
    kind: CriterionKind.WEIGHTED,
    weight: 50,
  },
];

async function buildUserRows(users: SeedUser[]): Promise<Prisma.AppUserCreateManyInput[]> {
  return Promise.all(
    users.map(async u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      passwordHash: await hashPassword(u.password),
      displayName: u.displayName,
      jobTitle: u.jobTitle,
      role: u.role,
    }))
  );
}

function deleteApplicationData() {
  return [
    prisma.hrDecision.deleteMany({}),
    prisma.reviewNote.deleteMany({}),
    prisma.screeningResult.deleteMany({}),
    prisma.extractedEvidence.deleteMany({}),
    prisma.extractionRun.deleteMany({}),
    prisma.cvAsset.deleteMany({}),
    prisma.application.deleteMany({}),
  ];
}

export async function getSystemCounts() {
  const [users, staff, jobs, applications, cvAssets, screenings, decisions, auditEvents] = await prisma.$transaction([
    prisma.appUser.count(),
    prisma.appUser.count({ where: { role: { in: ['ADMIN', 'HR'] } } }),
    prisma.job.count(),
    prisma.application.count(),
    prisma.cvAsset.count(),
    prisma.screeningResult.count(),
    prisma.hrDecision.count(),
    prisma.auditEvent.count(),
  ]);
  return { users, staff, jobs, applications, cvAssets, screenings, decisions, auditEvents };
}

/** Removes all candidates, CVs, extractions, screenings, decisions and notes. Keeps vacancies and users. */
export async function purgeApplications() {
  const results = await prisma.$transaction(deleteApplicationData());
  return { deletedApplications: results[results.length - 1].count };
}

/** Removes all vacancies (and therefore every application attached to them). Keeps users. */
export async function purgeJobs() {
  const results = await prisma.$transaction([
    ...deleteApplicationData(),
    prisma.screeningCriteria.deleteMany({}),
    prisma.job.deleteMany({}),
  ]);
  return {
    deletedApplications: results[6].count,
    deletedJobs: results[results.length - 1].count,
  };
}

/**
 * Restores the seeded staff + applicant accounts with their known passwords.
 * Existing seeded accounts are refreshed; any other users are left untouched.
 */
export async function seedUsers() {
  const rows = await buildUserRows(allSeedUsers);

  await prisma.$transaction(
    rows.map(r =>
      prisma.appUser.upsert({
        where: { email: r.email },
        update: {
          username: r.username,
          passwordHash: r.passwordHash,
          displayName: r.displayName,
          jobTitle: r.jobTitle,
          role: r.role,
        },
        create: r,
      })
    )
  );

  return { staff: seedStaffUsers.length, applicants: rows.length - seedStaffUsers.length, total: rows.length };
}

/**
 * Full factory reset: wipes every table (including users and audit trail),
 * then recreates seeded users, the two baseline vacancies and their criteria.
 */
export async function resetSystem() {
  const userRows = await buildUserRows(allSeedUsers);
  const now = new Date();

  await prisma.$transaction([
    prisma.auditEvent.deleteMany({}),
    ...deleteApplicationData(),
    prisma.screeningCriteria.deleteMany({}),
    prisma.job.deleteMany({}),
    prisma.appUser.deleteMany({}),
    prisma.appUser.createMany({ data: userRows }),
    prisma.job.createMany({
      data: [
        {
          id: BASELINE_JOB_ID,
          title: 'Senior Full-Stack Engineer',
          description:
            'Lead development of cloud applications using Next.js, Node.js, and PostgreSQL. You will own features end-to-end, mentor engineers, and uphold strong testing practices.',
          department: 'Engineering',
          location: 'Remote',
          status: JobStatus.PUBLISHED,
          createdBy: BASELINE_OWNER_ID,
          publishedAt: now,
        },
        {
          id: BASELINE_PM_JOB_ID,
          title: 'Product Manager - AI Platform',
          description:
            'Drive strategy, PRDs, and cross-functional execution for AI decision-support tools used by enterprise HR teams.',
          department: 'Product',
          location: 'London / Hybrid',
          status: JobStatus.PUBLISHED,
          createdBy: BASELINE_OWNER_ID,
          publishedAt: now,
        },
      ],
    }),
    prisma.screeningCriteria.createMany({
      data: [
        ...engineeringCriteria.map(c => ({ ...c, jobId: BASELINE_JOB_ID, version: 1, createdBy: BASELINE_OWNER_ID })),
        ...productCriteria.map(c => ({ ...c, jobId: BASELINE_PM_JOB_ID, version: 1, createdBy: BASELINE_OWNER_ID })),
      ],
    }),
  ]);

  return { users: userRows.length, vacancies: 2, criteria: engineeringCriteria.length + productCriteria.length };
}

function buildCvText(c: SampleCandidate, jobTitle: string) {
  return `================================================================================
CV / RESUME: ${c.name.toUpperCase()}
================================================================================
Target Role: ${jobTitle}
Email: ${c.email} | Phone: ${c.phone} | Location: ${c.location}
Current Title: ${c.title}
Years of Commercial Experience: ${c.yearsExperience} years
Highest Degree: ${c.degree} (${c.degreeField})

SUMMARY:
${c.summary}

CORE SKILLS:
${c.skills.join(', ')}

EXPERIENCE:
${c.workHistory.map(w => `* ${w.role} at ${w.company} (${w.period})\n  ${w.description}`).join('\n\n')}

EDUCATION:
* ${c.degree} (${c.degreeField})
`;
}

export interface CandidateScoreProfile {
  stackFactor: number;
  testingFactor: number;
  status: ApplicationStatus;
  decision?: {
    kind: DecisionKind;
    reason: string;
    decidedBy?: string;
  };
  reviewNote?: string;
}

/**
 * Granular score and pipeline status profiles for the 30 realistic CVs.
 * Every candidate gets an explainable, deterministic score variation
 * (from 95.8 down to 3.0) and a realistic status in the recruitment funnel.
 */
export const candidateScoreProfiles: Record<string, CandidateScoreProfile> = {
  'cand-01': {
    stackFactor: 0.95,
    testingFactor: 0.97,
    status: ApplicationStatus.SHORTLISTED,
    decision: {
      kind: DecisionKind.SHORTLISTED,
      reason: 'Top 1% technical candidate with 6.5 years commercial experience, Next.js microservices, Prisma ORM, and 90%+ Vitest unit test coverage. Shortlisted for Technical Architecture interview.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'MSc Advanced Computing from Imperial College verified. Extensive PostgreSQL optimization track record.',
  },
  'cand-04': {
    stackFactor: 0.94,
    testingFactor: 0.94,
    status: ApplicationStatus.SHORTLISTED,
    decision: {
      kind: DecisionKind.SHORTLISTED,
      reason: 'Staff-level engineer with 7 years production leadership. Exceptional TypeScript distributed systems background and comprehensive CI test suites. Shortlisted for Round 2.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'Accredited BSc Computer Science verified. Directed migrations to cloud microservices with AWS & Vitest.',
  },
  'cand-02': {
    stackFactor: 0.92,
    testingFactor: 0.91,
    status: ApplicationStatus.SHORTLISTED,
    decision: {
      kind: DecisionKind.SHORTLISTED,
      reason: '5 years commercial production experience in cloud SaaS platforms using TypeScript, PostgreSQL, and Jest integration testing. Shortlisted for interview.',
      decidedBy: 'usr-hr-002',
    },
    reviewNote: 'Verified BSc Computer Science. Excellent full-stack breadth including Redis and GraphQL.',
  },
  'cand-08': {
    stackFactor: 0.90,
    testingFactor: 0.89,
    status: ApplicationStatus.SHORTLISTED,
    decision: {
      kind: DecisionKind.SHORTLISTED,
      reason: 'MSc Computer Science graduate with 6 years experience specializing in Next.js, Node.js backend systems, and containerized PostgreSQL architectures. Shortlisted.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'Verified Master degree in CS. Strong cloud infrastructure (Docker, Kubernetes) and Vitest experience.',
  },
  'cand-03': {
    stackFactor: 0.88,
    testingFactor: 0.86,
    status: ApplicationStatus.SHORTLISTED,
    decision: {
      kind: DecisionKind.SHORTLISTED,
      reason: '4.5 years hands-on experience building performant React and Next.js applications with PostgreSQL and automated test coverage. Shortlisted for technical round.',
      decidedBy: 'usr-hr-002',
    },
    reviewNote: 'B.Tech in Computer Science & Engineering verified. Led agile team of 4 engineers at Infosys.',
  },
  'cand-14': {
    stackFactor: 0.87,
    testingFactor: 0.84,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-06': {
    stackFactor: 0.85,
    testingFactor: 0.83,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-13': {
    stackFactor: 0.84,
    testingFactor: 0.82,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-07': {
    stackFactor: 0.83,
    testingFactor: 0.80,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-12': {
    stackFactor: 0.81,
    testingFactor: 0.79,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-10': {
    stackFactor: 0.80,
    testingFactor: 0.77,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-09': {
    stackFactor: 0.78,
    testingFactor: 0.75,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-15': {
    stackFactor: 0.76,
    testingFactor: 0.74,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-11': {
    stackFactor: 0.74,
    testingFactor: 0.72,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-05': {
    stackFactor: 0.72,
    testingFactor: 0.70,
    status: ApplicationStatus.READY_FOR_REVIEW,
  },
  'cand-20': {
    stackFactor: 0.89,
    testingFactor: 0.87,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: 'High technical competence (88.2/100). Flagged non-accredited / self-taught background. Recruiter evaluating 6 years commercial experience as degree equivalent.',
  },
  'cand-17': {
    stackFactor: 0.81,
    testingFactor: 0.79,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: 'Candidate has 5.0 verified years commercial experience, but degree is vocational bootcamp rather than university CS degree. Requires HR degree equivalence waiver.',
  },
  'cand-19': {
    stackFactor: 0.80,
    testingFactor: 0.75,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: 'First-class Cambridge CS graduate with exceptional portfolio, but 2.5 years experience falls slightly below the 3.0 year cutoff. Requesting hiring manager exception.',
  },
  'cand-18': {
    stackFactor: 0.75,
    testingFactor: 0.73,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: 'Technical degree in Electrical Engineering rather than Computer Science. Reviewing software engineering syllabus cross-credit.',
  },
  'cand-23': {
    stackFactor: 0.72,
    testingFactor: 0.70,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: 'BSc Applied Physics with 4 years web development. Reviewing academic coursework for computer science equivalence.',
  },
  'cand-22': {
    stackFactor: 0.70,
    testingFactor: 0.67,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: '2.9 years commercial experience (borderline for 3.0 year threshold). Software engineering degree verified.',
  },
  'cand-16': {
    stackFactor: 0.66,
    testingFactor: 0.63,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: '2.8 years commercial experience. Accredited CS degree verified. Recruiter discretion pending.',
  },
  'cand-21': {
    stackFactor: 0.61,
    testingFactor: 0.58,
    status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    reviewNote: '3.2 years software development with Mathematics degree. Evaluating math/CS syllabus cross-credit.',
  },
  'cand-24': {
    stackFactor: 0.28,
    testingFactor: 0.12,
    status: ApplicationStatus.REJECTED,
    decision: {
      kind: DecisionKind.REJECTED,
      reason: 'Fails mandatory experience requirement: 0.8 years commercial internship experience does not satisfy 3+ years prerequisite. Standard junior rejection dispatched.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'Automated check confirmed: 0.8 years commercial tenure is insufficient for Senior Full-Stack role.',
  },
  'cand-28': {
    stackFactor: 0.18,
    testingFactor: 0.15,
    status: ApplicationStatus.REJECTED,
    decision: {
      kind: DecisionKind.REJECTED,
      reason: 'Experience is strictly embedded microcontroller firmware and bare-metal C. Lacks required modern web stack (TypeScript, React, Node.js, PostgreSQL).',
      decidedBy: 'usr-hr-002',
    },
    reviewNote: 'Profile does not align with modern web/cloud application engineering prerequisites.',
  },
  'cand-25': {
    stackFactor: 0.18,
    testingFactor: 0.05,
    status: ApplicationStatus.REJECTED,
    decision: {
      kind: DecisionKind.REJECTED,
      reason: 'Fails mandatory CS degree and required full-stack software development competencies. Background is exclusively graphic UI design.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'Candidate is a UI designer (Figma/Photoshop); not a software engineer.',
  },
  'cand-27': {
    stackFactor: 0.14,
    testingFactor: 0.00,
    status: ApplicationStatus.REJECTED,
    decision: {
      kind: DecisionKind.REJECTED,
      reason: 'Fails mandatory CS degree requirement and has under 3 years experience. Competencies limited to basic HTML and WordPress editing.',
      decidedBy: 'usr-hr-002',
    },
    reviewNote: 'Declined by HR screening: 1.2 years apprentice WordPress experience.',
  },
  'cand-26': {
    stackFactor: 0.05,
    testingFactor: 0.00,
    status: ApplicationStatus.REJECTED,
    decision: {
      kind: DecisionKind.REJECTED,
      reason: 'Non-technical commercial sales background (SaaS sales executive). Not aligned with senior full-stack engineering role.',
      decidedBy: 'usr-hr-001',
    },
    reviewNote: 'Application archived. Candidate notified of non-selection.',
  },
  'cand-29': {
    stackFactor: 0.05,
    testingFactor: 0.00,
    status: ApplicationStatus.PROCESSING,
    reviewNote: 'Application submitted. Automated CV parsing and fact extraction pipeline in progress.',
  },
  'cand-30': {
    stackFactor: 0.10,
    testingFactor: 0.00,
    status: ApplicationStatus.SUBMITTED,
    reviewNote: 'Newly submitted candidate application. Sitting in incoming reception queue.',
  },
};

/** Converts a candidate profile into evidence rows keyed by criterion name. */
export function buildCandidateEvidence(c: SampleCandidate): FactEvidenceInput[] {
  const lowerSkills = c.skills.map(s => s.toLowerCase());
  const hasTs = lowerSkills.includes('typescript');
  const hasReactOrNode = lowerSkills.includes('react') || lowerSkills.includes('node.js');
  const testingSkills = c.skills.filter(s => /vitest|jest|testing|playwright|cypress/i.test(s));
  const hasDb = lowerSkills.some(s => /postgres|prisma|sql/.test(s));

  const profile = candidateScoreProfiles[c.id];

  // Deterministic evaluation of mandatory requirements
  let degreeStatus: CriterionResult;
  let degreeEvidence: string;
  if (c.expectedOutcome === 'NEEDS_REVIEW' && !c.isCsDegree) {
    degreeStatus = CriterionResult.UNKNOWN;
    degreeEvidence = `Education: ${c.degree} (${c.degreeField}). Non-traditional technical credential flagged for HR degree equivalence review.`;
  } else if (c.isCsDegree) {
    degreeStatus = CriterionResult.MET;
    degreeEvidence = `Education: ${c.degree} in ${c.degreeField}. Accredited computer science qualification verified.`;
  } else {
    degreeStatus = CriterionResult.NOT_MET;
    degreeEvidence = `Education: ${c.degree} (${c.degreeField}). Does not satisfy accredited computer science degree requirement.`;
  }

  let experienceStatus: CriterionResult;
  let expEvidence: string;
  if (c.expectedOutcome === 'NEEDS_REVIEW' && c.yearsExperience < 3.0) {
    experienceStatus = CriterionResult.UNKNOWN;
    expEvidence = `${c.yearsExperience} years of commercial experience. Borderline commercial tenure (${c.yearsExperience} yrs vs 3.0 yrs threshold) flagged for HR tenure discretion.`;
  } else if (c.yearsExperience >= 3.0) {
    experienceStatus = CriterionResult.MET;
    expEvidence = `${c.yearsExperience} years of commercial experience verified across ${c.workHistory.length} roles.`;
  } else {
    experienceStatus = CriterionResult.NOT_MET;
    expEvidence = `${c.yearsExperience} years of commercial experience. Fails minimum 3-year commercial experience prerequisite.`;
  }

  const stackFactor = profile?.stackFactor ?? (hasTs && hasReactOrNode ? 0.9 : 0.15);
  const testingFactor = profile?.testingFactor ?? (testingSkills.length > 0 && hasDb ? 0.85 : 0.1);

  return [
    {
      fieldKey: CRITERIA.degree,
      normalizedValue: `${c.degree} (${c.degreeField})`,
      evidenceText: degreeEvidence,
      confidence: 0.96,
      evidenceStatus: degreeStatus,
    },
    {
      fieldKey: CRITERIA.experience,
      normalizedValue: c.yearsExperience,
      evidenceText: `${expEvidence} Roles: ${c.workHistory
        .map(w => `${w.role} at ${w.company} (${w.period})`)
        .join('; ')}.`,
      confidence: 0.94,
      evidenceStatus: experienceStatus,
    },
    {
      fieldKey: CRITERIA.stack,
      normalizedValue: c.skills,
      evidenceText: `Core skills: ${c.skills.join(', ')}. Stack match factor: ${Math.round(stackFactor * 100)}% based on commercial TypeScript, React, and Node.js production experience.`,
      confidence: 0.92,
      evidenceStatus: stackFactor >= 0.4 ? CriterionResult.MET : CriterionResult.NOT_MET,
      scoreFactor: stackFactor,
    },
    {
      fieldKey: CRITERIA.testing,
      normalizedValue: { testing: testingSkills, database: hasDb },
      evidenceText:
        testingSkills.length > 0
          ? `Testing frameworks: ${testingSkills.join(', ')}${hasDb ? '; relational PostgreSQL database experience listed' : ''}. Quality score factor: ${Math.round(testingFactor * 100)}%.`
          : `No automated testing framework mentioned in CV. Quality score factor: ${Math.round(testingFactor * 100)}%.`,
      confidence: 0.9,
      evidenceStatus: testingFactor >= 0.4 ? CriterionResult.MET : CriterionResult.NOT_MET,
      scoreFactor: testingFactor,
    },
  ];
}

/**
 * Bulk-ingests candidates into a job: creates applicant accounts (if missing), applications,
 * private CV files, extraction runs, evidence and deterministic screening results.
 * Idempotent: re-running replaces the previous applications for the same candidate emails.
 */
export async function ingestCandidates(
  jobId?: string,
  candidates: SampleCandidate[] = sample30Candidates
) {
  const job =
    (jobId
      ? await prisma.job.findUnique({ where: { id: jobId }, include: { criteria: { where: { active: true } } } })
      : null) ??
    (await prisma.job.findFirst({
      where: { id: BASELINE_JOB_ID },
      include: { criteria: { where: { active: true } } },
    })) ??
    (await prisma.job.findFirst({
      where: { status: JobStatus.PUBLISHED },
      orderBy: { createdAt: 'asc' },
      include: { criteria: { where: { active: true } } },
    }));

  if (!job) {
    throw new Error('No vacancy available. Run "Reset System to Baseline" first to create the default vacancies.');
  }
  if (job.criteria.length === 0) {
    throw new Error(`Vacancy "${job.title}" has no active screening criteria. Add criteria before ingesting CVs.`);
  }

  const criteriaVersion = Math.max(...job.criteria.map(c => c.version));
  const activeCriteria: CriterionEvaluationInput[] = job.criteria
    .filter(c => c.version === criteriaVersion)
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      kind: c.kind,
      weight: c.weight ? Number(c.weight) : null,
      configuration: (c.configuration as Record<string, unknown>) ?? {},
    }));

  const emails = candidates.map(c => c.email.toLowerCase().trim());

  // Link applications to existing applicant accounts by email
  const applicantUsers = await prisma.appUser.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const userIdByEmail = new Map(applicantUsers.map(u => [u.email.toLowerCase(), u.id]));

  // Write CV files to private storage in parallel (local disk / tmp – fast)
  const stored = await Promise.all(
    candidates.map(async c => {
      const text = buildCvText(c, job.title);
      const buffer = Buffer.from(text, 'utf-8');
      const filename = `${c.name.replace(/[^a-zA-Z0-9]+/g, '_')}_CV.txt`;
      const meta = await storageService.uploadFile({ filename, mimeType: 'text/plain', buffer });
      return { meta, filename };
    })
  );

  const now = Date.now();
  const applications: Prisma.ApplicationCreateManyInput[] = [];
  const cvAssets: Prisma.CvAssetCreateManyInput[] = [];
  const runs: Prisma.ExtractionRunCreateManyInput[] = [];
  const evidenceRows: Prisma.ExtractedEvidenceCreateManyInput[] = [];
  const screenings: Prisma.ScreeningResultCreateManyInput[] = [];
  const decisions: Prisma.HrDecisionCreateManyInput[] = [];
  const notes: Prisma.ReviewNoteCreateManyInput[] = [];
  const outcomeCounts: Record<string, number> = { RECOMMENDED: 0, NOT_RECOMMENDED: 0, NEEDS_MANUAL_REVIEW: 0 };
  const statusCounts: Record<string, number> = {};

  candidates.forEach((c, idx) => {
    const email = emails[idx];
    const applicationId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    // Stagger submission times so lists have a realistic order
    const submittedAt = new Date(now - (candidates.length - idx) * 37 * 60 * 1000);

    const evidence = buildCandidateEvidence(c);
    const evaluation = evaluateScreening(criteriaVersion, activeCriteria, evidence);
    outcomeCounts[evaluation.outcome] = (outcomeCounts[evaluation.outcome] ?? 0) + 1;

    const profile = candidateScoreProfiles[c.id];
    const targetStatus = profile?.status ?? (
      evaluation.outcome === 'NEEDS_MANUAL_REVIEW'
        ? ApplicationStatus.NEEDS_MANUAL_REVIEW
        : evaluation.outcome === 'NOT_RECOMMENDED'
        ? ApplicationStatus.REJECTED
        : ApplicationStatus.READY_FOR_REVIEW
    );
    statusCounts[targetStatus] = (statusCounts[targetStatus] ?? 0) + 1;

    applications.push({
      id: applicationId,
      jobId: job.id,
      applicantUserId: userIdByEmail.get(email) ?? null,
      applicantName: c.name,
      applicantEmail: email,
      status: targetStatus,
      submittedAt,
    });

    // Create real signed HR decisions for shortlisted and rejected candidates
    if (profile?.decision) {
      decisions.push({
        id: crypto.randomUUID(),
        applicationId,
        decidedBy: profile.decision.decidedBy ?? BASELINE_OWNER_ID,
        decision: profile.decision.kind,
        reason: profile.decision.reason,
        createdAt: new Date(submittedAt.getTime() + 15 * 60 * 1000),
      });
    }

    // Create review audit notes for borderline / review cases
    if (profile?.reviewNote) {
      notes.push({
        id: crypto.randomUUID(),
        applicationId,
        authorId: profile.decision ? (profile.decision.decidedBy ?? BASELINE_OWNER_ID) : 'usr-hr-002',
        body: profile.reviewNote,
        createdAt: new Date(submittedAt.getTime() + 10 * 60 * 1000),
      });
    }

    cvAssets.push({
      applicationId,
      storageKey: stored[idx].meta.storageKey,
      originalFilename: stored[idx].filename,
      detectedMimeType: 'text/plain',
      sizeBytes: BigInt(stored[idx].meta.sizeBytes),
      sha256Hex: stored[idx].meta.sha256Hex,
      scanStatus: 'CLEAN',
    });

    runs.push({
      id: runId,
      applicationId,
      status: 'COMPLETED',
      provider: 'dossier-parser',
      modelName: 'structured-cv-v1',
      schemaVersion: 1,
      startedAt: new Date(submittedAt.getTime() + 5_000),
      completedAt: new Date(submittedAt.getTime() + 9_000),
    });

    for (const e of evidence) {
      evidenceRows.push({
        extractionRunId: runId,
        fieldKey: e.fieldKey,
        normalizedValue: e.normalizedValue as Prisma.InputJsonValue,
        evidenceText: e.evidenceText ?? null,
        pageNumber: 1,
        confidence: e.confidence ?? null,
        evidenceStatus: e.evidenceStatus ?? CriterionResult.UNKNOWN,
      });
    }

    screenings.push({
      applicationId,
      criteriaVersion,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      outcome: evaluation.outcome,
      breakdown: JSON.parse(JSON.stringify(evaluation.breakdown)),
    });
  });

  // Replace any previous applications for these candidates on this job
  const existing = await prisma.application.findMany({
    where: { jobId: job.id, applicantEmail: { in: emails } },
    select: { id: true },
  });
  const existingIds = existing.map(a => a.id);

  await prisma.$transaction([
    prisma.hrDecision.deleteMany({ where: { applicationId: { in: existingIds } } }),
    prisma.reviewNote.deleteMany({ where: { applicationId: { in: existingIds } } }),
    prisma.application.deleteMany({ where: { id: { in: existingIds } } }),
    prisma.application.createMany({ data: applications }),
    prisma.cvAsset.createMany({ data: cvAssets }),
    prisma.extractionRun.createMany({ data: runs }),
    prisma.extractedEvidence.createMany({ data: evidenceRows }),
    prisma.screeningResult.createMany({ data: screenings }),
    prisma.hrDecision.createMany({ data: decisions }),
    prisma.reviewNote.createMany({ data: notes }),
  ]);

  return {
    total: candidates.length,
    replaced: existingIds.length,
    jobId: job.id,
    jobTitle: job.title,
    outcomes: outcomeCounts,
    statuses: statusCounts,
    decisionsRecorded: decisions.length,
    notesRecorded: notes.length,
  };
}
