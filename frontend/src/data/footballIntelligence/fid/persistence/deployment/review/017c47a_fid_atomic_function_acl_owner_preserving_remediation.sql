-- Sprint 17C.47 owner-preserving remediation. Execution is not authorized by this artifact.
BEGIN;
DO $fid_acl_owner_preserving$
DECLARE
  function_oid oid; owner_oid oid; service_oid oid; anon_oid oid; authenticated_oid oid; exact_count integer;
  metadata_count bigint; object_count integer; direct_public integer; direct_owner integer; direct_service integer; direct_anon integer; direct_authenticated integer; direct_total integer; grantable_total integer;
  before_owner oid; before_security boolean; before_config text[]; before_source_md5 text;
BEGIN
  IF CURRENT_USER<>'postgres' OR SESSION_USER<>'postgres' THEN RAISE EXCEPTION 'Exact postgres execution identity required'; END IF;
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls AND NOT rolinherit;
  SELECT oid INTO service_oid FROM pg_catalog.pg_roles WHERE rolname='service_role'; SELECT oid INTO anon_oid FROM pg_catalog.pg_roles WHERE rolname='anon'; SELECT oid INTO authenticated_oid FROM pg_catalog.pg_roles WHERE rolname='authenticated';
  SELECT count(*)::integer,(array_agg(p.oid))[1],(array_agg(p.proowner))[1],bool_and(p.prosecdef),(array_agg(p.proconfig))[1],(array_agg(pg_catalog.md5(p.prosrc)))[1]
    INTO exact_count,function_oid,before_owner,before_security,before_config,before_source_md5
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='fid' AND p.proname='fid_execute_atomic_persistence_batch'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid)='batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb';
  IF exact_count<>1 OR function_oid IS NULL OR owner_oid IS NULL OR service_oid IS NULL OR anon_oid IS NULL OR authenticated_oid IS NULL OR before_owner<>owner_oid OR before_security IS NOT TRUE OR before_config IS DISTINCT FROM ARRAY['search_path=pg_catalog, fid']::text[]
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=function_oid AND p.provolatile='v' AND p.proparallel='u') THEN RAISE EXCEPTION 'Governed function or restricted-owner baseline mismatch'; END IF;
  SELECT count(*) FILTER(WHERE a.grantee=0 AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=owner_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=service_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=anon_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=authenticated_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE' AND a.is_grantable)
    INTO direct_public,direct_owner,direct_service,direct_anon,direct_authenticated,direct_total,grantable_total
  FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid;
  IF direct_public<>1 OR direct_owner<>1 OR direct_service<>0 OR direct_anon<>0 OR direct_authenticated<>0 OR direct_total<>2 OR grantable_total<>0 OR NOT pg_catalog.has_function_privilege(anon_oid,function_oid,'EXECUTE') OR NOT pg_catalog.has_function_privilege(authenticated_oid,function_oid,'EXECUTE') OR NOT pg_catalog.has_function_privilege(service_oid,function_oid,'EXECUTE') OR NOT pg_catalog.has_function_privilege(owner_oid,function_oid,'EXECUTE') THEN RAISE EXCEPTION 'Captured before-state ACL mismatch'; END IF;
  SELECT count(*) INTO metadata_count FROM fid.fid_persistence_migrations WHERE migration_id COLLATE "C" LIKE '%014%' OR migration_sequence=14 OR 'fid-014-identifier-issuance-transaction'=ANY(applied_migration_ids);
  SELECT count(*) INTO object_count FROM (VALUES(pg_catalog.to_regclass('fid.fid_identifier_reservations')::oid),(pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger')::oid),(pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency')::oid),(pg_catalog.to_regprocedure('fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb)')::oid)) objects(object_oid) WHERE object_oid IS NOT NULL;
  IF metadata_count<>0 OR object_count<>0 THEN RAISE EXCEPTION 'Migration 014 is not fully rolled back'; END IF;
  REVOKE EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) TO service_role;
  SELECT count(*) FILTER(WHERE a.grantee=0 AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=owner_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=service_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=anon_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=authenticated_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE' AND a.is_grantable)
    INTO direct_public,direct_owner,direct_service,direct_anon,direct_authenticated,direct_total,grantable_total
  FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid;
  IF direct_public<>0 OR direct_owner<>1 OR direct_service<>1 OR direct_anon<>0 OR direct_authenticated<>0 OR direct_total<>2 OR grantable_total<>0 OR pg_catalog.has_function_privilege(anon_oid,function_oid,'EXECUTE') OR pg_catalog.has_function_privilege(authenticated_oid,function_oid,'EXECUTE') OR NOT pg_catalog.has_function_privilege(service_oid,function_oid,'EXECUTE') OR NOT pg_catalog.has_function_privilege(owner_oid,function_oid,'EXECUTE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=function_oid AND p.proowner=before_owner AND p.prosecdef=before_security AND p.provolatile='v' AND p.proparallel='u' AND p.proconfig IS NOT DISTINCT FROM before_config AND pg_catalog.md5(p.prosrc)=before_source_md5) THEN RAISE EXCEPTION 'Owner-preserving after-state verification failed'; END IF;
END
$fid_acl_owner_preserving$;
COMMIT;
