-- Sprint 17C.60 transaction-local ACL diagnostic. Complete-file execution only; explicit rollback is mandatory.
BEGIN;
DO $fid_acl_017c60$
DECLARE
  setting_name constant text := 'lbht.fid_acl_017c60_diagnostic';
  function_oid oid; owner_oid oid; service_oid oid; anon_oid oid; authenticated_oid oid;
  schema_count integer; function_count integer; owner_count integer; service_count integer; anon_count integer; authenticated_count integer;
  owner_match boolean; security_match boolean; volatility_match boolean; parallel_match boolean; config_match boolean;
  owner_nologin boolean; owner_nosuper boolean; owner_nocreatedb boolean; owner_nocreaterole boolean;
  owner_noreplication boolean; owner_nobypassrls boolean; owner_noinherit boolean;
  before_public integer; before_owner integer; before_service integer; before_anon integer; before_authenticated integer;
  before_total integer; before_grantable integer; before_effective_public boolean; before_effective_owner boolean;
  before_effective_service boolean; before_effective_anon boolean; before_effective_authenticated boolean; before_owner_derived boolean;
  direct_public integer; direct_owner integer; direct_service integer; direct_anon integer; direct_authenticated integer;
  direct_total integer; grantable_total integer; effective_public boolean; effective_owner boolean; effective_service boolean;
  effective_anon boolean; effective_authenticated boolean; owner_derived boolean; acl_default_expansion boolean;
  owner_membership_path boolean; service_membership_path boolean; anon_membership_path boolean; authenticated_membership_path boolean;
  metadata_ref regclass; metadata_relation_match boolean := false; metadata_columns_match boolean := false;
  metadata_operators_match boolean := false; metadata_shape_match boolean := false; metadata_count bigint; object_count integer;
  identity_exact boolean; properties_exact boolean; restricted_owner_exact boolean; rollback_exact boolean; before_exact boolean;
  p_public_direct boolean; p_service_direct boolean; p_public_effective boolean; p_anon_effective boolean; p_authenticated_effective boolean;
  five_details jsonb; failed_count integer; detail_count integer; count_detail_reconciled boolean;
  complete_details jsonb; complete_failed_count integer; complete_detail_count integer; complete_count_reconciled boolean;
  direct_after_exact boolean; effective_fail_explained boolean; evidence_complete boolean; classification text;
  intended_executed boolean := false;
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
    INTO before_public,before_owner,before_service,before_anon,before_authenticated,before_total,before_grantable
    FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid;
    before_effective_public:=before_public>0;
    before_effective_owner:=pg_catalog.has_function_privilege(owner_oid,function_oid,'EXECUTE');
    before_effective_service:=pg_catalog.has_function_privilege(service_oid,function_oid,'EXECUTE');
    before_effective_anon:=pg_catalog.has_function_privilege(anon_oid,function_oid,'EXECUTE');
    before_effective_authenticated:=pg_catalog.has_function_privilege(authenticated_oid,function_oid,'EXECUTE');
    before_owner_derived:=owner_match IS TRUE AND before_effective_owner IS TRUE;
  END IF;
  metadata_ref:=pg_catalog.to_regclass('fid.fid_persistence_migrations')::regclass;
  IF metadata_ref IS NOT NULL THEN
    SELECT count(*)=1 INTO metadata_relation_match FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE c.oid=metadata_ref AND n.nspname='fid' AND c.relname='fid_persistence_migrations' AND c.relkind='r';
    IF metadata_relation_match THEN
      SELECT count(*)=3 AND bool_and(
        (a.attname='migration_id' AND a.atttypid='pg_catalog.text'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=0) OR
        (a.attname='migration_sequence' AND a.atttypid='pg_catalog.int4'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=0) OR
        (a.attname='applied_migration_ids' AND a.atttypid='pg_catalog._text'::pg_catalog.regtype AND a.atttypmod=-1 AND a.attndims=1))
      INTO metadata_columns_match FROM pg_catalog.pg_attribute a WHERE a.attrelid=metadata_ref AND a.attnum>0 AND NOT a.attisdropped
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
  before_exact:=identity_exact AND properties_exact AND restricted_owner_exact AND rollback_exact
    AND before_public=1 AND before_owner=1 AND before_service=0 AND before_anon=0 AND before_authenticated=0
    AND before_total=2 AND before_grantable=0 AND before_effective_public IS TRUE AND before_effective_owner IS TRUE
    AND before_effective_service IS TRUE AND before_effective_anon IS TRUE AND before_effective_authenticated IS TRUE AND before_owner_derived IS TRUE;
  IF before_exact THEN
    REVOKE EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb) TO service_role;
    intended_executed:=true;
    SELECT count(*) FILTER(WHERE a.grantee=0 AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=owner_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=service_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.grantee=anon_oid AND a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.grantee=authenticated_oid AND a.privilege_type='EXECUTE'),count(*) FILTER(WHERE a.privilege_type='EXECUTE'),
      count(*) FILTER(WHERE a.privilege_type='EXECUTE' AND a.is_grantable)
    INTO direct_public,direct_owner,direct_service,direct_anon,direct_authenticated,direct_total,grantable_total
    FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid;
    effective_public:=direct_public>0;
    effective_owner:=pg_catalog.has_function_privilege(owner_oid,function_oid,'EXECUTE');
    effective_service:=pg_catalog.has_function_privilege(service_oid,function_oid,'EXECUTE');
    effective_anon:=pg_catalog.has_function_privilege(anon_oid,function_oid,'EXECUTE');
    effective_authenticated:=pg_catalog.has_function_privilege(authenticated_oid,function_oid,'EXECUTE');
    owner_derived:=EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=function_oid AND p.proowner=owner_oid) AND effective_owner IS TRUE;
    SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>owner_oid AND pg_catalog.pg_has_role(owner_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>service_oid AND pg_catalog.pg_has_role(service_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>anon_oid AND pg_catalog.pg_has_role(anon_oid,a.grantee,'USAGE')),
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a WHERE p.oid=function_oid AND a.privilege_type='EXECUTE' AND a.grantee<>0 AND a.grantee<>authenticated_oid AND pg_catalog.pg_has_role(authenticated_oid,a.grantee,'USAGE'))
    INTO owner_membership_path,service_membership_path,anon_membership_path,authenticated_membership_path;
  END IF;
  p_public_direct:=direct_public=0; p_service_direct:=direct_service=1; p_public_effective:=effective_public IS FALSE;
  p_anon_effective:=effective_anon IS FALSE; p_authenticated_effective:=effective_authenticated IS FALSE;
  SELECT count(*)::integer,COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'predicate',identifier,'expected',expected,'observed',observed,'passed',passed,'source',source,'classification',kind) ORDER BY ordinal),'[]'::jsonb)
  INTO failed_count,five_details FROM (VALUES
    (1,'after_public_direct_execute_absent','0',direct_public::text,p_public_direct,'aclexplode','direct'),
    (2,'after_service_direct_execute_present','1',direct_service::text,p_service_direct,'aclexplode','direct'),
    (3,'after_public_effective_execute_absent','false',effective_public::text,p_public_effective,'PUBLIC ACL semantics','effective'),
    (4,'after_anon_effective_execute_absent','false',effective_anon::text,p_anon_effective,'has_function_privilege + membership path','effective/membership'),
    (5,'after_authenticated_effective_execute_absent','false',effective_authenticated::text,p_authenticated_effective,'has_function_privilege + membership path','effective/membership')
  ) p(ordinal,identifier,expected,observed,passed,source,kind) WHERE passed IS NOT TRUE;
  detail_count:=pg_catalog.jsonb_array_length(five_details); count_detail_reconciled:=failed_count=detail_count;
  SELECT count(*)::integer,COALESCE(pg_catalog.jsonb_agg(identifier ORDER BY ordinal),'[]'::jsonb) INTO complete_failed_count,complete_details FROM (VALUES
    (1,'owner_direct_execute_preserved',direct_owner=1),(2,'owner_effective_execute_preserved',effective_owner IS TRUE),
    (3,'owner_derived_authority_preserved',owner_derived IS TRUE),(4,'anon_direct_execute_absent',direct_anon=0),
    (5,'authenticated_direct_execute_absent',direct_authenticated=0),(6,'direct_acl_cardinality_exact',direct_total=2),
    (7,'zero_grant_options',grantable_total=0),(8,'function_properties_unchanged',properties_exact),
    (9,'owner_role_attributes_unchanged',restricted_owner_exact),(10,'migration_014_unchanged',rollback_exact),
    (11,'no_out_of_scope_object_drift_observed',properties_exact AND restricted_owner_exact AND rollback_exact)
  ) p(ordinal,identifier,passed) WHERE passed IS NOT TRUE;
  complete_detail_count:=pg_catalog.jsonb_array_length(complete_details); complete_count_reconciled:=complete_failed_count=complete_detail_count;
  evidence_complete:=before_exact AND intended_executed AND direct_total IS NOT NULL AND grantable_total IS NOT NULL
    AND effective_public IS NOT NULL AND effective_owner IS NOT NULL AND effective_service IS NOT NULL
    AND effective_anon IS NOT NULL AND effective_authenticated IS NOT NULL AND owner_derived IS NOT NULL
    AND owner_membership_path IS NOT NULL AND service_membership_path IS NOT NULL AND anon_membership_path IS NOT NULL
    AND authenticated_membership_path IS NOT NULL AND count_detail_reconciled AND complete_count_reconciled;
  direct_after_exact:=direct_public=0 AND direct_owner=1 AND direct_service=1 AND direct_anon=0 AND direct_authenticated=0 AND direct_total=2 AND grantable_total=0;
  effective_fail_explained:=(effective_anon IS TRUE AND anon_membership_path IS TRUE) OR (effective_authenticated IS TRUE AND authenticated_membership_path IS TRUE);
  classification:=CASE
    WHEN NOT identity_exact OR metadata_ref IS NULL OR NOT metadata_relation_match OR NOT metadata_shape_match THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_EVIDENCE_UNRESOLVED'
    WHEN NOT before_exact THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_BEFORE_STATE_MISMATCH'
    WHEN NOT properties_exact OR NOT restricted_owner_exact OR NOT rollback_exact OR complete_failed_count>0 THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_INCONSISTENT_RECOVERY_REQUIRED'
    WHEN direct_after_exact AND failed_count=0 THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_EXACT_OWNER_PRESERVING_AFTER_STATE'
    WHEN direct_after_exact AND failed_count>0 AND effective_fail_explained THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_EFFECTIVE_PRIVILEGE_ORACLE_MISMATCH'
    WHEN NOT p_public_direct OR NOT p_service_direct THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_DIRECT_ACL_MUTATION_FAILURE'
    WHEN direct_public IN(0,1) AND direct_service IN(0,1) THEN 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_PARTIAL_STATE'
    ELSE 'FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_INCONSISTENT_RECOVERY_REQUIRED' END;
  PERFORM pg_catalog.set_config(setting_name,(
    pg_catalog.jsonb_build_object('result_identity','FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_017C60','result_version','17C.60.1','classification',classification,
      'failed_after_state_predicate_count',failed_count,'failed_after_state_predicates',five_details,'detail_count',detail_count,'count_detail_reconciled',count_detail_reconciled,
      'complete_policy_failed_count',complete_failed_count,'complete_policy_failed_predicates',complete_details,'complete_policy_detail_count',complete_detail_count,'complete_policy_count_reconciled',complete_count_reconciled,
      'public_direct_execute_count',direct_public,'owner_direct_execute_count',direct_owner,'service_direct_execute_count',direct_service,'anon_direct_execute_count',direct_anon,'authenticated_direct_execute_count',direct_authenticated,'direct_execute_entry_count',direct_total,'grantable_execute_entry_count',grantable_total)
    || pg_catalog.jsonb_build_object('public_effective_execute',effective_public,'owner_effective_execute',effective_owner,'service_effective_execute',effective_service,'anon_effective_execute',effective_anon,'authenticated_effective_execute',effective_authenticated,
      'owner_derived_authority',owner_derived,'default_acl_expansion_used',acl_default_expansion,'owner_membership_execute_path',owner_membership_path,'service_membership_execute_path',service_membership_path,'anon_membership_execute_path',anon_membership_path,'authenticated_membership_execute_path',authenticated_membership_path,
      'before_state_exact',before_exact,'function_properties_unchanged',properties_exact,'owner_role_attributes_unchanged',restricted_owner_exact,'migration_014_unchanged',rollback_exact,'evidence_complete',evidence_complete)
    || pg_catalog.jsonb_build_object('transaction_local_diagnostic',true,'persistent_change_authorized',false,'commit_statement_present',false,'explicit_rollback_present',true,'rollback_required',true,
      'intended_acl_statements_executed_transaction_locally',intended_executed,'result_emitted_before_rollback',true,'persistent_mutation_count_expected',0,'remediation_success_established',false,'final_acl_policy_established',false,
      'external_target_attestation_required',true,'postgres_observed_external_target_values',false,'overall_target_verified',false)
  )::text,true);
