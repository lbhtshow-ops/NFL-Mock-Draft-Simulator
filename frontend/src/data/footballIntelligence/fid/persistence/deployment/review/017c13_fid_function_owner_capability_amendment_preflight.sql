WITH membership AS (
  SELECT m.admin_option, m.inherit_option, m.set_option FROM pg_catalog.pg_auth_members m
  JOIN pg_catalog.pg_roles r ON r.oid=m.roleid JOIN pg_catalog.pg_roles u ON u.oid=m.member
  WHERE r.rolname='fid_function_owner' AND u.rolname='postgres'
), owner_role AS (
  SELECT NOT (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit) AS restricted_attributes_exact FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner'
), state AS (
  SELECT CURRENT_USER='postgres' AND SESSION_USER='postgres' AS identity_exact,
    pg_catalog.current_setting('server_version_num')::integer = 170006 AS postgresql_17,
    EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='fid') AS schema_exists,
    EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='postgres') AS deployment_role_exists,
    EXISTS(SELECT 1 FROM owner_role) AS owner_role_exists,
    COALESCE((SELECT admin_option AND NOT inherit_option AND NOT set_option FROM membership),false) AS membership_before_exact,
    COALESCE((SELECT restricted_attributes_exact FROM owner_role),false) AS owner_attributes_exact,
    pg_catalog.has_schema_privilege('postgres','fid','USAGE') AND pg_catalog.has_schema_privilege('postgres','fid','CREATE') AS deployment_schema_authority,
    pg_catalog.has_schema_privilege('fid_function_owner','fid','USAGE') AND NOT pg_catalog.has_schema_privilege('fid_function_owner','fid','CREATE') AS owner_schema_before_exact,
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction') AND NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') AND (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)=1 AND EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) AS migration_014_absent
)
SELECT 'ahmorpzcaapvoymiqlkv'::text AS project_id, 'DEDICATED_NON_PRODUCTION_TEST'::text AS environment,
  CASE WHEN identity_exact AND postgresql_17 AND schema_exists AND deployment_role_exists AND owner_role_exists AND membership_before_exact AND owner_attributes_exact AND deployment_schema_authority AND owner_schema_before_exact AND migration_014_absent THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_PASSED' ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_BLOCKED' END AS classification,
  identity_exact, postgresql_17, schema_exists, deployment_role_exists, owner_role_exists, membership_before_exact, owner_attributes_exact, deployment_schema_authority, owner_schema_before_exact, migration_014_absent
FROM state;
