import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { hashPassword } from '@/lib/password';
import { evaluateScreening, CriterionEvaluationInput, FactEvidenceInput } from '@/lib/screening/engine';
import { allSeedUsers, seedStaffUsers, SeedUser } from '@/lib/data/seedUsers';
import { sample30Candidates, SampleCandidate } from '@/lib/data/sampleCandidates';
import { ApplicationStatus, CriterionKind, CriterionResult, JobStatus, Prisma } from '@prisma/client';

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

/** Converts a candidate profile into evidence rows keyed by criterion name. */
export function buildCandidateEvidence(c: SampleCandidate): FactEvidenceInput[] {
  const lowerSkills = c.skills.map(s => s.toLowerCase());
  const hasTs = lowerSkills.includes('typescript');
  const hasReactOrNode = lowerSkills.includes('react') || lowerSkills.includes('node.js');
  const testingSkills = c.skills.filter(s => /vitest|jest|testing|playwright|cypress/i.test(s));
  const hasDb = lowerSkills.some(s => /postgres|prisma|sql/.test(s));

  const experienceStatus =
    c.yearsExperience >= 3
      ? CriterionResult.MET
      : c.yearsExperience >= 2.5
      ? CriterionResult.UNKNOWN
      : CriterionResult.NOT_MET;

  return [
    {
      fieldKey: CRITERIA.degree,
      normalizedValue: `${c.degree} (${c.degreeField})`,
      evidenceText: `Education: ${c.degree} in ${c.degreeField}.`,
      confidence: 0.96,
      evidenceStatus: c.isCsDegree ? CriterionResult.MET : CriterionResult.NOT_MET,
    },
    {
      fieldKey: CRITERIA.experience,
      normalizedValue: c.yearsExperience,
      evidenceText: `${c.yearsExperience} years of commercial experience. Roles: ${c.workHistory
        .map(w => `${w.role} at ${w.company} (${w.period})`)
        .join('; ')}.`,
      confidence: 0.94,
      evidenceStatus: experienceStatus,
    },
    {
      fieldKey: CRITERIA.stack,
      normalizedValue: c.skills,
      evidenceText: `Core skills listed: ${c.skills.join(', ')}.`,
      confidence: 0.92,
      evidenceStatus: hasTs && hasReactOrNode ? CriterionResult.MET : CriterionResult.NOT_MET,
    },
    {
      fieldKey: CRITERIA.testing,
      normalizedValue: { testing: testingSkills, database: hasDb },
      evidenceText:
        testingSkills.length > 0
          ? `Testing frameworks: ${testingSkills.join(', ')}${hasDb ? '; relational database experience listed' : ''}.`
          : 'No automated testing framework mentioned in CV.',
      confidence: 0.9,
      evidenceStatus: testingSkills.length > 0 && hasDb ? CriterionResult.MET : CriterionResult.NOT_MET,
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
  const outcomeCounts: Record<string, number> = { RECOMMENDED: 0, NOT_RECOMMENDED: 0, NEEDS_MANUAL_REVIEW: 0 };

  candidates.forEach((c, idx) => {
    const email = emails[idx];
    const applicationId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    // Stagger submission times so lists have a realistic order
    const submittedAt = new Date(now - (candidates.length - idx) * 37 * 60 * 1000);

    const evidence = buildCandidateEvidence(c);
    const evaluation = evaluateScreening(criteriaVersion, activeCriteria, evidence);
    outcomeCounts[evaluation.outcome] = (outcomeCounts[evaluation.outcome] ?? 0) + 1;

    applications.push({
      id: applicationId,
      jobId: job.id,
      applicantUserId: userIdByEmail.get(email) ?? null,
      applicantName: c.name,
      applicantEmail: email,
      status:
        evaluation.outcome === 'NEEDS_MANUAL_REVIEW'
          ? ApplicationStatus.NEEDS_MANUAL_REVIEW
          : ApplicationStatus.READY_FOR_REVIEW,
      submittedAt,
    });

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
    prisma.application.deleteMany({ where: { id: { in: existingIds } } }),
    prisma.application.createMany({ data: applications }),
    prisma.cvAsset.createMany({ data: cvAssets }),
    prisma.extractionRun.createMany({ data: runs }),
    prisma.extractedEvidence.createMany({ data: evidenceRows }),
    prisma.screeningResult.createMany({ data: screenings }),
  ]);

  return {
    total: candidates.length,
    replaced: existingIds.length,
    jobId: job.id,
    jobTitle: job.title,
    outcomes: outcomeCounts,
  };
}
