# Antigravity Prompts — Backend Implementation

Use one prompt at a time. Do not ask the agent to implement all phases at once.

## Prompt 0 — Inspect repository and plan
Read `BACKEND_ARCHITECTURE.md` and `BACKEND_TASKS.md` completely. Inspect the existing repository, including frontend work, without overwriting it. Propose a backend implementation plan compatible with the current codebase. Identify the actual Next.js version, package manager, auth setup, and any existing database/schema work. List assumptions and files you intend to change. Do not implement yet. Functionality, correctness, privacy, and security matter more than visual appearance.

## Prompt 1 — Foundation
Implement only Phase 1 in `BACKEND_TASKS.md`. Follow the existing repository conventions. Add environment validation, Prisma/PostgreSQL setup, safe error handling, redacted structured logging, request IDs, health endpoint, scripts, and `.env.example`. Never put real credentials in files. Add tests and run them. Stop after Phase 1 and report files, commands, test results, assumptions, and remaining issues.

## Prompt 2 — Data model and access control
Implement only Phase 2. Build the relational model for users/roles, jobs, criteria, applications, CV assets, extraction runs, evidence, screening results, decisions, notes, and audit events. Add constraints and indexes. Implement server-side role/resource authorization. Do not trust client-supplied role IDs or resource ownership. Add migrations and access-control tests. Stop and report results.

## Prompt 3 — Jobs and criteria
Implement only Phase 3. Create validated job CRUD, publish/close transitions, pagination, criteria management, criteria versioning, and audit events for criteria changes. Enforce authorization on every request. Add tests for validation, forbidden access, not-found resources, and normal operations. Stop and report results.

## Prompt 4 — Applications and private files
Implement only Phase 4. Add safe application submission, duplicate protection, upload validation, and private CV storage through a provider abstraction. Keep storage credentials server-side. Do not expose public object URLs. Add file size/type validation and tests for invalid files, duplicate submissions, unauthorized access, and storage failures. Stop and report results.

## Prompt 5 — CV extraction
Implement only Phase 5. Create an extraction provider interface and strict structured output schema for job-relevant facts, evidence, confidence, and unknown/ambiguous values. Integrate the external AI provider using server-only environment variables. Treat all model output as untrusted; validate it before persistence. Add idempotent retries, processing states, safe failure handling, and tests using a mocked provider. Do not log raw CV text. Stop and report results.

## Prompt 6 — Screening engine
Implement only Phase 6. Build deterministic mandatory and weighted criteria evaluation. Mandatory results must support MET, NOT_MET, and UNKNOWN; UNKNOWN routes to manual review. Persist explainable per-criterion points, evidence, and rule version. Do not use protected/sensitive characteristics or proxies, and do not make AI the final decision-maker. Do not automatically reject applicants solely on a score. Add unit tests proving deterministic outputs and edge cases. Stop and report results.

## Prompt 7 — HR review and audit
Implement only Phase 7. Add protected endpoints for application list/detail, evidence, CV access, HR decisions, notes, and screening summaries. Enforce resource-level authorization. Record audit events for decisions, CV access, and criteria changes. Keep applicant self-service responses limited to their own application. Add integration tests. Stop and report results.

## Prompt 8 — End-to-end hardening
Implement only Phase 8. Run the complete test suite, review authorization, upload validation, private storage, rate limits, error redaction, data retention/deletion, and deployment configuration. Add or fix tests for the end-to-end flow. Update setup docs. Do not claim a feature works unless it is implemented and tested. Return a final implementation report and a list of remaining risks.
