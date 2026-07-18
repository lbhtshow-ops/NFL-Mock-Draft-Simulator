CREATE TABLE fid.fid_persistence_migrations (
  migration_id text NOT NULL, schema_version text NOT NULL, package_version text NOT NULL,
  deployment_environment text NOT NULL, deployment_status text NOT NULL, verification_status text NOT NULL,
  migration_sequence integer NOT NULL, applied_migration_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  expected_migration_count integer NOT NULL, compatibility_floor text NOT NULL, compatibility_ceiling text NOT NULL,
  recorded_at timestamptz NOT NULL, CONSTRAINT fid_persistence_migrations_pk PRIMARY KEY (migration_id)
);
