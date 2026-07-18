CREATE TABLE fid.fid_persistence_idempotency (
  idempotency_key text NOT NULL, request_id text, batch_id text, operation_id text, request_hash text,
  result_status text, persistence_id text, canonical_record_id text, effect_receipt_id text, record_revision integer,
  first_seen_at timestamptz NOT NULL, completed_at timestamptz, outcome_indeterminate boolean NOT NULL DEFAULT false,
  result_payload jsonb, CONSTRAINT fid_persistence_idempotency_pk PRIMARY KEY (idempotency_key)
);
CREATE TABLE fid.fid_persistence_batches (
  batch_id text NOT NULL, request_id text, requested_atomicity text, actor_ref text, commit_state text, rollback_state text,
  expected_operation_count integer NOT NULL, source_refs jsonb, lifecycle jsonb, notes text,
  started_at timestamptz NOT NULL, completed_at timestamptz,
  committed_operation_count integer NOT NULL DEFAULT 0, failed_operation_count integer NOT NULL DEFAULT 0,
  achieved_atomicity text, CONSTRAINT fid_persistence_batches_pk PRIMARY KEY (batch_id)
);
CREATE TABLE fid.fid_persistence_batch_operations (
  batch_id text NOT NULL, operation_id text NOT NULL, operation_index integer NOT NULL, action text,
  persistence_id text, canonical_record_id text, expected_result_ref text, record_revision integer,
  preconditions jsonb, command_payload jsonb,
  CONSTRAINT fid_persistence_batch_operations_pk PRIMARY KEY (batch_id, operation_id)
);
CREATE TABLE fid.fid_persistence_effect_receipts (
  receipt_id text NOT NULL, request_ref text, batch_ref text, operation_ref text, repository_ref text, effect_type text,
  persistence_id text, canonical_record_id text, predecessor_persistence_id text, commit_state text, atomicity_state text,
  actor_ref text, notes text, record_revision integer, committed boolean NOT NULL, durable boolean NOT NULL,
  occurred_at timestamptz NOT NULL, verification jsonb, audit_refs jsonb,
  CONSTRAINT fid_persistence_effect_receipts_pk PRIMARY KEY (receipt_id)
);
CREATE TABLE fid.fid_persistence_audit_events (
  event_id text NOT NULL, event_type text NOT NULL, request_ref text, batch_ref text, operation_ref text,
  repository_ref text, actor_ref text, category text, severity text, message text, notes text,
  occurred_at timestamptz NOT NULL, details jsonb, source_refs jsonb,
  CONSTRAINT fid_persistence_audit_events_pk PRIMARY KEY (event_id)
);
