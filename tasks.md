# `tasks.md` --- Phased Frontend Build Plan

## Purpose

Build the frontend of the AI-powered recruitment and CV screening system
first. The initial frontend must be functional using typed mock data and
a mock service layer. Backend APIs, real database integration, real file
storage, and AI processing will be implemented later.

**Primary rule:** Prioritise functionality over appearance. A simple,
reliable workflow is better than a beautiful screen with controls that
do not work.

## Frontend stack

-   Next.js App Router
-   TypeScript
-   React
-   Tailwind CSS or CSS modules (choose one)
-   Zod for client-side form/schema validation where useful
-   Lucide icons or another consistent icon set
-   Vitest/Jest and React Testing Library if configured
-   Playwright for end-to-end tests when practical

Do not add a UI framework or state-management library unless it solves a
real need. Prefer simple React state and reusable components.

## Architecture rules for frontend phases

1.  Keep pages in the Next.js App Router structure.
2.  Separate page layout, feature components, types, and data/service
    functions.
3.  Create typed domain types for jobs, applicants, applications,
    criteria, screening results, and review decisions.
4.  Use a service layer such as `src/services/jobs.ts` and
    `src/services/applications.ts`.
5.  Initially implement mock services. Do not hard-code arrays directly
    inside page components.
6.  Later, replace mock service implementations with API calls while
    keeping page components and type contracts stable.
7.  Use explicit loading, empty, success, and error states.
8.  Every visible interactive control must work or be clearly labelled
    as unavailable/planned.
9.  Do not use real personal data. Use clearly fictional demo records.
10. Keep secrets and future API keys out of the frontend.

------------------------------------------------------------------------

## Phase 0 --- Inspect and establish the project

### Tasks

-   Inspect the existing repository before creating or replacing files.
-   Identify current framework, package manager, scripts, and
    conventions.
-   Preserve useful existing work.
-   Confirm Next.js App Router and TypeScript are configured.
-   Establish lint, type-check, and test commands.
-   Create or update `.env.example` with placeholders only; never add
    actual secrets.
-   Add a brief `README.md` with setup and development commands.

### Acceptance criteria

-   Project starts locally using documented commands.
-   TypeScript and lint checks run.
-   Existing useful code has not been discarded without reason.
-   No secret values are committed.

### Antigravity prompt

> Complete Phase 0 from `tasks.md`. First inspect the repository and
> report its current state. Preserve existing useful code. Set up or
> verify Next.js App Router and TypeScript, scripts for
> development/lint/type-check, `.env.example` placeholders, and a
> concise README. Do not build features from later phases yet.
> Prioritise a working baseline over styling.

------------------------------------------------------------------------

## Phase 1 --- Domain types and mock service layer

### Tasks

Create TypeScript types for: - `User` and `UserRole` - `Job` and
`JobStatus` - `JobCriterion`, `CriterionType`, and `CriterionStatus` -
`Applicant` - `Application` and `ApplicationStatus` -
`CandidateProfile` - `ScreeningRun` and `CriterionResult` -
`ReviewDecision` - `ProcessingStatus`

Create fictional mock records for a few vacancies and applicants.
Include edge cases: - A candidate who meets all mandatory
requirements. - A candidate who does not meet a mandatory requirement. -
A candidate with missing or ambiguous experience information. - A CV
processing failure. - A candidate awaiting HR review.

Create mock service functions for listing, reading, creating, updating,
filtering, and sorting records. Keep service function signatures ready
to be replaced by API calls later.

### Acceptance criteria

-   Domain types are centralised and reused.
-   Pages do not contain duplicated inline mock datasets.
-   Status values use TypeScript unions/enums instead of arbitrary
    strings.
-   Mock data clearly represents fictional demo data.
-   Service functions have useful return types and predictable errors.

### Antigravity prompt

> Complete Phase 1 from `tasks.md`. Define reusable TypeScript domain
> types and a mock service layer for jobs, criteria, applicants,
> applications, candidate profiles, screening results, and HR decisions.
> Add realistic fictional data including eligible, ineligible,
> uncertain, and failed-processing cases. Keep mock data outside page
> components. Do not implement a real backend or AI calls.

------------------------------------------------------------------------

## Phase 2 --- Application shell, navigation, and dashboard

### Tasks

Build: - Responsive app shell. - Sidebar or simple navigation suitable
for an HR tool. - Header with current section and a placeholder user
menu. - Dashboard summary cards for active vacancies, total
applications, awaiting review, and processing failures. - Recent
vacancies and recent application activity. - Loading, empty, and error
states. - Responsive layout for desktop and smaller screens.

