# Antigravity Prompt Pack

Use these prompts with the project specification and `tasks.md`. Give
Antigravity one prompt at a time. Review the result and acceptance
criteria before moving to the next phase.

------------------------------------------------------------------------

## Prompt 1 --- Project-wide instructions

> You are building an AI-powered recruitment and CV screening web
> application. Read `architecture.md` and `tasks.md` completely before
> coding.
>
> **Architecture:** Next.js App Router, TypeScript, React, PostgreSQL,
> private object storage, managed authentication, an external AI API for
> structured CV information extraction, and deterministic TypeScript
> scoring rules. Do not add FastAPI unless a later explicit decision
> requires Python-based custom ML.
>
> **Priority:** functionality, correctness, security, accessibility, and
> maintainability over visual appearance. Avoid decorative animations
> and unnecessary dependencies. Every visible control must work or be
> clearly marked as not implemented.
>
> **Development boundary:** implement the frontend phases in `tasks.md`
> sequentially using typed mock services. Do not start real
> backend/database/AI integration until the frontend handoff phase has
> been accepted.
>
> Before each phase, inspect the existing code and preserve useful work.
> Do not rewrite the whole project without a clear reason. After each
> phase, run available lint, type-check, and tests; report changed
> files, test results, and unmet acceptance criteria. Never invent
> credentials, API keys, or deployment URLs. Use fictional applicant
> data only.
>
> Start with Phase 0 only. Do not proceed to later phases until asked.

------------------------------------------------------------------------

## Prompt 2 --- Phase 0: Inspect and establish the project

> Complete Phase 0 in `tasks.md`. Inspect the repository first and
> report its current framework, package manager, scripts, and structure.
> Preserve useful code. Verify or set up Next.js App Router and
> TypeScript, add baseline development/lint/type-check scripts,
> `.env.example` placeholders, and a concise README. Do not implement
> feature pages yet. Run the available checks and report results.

------------------------------------------------------------------------

## Prompt 3 --- Phase 1: Types and mock services

> Complete Phase 1 in `tasks.md`. Create central TypeScript types and
> mock service functions for users, jobs, criteria, applicants,
> applications, candidate profiles, screening runs, criterion results,
> and HR decisions. Include fictional edge cases: eligible applicant,
> mandatory-criteria failure, missing/ambiguous evidence, and failed CV
> processing. Keep mock datasets outside page components. Use typed
> status unions and predictable service errors. Do not connect a real
> backend or AI provider. Run checks and report results.

------------------------------------------------------------------------

## Prompt 4 --- Phase 2: App shell and dashboard

> Complete Phase 2 in `tasks.md`. Build a straightforward responsive HR
> shell and dashboard with functional navigation, derived metrics,
> recent jobs, recent application activity, and loading/empty/error
> states. Establish the required routes. Use mock services only. Do not
> claim authentication is production-ready. Prioritise clear information
> hierarchy and working navigation over visual polish. Run checks and
> report results.

------------------------------------------------------------------------

## Prompt 5 --- Phase 3: Vacancy management

> Complete Phase 3 in `tasks.md`. Implement job list search/filter/sort
> and create/edit vacancy forms. Build a working criteria editor
> supporting mandatory and scored criteria, descriptions, weights,
> total-weight validation, and useful error messages. Persist through
> the mock service layer. Prevent invalid criteria configurations from
> being saved. Do not connect a database. Run checks and report results.

------------------------------------------------------------------------

## Prompt 6 --- Phase 4: CV upload prototype

> Complete Phase 4 in `tasks.md`. Build a multi-file PDF/DOCX intake
> interface with file selection, filename/size display, removal,
> client-side validation, simulated progress, per-file outcomes, and
> retry interactions. Use mock services only. Do not upload real CVs or
> send them to external providers. Clearly treat frontend validation as
> a prototype, not a security boundary. Run checks and report results.

------------------------------------------------------------------------

## Prompt 7 --- Phase 5: Shortlist and score explanations

> Complete Phase 5 in `tasks.md`. Implement the shortlist with candidate
> scores, mandatory requirement status, processing status, HR review
> status, search, filters, sorting, and pagination. Add a detailed score
> breakdown with criterion result, points, explanation, evidence, and
> uncertainty. Keep `NEEDS_REVIEW` candidates visible. A high total
> score must never override a failed mandatory criterion. Do not call a
> real AI API or backend. Run checks and report results.

