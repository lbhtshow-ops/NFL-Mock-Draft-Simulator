-- Sprint 17C.17: read-only preflight successor.
-- The sole dynamic statement is repository-controlled and receives only an OID
-- resolved by to_regclass. It is never prepared when the optional relation is absent.
DO $preflight$
DECLARE
  metadata_oid oid := pg_catalog.to_regclass('fid.fid_persistence_migrations')::oid;
  metadata_total bigint;
  metadata_014 bigint;
  metadata_013_exact bigint;
  owner_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner');
  postgres_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
  fid_oid oid := (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'fid');
  membership_exact boolean;
  authority_exact boolean;
  boundaries_exact boolean;
  migration_objects_absent boolean;
  classification text;
BEGIN
  IF metadata_oid IS NULL THEN
    RAISE NOTICE 'classification=MIGRATION_METADATA_RELATION_MISSING metadata_storage_present=false';
    RETURN;
  END IF;

  EXECUTE pg_catalog.format(
    'SELECT count(*), count(*) FILTER (WHERE migration_id LIKE %L), count(*) FILTER (WHERE migration_id = %L AND migration_sequence = 13 AND expected_migration_count = 13) FROM %s',
    '014%', '013_record_fid_deployment_metadata', metadata_oid::pg_catalog.regclass
  ) INTO metadata_total, metadata_014, metadata_013_exact;

  SELECT count(*) = 1
         AND pg_catalog.bool_and(admin_option AND NOT inherit_option AND NOT set_option)
    INTO membership_exact
    FROM pg_catalog.pg_auth_members
   WHERE roleid = owner_oid AND member = postgres_oid;

  SELECT n.nspowner = postgres_oid OR EXISTS (
           SELECT 1
             FROM pg_catalog.aclexplode(COALESCE(n.nspacl, pg_catalog.acldefault('n', n.nspowner))) a
            WHERE a.grantee = postgres_oid AND a.privilege_type = 'CREATE' AND a.is_grantable
         )
    INTO authority_exact
    FROM pg_catalog.pg_namespace n WHERE n.oid = fid_oid;

  boundaries_exact :=
    CURRENT_USER = 'postgres' AND SESSION_USER = 'postgres'
    AND pg_catalog.current_setting('server_version_num')::integer >= 170000
    AND owner_oid IS NOT NULL AND postgres_oid IS NOT NULL AND fid_oid IS NOT NULL
    AND pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)') IS NOT NULL
    AND pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'USAGE')
    AND NOT pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'CREATE')
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_roles
       WHERE oid = owner_oid
         AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n
       WHERE n.oid <> fid_oid AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
         AND pg_catalog.has_schema_privilege(owner_oid, n.oid, 'CREATE')
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl, pg_catalog.acldefault('r', c.relowner))) a
       WHERE c.relnamespace = fid_oid AND c.relkind IN ('r','S') AND a.grantee = 0
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
       WHERE p.pronamespace = fid_oid AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
    );

  migration_objects_absent :=
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL
    AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL
    AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc
       WHERE pronamespace = fid_oid AND proname = 'fid_execute_prospect_identifier_issuance_transaction'
    );

  classification := CASE
    WHEN owner_oid IS NULL OR postgres_oid IS NULL OR fid_oid IS NULL OR membership_exact IS NULL
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_STATE_UNRESOLVED'
    WHEN metadata_total <> 1 OR metadata_014 <> 0 OR metadata_013_exact <> 1
      OR NOT migration_objects_absent OR NOT boundaries_exact OR NOT authority_exact OR NOT membership_exact
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTED_PREFLIGHT_BLOCKED'
    ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SECOND_CORRECTED_PREFLIGHT_PASSED'
  END;
  RAISE NOTICE 'classification=% metadata_storage_present=true metadata_total=% migration_014_rows=% migration_013_exact_rows=%',
    classification, metadata_total, metadata_014, metadata_013_exact;
END
$preflight$ LANGUAGE plpgsql;
