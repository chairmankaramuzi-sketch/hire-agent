# AI-Powered Recruitment & CV Screening System

## Product and Technical Specification for Antigravity

**Document type:** Product requirements, architecture, data flow, user
flow, and implementation guidance\
**Project status:** Planned\
**Primary goal:** Build a cloud-hosted recruitment web application that
helps HR teams process many CVs, compare applicants against job-specific
criteria, and review a smaller, explainable shortlist.

------------------------------------------------------------------------

## 1. Product vision

Build a responsive web application that helps a company manage job
vacancies and screen submitted CVs. HR users define the requirements for
each job. Applicants' CVs are uploaded, text is extracted, relevant
facts are structured, and each application is evaluated against the job
criteria. The system presents a ranked and explainable review queue to
HR.

The system is a **decision-support tool**, not an autonomous hiring
decision-maker. HR must be able to inspect original CVs, correct
extraction errors, override a screening recommendation with a recorded
reason, and make the final decision.

### Primary outcomes

-   Reduce the time spent manually reviewing large volumes of CVs.
-   Apply consistent, job-specific screening criteria.
-   Show why a candidate matched or did not match each criterion.
-   Keep original CVs, extracted facts, scores, and HR decisions
    traceable.
-   Run as a cloud-hosted application accessible to authorised users.

### Non-goals for the first release

-   Automatically hiring or rejecting candidates without HR review.
-   Training a proprietary AI model from scratch.
-   Facial analysis, personality inference, or scoring based on
    protected or irrelevant personal characteristics.
-   Integrations with job boards, email inboxes, payroll, or HRIS
    systems unless added later as a separate phase.

------------------------------------------------------------------------

## 2. Recommended technology stack

Use one TypeScript codebase for the initial application. Prefer reliable
functionality and maintainability over visual effects or premature
complexity.

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Full-stack web          Next.js with App Router Frontend pages and
  framework                                       server-side application
                                                  logic

  Language                TypeScript              Typed, maintainable
                                                  code

  UI                      React, semantic HTML,   Accessible HR interface
                          CSS, a small component  
                          library if useful       

  Styling                 Tailwind CSS or CSS     Consistent responsive
                          modules                 layout; choose one and
                                                  use it consistently

  API                     Next.js Route Handlers  Server-side API
                          under `app/api/...`     endpoints

  Validation              Zod                     Validate request
                                                  bodies, query
                                                  parameters, environment
                                                  variables, and AI
                                                  output

  Database                PostgreSQL              Persistent relational
                                                  data

  Database access         Prisma ORM or Drizzle   Choose one; do not mix
                          ORM                     ORM approaches

  Authentication          Supabase Auth or        Login and session
                          another supported       management
                          managed auth provider   

  File storage            Supabase Storage or     Store original CVs
                          equivalent private      outside database rows
                          object storage          

  Document extraction     Apache Tika service or  Extract text from PDF
                          Node-compatible         and DOCX documents
                          PDF/DOCX parsers        

  OCR                     Tesseract-based service Read scanned/image-only
                          only when required      CVs

  AI extraction           External AI API with    Convert extracted CV
                          structured JSON output  text into candidate
                                                  facts

  Scoring                 Deterministic           Apply mandatory checks
                          TypeScript business     and weighted scores
                          rules                   consistently

  Background processing   Add a managed           Process large batches
                          queue/worker when batch without holding open
                          size or execution       web requests
                          limits require it       

  Testing                 Vitest or Jest;         Unit, integration, and
                          Playwright for browser  end-to-end tests
                          flows                   

  Deployment              Vercel or another       Host the web
                          Next.js-compatible      application
                          cloud host              

  Database/storage        Supabase or equivalent  Managed database,
  hosting                 managed service         authentication, and
                                                  private files

  Version control         Git                     Change history and
                                                  collaboration
  -----------------------------------------------------------------------

### Important implementation decisions

1.  **Use Next.js first; do not add FastAPI by default.** An external AI
    API can be called from the server-side Next.js backend.
2.  Keep AI API keys, database credentials, and storage secrets on the
    server. Never expose them in browser code or public environment
    variables.
3.  Store CV files in private object storage. Store only file metadata
    and storage keys in PostgreSQL.
4.  Never use AI-generated prose as the source of truth for the numeric
    score. AI extracts facts; validated application code evaluates those
    facts against criteria.
5.  Keep a clean boundary between the initial frontend phase and later
    backend integration. Use typed mock data and a service layer during
    frontend development, then replace mock implementations with real
    APIs without rewriting pages.
6.  If the chosen cloud host has request-duration or payload limits, use
    direct-to-storage uploads and background jobs for document
    processing.