END
$fid_acl_017c60$;
SELECT r.* FROM pg_catalog.jsonb_to_record(pg_catalog.current_setting('lbht.fid_acl_017c60_diagnostic',true)::jsonb) AS r(
  result_identity text,result_version text,classification text,failed_after_state_predicate_count integer,failed_after_state_predicates jsonb,detail_count integer,count_detail_reconciled boolean,
  complete_policy_failed_count integer,complete_policy_failed_predicates jsonb,complete_policy_detail_count integer,complete_policy_count_reconciled boolean,
  public_direct_execute_count integer,owner_direct_execute_count integer,service_direct_execute_count integer,anon_direct_execute_count integer,authenticated_direct_execute_count integer,direct_execute_entry_count integer,grantable_execute_entry_count integer,
  public_effective_execute boolean,owner_effective_execute boolean,service_effective_execute boolean,anon_effective_execute boolean,authenticated_effective_execute boolean,owner_derived_authority boolean,default_acl_expansion_used boolean,
  owner_membership_execute_path boolean,service_membership_execute_path boolean,anon_membership_execute_path boolean,authenticated_membership_execute_path boolean,before_state_exact boolean,function_properties_unchanged boolean,owner_role_attributes_unchanged boolean,migration_014_unchanged boolean,evidence_complete boolean,
  transaction_local_diagnostic boolean,persistent_change_authorized boolean,commit_statement_present boolean,explicit_rollback_present boolean,rollback_required boolean,intended_acl_statements_executed_transaction_locally boolean,result_emitted_before_rollback boolean,persistent_mutation_count_expected integer,remediation_success_established boolean,final_acl_policy_established boolean,external_target_attestation_required boolean,postgres_observed_external_target_values boolean,overall_target_verified boolean);
ROLLBACK;
