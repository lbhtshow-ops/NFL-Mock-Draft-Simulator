-- Sprint 17C.58 failed after-state read-only reconciliation. Execution is not authorized by this SQL artifact.
BEGIN TRANSACTION READ ONLY;
DO $fid_acl_017c58$
DECLARE
  setting_name constant text := 'lbht.fid_acl_017c58_reconciliation';
  schema_count integer; function_count integer; function_oid oid; owner_count integer; owner_oid oid;
  service_count integer; service_oid oid; anon_count integer; anon_oid oid; authenticated_count integer; authenticated_oid oid;
  owner_match boolean; security_match boolean; volatility_match boolean; parallel_match boolean; config_match boolean;
  owner_nologin boolean; owner_nosuper boolean; owner_nocreatedb boolean; owner_nocreaterole boolean;
  owner_noreplication boolean; owner_nobypassrls boolean; owner_noinherit boolean;
  acl_default_expansion boolean; direct_public integer; direct_owner integer; direct_service integer;
  direct_anon integer; direct_authenticated integer; direct_total integer; grantable_total integer;
  effective_public boolean; effective_owner boolean; effective_service boolean; effective_anon boolean; effective_authenticated boolean;
  owner_derived boolean; owner_membership_path boolean; service_membership_path boolean;
  anon_membership_path boolean; authenticated_membership_path boolean;
  metadata_ref regclass; metadata_relation_match boolean := false; metadata_columns_match boolean := false;
  metadata_operators_match boolean := false; metadata_shape_match boolean := false; metadata_count bigint; object_count integer;
  details jsonb; failed_count integer; detail_count integer; counts_reconciled boolean;
  identity_exact boolean; properties_exact boolean; restricted_owner_exact boolean; rollback_exact boolean; evidence_complete boolean;
  before_exact boolean; direct_after_exact boolean; effective_after_exact boolean; applied_exact boolean;
  partial_exact boolean; oracle_mismatch boolean; classification text;
