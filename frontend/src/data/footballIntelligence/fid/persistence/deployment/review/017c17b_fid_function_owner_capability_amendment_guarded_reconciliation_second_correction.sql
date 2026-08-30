-- Sprint 17C.17: read-only six-state reconciliation successor.
DO $reconciliation$
DECLARE
  metadata_oid oid := pg_catalog.to_regclass('fid.fid_persistence_migrations')::oid;
  metadata_total bigint;
  metadata_014 bigint;
  metadata_013_exact bigint;
  owner_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner');
  postgres_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
  fid_oid oid := (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'fid');
  membership_rows bigint;
  admin_true boolean;
  inherit_false boolean;
  set_true boolean;
  create_true boolean;
  protected_exact boolean;
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

  SELECT count(*), COALESCE(bool_and(admin_option), false),
         COALESCE(bool_and(NOT inherit_option), false), COALESCE(bool_and(set_option), false)
    INTO membership_rows, admin_true, inherit_false, set_true
    FROM pg_catalog.pg_auth_members
   WHERE roleid = owner_oid AND member = postgres_oid;
  create_true := pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'CREATE');

  protected_exact :=
    CURRENT_USER = 'postgres' AND SESSION_USER = 'postgres'
    AND pg_catalog.current_setting('server_version_num')::integer >= 170000
    AND membership_rows = 1 AND admin_true AND inherit_false
    AND pg_catalog.has_schema_privilege(owner_oid, fid_oid, 'USAGE')
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
    AND metadata_total = 1 AND metadata_014 = 0 AND metadata_013_exact = 1;

  classification := CASE
    WHEN owner_oid IS NULL OR postgres_oid IS NULL OR fid_oid IS NULL
      OR membership_rows IS NULL OR set_true IS NULL OR create_true IS NULL
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'
    WHEN NOT protected_exact
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED'
    WHEN NOT set_true AND NOT create_true
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_UNAPPLIED'
    WHEN set_true AND create_true
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED'
    WHEN set_true AND NOT create_true
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SET_ONLY_PARTIALLY_APPLIED'
    WHEN NOT set_true AND create_true
      THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CREATE_ONLY_PARTIALLY_APPLIED'
    ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED'
  END;
  RAISE NOTICE 'classification=% set=% create=% metadata_storage_present=true migration_014_rows=%',
    classification, set_true, create_true, metadata_014;
END
$reconciliation$ LANGUAGE plpgsql;
