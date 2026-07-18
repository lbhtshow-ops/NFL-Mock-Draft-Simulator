BEGIN;

LOCK TABLE fid.fid_persistence_migrations IN SHARE ROW EXCLUSIVE MODE;

DO $fid_deployment_metadata$
DECLARE
  existing_metadata fid.fid_persistence_migrations%ROWTYPE;
BEGIN
  SELECT metadata.*
  INTO existing_metadata
  FROM fid.fid_persistence_migrations AS metadata
  WHERE metadata.schema_version = 'FID-SUPABASE-SCHEMA-V1'::text
    AND metadata.deployment_environment = 'DEDICATED_NON_PRODUCTION_TEST'::text;

  IF NOT FOUND THEN
    INSERT INTO fid.fid_persistence_migrations (
      migration_id,
      schema_version,
      package_version,
      deployment_environment,
      deployment_status,
      verification_status,
      migration_sequence,
      applied_migration_ids,
      expected_migration_count,
      compatibility_floor,
      compatibility_ceiling,
      recorded_at
    ) VALUES (
      '013_record_fid_deployment_metadata'::text,
      'FID-SUPABASE-SCHEMA-V1'::text,
      'FID-SUPABASE-TEST-DEPLOYMENT-1.0.1'::text,
      'DEDICATED_NON_PRODUCTION_TEST'::text,
      'DEPLOYED'::text,
      'VERIFIED'::text,
      13::integer,
      ARRAY['fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables','fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function','fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification','013_record_fid_deployment_metadata']::text[],
      13::integer,
      'FID-SUPABASE-SCHEMA-V1'::text,
      'FID-SUPABASE-SCHEMA-V1'::text,
      '2026-07-18T03:12:05Z'::timestamptz
    );
  ELSIF ROW(
    existing_metadata.migration_id,
    existing_metadata.schema_version,
    existing_metadata.package_version,
    existing_metadata.deployment_environment,
    existing_metadata.deployment_status,
    existing_metadata.verification_status,
    existing_metadata.migration_sequence,
    existing_metadata.applied_migration_ids,
    existing_metadata.expected_migration_count,
    existing_metadata.compatibility_floor,
    existing_metadata.compatibility_ceiling,
    existing_metadata.recorded_at
  ) IS DISTINCT FROM ROW(
    '013_record_fid_deployment_metadata'::text,
    'FID-SUPABASE-SCHEMA-V1'::text,
    'FID-SUPABASE-TEST-DEPLOYMENT-1.0.1'::text,
    'DEDICATED_NON_PRODUCTION_TEST'::text,
    'DEPLOYED'::text,
    'VERIFIED'::text,
    13::integer,
    ARRAY['fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables','fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function','fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification','013_record_fid_deployment_metadata']::text[],
    13::integer,
    'FID-SUPABASE-SCHEMA-V1'::text,
    'FID-SUPABASE-SCHEMA-V1'::text,
    '2026-07-18T03:12:05Z'::timestamptz
  ) THEN
    RAISE EXCEPTION 'Conflicting FID deployment metadata exists for schema version % and environment %',
      'FID-SUPABASE-SCHEMA-V1',
      'DEDICATED_NON_PRODUCTION_TEST'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
END
$fid_deployment_metadata$;

COMMIT;