------------------------------------------------------------------------

## 3. User roles and permissions

### HR / Recruiter

-   Sign in and sign out.
-   Create, edit, publish, close, and archive vacancies.
-   Define mandatory and scored criteria and their weights.
-   View applications and processing statuses.
-   Review extracted facts and the original CV.
-   Review score breakdowns and reasons.
-   Mark applications for further review, shortlist, or reject after
    human review.
-   Export permitted reports.
-   Correct inaccurate extracted data with an audit record.

### Administrator

-   Manage authorised users and roles.
-   Configure system-wide settings and retention rules.
-   Review operational logs and processing failures.
-   Access candidate data only where the organisation's permission
    policy permits it.

### Applicant (optional first-release scope)

The system may support a public application form where applicants select
a vacancy and submit a CV and contact details. If the initial build is
HR-only, HR can upload CVs received through other channels. Keep the
data model compatible with both intake methods.

**Authorization rule:** Every server endpoint must check the
authenticated user's role and permission. Hiding a button in the UI is
not security.

------------------------------------------------------------------------

## 4. Core user flow

### HR flow

1.  HR signs in.
2.  HR opens the dashboard and sees active vacancies, application
    counts, and processing statuses.
3.  HR creates a vacancy and enters a title, description, and required
    criteria.
4.  HR marks each criterion as mandatory or scored, defines weights, and
    sets any score threshold.
5.  HR publishes the vacancy or opens an existing vacancy.
6.  CVs enter through applicant upload or HR batch upload.
7.  The system validates file type and size, stores the original file
    privately, and creates an application record.
8.  A processing task extracts CV text and structures relevant facts.
9.  The screening engine evaluates mandatory criteria, calculates the
    score for eligible candidates, and records evidence and uncertainty.
10. HR opens the shortlist and filters or sorts candidates by status,
    score, or criterion.
11. HR opens an application to inspect the original CV, extracted
    profile, criterion-by-criterion results, and score explanation.
12. HR corrects errors if necessary and records a human decision with a
    reason.
13. HR exports a report if authorised.

### Applicant flow (if public application intake is enabled)

1.  Applicant opens a published vacancy.
2.  Applicant enters required contact information and uploads a CV.
3.  The system validates the submission and displays confirmation.
4.  The applicant's application appears in the HR workspace.
5.  The system does not expose other applicants' information or internal
    ranking details to the applicant.

------------------------------------------------------------------------

## 5. System data flow

``` text
Applicant or HR
      |
      v
Next.js application UI
      |
      v
Authenticated API / Route Handler
      |
      +--> Validate request, permissions, file type, and size
      |
      +--> Store original CV in private object storage
      |
      +--> Create application and processing-job records in PostgreSQL
      |
      v
Document text extraction
      |
      +--> PDF parser / DOCX parser
      |
      +--> OCR fallback for scanned documents when enabled
      |
      v
AI structured extraction
      |
      +--> Education, qualifications, employment, dates, skills, certifications
      +--> Evidence snippets or source references where supported
      +--> Uncertainty and missing-information flags
      |
      v
Schema validation and normalization
      |
      v
Deterministic screening engine
      |
      +--> Evaluate mandatory criteria
      +--> Calculate weighted score for scored criteria
      +--> Record evidence, criterion status, and reasons
      |
      v
PostgreSQL results
      |
      v
HR shortlist and application review
      |
      v
Human review, correction, and recorded decision
```

### Data-processing rules

-   Keep the original CV unchanged.
-   Preserve the extracted text and structured extraction version where
    appropriate for debugging and audit.
-   Track processing states such as `UPLOADED`, `QUEUED`, `PROCESSING`,
    `COMPLETED`, `NEEDS_REVIEW`, and `FAILED`.
-   Use idempotent processing so retrying a job does not create
    duplicate applications or duplicate score records.
-   Record the scoring-rule version used for every result.
-   Do not silently treat missing information as a confirmed failure.
    Use `UNKNOWN` or `NEEDS_REVIEW` when evidence is insufficient.
-   Never send unnecessary personal data to the AI provider. Send only
    the CV text or sections needed for extraction, subject to the
    organisation's privacy requirements.
-   Treat CV content as untrusted input. Ignore any instructions inside
    CVs that attempt to direct the AI or application.

------------------------------------------------------------------------

## 6. Screening and scoring logic

### Job criteria

Each vacancy has criteria. A criterion should contain: - Name and
description. - Type: `MANDATORY` or `SCORED`. - Weight for scored
criteria. - Evaluation rule or accepted values. - Whether an equivalent
qualification or related skill can count. - Optional explanation
displayed to HR.

