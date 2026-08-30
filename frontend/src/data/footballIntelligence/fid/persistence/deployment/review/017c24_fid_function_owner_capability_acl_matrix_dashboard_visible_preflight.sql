-- Sprint 17C.24: dashboard-visible read-only ACL-matrix preflight successor.
BEGIN TRANSACTION READ ONLY;

DO $acl_matrix$
DECLARE
  result_setting constant text := 'lbht.017c24_preflight_result';
  mode constant text := 'PREFLIGHT';
  metadata_oid oid := pg_catalog.to_regclass('fid.fid_persistence_migrations')::oid;
  metadata_total bigint := 0; metadata_014 bigint := 0; metadata_013_exact bigint := 0;
  owner_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner');
  postgres_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='postgres');
  service_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role');
  anon_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon');
  authenticated_oid oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated');
  fid_oid oid := (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='fid');
  principal_name text; principal_oid oid; table_name text; privilege_name text;
  expected boolean; direct_acl boolean; effective_acl boolean; grantable boolean;
  mismatch_count integer := 0; unresolved boolean := false;
  set_state boolean := false; create_state boolean := false; classification text;
  allowed text[]; governed_tables constant text[] := ARRAY[
    'fid_record_revisions','fid_persistence_effect_receipts','fid_persistence_audit_events',
    'fid_persistence_idempotency','fid_persistence_batches','fid_persistence_batch_operations',
    'fid_persistence_migrations'];
  privileges constant text[] := ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