Routes to establish: - `/login` - `/dashboard` - `/jobs` - `/jobs/new` -
`/jobs/[jobId]` - `/jobs/[jobId]/applications` -
`/applications/[applicationId]` - `/settings` (basic placeholder if
needed)

Do not claim authentication is secure yet; real authentication belongs
to the backend phase. The login screen can be a frontend-only prototype.

### Acceptance criteria

-   Navigation links work.
-   Dashboard values derive from mock service data.
-   Empty and error states can be demonstrated.
-   Layout works on laptop, tablet, and mobile.
-   No unnecessary animations or visual effects.

### Antigravity prompt

> Complete Phase 2 from `tasks.md`. Build the responsive HR app shell
> and dashboard using the established mock service layer. Add working
> navigation and the listed routes. Dashboard metrics must be derived
> from mock data. Include loading, empty, and error states. Prioritise
> clarity and working interactions over visual polish. Do not implement
> real authentication or backend APIs.

------------------------------------------------------------------------

## Phase 3 --- Vacancy list and job creation/editing

### Tasks

Build the vacancy list with: - Search by title or department. - Filter
by status. - Sort by title, creation date, or application count. - Clear
empty state and create-vacancy action.

Build the create/edit vacancy form with: - Job title. - Department
(optional). - Description. - Status/draft workflow. - Score threshold
(optional). - Criteria editor.

Criteria editor requirements: - Add, edit, and remove criteria. - Set
criterion type to `MANDATORY` or `SCORED`. - Set weight for scored
criteria. - Add a description/rule. - Validate weights and show the
total. - Prevent invalid values and clearly explain validation errors. -
Do not assign weights to mandatory criteria unless the design explicitly
supports a separate non-gating score. - Save to mock service and show
success/error feedback.

### Acceptance criteria

-   Create, edit, search, filter, and sort work with mock data.
-   Criteria can be added and removed.
-   Validation blocks invalid weights and missing required fields.
-   The user can return to the list and see the saved job.
-   A draft is distinguishable from a published/closed job.

### Antigravity prompt

> Complete Phase 3 from `tasks.md`. Implement the job list and
> functional create/edit vacancy flow with criteria management. Validate
> required fields and scored-criteria weights. Show the total weight and
> useful error messages. Persist through the mock service layer only. Do
> not connect to a database. Keep the interface straightforward and
> functional.

------------------------------------------------------------------------

## Phase 4 --- CV intake and upload interaction prototype

### Tasks

Build the upload screen for a vacancy: - Drag-and-drop zone and
browse-file control. - Support `.pdf` and `.docx` in the UI. - Display
selected filenames and sizes. - Allow removing a selected file before
submission. - Show client-side checks for extension and size, with clear
warnings. - Show simulated upload and processing states using mock
services. - Display success, partial failure, and retry states. -
Support multiple CV selections in the prototype. - Clearly indicate that
actual secure upload and server validation will be connected in the
backend phase.

Never imply client-side validation is sufficient for production
security.

### Acceptance criteria

-   Selecting files, removing files, and submitting work.
-   Invalid file extensions and oversized files are handled clearly.
-   Progress and results are understandable.
-   One simulated failed file does not prevent successful files from
    showing results.
-   No actual CV content is uploaded to an external service during
    frontend-only work.

### Antigravity prompt

> Complete Phase 4 from `tasks.md`. Build a functional CV intake UI
> supporting multiple PDF/DOCX selections, filename/size display,
> removal, client-side validation, simulated progress, per-file
> success/failure, and retry states. Use mock services only. Clearly
> keep this as a frontend prototype; do not pretend files are securely
> uploaded or processed by a backend yet.

------------------------------------------------------------------------

## Phase 5 --- Candidate shortlist and screening results

### Tasks

Build the applications/shortlist page with: - Candidate name and
application reference. - Total score. - Mandatory requirement status. -
Processing status. - HR review status. - Search, sorting, filters, and
pagination. - Distinct queues or filters for eligible, not meeting
requirements, and needs review. - Score threshold filter if configured
for the vacancy.

Build a score breakdown view: - Criterion name. - Criterion type. -
Result status. - Points earned / possible where relevant. -
Explanation. - Supporting evidence excerpt or source reference where
available. - Uncertainty indicator. - Clear distinction between
AI-extracted facts, system evaluation, and HR decision.

Rules: - Never present a high numeric score as proof of eligibility when
a mandatory criterion fails. - Never silently treat missing evidence as
a confirmed failure. - Keep `NEEDS_REVIEW` candidates accessible. - Do
not display unexplained AI confidence as if it were a probability of job
performance.

### Acceptance criteria

-   Search, sort, filter, and pagination work.
-   Mandatory status and numeric score are visually distinct.
-   Candidate with missing information appears in the review queue.
-   Every demo score has a criterion breakdown.
-   Original CV access is represented by a placeholder until backend
    storage is connected.

