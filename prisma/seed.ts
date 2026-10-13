import 'dotenv/config';
import { UserRole, JobStatus, ApplicationStatus, CriterionKind, CriterionResult, DecisionKind } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting database seeding on Supabase PostgreSQL...');

  // 1. Seed Core Users
  const hrUser = await prisma.appUser.upsert({
    where: { email: 'hr@company.com' },
    update: {
      displayName: 'Jane Doe - HR Director',
      role: UserRole.HR,
    },
    create: {
      id: 'usr-hr-001',
      email: 'hr@company.com',
      displayName: 'Jane Doe - HR Director',
      role: UserRole.HR,
    },
  });

  const adminUser = await prisma.appUser.upsert({
    where: { email: 'admin@company.com' },
    update: {
      displayName: 'System Admin',
      role: UserRole.ADMIN,
    },
    create: {
      id: 'usr-admin-001',
      email: 'admin@company.com',
      displayName: 'System Admin',
      role: UserRole.ADMIN,
    },
  });

  console.log(`✓ Seeded users: HR (${hrUser.id}), Admin (${adminUser.id})`);

  // 2. Seed Jobs
  const job1 = await prisma.job.upsert({
    where: { id: 'job-001' },
    update: {
      title: 'Senior Full-Stack Engineer',
      description: 'Lead development of cloud applications using Next.js, Node.js, and PostgreSQL.',
      department: 'Engineering',
      location: 'Remote',
      status: JobStatus.PUBLISHED,
    },
    create: {
      id: 'job-001',
      title: 'Senior Full-Stack Engineer',
      description: 'Lead development of cloud applications using Next.js, Node.js, and PostgreSQL.',
      department: 'Engineering',
      location: 'Remote',
      status: JobStatus.PUBLISHED,
      createdBy: hrUser.id,
      publishedAt: new Date(),
    },
  });

  const job2 = await prisma.job.upsert({
    where: { id: 'job-002' },
    update: {
      title: 'Product Manager - AI Platform',
      description: 'Drive strategy, PRDs, and cross-functional execution for AI decision-support tools.',
      department: 'Product',
      location: 'London / Hybrid',
      status: JobStatus.PUBLISHED,
    },
    create: {
      id: 'job-002',
      title: 'Product Manager - AI Platform',
      description: 'Drive strategy, PRDs, and cross-functional execution for AI decision-support tools.',
      department: 'Product',
      location: 'London / Hybrid',
      status: JobStatus.PUBLISHED,
      createdBy: hrUser.id,
      publishedAt: new Date(),
    },
  });

  console.log(`✓ Seeded vacancies: "${job1.title}" (${job1.id}), "${job2.title}" (${job2.id})`);

  // 3. Seed Screening Criteria for Job 1
  const criteriaData = [
    {
      name: 'Computer Science Degree',
      description: 'BSc or MSc degree in Computer Science, Software Engineering, or equivalent accredited qualification.',
      kind: CriterionKind.MANDATORY,
      weight: null,
    },
    {
      name: 'Minimum 3 Years Experience',
      description: 'At least 3 years of commercial production experience in full-stack web applications.',
      kind: CriterionKind.MANDATORY,
      weight: null,
    },
    {
      name: 'Modern Web Stack (TypeScript, React, Node.js)',
      description: 'Demonstrated mastery of TypeScript, modern React hooks, and Node.js server architectures.',
      kind: CriterionKind.WEIGHTED,
      weight: 60,
    },
    {
      name: 'Database & Testing Quality',
      description: 'Relational PostgreSQL design, Prisma ORM, and comprehensive unit/integration testing with Vitest/Jest.',
      kind: CriterionKind.WEIGHTED,
      weight: 40,
    },
  ];

  for (const c of criteriaData) {
    await prisma.screeningCriteria.upsert({
      where: {
        jobId_version_name: {
          jobId: job1.id,
          version: 1,
          name: c.name,
        },
      },
      update: {
        description: c.description,
        kind: c.kind,
        weight: c.weight,
        active: true,
      },
      create: {
        jobId: job1.id,
        version: 1,
        name: c.name,
        description: c.description,
        kind: c.kind,
        weight: c.weight,
        createdBy: hrUser.id,
        active: true,
      },
    });
  }

  console.log(`✓ Seeded criteria for ${job1.title}`);

  // 4. Seed Applications for Job 1
  // Candidate 1: Alex Morgan (Recommended / Shortlist candidate)
  const app1 = await prisma.application.upsert({
    where: { id: 'app-seed-001' },
    update: {
      status: ApplicationStatus.READY_FOR_REVIEW,
    },
    create: {
      id: 'app-seed-001',
      jobId: job1.id,
      applicantName: 'Alex Morgan',
      applicantEmail: 'alex.morgan@example.com',
      status: ApplicationStatus.READY_FOR_REVIEW,
      cvAsset: {
        create: {
          storageKey: 'cv_alex_morgan.pdf',
          originalFilename: 'Alex_Morgan_Resume_2026.pdf',
          detectedMimeType: 'application/pdf',
          sizeBytes: BigInt(245760),
          sha256Hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          scanStatus: 'CLEAN',
        },
      },
    },
  });

  // Extraction Run for Alex Morgan
  const run1 = await prisma.extractionRun.upsert({
    where: { id: 'run-seed-001' },
    update: { status: 'COMPLETED' },
    create: {
      id: 'run-seed-001',
      applicationId: app1.id,
      status: 'COMPLETED',
      provider: 'google-gemini',
      modelName: 'gemini-1.5-flash',
      schemaVersion: 1,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3590000),
    },
  });

  // Extracted Evidence for Alex Morgan
  await prisma.extractedEvidence.deleteMany({ where: { extractionRunId: run1.id } });
  await prisma.extractedEvidence.createMany({
    data: [
      {
        extractionRunId: run1.id,
        fieldKey: 'Computer Science Degree',
        normalizedValue: 'BSc Computer Science - First Class Honours',
        evidenceText: 'Graduated with First Class Honours in BSc Computer Science from University of Edinburgh.',
        confidence: 0.98,
        evidenceStatus: CriterionResult.MET,
        pageNumber: 1,
      },
      {
        extractionRunId: run1.id,
        fieldKey: 'Minimum 3 Years Experience',
        normalizedValue: 5.5,
        evidenceText: 'Over 5.5 years of professional engineering experience building scalable cloud SaaS platforms.',
        confidence: 0.95,
        evidenceStatus: CriterionResult.MET,
        pageNumber: 1,
      },
      {
        extractionRunId: run1.id,
        fieldKey: 'Modern Web Stack (TypeScript, React, Node.js)',
        normalizedValue: 'Expert',
        evidenceText: 'Principal frontend architect using Next.js 14, TypeScript, React Server Components, and Node microservices.',
        confidence: 0.96,
        evidenceStatus: CriterionResult.MET,
        pageNumber: 2,
      },
      {
        extractionRunId: run1.id,
        fieldKey: 'Database & Testing Quality',
        normalizedValue: 'Proficient',
        evidenceText: 'Designed multi-tenant PostgreSQL databases with Prisma ORM; achieved 90% test coverage using Vitest and RTL.',
        confidence: 0.92,
        evidenceStatus: CriterionResult.MET,
        pageNumber: 2,
      },
    ],
  });

  // Screening Result for Alex Morgan
  await prisma.screeningResult.upsert({
    where: {
      applicationId_criteriaVersion: {
        applicationId: app1.id,
        criteriaVersion: 1,
      },
    },
    update: {
      outcome: 'RECOMMENDED',
      totalScore: 96,
      maxScore: 100,
    },
    create: {
      applicationId: app1.id,
      criteriaVersion: 1,
      totalScore: 96,
      maxScore: 100,
      outcome: 'RECOMMENDED',
      breakdown: {
        mandatoryChecks: [
          { name: 'Computer Science Degree', status: 'MET', evidenceExcerpt: 'BSc Computer Science - First Class Honours' },
          { name: 'Minimum 3 Years Experience', status: 'MET', evidenceExcerpt: 'Over 5.5 years of professional experience' },
        ],
        scoredCriteria: [
          { name: 'Modern Web Stack (TypeScript, React, Node.js)', weight: 60, pointsEarned: 58, explanation: 'Strong Next.js and TypeScript background' },
          { name: 'Database & Testing Quality', weight: 40, pointsEarned: 38, explanation: 'PostgreSQL and Vitest automated coverage' },
        ],
      },
    },
  });

  console.log(`✓ Seeded candidate Alex Morgan (${app1.id}) with extraction and screening results`);

  // Candidate 2: Jordan Lee (Needs Manual Review candidate)
  const app2 = await prisma.application.upsert({
    where: { id: 'app-seed-002' },
    update: {
      status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
    },
    create: {
      id: 'app-seed-002',
      jobId: job1.id,
      applicantName: 'Jordan Lee',
      applicantEmail: 'jordan.lee@example.com',
      status: ApplicationStatus.NEEDS_MANUAL_REVIEW,
      cvAsset: {
        create: {
          storageKey: 'cv_jordan_lee.pdf',
          originalFilename: 'Jordan_Lee_Resume.pdf',
          detectedMimeType: 'application/pdf',
          sizeBytes: BigInt(189440),
          sha256Hex: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
          scanStatus: 'CLEAN',
        },
      },
    },
  });

  console.log(`✓ Seeded candidate Jordan Lee (${app2.id}) requiring manual review`);

  // 5. Seed Initial Audit Record
  await prisma.auditEvent.create({
    data: {
      actorUserId: hrUser.id,
      action: 'SYSTEM_DATABASE_SEEDED',
      resourceType: 'SYSTEM',
      metadata: {
        seededBy: 'prisma/seed.ts',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
