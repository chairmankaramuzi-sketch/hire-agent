# AI Recruitment System — Backend Handoff Pack for Antigravity

This pack defines the backend implementation work for the AI Recruitment System. It is a build specification and starter schema, not a claim that a production-ready backend has already been implemented.

## Agreed direction
- Next.js + TypeScript as a unified application
- PostgreSQL relational database
- Private object storage for CV files (never public URLs)
- External AI API for structured CV extraction; provider must be configured through environment variables
- Deterministic, explainable scoring rules; AI must not make the final hiring decision
- HR users review evidence and make shortlist decisions
- Prioritize correctness, security, and functionality over visual polish

## Suggested implementation approach
Use Next.js Route Handlers under `app/api`, Prisma ORM for PostgreSQL, Zod for input validation, and a private storage adapter (S3-compatible or cloud provider). Keep AI and storage integrations behind small interfaces so providers can be changed without rewriting recruitment logic.

## How to use in Antigravity
1. Give Antigravity `BACKEND_ARCHITECTURE.md` and `BACKEND_TASKS.md` as source of truth.
2. Run the prompts in `BACKEND_PROMPTS.md` one phase at a time.
3. Require tests and a short report before moving to the next phase.
4. Do not ask it to implement every phase in one giant prompt.
5. Treat the SQL schema as a reference; if Prisma is selected, translate it into `schema.prisma` and create migrations rather than maintaining two competing schemas.

## Important safeguards
- Do not use AI-generated scores as the sole basis for rejecting or selecting candidates.
- Do not infer protected characteristics or use them in scoring.
- Keep an audit trail for HR actions and scoring-rule changes.
- Never log CV contents, secrets, access tokens, or full personal data.
- Validate file type and size; scan uploads where available; store files privately.
- Use least-privilege authorization and server-side access checks on every protected endpoint.
