-- Sprint 17C.17: read-only post-verification successor.
DO $post_verification$
DECLARE
  metadata_oid oid := pg_catalog.to_regclass('fid.fid_persistence_migrations')::oid;
  metadata_total bigint;
  metadata_014 bigint;
  metadata_013_exact bigint;
  owner_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner');
  postgres_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
  fid_oid oid := (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'fid');
  edge_exact boolean;
  boundary_exact boolean;
  classification text;
BEGIN
  IF metadata_oid IS NULL THEN
    RAISE NOTICE 'classification=FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED reason=MIGRATION_METADATA_RELATION_MISSING';
    RETURN;
  END IF;

  EXECUTE pg_catalog.format(
    'SELECT count(*), count(*) FILTER (WHERE migration_id LIKE %L), count(*) FILTER (WHERE migration_id = %L AND migration_sequence = 13 AND expected_migration_count = 13) FROM %s',
    '014%', '013_record_fid_deployment_metadata', metadata_oid::pg_catalog.regclass
  ) INTO metadata_total, metadata_014, metadata_013_exact;

  SELECT count(*) = 1 AND bool_and(admin_option AND NOT inherit_option AND set_option)
    INTO edge_exact FROM pg_catalog.pg_auth_members
   WHERE roleid = owner_oid AND member = postgres_oid;

  boundary_exact :=
    CURRENT_USER = 'postgres' AND SESSION_USER = 'postgres'
    AND pg_catalog.current_setting('server_version_num')::integer >= 170000
    AND owner_oid IS NOT NULL AND postgres_oid IS NOT NULL AND fid_oid IS NOT NULL
    AND edge_exact
    AND pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'USAGE')
    AND pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'CREATE')
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
    AND pg_catalog.has_schema_privilege((SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role'), fid_oid, 'USAGE')
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
       WHERE c.relnamespace = fid_oid AND c.relkind = 'S'
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
    )
    AND pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)') IS NOT NULL
    AND pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL
    AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL
    AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc
       WHERE pronamespace = fid_oid AND proname = 'fid_execute_prospect_identifier_issuance_transaction'
    )
    AND metadata_total = 1 AND metadata_014 = 0 AND metadata_013_exact = 1;

  classification := CASE
    WHEN owner_oid IS NULL OR postgres_oid IS NULL OR fid_oid IS NULL OR edge_exact IS NULL
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'
    WHEN boundary_exact
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SECOND_CORRECTED_POST_VERIFICATION_PASSED'
    ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SECOND_CORRECTED_POST_VERIFICATION_FAILED'
  END;
  RAISE NOTICE 'classification=% metadata_storage_present=true metadata_total=% migration_014_rows=%',
    classification, metadata_total, metadata_014;
END
$post_verification$ LANGUAGE plpgsql;
