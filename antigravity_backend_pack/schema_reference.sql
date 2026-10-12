-- Reference PostgreSQL schema for planning.
-- If the project uses Prisma, translate this into schema.prisma and migrations.
-- Do not maintain this SQL and Prisma schema as competing sources of truth.

CREATE TYPE user_role AS ENUM ('ADMIN', 'HR', 'APPLICANT');
CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
CREATE TYPE application_status AS ENUM (
  'SUBMITTED', 'PROCESSING', 'READY_FOR_REVIEW', 'NEEDS_MANUAL_REVIEW',
  'SHORTLISTED', 'REJECTED', 'WITHDRAWN'
);
CREATE TYPE criterion_kind AS ENUM ('MANDATORY', 'WEIGHTED');
CREATE TYPE criterion_result AS ENUM ('MET', 'NOT_MET', 'UNKNOWN');
CREATE TYPE decision_kind AS ENUM ('SHORTLISTED', 'REJECTED', 'HOLD');

CREATE TABLE app_user (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT,
  location TEXT,
  status job_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES app_user(id),
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE screening_criteria (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  kind criterion_kind NOT NULL,
  weight NUMERIC(7,4),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES app_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, version, name),
  CHECK (weight IS NULL OR weight >= 0)
);

CREATE TABLE application (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job(id),
  applicant_user_id UUID REFERENCES app_user(id),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX application_job_status_idx ON application(job_id, status, submitted_at DESC);
CREATE INDEX application_email_job_idx ON application(job_id, applicant_email);

CREATE TABLE cv_asset (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL UNIQUE REFERENCES application(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  detected_mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  sha256_hex CHAR(64),
  scan_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE extraction_run (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  provider TEXT,
  model_name TEXT,
  schema_version INTEGER NOT NULL,
  safe_error_code TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE extracted_evidence (
  id UUID PRIMARY KEY,
  extraction_run_id UUID NOT NULL REFERENCES extraction_run(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  normalized_value JSONB,
  evidence_text TEXT,
  page_number INTEGER,
  confidence NUMERIC(5,4),
  evidence_status criterion_result NOT NULL DEFAULT 'UNKNOWN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE TABLE screening_result (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
  criteria_version INTEGER NOT NULL,
  total_score NUMERIC(8,4),
  max_score NUMERIC(8,4),
  outcome TEXT NOT NULL,
  breakdown JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, criteria_version)
);

CREATE TABLE hr_decision (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES application(id),
  decided_by UUID NOT NULL REFERENCES app_user(id),
  decision decision_kind NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_note (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES app_user(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_event (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES app_user(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_event_resource_idx ON audit_event(resource_type, resource_id, created_at DESC);
CREATE INDEX extraction_run_application_idx ON extraction_run(application_id, created_at DESC);
CREATE INDEX evidence_run_field_idx ON extracted_evidence(extraction_run_id, field_key);
