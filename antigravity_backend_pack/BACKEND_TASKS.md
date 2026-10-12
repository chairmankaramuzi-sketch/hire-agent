# Backend Build Tasks — Phased Plan

Antigravity must complete one phase at a time. Functionality, data integrity, and security take priority over UI appearance.

## Phase 0 — Inspect and plan
- Inspect the existing repository and frontend tasks.
- Confirm package manager, Next.js version, folder structure, auth approach, and existing naming conventions.
- Do not overwrite working frontend code.
- Return a concise implementation plan and list assumptions before editing files.

**Done when:** the plan matches `BACKEND_ARCHITECTURE.md` and no duplicate backend architecture is introduced.

## Phase 1 — Backend foundation
- Configure TypeScript, environment validation, Prisma, and PostgreSQL.
- Add a safe database connection pattern.
- Add shared API response/error utilities, request IDs, and logging redaction.
- Add `/api/v1/health`.
- Add test and migration scripts.
- Create `.env.example` with placeholders only.

**Done when:** app starts, database connection can be checked safely, migrations run, health endpoint passes tests, and no secrets are committed.

## Phase 2 — Database and authorization
- Implement schema for users/roles, jobs, criteria, applications, CV assets, extraction runs, extracted evidence, screening results, HR decisions, notes, and audit events.
- Add indexes, unique constraints, foreign keys, and timestamps.
- Implement authentication integration and server-side role/resource authorization helpers.
- Add seed data only for local development.

**Done when:** migrations work on a clean database and authorization tests prevent cross-user/resource access.

## Phase 3 — Jobs and criteria APIs
- Implement create/list/read/update/publish/close job endpoints.
- Validate payloads with Zod.
- Support pagination and explicit job/application ownership or tenant scoping if relevant.
- Version screening criteria and audit changes.

**Done when:** CRUD tests and authorization tests pass.

## Phase 4 — Application submission and private CV storage
- Implement application submission and duplicate protection.
- Implement a storage interface and private provider adapter.
- Validate file size, extension, MIME, and signature where feasible.
- Use private object keys; never store public CV URLs.
- Add upload rate limits and clear user-facing validation errors.

**Done when:** valid submissions persist; invalid/oversized files fail; CV access is private and authorized.

## Phase 5 — Extraction pipeline
- Implement extraction service behind a provider interface.
- Define a strict schema for structured facts, evidence, confidence, and missing/ambiguous values.
- Call the external AI provider only from server code.
- Persist processing state and safe error details.
- Make retries idempotent and support manual review when extraction fails.
- Never log full CV text or raw provider payloads containing personal data.

**Done when:** mocked provider tests cover success, malformed output, timeout, rate limit, and retry.

## Phase 6 — Deterministic screening engine
- Implement mandatory criteria with `MET`, `NOT_MET`, and `UNKNOWN`.
- Implement weighted criteria and explainable score breakdowns.
- Store the scoring rule-set version and evidence behind each result.
- Route unknown or ambiguous evidence to manual review.
- Do not let AI choose the final hiring decision or automatically reject candidates.

**Done when:** same inputs + same rule version produce the same results; unit tests cover edge cases and score boundaries.

## Phase 7 — HR review and audit
- Implement paginated application list, application detail, evidence, decision, and notes endpoints.
- Require a reason for HR overrides/decisions as defined by policy.
- Audit decisions, document access, and rule changes.
- Add screening summary endpoints with aggregate job-related information only.

**Done when:** HR workflow is testable end-to-end and audit entries are created for sensitive actions.

## Phase 8 — Hardening and integration
- Add integration tests for the full flow: job → application → CV → extraction → screening → HR decision.
- Add rate limits, security headers, upload scanning integration if available, retention/deletion behavior, and operational documentation.
- Check database indexes and pagination behavior.
- Ensure logs and errors do not leak personal data or secrets.
- Provide migration, seed, test, and local-run instructions.

**Done when:** clean setup instructions work, tests pass, and known limitations are documented.

## Required report after every phase
1. Files created/changed.
2. Commands run and their results.
3. Tests added and test results.
4. Decisions/assumptions.
5. Remaining issues.
6. Explicit confirmation before proceeding to the next phase.