BEGIN
  PERFORM pg_catalog.set_config(result_setting, 'PENDING', true);
  IF metadata_oid IS NULL THEN
    PERFORM pg_catalog.set_config(result_setting, pg_catalog.jsonb_build_object(
      'result_identity','FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT',
      'result_version','17C.24.1','mode',mode,
      'classification','FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED',
      'mismatch_count',0,'set_state',false,'create_state',false,
      'metadata_storage_present',false,'migration_014_metadata_count',0,
      'evidence_complete',false,'read_only',true,'mutation_count',0,
      'project_id','ahmorpzcaapvoymiqlkv','database','Primary Database','branch','main','sql_role','postgres')::text, true);
    RETURN;
  END IF;
  EXECUTE pg_catalog.format(
    'SELECT count(*), count(*) FILTER (WHERE migration_id LIKE %L), count(*) FILTER (WHERE migration_id=%L AND migration_sequence=13 AND expected_migration_count=13) FROM %s',
    '014%', '013_record_fid_deployment_metadata', metadata_oid::pg_catalog.regclass)
    INTO metadata_total, metadata_014, metadata_013_exact;

  unresolved := CURRENT_USER IS NULL OR SESSION_USER IS NULL OR owner_oid IS NULL OR postgres_oid IS NULL
    OR service_oid IS NULL OR anon_oid IS NULL OR authenticated_oid IS NULL OR fid_oid IS NULL;
  IF NOT unresolved THEN
    IF CURRENT_USER <> 'postgres' OR SESSION_USER <> 'postgres' THEN mismatch_count := mismatch_count + 1; END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE oid=owner_oid AND
      (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
      THEN mismatch_count := mismatch_count + 1; END IF;

    SELECT count(*)=1 AND pg_catalog.bool_and(admin_option AND NOT inherit_option),
           COALESCE(pg_catalog.bool_and(set_option),false)
      INTO expected, set_state FROM pg_catalog.pg_auth_members WHERE roleid=owner_oid AND member=postgres_oid;
    IF NOT expected THEN mismatch_count := mismatch_count + 1; END IF;

    create_state := pg_catalog.has_schema_privilege(owner_oid,fid_oid,'CREATE');
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid=fid_oid AND
      (n.nspowner=postgres_oid OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(n.nspacl) a
        WHERE a.grantee=postgres_oid AND a.privilege_type='CREATE' AND a.is_grantable)))
      THEN mismatch_count := mismatch_count + 1; END IF;

    FOR principal_name, principal_oid IN SELECT * FROM (VALUES
      ('fid_function_owner',owner_oid),('service_role',service_oid),('anon',anon_oid),
      ('authenticated',authenticated_oid),('PUBLIC',0::oid)) p(name,oid)
    LOOP
      FOREACH privilege_name IN ARRAY ARRAY['USAGE','CREATE'] LOOP
        expected := CASE WHEN principal_name='fid_function_owner' AND privilege_name='USAGE' THEN true
                         WHEN principal_name='service_role' AND privilege_name='USAGE' THEN true ELSE false END;
        SELECT COALESCE(pg_catalog.bool_or(a.privilege_type=privilege_name),false),
               COALESCE(pg_catalog.bool_or(a.privilege_type=privilege_name AND a.is_grantable),false)
          INTO direct_acl,grantable FROM pg_catalog.pg_namespace n
          LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=principal_oid WHERE n.oid=fid_oid;
        effective_acl := CASE WHEN principal_name='PUBLIC' THEN direct_acl
          ELSE pg_catalog.has_schema_privilege(principal_oid,fid_oid,privilege_name) END;
        IF privilege_name='CREATE' AND principal_name='fid_function_owner' THEN
          IF grantable OR direct_acl<>create_state OR effective_acl<>create_state THEN mismatch_count:=mismatch_count+1; END IF;
        ELSIF direct_acl<>expected OR effective_acl<>expected OR grantable THEN mismatch_count:=mismatch_count+1; END IF;
      END LOOP;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>fid_oid
      AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\' AND n.nspname<>'information_schema'
      AND n.nspname<>ALL(ARRAY['auth','storage','extensions','graphql','graphql_public','realtime','supabase_functions','vault','_analytics','_realtime','net'])
      AND pg_catalog.has_schema_privilege(owner_oid,n.oid,'CREATE')) THEN mismatch_count:=mismatch_count+1; END IF;

    IF (SELECT count(*) FROM pg_catalog.pg_class WHERE relnamespace=fid_oid AND relkind='r'
        AND relname=ANY(governed_tables))<>7
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=fid_oid AND relkind='r' AND NOT relname=ANY(governed_tables))
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=fid_oid AND relname=ANY(governed_tables) AND relkind<>'r')
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=fid_oid AND relkind IN ('v','m','f','p'))
      THEN mismatch_count:=mismatch_count+1; END IF;

    FOREACH table_name IN ARRAY governed_tables LOOP
      allowed := CASE table_name
        WHEN 'fid_record_revisions' THEN ARRAY['SELECT','INSERT']
        WHEN 'fid_persistence_effect_receipts' THEN ARRAY['SELECT','INSERT']
        WHEN 'fid_persistence_audit_events' THEN ARRAY['SELECT','INSERT']
        WHEN 'fid_persistence_idempotency' THEN ARRAY['SELECT','INSERT','UPDATE']
        WHEN 'fid_persistence_batches' THEN ARRAY['SELECT','INSERT','UPDATE']
        WHEN 'fid_persistence_batch_operations' THEN ARRAY['SELECT','INSERT','UPDATE']
        ELSE ARRAY[]::text[] END;
      IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=fid_oid
        AND c.relname=table_name AND c.relkind='r' AND c.relowner=postgres_oid) THEN mismatch_count:=mismatch_count+1; CONTINUE; END IF;
      FOR principal_name, principal_oid IN SELECT * FROM (VALUES
        ('fid_function_owner',owner_oid),('service_role',service_oid),('anon',anon_oid),
        ('authenticated',authenticated_oid),('PUBLIC',0::oid)) p(name,oid)
      LOOP
        FOREACH privilege_name IN ARRAY privileges LOOP
          expected := principal_name='fid_function_owner' AND privilege_name=ANY(allowed);
          SELECT COALESCE(pg_catalog.bool_or(a.privilege_type=privilege_name),false),
                 COALESCE(pg_catalog.bool_or(a.privilege_type=privilege_name AND a.is_grantable),false)
            INTO direct_acl,grantable FROM pg_catalog.pg_class c
            LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=principal_oid
            WHERE c.relnamespace=fid_oid AND c.relname=table_name AND c.relkind='r';
          effective_acl := CASE WHEN principal_name='PUBLIC' THEN direct_acl ELSE
            pg_catalog.has_table_privilege(principal_oid,pg_catalog.format('%I.%I','fid',table_name),privilege_name) END;
          IF direct_acl<>expected OR effective_acl<>expected OR grantable THEN mismatch_count:=mismatch_count+1; END IF;
        END LOOP;
      END LOOP;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=fid_oid AND relkind='S')
      THEN mismatch_count:=mismatch_count+1; END IF;
    IF (SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=fid_oid)<>1 THEN mismatch_count:=mismatch_count+1; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=
        pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')
        AND p.proowner=owner_oid AND p.prosecdef AND p.proconfig=ARRAY['search_path=pg_catalog, fid']) THEN mismatch_count:=mismatch_count+1; END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE pronamespace=fid_oid
        AND proname='fid_execute_prospect_identifier_issuance_transaction') THEN mismatch_count:=mismatch_count+1; END IF;

    FOR principal_name, principal_oid IN SELECT * FROM (VALUES
      ('fid_function_owner',owner_oid),('service_role',service_oid),('anon',anon_oid),
      ('authenticated',authenticated_oid),('PUBLIC',0::oid)) p(name,oid)
    LOOP
      expected := principal_name='service_role';
      SELECT COALESCE(pg_catalog.bool_or(a.privilege_type='EXECUTE'),false),
             COALESCE(pg_catalog.bool_or(a.privilege_type='EXECUTE' AND a.is_grantable),false)
        INTO direct_acl,grantable FROM pg_catalog.pg_proc p
        LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=principal_oid
        WHERE p.oid=pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)');
      effective_acl := CASE WHEN principal_name='PUBLIC' THEN direct_acl ELSE
        pg_catalog.has_function_privilege(principal_oid,
          'fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)','EXECUTE') END;
      IF direct_acl<>expected OR effective_acl<>(expected OR principal_name='fid_function_owner') OR grantable
        THEN mismatch_count:=mismatch_count+1; END IF;
    END LOOP;

    IF metadata_total<>1 OR metadata_014<>0 OR metadata_013_exact<>1
      OR pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL
      OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL
      OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL
      THEN mismatch_count:=mismatch_count+1; END IF;
  END IF;

  classification := CASE
    WHEN unresolved THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'
    WHEN mismatch_count=0 AND NOT set_state AND NOT create_state THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C24_PREFLIGHT_PASSED'
    ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED' END;
  PERFORM pg_catalog.set_config(result_setting, pg_catalog.jsonb_build_object(
    'result_identity','FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT',
    'result_version','17C.24.1','mode',mode,'classification',classification,
    'mismatch_count',mismatch_count,'set_state',set_state,'create_state',create_state,
    'metadata_storage_present',true,'migration_014_metadata_count',metadata_014,
    'evidence_complete',NOT unresolved,'read_only',true,'mutation_count',0,
    'project_id','ahmorpzcaapvoymiqlkv','database','Primary Database','branch','main','sql_role','postgres')::text, true);
