CREATE TABLE fid.fid_record_revisions (
  persistence_id text NOT NULL, canonical_record_id text NOT NULL, record_revision integer NOT NULL,
  predecessor_persistence_id text, predecessor_record_id text, predecessor_revision integer,
  target_contract text NOT NULL, contract_version text NOT NULL, schema_version text NOT NULL,
  persistence_envelope jsonb NOT NULL, record_payload jsonb NOT NULL,
  source_refs text[] NOT NULL, evidence_refs text[] NOT NULL, review_refs text[] NOT NULL, blocker_refs text[] NOT NULL,
  verification jsonb NOT NULL, provenance jsonb NOT NULL, lifecycle jsonb NOT NULL, notes text, extensions jsonb NOT NULL,
  created_at timestamptz NOT NULL, created_by text NOT NULL, request_id text NOT NULL, operation_id text NOT NULL,
  batch_id text, idempotency_key text, content_hash text NOT NULL, status text NOT NULL,
  relationship_source_contract text, relationship_source_record_id text,
  relationship_target_contract text, relationship_target_record_id text,
  relationship_type text, relationship_direction text,
  CONSTRAINT fid_record_revisions_pk PRIMARY KEY (persistence_id)
);