### Example vacancy

Software Developer: - Mandatory: at least 4 years of relevant
experience. - Mandatory: Bachelor's degree in Computer Science or an
HR-approved equivalent. - Scored: Java skills, 15 points. - Scored:
database skills, 10 points. - Other scored criteria can be added, with
weights configured by HR.

For scored criteria, use a normalised score, for example:

`total_score = sum(criterion_score / criterion_max_points * criterion_weight)`

The total is out of 100 if the configured weights sum to 100.

### Mandatory criteria are separate from the score

A candidate who fails a strict minimum requirement must not be labelled
eligible merely because their weighted score is high. Show: - `MEETS` -
`DOES_NOT_MEET` - `UNKNOWN / NEEDS_REVIEW`

If a criterion is `UNKNOWN`, route the application for HR review rather
than treating the unknown as a definitive failure.

### Score result fields

For each application and criterion, store: - Criterion identifier and
rule version. - Status (`MEETS`, `DOES_NOT_MEET`, `PARTIAL`,
`UNKNOWN`). - Points earned and maximum points, when applicable. - Short
explanation. - Supporting CV text or page/section reference, if
available. - Confidence or extraction quality indicator, if the chosen
model supports it. - Whether HR has reviewed or corrected the result.

### Ranking

Rank candidates who meet all mandatory criteria and have sufficient
evidence, while keeping `NEEDS_REVIEW` applications visible in a
separate queue. Do not hide applicants solely because an AI extraction
was uncertain.

The threshold is configurable per vacancy. Do not hard-code a universal
pass mark.

------------------------------------------------------------------------

## 7. Functional requirements

### Vacancy management

-   Create, view, edit, publish, close, and archive jobs.
-   Configure mandatory criteria and scored criteria.
-   Validate weights and warn if they do not sum to the intended total.
-   Prevent edits from silently rewriting the meaning of historical
    results; version criteria or rescreen applications with a recorded
    new rule version.

### CV and application management

-   Support PDF and DOCX initially.
-   Validate MIME type, extension, and file size on the server.
-   Use random storage keys, not user-provided filenames, as storage
    identifiers.
-   Store original files privately and issue short-lived signed URLs
    only to authorised users.
-   Track duplicates and allow HR to resolve them.
-   Display upload and processing progress and useful error messages.
-   Support HR batch upload; add public applicant submission if included
    in scope.

### AI extraction

-   Return structured JSON matching a defined schema.
-   Extract education, institution, qualification, employment history,
    dates, skills, certifications, and relevant evidence.
-   Preserve uncertainty and missing fields.
-   Validate AI output with Zod or an equivalent schema validator.
-   Retry transient failures safely and send unrecoverable tasks to a
    failure state.
-   Never allow the AI response to directly execute SQL, change
    permissions, or make an unreviewed final hiring decision.

### HR dashboard

-   Display vacancy count, application count, processing failures, and
    pending reviews.
-   Show candidate name, score, mandatory-criteria status, processing
    status, and review status.
-   Support search, sorting, filtering, and pagination.
-   Show criterion-level explanations and links to the original CV.
-   Make `NEEDS_REVIEW` visible and easy to access.

### Audit and reporting

-   Record who changed criteria, edited extracted facts, changed
    application status, and made a human decision.
-   Record timestamps and reasons for overrides.
-   Provide CSV export only to authorised users.
-   Do not include secrets, raw CV content, or unnecessary personal data
    in application logs.

------------------------------------------------------------------------

## 8. Suggested data model

The exact schema can be refined during backend implementation. Use
relational foreign keys and appropriate indexes.

### `users`

-   `id` (UUID, primary key)
-   `name`
-   `email` (unique)
-   `role` (`ADMIN`, `HR`)
-   `created_at`, `updated_at`

### `jobs`

