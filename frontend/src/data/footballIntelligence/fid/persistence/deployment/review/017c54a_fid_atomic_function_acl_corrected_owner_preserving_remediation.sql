-- Sprint 17C.54 corrected owner-preserving remediation. Review artifact only; execution is not authorized.
BEGIN;
DO $fid_acl_017c54$
DECLARE
  function_oid oid; owner_oid oid; service_oid oid; anon_oid oid; authenticated_oid oid;
  function_count integer; owner_count integer; service_count integer; anon_count integer; authenticated_count integer;
  before_owner oid; before_security boolean; before_volatility "char"; before_parallel "char"; before_config text[]; before_source_md5 text; before_arguments oidvector;
  metadata_count bigint; object_count integer;
  direct_public integer; direct_owner integer; direct_service integer; direct_anon integer; direct_authenticated integer; direct_total integer; grantable_total integer;
BEGIN
  IF CURRENT_USER <> 'postgres' OR SESSION_USER <> 'postgres' THEN
    RAISE EXCEPTION 'execution identity mismatch';
  END IF;

  SELECT count(*)::integer, (array_agg(p.oid ORDER BY p.oid))[1]
    INTO function_count, function_oid
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'fid'
    AND p.proname = 'fid_execute_atomic_persistence_batch'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb';
  IF function_count <> 1 OR function_oid IS NULL THEN
    RAISE EXCEPTION 'function identity unresolved';
  END IF;

  SELECT count(*)::integer, (array_agg(oid ORDER BY oid))[1] INTO owner_count, owner_oid FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner';
  SELECT count(*)::integer, (array_agg(oid ORDER BY oid))[1] INTO service_count, service_oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role';
  SELECT count(*)::integer, (array_agg(oid ORDER BY oid))[1] INTO anon_count, anon_oid FROM pg_catalog.pg_roles WHERE rolname = 'anon';
  SELECT count(*)::integer, (array_agg(oid ORDER BY oid))[1] INTO authenticated_count, authenticated_oid FROM pg_catalog.pg_roles WHERE rolname = 'authenticated';
  IF owner_count <> 1 OR service_count <> 1 OR anon_count <> 1 OR authenticated_count <> 1
     OR owner_oid IS NULL OR service_oid IS NULL OR anon_oid IS NULL OR authenticated_oid IS NULL THEN
    RAISE EXCEPTION 'governed roles unresolved';
  END IF;

  SELECT p.proowner, p.prosecdef, p.provolatile, p.proparallel, p.proconfig, pg_catalog.md5(p.prosrc), p.proargtypes
    INTO STRICT before_owner, before_security, before_volatility, before_parallel, before_config, before_source_md5, before_arguments
  FROM pg_catalog.pg_proc p WHERE p.oid = function_oid;
  IF before_owner <> owner_oid OR before_security IS NOT TRUE OR before_volatility <> 'v' OR before_parallel <> 'u'
     OR before_config IS DISTINCT FROM ARRAY['search_path=pg_catalog, fid']::text[]
     OR before_arguments <> '25 3802 25 3802 3802 3802 3802 3802'::pg_catalog.oidvector THEN
    RAISE EXCEPTION 'function property baseline mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE oid = owner_oid AND NOT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
      AND NOT rolreplication AND NOT rolbypassrls AND NOT rolinherit
  ) THEN
    RAISE EXCEPTION 'restricted-owner attribute mismatch';
  END IF;

  SELECT count(*) FILTER (WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = owner_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = service_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = anon_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = authenticated_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.privilege_type = 'EXECUTE' AND a.is_grantable)
    INTO direct_public, direct_owner, direct_service, direct_anon, direct_authenticated, direct_total, grantable_total
  FROM pg_catalog.pg_proc p
  CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
  WHERE p.oid = function_oid;
  IF direct_public <> 1 OR direct_owner <> 1 OR direct_service <> 0 OR direct_anon <> 0 OR direct_authenticated <> 0
     OR direct_total <> 2 OR grantable_total <> 0
     OR NOT pg_catalog.has_function_privilege(owner_oid, function_oid, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege(service_oid, function_oid, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege(anon_oid, function_oid, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege(authenticated_oid, function_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'before-state ACL mismatch';
  END IF;

  SELECT count(*) INTO metadata_count FROM fid.fid_persistence_migrations
  WHERE migration_id COLLATE "C" LIKE '%014%' OR migration_sequence = 14 OR 'fid-014-identifier-issuance-transaction' = ANY(applied_migration_ids);
  SELECT count(*) INTO object_count FROM (VALUES
    (pg_catalog.to_regclass('fid.fid_identifier_reservations')::oid),
    (pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger')::oid),
    (pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency')::oid),
    (pg_catalog.to_regprocedure('fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb)')::oid)
  ) objects(object_oid) WHERE object_oid IS NOT NULL;
  IF metadata_count <> 0 OR object_count <> 0 THEN
    RAISE EXCEPTION 'rollback-state mismatch';
  END IF;

  REVOKE EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) TO service_role;

  SELECT count(*) FILTER (WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = owner_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = service_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = anon_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.grantee = authenticated_oid AND a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.privilege_type = 'EXECUTE'),
         count(*) FILTER (WHERE a.privilege_type = 'EXECUTE' AND a.is_grantable)
    INTO direct_public, direct_owner, direct_service, direct_anon, direct_authenticated, direct_total, grantable_total
  FROM pg_catalog.pg_proc p
  CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
  WHERE p.oid = function_oid;
  IF direct_public <> 0 OR direct_owner <> 1 OR direct_service <> 1 OR direct_anon <> 0 OR direct_authenticated <> 0
     OR direct_total <> 2 OR grantable_total <> 0
     OR NOT pg_catalog.has_function_privilege(owner_oid, function_oid, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege(service_oid, function_oid, 'EXECUTE')
     OR pg_catalog.has_function_privilege(anon_oid, function_oid, 'EXECUTE')
     OR pg_catalog.has_function_privilege(authenticated_oid, function_oid, 'EXECUTE')
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid = function_oid AND p.proowner = owner_oid) THEN
    RAISE EXCEPTION 'after-state ACL mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid = function_oid AND p.proowner = before_owner
      AND p.prosecdef = before_security AND p.provolatile = before_volatility AND p.proparallel = before_parallel
      AND p.proconfig IS NOT DISTINCT FROM before_config AND pg_catalog.md5(p.prosrc) = before_source_md5
      AND p.proargtypes = before_arguments
  ) THEN
    RAISE EXCEPTION 'protected function property changed during remediation';
  END IF;
END
$fid_acl_017c54$;
COMMIT;