### Antigravity prompt

> Complete Phase 5 from `tasks.md`. Build the shortlist and score
> breakdown using mock data. Implement search, filtering, sorting,
> pagination, mandatory-requirement status, score explanations, evidence
> excerpts, and a visible needs-review queue. Make it impossible to
> confuse a numeric score with passing mandatory requirements. Do not
> implement real AI calls or backend storage.

------------------------------------------------------------------------

## Phase 6 --- Candidate detail and HR review workflow

### Tasks

Build the application detail page with sections/tabs for: - Applicant
details. - Original CV placeholder/viewer panel. - Extracted
education. - Employment history. - Skills and certifications. -
Screening result and criterion evidence. - Processing history/status. -
HR review history.

Add mock interactions: - Mark as shortlisted. - Put on hold / needs more
information. - Reject after HR review. - Advance to next stage. -
Correct an extracted fact in an editable review form. - Require a reason
for an override or final decision. - Display confirmation before
finalising a decision. - Show an audit/activity timeline.

Do not add automated final rejection based only on AI output.

### Acceptance criteria

-   Each decision action updates mock state and the visible status.
-   Decision reason is required.
-   Edits to extracted data are visibly distinguished from original
    extracted values.
-   Review history is displayed.
-   The UI consistently identifies HR decisions as human decisions.

### Antigravity prompt

> Complete Phase 6 from `tasks.md`. Implement the candidate
> detail/review workflow with extracted profile, screening evidence,
> original-CV placeholder, processing status, correction form, decision
> actions, required decision reason, confirmation, and activity history.
> Use mock services and record mock audit events. Keep final decisions
> human-controlled.

------------------------------------------------------------------------

## Phase 7 --- Reports, accessibility, and frontend hardening

### Tasks

-   Add a simple report view with counts by status and score
    distribution using available mock data.
-   Add CSV export from mock data if feasible; clearly separate this
    from the later server-authorised production export.
-   Verify labels, keyboard navigation, focus indicators, contrast,
    semantic headings, and table accessibility.
-   Verify mobile layouts and long names/filenames.
-   Add reusable loading, empty, error, and confirmation components.
-   Remove dead links and inert buttons.
-   Add unit tests for criterion-weight validation, filters, and status
    presentation.
-   Add Playwright tests for core navigation and job creation if test
    infrastructure is available.
-   Run lint and TypeScript checks.

### Acceptance criteria

-   Core user flows are testable without a backend.
-   No visible control is inert or misleading.
-   Accessibility basics are satisfied.
-   No major TypeScript/lint errors remain.
-   Frontend can be demonstrated with fictional data.

### Antigravity prompt

> Complete Phase 7 from `tasks.md`. Harden the frontend: accessible
> forms and tables, responsive layouts, reports/CSV prototype, reusable
> states, and tests for criteria validation and core user journeys.
> Remove dead links and inert controls. Run lint/type-check/tests and
> report results. Do not start backend implementation.

------------------------------------------------------------------------

## Phase 8 --- Frontend handoff for backend integration

### Tasks

-   Document all screens, service functions, and domain types.
-   Identify every mock service method that needs a real API
    implementation.
-   Define expected request/response shapes for each screen.
-   Document file upload expectations and processing states.
-   Document authentication/authorization assumptions.
-   Add `.env.example` placeholders only.
-   Create a list of API endpoints expected from the backend
    specification.
-   Verify that pages call services rather than directly reading mock
    data.

### Acceptance criteria

-   Backend work can replace mock services without redesigning pages.
-   Request/response contracts are documented.
-   No frontend secret is present.
-   Every page has loading, success, empty, and error handling where
    applicable.

### Antigravity prompt

> Complete Phase 8 from `tasks.md`. Prepare a clean frontend handoff for
> backend implementation. Document domain types, service interfaces, API
> contracts, loading/error expectations, upload flow, and authentication
> assumptions. Ensure pages depend on service interfaces rather than
> mock arrays. Do not implement the backend yet. Report remaining gaps
> and the exact files that will need API integration.

------------------------------------------------------------------------

## Global definition of done

A phase is done only when: - Its acceptance criteria are checked. -
Relevant routes and interactions work. - TypeScript and lint checks
pass, or failures are documented. - No secrets or real personal data are
included. - Mock data is clearly identified. - The phase summary states
what changed, what was tested, and what remains.

## Backend phase boundary

Do **not** proceed to backend implementation as part of these frontend
tasks. After Phase 8 is accepted, use the architecture document to plan
backend phases for authentication, database schema/migrations, private
CV storage, document parsing, AI extraction, scoring, queue processing,
audit logs, and deployment.