BEGIN
  PERFORM pg_catalog.set_config(setting_name,'{"sentinel":"PENDING"}',true);
  SELECT count(*)::integer INTO schema_count FROM pg_catalog.pg_namespace WHERE nspname='fid';
  SELECT count(*)::integer,(array_agg(p.oid ORDER BY p.oid))[1] INTO function_count,function_oid
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='fid' AND p.proname='fid_execute_atomic_persistence_batch'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid)='batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb';
  SELECT count(*)::integer,(array_agg(oid ORDER BY oid))[1] INTO owner_count,owner_oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner';
  SELECT count(*)::integer,(array_agg(oid ORDER BY oid))[1] INTO service_count,service_oid FROM pg_catalog.pg_roles WHERE rolname='service_role';
  SELECT count(*)::integer,(array_agg(oid ORDER BY oid))[1] INTO anon_count,anon_oid FROM pg_catalog.pg_roles WHERE rolname='anon';
  SELECT count(*)::integer,(array_agg(oid ORDER BY oid))[1] INTO authenticated_count,authenticated_oid FROM pg_catalog.pg_roles WHERE rolname='authenticated';
  identity_exact:=schema_count=1 AND function_count=1 AND function_oid IS NOT NULL AND owner_count=1 AND owner_oid IS NOT NULL
    AND service_count=1 AND service_oid IS NOT NULL AND anon_count=1 AND anon_oid IS NOT NULL
    AND authenticated_count=1 AND authenticated_oid IS NOT NULL;
  IF owner_count=1 THEN
    SELECT NOT rolcanlogin,NOT rolsuper,NOT rolcreatedb,NOT rolcreaterole,NOT rolreplication,NOT rolbypassrls,NOT rolinherit
      INTO owner_nologin,owner_nosuper,owner_nocreatedb,owner_nocreaterole,owner_noreplication,owner_nobypassrls,owner_noinherit
    FROM pg_catalog.pg_roles WHERE oid=owner_oid;
  END IF;
  IF function_count=1 THEN
    SELECT p.proowner=owner_oid,p.prosecdef,p.provolatile='v',p.proparallel='u',
      p.proconfig IS NOT DISTINCT FROM ARRAY['search_path=pg_catalog, fid']::text[],p.proacl IS NULL
      INTO owner_match,security_match,volatility_match,parallel_match,config_match,acl_default_expansion
    FROM pg_catalog.pg_proc p WHERE p.oid=function_oid;
  END IF;
  IF identity_exact THEN
    SELECT count(*) FILTER(WHERE a.grantee=0 AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=owner_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=service_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=anon_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=authenticated_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE' AND a.is_grantable)
      INTO direct_public,direct_owner,direct_service,direct_anon,direct_authenticated,direct_total,grantable_total
    FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid;
    effective_public:=direct_public>0;
    effective_owner:=pg_catalog.has_function_privilege(owner_oid,function_oid,'EXECUTE');
    effective_service:=pg_catalog.has_function_privilege(service_oid,function_oid,'EXECUTE');
    effective_anon:=pg_catalog.has_function_privilege(anon_oid,function_oid,'EXECUTE');
    effective_authenticated:=pg_catalog.has_function_privilege(authenticated_oid,function_oid,'EXECUTE');
    owner_derived:=owner_match IS TRUE AND effective_owner IS TRUE;
    SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>owner_oid AND pg_catalog.pg_has_role(owner_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>service_oid AND pg_catalog.pg_has_role(service_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>anon_oid AND pg_catalog.pg_has_role(anon_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>authenticated_oid AND pg_catalog.pg_has_role(authenticated_oid,a.grantee,'USAGE'))
      INTO owner_membership_path,service_membership_path,anon_membership_path,authenticated_membership_path;
  END IF;
  metadata_ref:=pg_catalog.to_regclass('fid.fid_persistence_migrations')::regclass;
  IF metadata_ref IS NOT NULL THEN
    SELECT count(*)=1 INTO metadata_relation_match FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE c.oid=metadata_ref AND n.nspname='fid' AND c.relname='fid_persistence_migrations' AND c.relkind='r';
    IF metadata_relation_match THEN
      SELECT count(*)=3 AND bool_and(
        (a.attname='migration_id' AND a.atttypid='pg_catalog.text'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=0)
        OR (a.attname='migration_sequence' AND a.atttypid='pg_catalog.int4'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=0)
        OR (a.attname='applied_migration_ids' AND a.atttypid='pg_catalog._text'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=1)
      ) INTO metadata_columns_match FROM pg_catalog.pg_attribute a
      WHERE a.attrelid=metadata_ref AND a.attnum>0 AND NOT a.attisdropped
        AND a.attname=ANY(ARRAY['migration_id','migration_sequence','applied_migration_ids']::name[]);
      metadata_operators_match:=pg_catalog.to_regoperator('pg_catalog.~~(text,text)') IS NOT NULL
        AND pg_catalog.to_regoperator('pg_catalog.=(integer,integer)') IS NOT NULL
        AND pg_catalog.to_regoperator('pg_catalog.=(text,text)') IS NOT NULL;
      metadata_shape_match:=metadata_columns_match AND metadata_operators_match;
      IF metadata_shape_match THEN
        EXECUTE pg_catalog.format('SELECT count(*) FROM %s WHERE migration_id COLLATE "C" LIKE %L OR migration_sequence=14 OR %L=ANY(applied_migration_ids)',metadata_ref,'%014%','fid-014-identifier-issuance-transaction') INTO metadata_count;
      END IF;
    END IF;
  END IF;
  SELECT count(*)::integer INTO object_count FROM (VALUES
    (pg_catalog.to_regclass('fid.fid_identifier_reservations')::oid),(pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger')::oid),
    (pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency')::oid),(pg_catalog.to_regprocedure('fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb)')::oid)
  ) objects(object_oid) WHERE object_oid IS NOT NULL;
  properties_exact:=owner_match IS TRUE AND security_match IS TRUE AND volatility_match IS TRUE AND parallel_match IS TRUE AND config_match IS TRUE;
  restricted_owner_exact:=owner_nologin IS TRUE AND owner_nosuper IS TRUE AND owner_nocreatedb IS TRUE AND owner_nocreaterole IS TRUE
    AND owner_noreplication IS TRUE AND owner_nobypassrls IS TRUE AND owner_noinherit IS TRUE;
  rollback_exact:=metadata_ref IS NOT NULL AND metadata_relation_match AND metadata_shape_match AND metadata_count=0 AND object_count=0;
  SELECT count(*)::integer,COALESCE(pg_catalog.jsonb_agg(label ORDER BY ordinal),'[]'::jsonb) INTO failed_count,details FROM (VALUES
    (1,'after_public_direct_execute_absent',direct_public=0),(2,'after_owner_direct_acl_entry_present',direct_owner=1),
    (3,'after_service_direct_execute_present',direct_service=1),(4,'after_anon_direct_execute_absent',direct_anon=0),
    (5,'after_authenticated_direct_execute_absent',direct_authenticated=0),(6,'after_direct_execute_entry_count_two',direct_total=2),
    (7,'after_no_grantable_execute',grantable_total=0),(8,'after_public_effective_execute_absent',effective_public IS FALSE),
    (9,'after_owner_effective_execute_present',effective_owner),(10,'after_service_effective_execute_present',effective_service),
    (11,'after_anon_effective_execute_absent',effective_anon IS FALSE),(12,'after_authenticated_effective_execute_absent',effective_authenticated IS FALSE),
    (13,'after_owner_derived_authority_present',owner_derived)
  ) predicates(ordinal,label,passed) WHERE passed IS NOT TRUE;
  detail_count:=pg_catalog.jsonb_array_length(details);
  counts_reconciled:=failed_count IS NOT NULL AND detail_count IS NOT NULL AND failed_count=detail_count;
  evidence_complete:=identity_exact AND properties_exact AND restricted_owner_exact AND metadata_ref IS NOT NULL
    AND metadata_relation_match AND metadata_shape_match AND metadata_count IS NOT NULL AND object_count IS NOT NULL
    AND direct_total IS NOT NULL AND grantable_total IS NOT NULL AND effective_public IS NOT NULL AND effective_owner IS NOT NULL
    AND effective_service IS NOT NULL AND effective_anon IS NOT NULL AND effective_authenticated IS NOT NULL
    AND owner_derived IS NOT NULL AND owner_membership_path IS NOT NULL AND service_membership_path IS NOT NULL
    AND anon_membership_path IS NOT NULL AND authenticated_membership_path IS NOT NULL AND counts_reconciled;
  before_exact:=evidence_complete AND rollback_exact AND direct_public=1 AND direct_owner=1 AND direct_service=0
    AND direct_anon=0 AND direct_authenticated=0 AND direct_total=2 AND grantable_total=0 AND effective_public IS TRUE
    AND effective_owner IS TRUE AND effective_service IS TRUE AND effective_anon IS TRUE AND effective_authenticated IS TRUE AND owner_derived IS TRUE;
  direct_after_exact:=evidence_complete AND rollback_exact AND direct_public=0 AND direct_owner=1 AND direct_service=1
    AND direct_anon=0 AND direct_authenticated=0 AND direct_total=2 AND grantable_total=0;
  effective_after_exact:=effective_public IS FALSE AND effective_owner IS TRUE AND effective_service IS TRUE
    AND effective_anon IS FALSE AND effective_authenticated IS FALSE AND owner_derived IS TRUE;
  applied_exact:=direct_after_exact AND effective_after_exact;
  oracle_mismatch:=direct_after_exact AND effective_public IS FALSE AND effective_owner IS TRUE AND effective_service IS TRUE
    AND owner_derived IS TRUE AND (effective_anon IS TRUE OR effective_authenticated IS TRUE)
    AND (effective_anon IS FALSE OR anon_membership_path IS TRUE)
    AND (effective_authenticated IS FALSE OR authenticated_membership_path IS TRUE);
  partial_exact:=evidence_complete AND rollback_exact AND direct_public IN(0,1) AND direct_owner=1 AND direct_service IN(0,1)
    AND direct_anon=0 AND direct_authenticated=0 AND direct_total=direct_public+direct_owner+direct_service AND grantable_total=0
    AND NOT before_exact AND NOT direct_after_exact;
  classification:=CASE
    WHEN NOT evidence_complete THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_EVIDENCE_UNRESOLVED'
    WHEN NOT properties_exact OR NOT restricted_owner_exact OR NOT rollback_exact THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED'
    WHEN before_exact THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_EXACT_UNCHANGED_PRE_REMEDIATION_STATE'
    WHEN applied_exact THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_OWNER_PRESERVING_STATE_APPLIED'
    WHEN oracle_mismatch THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_AFTER_STATE_ORACLE_MISMATCH'
    WHEN partial_exact THEN 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_PARTIALLY_APPLIED'
    ELSE 'FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED' END;
  PERFORM pg_catalog.set_config(setting_name,(
    pg_catalog.jsonb_build_object(
      'result_identity','FID_ATOMIC_FUNCTION_ACL_FAILED_AFTER_STATE_RECONCILIATION_017C58','result_version','17C.58.1','mode','READ_ONLY_FAILED_AFTER_STATE_RECONCILIATION','classification',classification,
      'failed_after_state_predicate_count',failed_count,'failed_after_state_predicates',details,'detail_count',detail_count,'detail_count_matches_failed_count',counts_reconciled,
      'fid_schema_resolution_count',schema_count,'function_identity_resolution_count',function_count,'function_owner_role_resolution_count',owner_count,'service_role_resolution_count',service_count,'anon_role_resolution_count',anon_count,'authenticated_role_resolution_count',authenticated_count,
      'function_owner_match',owner_match,'security_definer_match',security_match,'volatility_match',volatility_match,'parallel_safety_match',parallel_match,'search_path_and_function_config_match',config_match)
    || pg_catalog.jsonb_build_object(
      'owner_nologin',owner_nologin,'owner_nosuperuser',owner_nosuper,'owner_nocreatedb',owner_nocreatedb,'owner_nocreaterole',owner_nocreaterole,'owner_noreplication',owner_noreplication,'owner_nobypassrls',owner_nobypassrls,'owner_noinherit',owner_noinherit,
      'acl_default_expansion_used',acl_default_expansion,'public_direct_execute_count',direct_public,'owner_direct_execute_count',direct_owner,'service_direct_execute_count',direct_service,'anon_direct_execute_count',direct_anon,'authenticated_direct_execute_count',direct_authenticated,'direct_execute_entry_count',direct_total,'grantable_execute_entry_count',grantable_total,
      'public_effective_execute',effective_public,'owner_effective_execute',effective_owner,'service_effective_execute',effective_service,'anon_effective_execute',effective_anon,'authenticated_effective_execute',effective_authenticated,'owner_derived_authority',owner_derived)
    || pg_catalog.jsonb_build_object(
      'owner_membership_execute_path',owner_membership_path,'service_membership_execute_path',service_membership_path,'anon_membership_execute_path',anon_membership_path,'authenticated_membership_execute_path',authenticated_membership_path,
      'metadata_storage_present',metadata_ref IS NOT NULL,'metadata_relation_compatible',metadata_relation_match,'metadata_shape_compatible',metadata_shape_match,'migration_014_metadata_count',metadata_count,'migration_014_object_count',object_count,
      'exact_unchanged_pre_remediation_state',before_exact,'direct_owner_preserving_after_state',direct_after_exact,'effective_owner_preserving_after_state',effective_after_exact,'owner_preserving_state_applied',applied_exact,'after_state_oracle_mismatch',oracle_mismatch,'partially_applied',partial_exact,
      'evidence_complete',evidence_complete,'external_target_attestation_required',true,'postgres_observed_external_target_values',false,'overall_target_verified',false,'read_only',true,'mutation_count',0)
  )::text,true);
END
$fid_acl_017c58$;
SELECT r.* FROM pg_catalog.jsonb_to_record(pg_catalog.current_setting('lbht.fid_acl_017c58_reconciliation',true)::jsonb) AS r(
  result_identity text,result_version text,mode text,classification text,failed_after_state_predicate_count integer,failed_after_state_predicates jsonb,detail_count integer,detail_count_matches_failed_count boolean,
  fid_schema_resolution_count integer,function_identity_resolution_count integer,function_owner_role_resolution_count integer,service_role_resolution_count integer,anon_role_resolution_count integer,authenticated_role_resolution_count integer,
  function_owner_match boolean,security_definer_match boolean,volatility_match boolean,parallel_safety_match boolean,search_path_and_function_config_match boolean,
  owner_nologin boolean,owner_nosuperuser boolean,owner_nocreatedb boolean,owner_nocreaterole boolean,owner_noreplication boolean,owner_nobypassrls boolean,owner_noinherit boolean,
  acl_default_expansion_used boolean,public_direct_execute_count integer,owner_direct_execute_count integer,service_direct_execute_count integer,anon_direct_execute_count integer,authenticated_direct_execute_count integer,direct_execute_entry_count integer,grantable_execute_entry_count integer,
  public_effective_execute boolean,owner_effective_execute boolean,service_effective_execute boolean,anon_effective_execute boolean,authenticated_effective_execute boolean,owner_derived_authority boolean,
  owner_membership_execute_path boolean,service_membership_execute_path boolean,anon_membership_execute_path boolean,authenticated_membership_execute_path boolean,
  metadata_storage_present boolean,metadata_relation_compatible boolean,metadata_shape_compatible boolean,migration_014_metadata_count bigint,migration_014_object_count integer,
  exact_unchanged_pre_remediation_state boolean,direct_owner_preserving_after_state boolean,effective_owner_preserving_after_state boolean,owner_preserving_state_applied boolean,after_state_oracle_mismatch boolean,partially_applied boolean,
  evidence_complete boolean,external_target_attestation_required boolean,postgres_observed_external_target_values boolean,overall_target_verified boolean,read_only boolean,mutation_count integer);
COMMIT;