-   `id` (UUID)
-   `title`
-   `description`
-   `department` (optional)
-   `status` (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`)
-   `score_threshold` (optional)
-   `created_by` (FK to users)
-   `created_at`, `updated_at`

### `job_criteria`

-   `id` (UUID)
-   `job_id` (FK)
-   `name`
-   `description`
-   `criterion_type` (`MANDATORY`, `SCORED`)
-   `weight` (nullable for mandatory criteria)
-   `rule_config` (JSONB for structured criterion configuration)
-   `version`
-   `created_at`, `updated_at`

### `applicants`

-   `id` (UUID)
-   `full_name`
-   `email` (optional depending on intake)
-   `phone` (optional)
-   `created_at`, `updated_at`

### `applications`

-   `id` (UUID)
-   `job_id` (FK)
-   `applicant_id` (FK)
-   `source` (`APPLICANT_PORTAL`, `HR_UPLOAD`)
-   `status` (`RECEIVED`, `PROCESSING`, `NEEDS_REVIEW`, `SCREENED`,
    `SHORTLISTED`, `REJECTED_AFTER_REVIEW`, `WITHDRAWN`, `FAILED`)
-   `created_at`, `updated_at`
-   Unique constraints should prevent accidental duplicate submissions
    while allowing an applicant to apply to different jobs.

### `cv_documents`

-   `id` (UUID)
-   `application_id` (FK)
-   `storage_key`
-   `original_filename` (sanitised display value only)
-   `mime_type`
-   `file_size`
-   `checksum`
-   `extracted_text` (or a secure reference if storing text separately
    is preferable)
-   `extraction_status`
-   `created_at`

### `candidate_profiles`

-   `id` (UUID)
-   `application_id` (FK, unique where one active profile per
    application is intended)
-   `education` (JSONB or normalised child table)
-   `employment_history` (JSONB or normalised child table)
-   `skills` (JSONB or normalised child table)
-   `certifications` (JSONB or normalised child table)
-   `extraction_version`
-   `needs_review`
-   `created_at`, `updated_at`

### `screening_runs`

-   `id` (UUID)
-   `application_id` (FK)
-   `criteria_version`
-   `total_score`
-   `mandatory_status`
-   `overall_status`
-   `score_explanation` (JSONB)
-   `scoring_version`
-   `created_at`

### `criterion_results`

-   `id` (UUID)
-   `screening_run_id` (FK)
-   `criterion_id` (FK)
-   `status`
-   `points_earned`
-   `points_possible`
-   `explanation`
-   `evidence_reference` or `evidence_text`
-   `needs_review`
-   `created_at`

### `review_decisions`

-   `id` (UUID)
-   `application_id` (FK)
-   `reviewer_id` (FK to users)
-   `decision` (`SHORTLIST`, `HOLD`, `REJECT`, `ADVANCE`)
-   `reason`
-   `created_at`

### `audit_logs`

-   `id` (UUID)
-   `actor_user_id` (FK, nullable for system events)
-   `action`
-   `entity_type`
-   `entity_id`
-   `metadata` (JSONB with no secrets or unnecessary CV data)
-   `created_at`

A queue/job table may be added if background processing is implemented.

------------------------------------------------------------------------

## 9. Initial API surface

Use REST-style endpoints via Next.js Route Handlers. Final names can be
refined, but keep the API consistent.

  ----------------------------------------------------------------------------------------------
  Method                  Route                                          Purpose
  ----------------------- ---------------------------------------------- -----------------------
  `GET`                   `/api/jobs`                                    List jobs visible to
                                                                         the signed-in user

  `POST`                  `/api/jobs`                                    Create a draft job

  `GET`                   `/api/jobs/:jobId`                             Get job details and
                                                                         criteria

  `PATCH`                 `/api/jobs/:jobId`                             Update a job

  `POST`                  `/api/jobs/:jobId/publish`                     Publish a job

  `GET`                   `/api/jobs/:jobId/applications`                List applications for a
                                                                         job

  `POST`                  `/api/jobs/:jobId/applications/upload`         Create application(s)
                                                                         from HR-uploaded CV(s)

  `POST`                  `/api/applications/:applicationId/process`     Queue or retry
                                                                         processing,
                                                                         permission-checked

  `GET`                   `/api/applications/:applicationId`             Get application and
                                                                         extracted profile

  `GET`                   `/api/applications/:applicationId/screening`   Get score and criterion
                                                                         results

  `POST`                  `/api/applications/:applicationId/review`      Save an HR decision
                                                                         with a reason

  `PATCH`                 `/api/applications/:applicationId/profile`     Correct extracted facts
                                                                         with audit trail

  `GET`                   `/api/reports/jobs/:jobId.csv`                 Export authorised job
                                                                         report
  ----------------------------------------------------------------------------------------------

For production, avoid processing a large batch synchronously in the
upload request. Create records, queue work, and return a status
response.

------------------------------------------------------------------------

## 10. UI and design principles

The AI must prioritise **functionality, clarity, and correctness over
appearance**.

-   Use a clean, restrained, professional HR dashboard.
-   Prioritise task completion over decorative effects, animations,
    gradients, and complex transitions.
-   Use clear labels, status text, tables, filters, and helpful
    empty/error/loading states.
-   Ensure keyboard navigation, visible focus, readable contrast, and
    accessible form labels.
-   Make the candidate score understandable; never show a score without
    a breakdown.
-   Clearly distinguish system recommendations from final HR decisions.
-   Use responsive layouts for laptop, tablet, and mobile.
-   Do not fabricate data in the production interface. Clearly label
    seed/demo data.
-   Keep components small and reusable.
-   Build frontend phases with mock data and typed interfaces before
    connecting to real backend APIs.

### Core screens

1.  Sign-in.
2.  HR dashboard.
3.  Vacancy list.
4.  Create/edit vacancy and criteria.
5.  Vacancy details and application intake.
6.  Upload CVs and upload progress.
7.  Applicant shortlist.
8.  Application detail with original CV, extracted facts, and score
    explanation.
9.  Review decision dialog.
10. Reports and settings.

------------------------------------------------------------------------

## 11. Security, privacy, and responsible screening

CVs contain personal information. Security and fairness are core
requirements, not optional enhancements.

-   Enforce authentication and server-side authorization on every
    protected endpoint.
-   Use private object storage and expiring signed URLs.
-   Validate file type, size, and content; consider malware scanning
    before production.
-   Use parameterised database operations through the selected ORM.
-   Apply rate limits to public endpoints and uploads.
-   Keep secrets in server-side environment variables.
-   Avoid logging CV text, credentials, tokens, or unnecessary personal
    data.
-   Establish a retention and deletion policy with the organisation.
-   Use data minimisation when sending text to an external AI provider
    and review provider retention settings and applicable agreements.
-   Do not score age, gender, ethnicity, religion, disability,
    photographs, marital status, or other protected/irrelevant
    characteristics.
-   Do not infer personality or job performance from names, photos,
    writing style, or other unsupported proxies.
-   Provide evidence and an `UNKNOWN / NEEDS_REVIEW` state for ambiguous
    data.
-   Allow HR to inspect and correct facts, and record overrides.
-   Test for inconsistent results across equivalent CV formats and for
    possible disparate impact.
-   Keep human review as the final decision stage.

This specification is technical guidance, not legal advice. Confirm
applicable privacy, employment, and data-protection requirements before
real deployment.

------------------------------------------------------------------------

## 12. Non-functional requirements

-   **Reliability:** Failures should be visible and retryable; one bad
    CV should not stop a batch.
-   **Performance:** Paginate candidate lists; avoid loading all CVs and
    results at once.
-   **Scalability:** Separate document processing from web requests when
    volume increases.
-   **Maintainability:** Use TypeScript, linting, tests, typed API
    contracts, and clear module boundaries.
-   **Portability:** Avoid hard-coding one host's proprietary features
    unless there is a clear benefit.
-   **Observability:** Record request IDs, processing states, duration,
    and safe error summaries.
-   **Accessibility:** Use semantic elements and accessible form
    controls.
-   **Auditability:** Store scoring versions, criterion results,
    evidence, and HR decisions.

------------------------------------------------------------------------

## 13. Acceptance criteria for the first useful release

The first release is not complete until all of the following work:

1.  An authorised HR user can sign in.
2.  HR can create and edit a vacancy.
3.  HR can configure mandatory and scored criteria with validated
    weights.
4.  HR can upload PDF/DOCX CVs securely.
5.  The system can extract text and show a useful error for unsupported
    or unreadable files.
6.  The system can create a structured candidate profile and mark
    uncertain fields for review.
7.  The screening engine applies mandatory requirements separately from
    the weighted score.
8.  Every score has a criterion-level explanation and traceable evidence
    where possible.
9.  HR can sort/filter candidates and open the original CV.
10. HR can correct extracted facts and record a review decision with a
    reason.
11. Failed processing tasks can be retried without duplicating
    applications.
12. Access controls prevent one user from accessing data they are not
    authorised to view.
13. Automated tests cover scoring, mandatory requirements, validation,
    permissions, and main user flows.
14. The app can be deployed to a cloud environment using documented
    environment variables.
15. No API key, database secret, or private CV URL is exposed in
    client-side code.

------------------------------------------------------------------------

## 14. Instructions to Antigravity

-   Read this document and `tasks.md` before changing code.
-   Implement one phase at a time and report which acceptance criteria
    pass.
-   In the initial frontend phase, do not build the backend prematurely.
    Create typed mock data and a mock service layer with realistic
    states.
-   Do not use fake buttons or decorative controls that do nothing. If a
    control is visible, implement its local interaction or clearly mark
    it as planned.
-   Prioritise functional behaviour, data correctness, accessibility,
    and error states over visual polish.
-   Do not invent credentials, API keys, or deployed URLs.
-   Ask before introducing major dependencies or changing the agreed
    architecture.
-   Keep documentation, `.env.example`, and tests updated as
    implementation evolves.