END
$acl_matrix$ LANGUAGE plpgsql;

WITH payload AS (
  SELECT pg_catalog.current_setting('lbht.017c24_preflight_result', true)::jsonb AS value
)
SELECT
  value->>'result_identity' AS result_identity,
  value->>'result_version' AS result_version,
  value->>'mode' AS mode,
  value->>'classification' AS classification,
  (value->>'mismatch_count')::integer AS mismatch_count,
  (value->>'set_state')::boolean AS set_state,
  (value->>'create_state')::boolean AS create_state,
  (value->>'metadata_storage_present')::boolean AS metadata_storage_present,
  (value->>'migration_014_metadata_count')::bigint AS migration_014_metadata_count,
  (value->>'evidence_complete')::boolean AS evidence_complete,
  (value->>'read_only')::boolean AS read_only,
  (value->>'mutation_count')::integer AS mutation_count,
  value->>'project_id' AS project_id,
  value->>'database' AS database,
  value->>'branch' AS branch,
  value->>'sql_role' AS sql_role
FROM payload
WHERE value->>'result_identity'='FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_VISIBLE_RESULT'
  AND value->>'result_version'='17C.24.1'
  AND value->>'mode'='PREFLIGHT'
  AND value->>'classification'<>'PENDING';

COMMIT;