------------------------------------------------------------------------

## Prompt 8 --- Phase 6: Candidate detail and human review

> Complete Phase 6 in `tasks.md`. Implement the application detail page,
> extracted profile, original-CV placeholder, criterion evidence,
> correction workflow, review decisions, required decision reasons,
> confirmation, and activity history. Store interactions through mock
> services and show audit events. The interface must clearly distinguish
> system recommendations from human decisions. Do not implement
> automated final hiring or rejection. Run checks and report results.

------------------------------------------------------------------------

## Prompt 9 --- Phase 7: Reports and hardening

> Complete Phase 7 in `tasks.md`. Add a useful report view and CSV
> prototype if feasible. Audit accessibility, responsive behaviour,
> loading/empty/error states, long text, keyboard navigation, and every
> visible control. Add tests for criteria validation and core flows.
> Remove dead links and inert controls. Run lint, type-check, and tests;
> report actual results and remaining failures.

------------------------------------------------------------------------

## Prompt 10 --- Phase 8: Frontend handoff

> Complete Phase 8 in `tasks.md`. Prepare the frontend for backend
> integration without implementing the backend. Document service
> interfaces, domain types, request/response expectations, API
> endpoints, authentication assumptions, upload flow, processing
> statuses, and error handling. Ensure pages depend on service
> functions, not embedded mock arrays. List every mock function that
> must be replaced with a real API call. Run checks and report the
> handoff status.

------------------------------------------------------------------------

## Prompt 11 --- Backend planning only (use after frontend handoff is approved)

> The frontend phase is accepted. Read `architecture.md` and the Phase 8
> handoff notes. **Do not immediately code.** Propose a backend
> implementation plan in phases covering:
>
> 1.  Authentication, roles, and server-side authorization.
> 2.  PostgreSQL schema, migrations, indexes, and seed data.
> 3.  Private object storage and secure CV upload.
> 4.  PDF/DOCX extraction and OCR fallback for scanned files.
> 5.  Structured AI extraction with schema validation, evidence,
>     uncertainty, retries, and prompt-injection resistance.
> 6.  Deterministic mandatory-criteria checks and weighted scoring.
> 7.  Background processing for batches and idempotent retries.
> 8.  HR review decisions, audit trail, and authorised reports.
> 9.  Security, privacy, retention, fairness tests, and cloud
>     deployment.
>
> For each phase, specify files/modules, endpoints, schema changes,
> tests, and acceptance criteria. Keep Next.js as the backend unless a
> clear technical constraint justifies a separate worker or service. Do
> not use AI output directly as the final score or final hiring
> decision. Wait for approval before implementing.

------------------------------------------------------------------------

## Prompt 12 --- Backend implementation phase template

> Implement only the approved backend phase from the agreed backend
> plan. First inspect existing code and the frontend handoff. Preserve
> the public service contracts where possible. Validate all inputs on
> the server, enforce authorization in every protected endpoint, keep
> secrets server-side, and return consistent error shapes. Add tests for
> success, invalid input, unauthorized access, and failure cases. Do not
> expose CV files publicly. Do not log raw CV content or secrets. Run
> lint, type-check, and tests; report changed files, test results, and
> remaining risks. Do not start the next phase.

------------------------------------------------------------------------

## Prompt 13 --- Final review and readiness assessment

> Review the complete implementation against `architecture.md`,
> `tasks.md`, and the accepted backend plan. Do not make broad rewrites.
> Produce a checklist for:
>
> -   Functional acceptance criteria.
> -   Authorization and private file access.
> -   CV parsing and invalid-file handling.
> -   AI extraction schema validation and uncertain results.
> -   Mandatory requirements and score calculations.
> -   Human review, override reasons, and audit trail.
> -   Retry/idempotency and background processing.
> -   Privacy, retention, and sensitive data handling.
> -   Accessibility and responsive behaviour.
> -   Automated tests, deployment configuration, and secrets management.
>
> Run the available checks and distinguish verified results from items
> that have not been tested. Identify release blockers clearly. Do not
> claim production readiness unless the evidence supports it.
