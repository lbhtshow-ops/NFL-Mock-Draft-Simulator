WITH facts AS (
  SELECT CURRENT_USER='postgres' AND SESSION_USER='postgres' AS identity_exact,
    pg_catalog.pg_has_role('postgres','fid_function_owner','SET') AS set_true,
    pg_catalog.pg_has_role('postgres','fid_function_owner','MEMBER WITH ADMIN OPTION') AS admin_true,
    COALESCE((SELECT NOT m.inherit_option FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.roleid JOIN pg_catalog.pg_roles u ON u.oid=m.member WHERE r.rolname='fid_function_owner' AND u.rolname='postgres'),false) AS inherit_false,
    pg_catalog.has_schema_privilege('fid_function_owner','fid','USAGE') AS usage_true,
    pg_catalog.has_schema_privilege('fid_function_owner','fid','CREATE') AS create_true,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner' AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)) AS restricted_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname<>'fid' AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND pg_catalog.has_schema_privilege('fid_function_owner',n.oid,'CREATE')) AS no_other_create,
    NOT pg_catalog.has_schema_privilege('service_role','fid','CREATE') AND NOT pg_catalog.has_schema_privilege('anon','fid','USAGE') AND NOT pg_catalog.has_schema_privilege('anon','fid','CREATE') AND NOT pg_catalog.has_schema_privilege('authenticated','fid','USAGE') AND NOT pg_catalog.has_schema_privilege('authenticated','fid','CREATE') AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.nspname='fid' AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE')) AS runtime_boundary_exact,
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction') AND NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') AND (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)=1 AND EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) AS migration_014_absent
)
SELECT CASE WHEN identity_exact AND set_true AND admin_true AND inherit_false AND usage_true AND create_true AND restricted_exact AND no_other_create AND runtime_boundary_exact AND migration_014_absent THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_POST_VERIFICATION_PASSED' ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_POST_VERIFICATION_FAILED' END AS classification,
  identity_exact, set_true, admin_true, inherit_false, usage_true, create_true,
  set_true AND admin_true AND create_true AS ownership_transfer_capability,
  restricted_exact, no_other_create, runtime_boundary_exact, migration_014_absent
FROM facts;
