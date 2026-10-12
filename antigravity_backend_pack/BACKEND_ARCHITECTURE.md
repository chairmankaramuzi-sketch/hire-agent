# Backend Architecture and API Contract

## 1. Purpose
Provide secure APIs and processing services for an AI-assisted recruitment workflow: HR creates a job, configures requirements, applicants submit applications and CVs, the system extracts job-relevant evidence, applies deterministic rules, and HR reviews results.

## 2. Recommended stack
- Next.js App Router Route Handlers + TypeScript
- PostgreSQL
- Prisma ORM and migrations
- Zod for request validation
- Auth.js or the project's established authentication provider
- Private object storage adapter for uploaded CVs
- External AI API for structured extraction only
- Vitest/Jest for unit tests and integration tests
- Structured server logging with personal-data redaction

Keep provider keys server-side. Never expose them to browser code.

## 3. Logical modules
1. **Auth & authorization** — session validation, roles, ownership checks.
2. **Jobs** — job description, required qualifications, configurable criteria.
3. **Applications** — applicant data, application lifecycle, duplicate checks.
4. **CV storage** — upload validation, private storage, signed access for authorized HR.
5. **CV extraction** — text extraction, AI-assisted structured facts with evidence and confidence.
6. **Screening** — mandatory criteria and weighted deterministic score, versioned rules.
7. **HR review** — shortlist/reject/hold decisions, notes, status history.
8. **Audit & operations** — audit records, processing errors, retry-safe jobs.

## 4. Core data flow
1. HR creates a job and defines mandatory requirements plus weighted criteria.
2. Applicant submits application and CV.
3. API validates request, checks allowed file type/size, and stores CV privately.
4. Extraction worker/service extracts text and asks the configured AI provider for a strict structured response.
5. Validate AI output against a schema. Store facts, evidence snippets/page references when available, confidence, provider/model metadata, and extraction status.
6. Screening service evaluates mandatory criteria and weighted rules deterministically. Save score breakdown and rule-set version.
7. HR dashboard reads results and evidence. HR can override or confirm recommendations with a recorded reason.
8. Every meaningful HR action and criteria change creates an audit event.

AI output is untrusted input. It must never execute code, create SQL, or directly decide a candidate's final outcome.

## 5. Candidate/application statuses
Suggested application statuses:
- `SUBMITTED`
- `PROCESSING`
- `READY_FOR_REVIEW`
- `NEEDS_MANUAL_REVIEW`
- `SHORTLISTED`
- `REJECTED`
- `WITHDRAWN`

Keep processing status separate from HR decision status if that makes transitions clearer. Reject invalid transitions in server code.

## 6. API contract
Use `/api/v1` as a logical prefix if the app's routing setup supports it. All endpoints must return consistent JSON and appropriate HTTP status codes.

### Jobs (HR-only unless stated)
- `GET /api/v1/jobs` — list jobs visible to current user; support pagination and status filters.
- `POST /api/v1/jobs` — create job and criteria.
- `GET /api/v1/jobs/:jobId` — retrieve job, with authorization.
- `PATCH /api/v1/jobs/:jobId` — update job; audit criteria changes.
- `POST /api/v1/jobs/:jobId/publish` — publish job.
- `POST /api/v1/jobs/:jobId/close` — close job.

### Applications
- `POST /api/v1/jobs/:jobId/applications` — submit applicant details and CV upload metadata or a server-mediated upload.
- `GET /api/v1/applications/:applicationId/status` — applicant can see only their own application status.
- `GET /api/v1/jobs/:jobId/applications` — HR-only paginated list, filters and sorting.
- `GET /api/v1/applications/:applicationId` — authorized HR detail; applicant access only to permitted self-view fields.
- `POST /api/v1/applications/:applicationId/withdraw` — applicant withdraws own application where allowed.

### CV processing (internal/HR guarded)
- `POST /api/v1/applications/:applicationId/process` — enqueue/retry processing; HR/admin only or internal authenticated job call.
- `GET /api/v1/applications/:applicationId/evidence` — authorized HR reads extracted facts/evidence.
- `GET /api/v1/applications/:applicationId/cv-access` — issue short-lived private access or stream through authorized server route.

### HR decisions
- `POST /api/v1/applications/:applicationId/decision` — body includes decision (`SHORTLISTED`, `REJECTED`, `HOLD`) and required reason/notes according to policy.
- `POST /api/v1/applications/:applicationId/notes` — add review note.
- `GET /api/v1/jobs/:jobId/screening-summary` — aggregate counts and score distributions, not protected-attribute analysis.

### Operations
- `GET /api/v1/health` — liveness only; do not expose secrets or internal infrastructure details.
- `GET /api/v1/audit-events` — admin/authorized HR only, paginated.

## 7. Screening design
- Separate **mandatory criteria** from **weighted criteria**.
- Mandatory criteria outcomes: `MET`, `NOT_MET`, `UNKNOWN`; `UNKNOWN` must route to manual review rather than silently count as failure.
- Weighted criteria use configured weights and deterministic scoring functions.
- Persist a per-criterion result, supporting evidence, weight, awarded points, and scoring-rule version.
- Missing or ambiguous information must not be treated as proof that a candidate lacks a qualification.
- Do not score personality, inferred demographic traits, names, photos, age, religion, ethnicity, disability, or other protected/sensitive characteristics.
- Do not auto-reject solely based on AI output or a numeric threshold. HR reviews evidence and makes the decision.
- Allow authorized admins to change criteria, and record before/after values in the audit trail.

## 8. Security and privacy requirements
- Authentication required for all HR APIs.
- Role-based authorization and resource-level ownership checks.
- Validate every input with Zod (or equivalent).
- Use parameterized ORM queries; never concatenate user input into SQL.
- Upload limits, allow-list MIME/extensions, inspect file signatures where possible, malware scanning where available.
- CV objects private by default; short-lived signed URLs only after authorization.
- Rate-limit public application and upload endpoints.
- CSRF protection where relevant to the chosen auth setup.
- Secrets only in environment variables / secret manager.
- Redact personal information and CV text from logs.
- Define retention/deletion workflow and applicant privacy notice.
- Use generic errors externally; detailed stack traces only in protected server logs.
- Audit HR decisions, exports, access to sensitive documents, and scoring-rule changes.

## 9. Error response shape
Use a consistent response, for example:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields.",
    "requestId": "server-generated-id"
  }
}
```
Do not return stack traces, provider errors, secrets, or internal file paths.

## 10. Acceptance criteria
- Unauthorized users cannot access HR endpoints or another applicant's application.
- Invalid files and oversized uploads are rejected.
- CVs are not publicly accessible.
- Extraction failures can be retried safely and do not duplicate applications.
- AI output is schema-validated and treated as untrusted.
- Screening results are reproducible from stored rule versions and inputs.
- Unknown evidence is routed to manual review.
- HR decisions and rule changes are audited.
- API tests cover normal paths, validation failures, access control, and processing failures.
