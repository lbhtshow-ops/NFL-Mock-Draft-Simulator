-- UNAPPLIED 17C.15 successor. Project ahmorpzcaapvoymiqlkv; DEDICATED_NON_PRODUCTION_TEST only.
-- Required CURRENT_USER and SESSION_USER: postgres. This unit is not execution authorization.
BEGIN;

DO $fid_17c15_before$
DECLARE
  v_postgres oid;
  v_owner oid;
  v_service oid;
  v_anon oid;
  v_authenticated oid;
  v_schema oid;
  v_function oid;
  v_membership pg_catalog.pg_auth_members%ROWTYPE;
  v_boundary_exact boolean;
BEGIN
  IF CURRENT_USER <> 'postgres' OR SESSION_USER <> 'postgres' OR pg_catalog.current_setting('server_version_num')::integer <> 170006 THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_IDENTITY_OR_VERSION_MISMATCH';
  END IF;
  SELECT oid INTO v_postgres FROM pg_catalog.pg_roles WHERE rolname='postgres';
  SELECT oid INTO v_owner FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner';
  SELECT oid INTO v_service FROM pg_catalog.pg_roles WHERE rolname='service_role';
  SELECT oid INTO v_anon FROM pg_catalog.pg_roles WHERE rolname='anon';
  SELECT oid INTO v_authenticated FROM pg_catalog.pg_roles WHERE rolname='authenticated';
  SELECT oid INTO v_schema FROM pg_catalog.pg_namespace WHERE nspname='fid';
  SELECT p.oid INTO v_function FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='fid' AND p.proname='fid_execute_atomic_persistence_batch'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid)='batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb';
  IF v_postgres IS NULL OR v_owner IS NULL OR v_service IS NULL OR v_anon IS NULL OR v_authenticated IS NULL OR v_schema IS NULL OR v_function IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_GOVERNED_TARGET_MISSING';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE oid=v_owner AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_OWNER_ATTRIBUTES_MISMATCH';
  END IF;
  SELECT m.* INTO v_membership FROM pg_catalog.pg_auth_members m WHERE m.roleid=v_owner AND m.member=v_postgres;
  IF NOT FOUND OR NOT v_membership.admin_option OR v_membership.inherit_option OR v_membership.set_option THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_MEMBERSHIP_BEFORE_MISMATCH';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid=v_schema AND (
      n.nspowner=v_postgres OR EXISTS (
        SELECT 1 FROM pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl
        WHERE acl.grantee=v_postgres AND acl.privilege_type='CREATE' AND acl.is_grantable
      )
    )
  ) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_SCHEMA_GRANT_AUTHORITY_MISSING';
  END IF;
  WITH governed_tables(table_name, owner_privileges) AS (
    VALUES ('fid_record_revisions',ARRAY['SELECT','INSERT']::text[]),
      ('fid_persistence_idempotency',ARRAY['SELECT','INSERT','UPDATE']::text[]),
      ('fid_persistence_batches',ARRAY['SELECT','INSERT','UPDATE']::text[]),
      ('fid_persistence_batch_operations',ARRAY['SELECT','INSERT','UPDATE']::text[]),
      ('fid_persistence_effect_receipts',ARRAY['SELECT','INSERT']::text[]),
      ('fid_persistence_audit_events',ARRAY['SELECT','INSERT']::text[]),
      ('fid_persistence_migrations',ARRAY[]::text[])
  ), privileges(privilege_name) AS (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')),
  checks AS (
    SELECT g.table_name,p.privilege_name,p.privilege_name=ANY(g.owner_privileges) AS expected_owner,
      COALESCE(pg_catalog.has_table_privilege(v_owner,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) AS observed_owner,
      COALESCE(pg_catalog.has_table_privilege(v_service,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR
      COALESCE(pg_catalog.has_table_privilege(v_anon,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR
      COALESCE(pg_catalog.has_table_privilege(v_authenticated,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) AS runtime_has_privilege
    FROM governed_tables g CROSS JOIN privileges p
  )
  SELECT pg_catalog.bool_and(expected_owner=observed_owner AND NOT runtime_has_privilege)
    AND (SELECT pg_catalog.count(*)=7 FROM pg_catalog.pg_class c WHERE c.relnamespace=v_schema AND c.relkind='r')
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) acl WHERE c.relnamespace=v_schema AND c.relkind='r' AND acl.grantee=0)
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=v_schema AND c.relkind='S')
    AND pg_catalog.has_schema_privilege(v_postgres,v_schema,'USAGE') AND pg_catalog.has_schema_privilege(v_postgres,v_schema,'CREATE')
    AND pg_catalog.has_schema_privilege(v_owner,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_owner,v_schema,'CREATE')
    AND pg_catalog.has_schema_privilege(v_service,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_service,v_schema,'CREATE')
    AND NOT pg_catalog.has_schema_privilege(v_anon,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_anon,v_schema,'CREATE')
    AND NOT pg_catalog.has_schema_privilege(v_authenticated,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_authenticated,v_schema,'CREATE')
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.oid=v_schema AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE'))
    AND pg_catalog.has_function_privilege(v_owner,v_function,'EXECUTE') AND pg_catalog.has_function_privilege(v_service,v_function,'EXECUTE')
    AND NOT pg_catalog.has_function_privilege(v_anon,v_function,'EXECUTE') AND NOT pg_catalog.has_function_privilege(v_authenticated,v_function,'EXECUTE')
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl WHERE p.oid=v_function AND acl.grantee=0 AND acl.privilege_type='EXECUTE')
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>v_schema AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND pg_catalog.has_schema_privilege(v_owner,n.oid,'CREATE'))
  INTO v_boundary_exact FROM checks;
  IF NOT COALESCE(v_boundary_exact,false) THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_PRIVILEGE_BOUNDARY_BEFORE_MISMATCH'; END IF;
  IF pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace=v_schema AND p.proname='fid_execute_prospect_identifier_issuance_transaction') OR EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') OR (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)<>1 OR NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_MIGRATION_STATE_BEFORE_MISMATCH';
  END IF;
END
$fid_17c15_before$;

GRANT CREATE ON SCHEMA fid TO fid_function_owner;
GRANT fid_function_owner TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET TRUE;

DO $fid_17c15_after$
DECLARE
  v_postgres oid; v_owner oid; v_service oid; v_anon oid; v_authenticated oid; v_schema oid; v_function oid;
  v_membership pg_catalog.pg_auth_members%ROWTYPE; v_boundary_exact boolean;
BEGIN
  SELECT oid INTO STRICT v_postgres FROM pg_catalog.pg_roles WHERE rolname='postgres';
  SELECT oid INTO STRICT v_owner FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner';
  SELECT oid INTO STRICT v_service FROM pg_catalog.pg_roles WHERE rolname='service_role';
  SELECT oid INTO STRICT v_anon FROM pg_catalog.pg_roles WHERE rolname='anon';
  SELECT oid INTO STRICT v_authenticated FROM pg_catalog.pg_roles WHERE rolname='authenticated';
  SELECT oid INTO STRICT v_schema FROM pg_catalog.pg_namespace WHERE nspname='fid';
  SELECT p.oid INTO STRICT v_function FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_atomic_persistence_batch' AND pg_catalog.pg_get_function_identity_arguments(p.oid)='batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb';
  SELECT m.* INTO STRICT v_membership FROM pg_catalog.pg_auth_members m WHERE m.roleid=v_owner AND m.member=v_postgres;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=v_owner AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)) OR NOT v_membership.admin_option OR v_membership.inherit_option OR NOT v_membership.set_option OR NOT pg_catalog.pg_has_role(v_postgres,v_owner,'SET') OR NOT pg_catalog.pg_has_role(v_postgres,v_owner,'MEMBER WITH ADMIN OPTION') THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_MEMBERSHIP_OR_ATTRIBUTES_AFTER_MISMATCH';
  END IF;
  WITH governed_tables(table_name, owner_privileges) AS (
    VALUES ('fid_record_revisions',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_idempotency',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batches',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batch_operations',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_effect_receipts',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_audit_events',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_migrations',ARRAY[]::text[])
  ), privileges(privilege_name) AS (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')),
  checks AS (SELECT g.table_name,p.privilege_name,p.privilege_name=ANY(g.owner_privileges) expected_owner,COALESCE(pg_catalog.has_table_privilege(v_owner,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) observed_owner,COALESCE(pg_catalog.has_table_privilege(v_service,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(v_anon,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(v_authenticated,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) runtime_has_privilege FROM governed_tables g CROSS JOIN privileges p)
  SELECT pg_catalog.bool_and(expected_owner=observed_owner AND NOT runtime_has_privilege)
    AND (SELECT pg_catalog.count(*)=7 FROM pg_catalog.pg_class c WHERE c.relnamespace=v_schema AND c.relkind='r')
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) acl WHERE c.relnamespace=v_schema AND c.relkind='r' AND acl.grantee=0)
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=v_schema AND c.relkind='S')
    AND pg_catalog.has_schema_privilege(v_postgres,v_schema,'USAGE') AND pg_catalog.has_schema_privilege(v_postgres,v_schema,'CREATE') AND pg_catalog.has_schema_privilege(v_owner,v_schema,'USAGE') AND pg_catalog.has_schema_privilege(v_owner,v_schema,'CREATE')
    AND pg_catalog.has_schema_privilege(v_service,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_service,v_schema,'CREATE') AND NOT pg_catalog.has_schema_privilege(v_anon,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_anon,v_schema,'CREATE') AND NOT pg_catalog.has_schema_privilege(v_authenticated,v_schema,'USAGE') AND NOT pg_catalog.has_schema_privilege(v_authenticated,v_schema,'CREATE')
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.oid=v_schema AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE'))
    AND pg_catalog.has_function_privilege(v_owner,v_function,'EXECUTE') AND pg_catalog.has_function_privilege(v_service,v_function,'EXECUTE') AND NOT pg_catalog.has_function_privilege(v_anon,v_function,'EXECUTE') AND NOT pg_catalog.has_function_privilege(v_authenticated,v_function,'EXECUTE')
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl WHERE p.oid=v_function AND acl.grantee=0 AND acl.privilege_type='EXECUTE')
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>v_schema AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND pg_catalog.has_schema_privilege(v_owner,n.oid,'CREATE'))
  INTO v_boundary_exact FROM checks;
  IF NOT COALESCE(v_boundary_exact,false) THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_PRIVILEGE_BOUNDARY_AFTER_MISMATCH'; END IF;
  IF pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace=v_schema AND p.proname='fid_execute_prospect_identifier_issuance_transaction') OR EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') OR (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)<>1 OR NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='FID_17C15_MIGRATION_STATE_AFTER_MISMATCH';
  END IF;
END
$fid_17c15_after$;

COMMIT;
