CREATE TABLE fid.fid_identifier_reservations (
  reservation_ref uuid NOT NULL,
  transaction_ref uuid NOT NULL,
  candidate_identifier text COLLATE "C" NOT NULL,
  identifier_layer text NOT NULL,
  namespace text NOT NULL,
  request_ref text NOT NULL,
  operation_ref text NOT NULL,
  authorization_ref text NOT NULL,
  generation_invocation_ref text NOT NULL,
  generation_result_ref text NOT NULL,
  strategy_ref text NOT NULL,
  convention_ref text NOT NULL,
  generator_port_ref text NOT NULL,
  adapter_ref text NOT NULL,
  provider_ref text NOT NULL,
  attempt_number integer NOT NULL,
  attempt_policy_ref text NOT NULL,
  environment text NOT NULL,
  actor_ref text NOT NULL,
  expected_policy_refs jsonb NOT NULL,
  audit_refs jsonb NOT NULL,
  reservation_status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT fid_identifier_reservations_pkey PRIMARY KEY (reservation_ref),
  CONSTRAINT fid_identifier_reservations_transaction_unique UNIQUE (transaction_ref),
  CONSTRAINT fid_identifier_reservations_operation_unique UNIQUE (operation_ref),
  CONSTRAINT fid_identifier_reservations_generation_result_unique UNIQUE (generation_result_ref),
  CONSTRAINT fid_identifier_reservations_namespace_candidate_unique UNIQUE (namespace,candidate_identifier),
  CONSTRAINT fid_identifier_reservations_transaction_binding_unique UNIQUE (reservation_ref,transaction_ref,namespace,candidate_identifier),
  CONSTRAINT fid_identifier_reservations_refs_nonempty CHECK (request_ref<>'' AND operation_ref<>'' AND authorization_ref<>'' AND generation_invocation_ref<>'' AND generation_result_ref<>'' AND strategy_ref<>'' AND convention_ref<>'' AND generator_port_ref<>'' AND adapter_ref<>'' AND provider_ref<>'' AND attempt_policy_ref<>'' AND actor_ref<>''),
  CONSTRAINT fid_identifier_reservations_references_distinct CHECK (reservation_ref<>transaction_ref),
  CONSTRAINT fid_identifier_reservations_attempt_positive CHECK (attempt_number>0),
  CONSTRAINT fid_identifier_reservations_environment_check CHECK (environment IN ('TEST','DEVELOPMENT')),
  CONSTRAINT fid_identifier_reservations_status_check CHECK (reservation_status='RESERVED_AND_ISSUED'),
  CONSTRAINT fid_identifier_reservations_policy_refs_check CHECK (jsonb_typeof(expected_policy_refs)='array' AND jsonb_array_length(expected_policy_refs)>=2),
  CONSTRAINT fid_identifier_reservations_audit_refs_check CHECK (jsonb_typeof(audit_refs)='array' AND jsonb_array_length(audit_refs)>0),
  CONSTRAINT fid_identifier_reservations_candidate_check CHECK (
    (namespace='person' AND identifier_layer='PERSON' AND length(candidate_identifier)=29 AND candidate_identifier ~ '^person:[A-Za-z0-9_-]{22}$') OR
    (namespace='player' AND identifier_layer='PLAYER' AND length(candidate_identifier)=29 AND candidate_identifier ~ '^player:[A-Za-z0-9_-]{22}$') OR
    (namespace='prospect' AND identifier_layer='PROSPECT' AND length(candidate_identifier)=31 AND candidate_identifier ~ '^prospect:[A-Za-z0-9_-]{22}$') OR
    (namespace='prospect-profile' AND identifier_layer='PROSPECT_PROFILE' AND length(candidate_identifier)=39 AND candidate_identifier ~ '^prospect-profile:[A-Za-z0-9_-]{22}$')
  )
);

CREATE TABLE fid.fid_identifier_issuance_ledger (
  issuance_ledger_ref uuid NOT NULL,
  transaction_ref uuid NOT NULL,
  reservation_ref uuid NOT NULL,
  candidate_identifier text COLLATE "C" NOT NULL,
  identifier_layer text NOT NULL,
  namespace text NOT NULL,
  request_ref text NOT NULL,
  operation_ref text NOT NULL,
  authorization_ref text NOT NULL,
  generation_invocation_ref text NOT NULL,
  generation_result_ref text NOT NULL,
  strategy_ref text NOT NULL,
  convention_ref text NOT NULL,
  generator_port_ref text NOT NULL,
  adapter_ref text NOT NULL,
  provider_ref text NOT NULL,
  attempt_number integer NOT NULL,
  attempt_policy_ref text NOT NULL,
  environment text NOT NULL,
  actor_ref text NOT NULL,
  expected_policy_refs jsonb NOT NULL,
  audit_refs jsonb NOT NULL,
  issuance_status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT fid_identifier_issuance_ledger_pkey PRIMARY KEY (issuance_ledger_ref),
  CONSTRAINT fid_identifier_issuance_ledger_transaction_unique UNIQUE (transaction_ref),
  CONSTRAINT fid_identifier_issuance_ledger_reservation_unique UNIQUE (reservation_ref),
  CONSTRAINT fid_identifier_issuance_ledger_operation_unique UNIQUE (operation_ref),
  CONSTRAINT fid_identifier_issuance_ledger_outcome_binding_unique UNIQUE (issuance_ledger_ref,reservation_ref,transaction_ref),
  CONSTRAINT fid_identifier_issuance_ledger_refs_distinct CHECK (issuance_ledger_ref<>transaction_ref AND issuance_ledger_ref<>reservation_ref AND transaction_ref<>reservation_ref),
  CONSTRAINT fid_identifier_issuance_ledger_status_check CHECK (issuance_status='ISSUANCE_RECORDED'),
  CONSTRAINT fid_identifier_issuance_ledger_reservation_fkey FOREIGN KEY (reservation_ref) REFERENCES fid.fid_identifier_reservations(reservation_ref),
  CONSTRAINT fid_identifier_issuance_ledger_reservation_binding_fkey FOREIGN KEY (reservation_ref,transaction_ref,namespace,candidate_identifier) REFERENCES fid.fid_identifier_reservations(reservation_ref,transaction_ref,namespace,candidate_identifier)
);

CREATE TABLE fid.fid_identifier_issuance_idempotency (
  idempotency_ref text NOT NULL,
  transaction_ref uuid NOT NULL,
  reservation_ref uuid,
  issuance_ledger_ref uuid,
  request_ref text NOT NULL,
  operation_ref text NOT NULL,
  authorization_ref text NOT NULL,
  generation_invocation_ref text NOT NULL,
  generation_result_ref text NOT NULL,
  candidate_identifier text COLLATE "C" NOT NULL,
  identifier_layer text NOT NULL,
  namespace text NOT NULL,
  strategy_ref text NOT NULL,
  convention_ref text NOT NULL,
  generator_port_ref text NOT NULL,
  adapter_ref text NOT NULL,
  provider_ref text NOT NULL,
  attempt_number integer NOT NULL,
  attempt_policy_ref text NOT NULL,
  environment text NOT NULL,
  actor_ref text NOT NULL,
  expected_policy_refs jsonb NOT NULL,
  audit_refs jsonb NOT NULL,
  outcome_status text NOT NULL,
  result_payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT fid_identifier_issuance_idempotency_pkey PRIMARY KEY (idempotency_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_transaction_unique UNIQUE (transaction_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_operation_unique UNIQUE (operation_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_generation_result_unique UNIQUE (generation_result_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_reservation_unique UNIQUE (reservation_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_ledger_unique UNIQUE (issuance_ledger_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_ref_nonempty CHECK (idempotency_ref<>''),
  CONSTRAINT fid_identifier_issuance_idempotency_attempt_positive CHECK (attempt_number>0),
  CONSTRAINT fid_identifier_issuance_idempotency_environment_check CHECK (environment IN ('TEST','DEVELOPMENT')),
  CONSTRAINT fid_identifier_issuance_idempotency_outcome_check CHECK (outcome_status IN ('IDENTIFIER_RESERVED_AND_RECORDED','IDENTIFIER_COLLISION_DETECTED')),
  CONSTRAINT fid_identifier_issuance_idempotency_reference_outcome_check CHECK ((outcome_status='IDENTIFIER_RESERVED_AND_RECORDED' AND reservation_ref IS NOT NULL AND issuance_ledger_ref IS NOT NULL) OR (outcome_status='IDENTIFIER_COLLISION_DETECTED' AND reservation_ref IS NULL AND issuance_ledger_ref IS NULL)),
  CONSTRAINT fid_identifier_issuance_idempotency_refs_distinct CHECK ((reservation_ref IS NULL OR reservation_ref<>transaction_ref) AND (issuance_ledger_ref IS NULL OR issuance_ledger_ref<>transaction_ref) AND (reservation_ref IS NULL OR issuance_ledger_ref IS NULL OR reservation_ref<>issuance_ledger_ref)),
  CONSTRAINT fid_identifier_issuance_idempotency_reservation_fkey FOREIGN KEY (reservation_ref) REFERENCES fid.fid_identifier_reservations(reservation_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_ledger_fkey FOREIGN KEY (issuance_ledger_ref) REFERENCES fid.fid_identifier_issuance_ledger(issuance_ledger_ref),
  CONSTRAINT fid_identifier_issuance_idempotency_outcome_binding_fkey FOREIGN KEY (issuance_ledger_ref,reservation_ref,transaction_ref) REFERENCES fid.fid_identifier_issuance_ledger(issuance_ledger_ref,reservation_ref,transaction_ref)
);

CREATE INDEX fid_identifier_reservations_operation_idx ON fid.fid_identifier_reservations(operation_ref);
CREATE INDEX fid_identifier_reservations_authorization_idx ON fid.fid_identifier_reservations(authorization_ref);
CREATE INDEX fid_identifier_issuance_ledger_operation_idx ON fid.fid_identifier_issuance_ledger(operation_ref);
CREATE INDEX fid_identifier_issuance_ledger_authorization_idx ON fid.fid_identifier_issuance_ledger(authorization_ref);
CREATE INDEX fid_identifier_issuance_idempotency_request_idx ON fid.fid_identifier_issuance_idempotency(request_ref);
CREATE INDEX fid_identifier_issuance_idempotency_recovery_idx ON fid.fid_identifier_issuance_idempotency(operation_ref,request_ref);

CREATE FUNCTION fid.fid_execute_prospect_identifier_issuance_transaction(
  request_contract_version text,
  request_id text,
  operation_id text,
  idempotency_ref text,
  authorization_ref text,
  generation_invocation_ref text,
  generation_result_ref text,
  candidate_identifier text,
  identifier_layer text,
  namespace text,
  strategy_ref text,
  convention_ref text,
  generator_port_ref text,
  adapter_ref text,
  provider_ref text,
  attempt_number integer,
  attempt_policy_ref text,
  environment text,
  actor_ref text,
  expected_policy_refs jsonb,
  audit_refs jsonb
) RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
PARALLEL UNSAFE
SECURITY DEFINER
SET search_path = pg_catalog, fid
AS $function$
#variable_conflict use_variable
DECLARE
  v_existing fid.fid_identifier_issuance_idempotency%ROWTYPE;
  v_transaction_ref uuid;
  v_reservation_ref uuid;
  v_issuance_ledger_ref uuid;
  v_now timestamp with time zone;
  v_result jsonb;
  v_collision boolean;
  v_replay_consistent boolean;
BEGIN
  IF request_contract_version<>'1.0.0' OR request_id IS NULL OR request_id='' OR operation_id IS NULL OR operation_id='' OR idempotency_ref IS NULL OR idempotency_ref='' OR authorization_ref IS NULL OR authorization_ref='' OR generation_invocation_ref IS NULL OR generation_invocation_ref='' OR generation_result_ref IS NULL OR generation_result_ref='' OR candidate_identifier IS NULL OR candidate_identifier='' OR strategy_ref IS NULL OR strategy_ref='' OR convention_ref IS NULL OR convention_ref='' OR generator_port_ref IS NULL OR generator_port_ref='' OR adapter_ref IS NULL OR adapter_ref='' OR provider_ref IS NULL OR provider_ref='' OR attempt_policy_ref IS NULL OR attempt_policy_ref='' OR actor_ref IS NULL OR actor_ref='' OR attempt_number IS NULL OR attempt_number<1 OR environment NOT IN ('TEST','DEVELOPMENT') OR jsonb_typeof(expected_policy_refs)<>'array' OR jsonb_array_length(expected_policy_refs)<2 OR jsonb_typeof(audit_refs)<>'array' OR jsonb_array_length(audit_refs)=0 THEN
    RETURN jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_TRANSACTION_REJECTED','transactionRef',NULL,'reservationRef',NULL,'issuanceLedgerRef',NULL,'recoveryClassification','NOT_REQUIRED');
  END IF;
  IF NOT (((namespace='person' AND identifier_layer='PERSON' AND length(candidate_identifier)=29 AND candidate_identifier ~ '^person:[A-Za-z0-9_-]{22}$') OR (namespace='player' AND identifier_layer='PLAYER' AND length(candidate_identifier)=29 AND candidate_identifier ~ '^player:[A-Za-z0-9_-]{22}$') OR (namespace='prospect' AND identifier_layer='PROSPECT' AND length(candidate_identifier)=31 AND candidate_identifier ~ '^prospect:[A-Za-z0-9_-]{22}$') OR (namespace='prospect-profile' AND identifier_layer='PROSPECT_PROFILE' AND length(candidate_identifier)=39 AND candidate_identifier ~ '^prospect-profile:[A-Za-z0-9_-]{22}$'))) THEN
    RETURN jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_TRANSACTION_REJECTED','transactionRef',NULL,'reservationRef',NULL,'issuanceLedgerRef',NULL,'recoveryClassification','NOT_REQUIRED');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('idempotency:'||idempotency_ref,0::bigint));
  SELECT * INTO v_existing FROM fid.fid_identifier_issuance_idempotency AS stored WHERE stored.idempotency_ref=idempotency_ref FOR UPDATE;
  IF FOUND THEN
    IF NOT (v_existing.request_ref=request_id AND v_existing.operation_ref=operation_id AND v_existing.authorization_ref=authorization_ref AND v_existing.generation_invocation_ref=generation_invocation_ref AND v_existing.generation_result_ref=generation_result_ref AND v_existing.candidate_identifier=candidate_identifier COLLATE "C" AND v_existing.identifier_layer=identifier_layer AND v_existing.namespace=namespace AND v_existing.strategy_ref=strategy_ref AND v_existing.convention_ref=convention_ref AND v_existing.generator_port_ref=generator_port_ref AND v_existing.adapter_ref=adapter_ref AND v_existing.provider_ref=provider_ref AND v_existing.attempt_number=attempt_number AND v_existing.attempt_policy_ref=attempt_policy_ref AND v_existing.environment=environment AND v_existing.actor_ref=actor_ref AND v_existing.expected_policy_refs=expected_policy_refs AND v_existing.audit_refs=audit_refs) THEN
      RETURN jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_TRANSACTION_REJECTED','transactionRef',NULL,'reservationRef',NULL,'issuanceLedgerRef',NULL,'recoveryClassification','IDEMPOTENCY_CONFLICT');
    END IF;

    v_replay_consistent:=jsonb_typeof(v_existing.result_payload)='object'
      AND jsonb_typeof(v_existing.result_payload->'contractId')='string' AND v_existing.result_payload->>'contractId'='PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT'
      AND jsonb_typeof(v_existing.result_payload->'contractVersion')='string' AND v_existing.result_payload->>'contractVersion'='1.1.0'
      AND jsonb_typeof(v_existing.result_payload->'status')='string' AND v_existing.result_payload->>'status'=v_existing.outcome_status
      AND jsonb_typeof(v_existing.result_payload->'idempotencyRef')='string' AND v_existing.result_payload->>'idempotencyRef'=v_existing.idempotency_ref
      AND jsonb_typeof(v_existing.result_payload->'transactionRef')='string' AND v_existing.result_payload->>'transactionRef'=pg_catalog.lower(v_existing.transaction_ref::text)
      AND v_existing.result_payload->'identityCreated'='false'::jsonb
      AND v_existing.result_payload->'recordCreated'='false'::jsonb
      AND v_existing.result_payload->'persisted'='true'::jsonb
      AND NOT (v_existing.result_payload ?| ARRAY['entropy','rawEntropy','encodedEntropy','jwt','token','credential','secret','rawError','stackTrace']);

    IF v_existing.outcome_status='IDENTIFIER_RESERVED_AND_RECORDED' THEN
      v_replay_consistent:=v_replay_consistent
        AND v_existing.reservation_ref IS NOT NULL AND v_existing.issuance_ledger_ref IS NOT NULL
        AND v_existing.transaction_ref<>v_existing.reservation_ref AND v_existing.transaction_ref<>v_existing.issuance_ledger_ref AND v_existing.reservation_ref<>v_existing.issuance_ledger_ref
        AND jsonb_typeof(v_existing.result_payload->'reservationRef')='string' AND v_existing.result_payload->>'reservationRef'=pg_catalog.lower(v_existing.reservation_ref::text)
        AND jsonb_typeof(v_existing.result_payload->'issuanceLedgerRef')='string' AND v_existing.result_payload->>'issuanceLedgerRef'=pg_catalog.lower(v_existing.issuance_ledger_ref::text)
        AND (NOT (v_existing.result_payload ? 'collisionChecked') OR v_existing.result_payload->'collisionChecked'='false'::jsonb)
        AND EXISTS(SELECT 1 FROM fid.fid_identifier_reservations AS replay_reservation WHERE replay_reservation.reservation_ref=v_existing.reservation_ref AND replay_reservation.transaction_ref=v_existing.transaction_ref)
        AND EXISTS(SELECT 1 FROM fid.fid_identifier_issuance_ledger AS replay_ledger WHERE replay_ledger.issuance_ledger_ref=v_existing.issuance_ledger_ref AND replay_ledger.reservation_ref=v_existing.reservation_ref AND replay_ledger.transaction_ref=v_existing.transaction_ref);
    ELSIF v_existing.outcome_status='IDENTIFIER_COLLISION_DETECTED' THEN
      v_replay_consistent:=v_replay_consistent
        AND v_existing.reservation_ref IS NULL AND v_existing.issuance_ledger_ref IS NULL
        AND v_existing.result_payload ? 'reservationRef' AND jsonb_typeof(v_existing.result_payload->'reservationRef')='null'
        AND v_existing.result_payload ? 'issuanceLedgerRef' AND jsonb_typeof(v_existing.result_payload->'issuanceLedgerRef')='null'
        AND (NOT (v_existing.result_payload ? 'reserved') OR v_existing.result_payload->'reserved'='false'::jsonb)
        AND (NOT (v_existing.result_payload ? 'issued') OR v_existing.result_payload->'issued'='false'::jsonb)
        AND (NOT (v_existing.result_payload ? 'ledgerWritten') OR v_existing.result_payload->'ledgerWritten'='false'::jsonb);
    ELSE
      v_replay_consistent:=false;
    END IF;

    IF NOT COALESCE(v_replay_consistent,false) THEN
      RETURN jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED','idempotencyRef',idempotency_ref,'transactionRef',NULL,'reservationRef',NULL,'issuanceLedgerRef',NULL,'replayClassification','INCONSISTENT_STORED_STATE','recoveryClassification','REQUIRED','identityCreated',false,'recordCreated',false,'persisted',false);
    END IF;

    RETURN jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status',v_existing.outcome_status,'idempotencyRef',v_existing.idempotency_ref,'transactionRef',pg_catalog.lower(v_existing.transaction_ref::text),'reservationRef',CASE WHEN v_existing.reservation_ref IS NULL THEN NULL ELSE pg_catalog.lower(v_existing.reservation_ref::text) END,'issuanceLedgerRef',CASE WHEN v_existing.issuance_ledger_ref IS NULL THEN NULL ELSE pg_catalog.lower(v_existing.issuance_ledger_ref::text) END,'replayClassification','MATCHING_COMPLETED_REPLAY','recoveryClassification','NOT_REQUIRED','identityCreated',false,'recordCreated',false,'persisted',true);
  END IF;

  v_transaction_ref:=pg_catalog.gen_random_uuid();
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('candidate:'||namespace||':'||candidate_identifier,0::bigint));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('operation:'||operation_id,0::bigint));
  SELECT EXISTS(SELECT 1 FROM fid.fid_identifier_reservations AS reservation WHERE reservation.namespace=namespace AND reservation.candidate_identifier=candidate_identifier COLLATE "C") INTO v_collision;
  v_now:=pg_catalog.transaction_timestamp();
  IF v_collision THEN
    v_result:=jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_COLLISION_DETECTED','idempotencyRef',idempotency_ref,'transactionRef',lower(v_transaction_ref::text),'reservationRef',NULL,'issuanceLedgerRef',NULL,'replayClassification','NOT_REPLAY','recoveryClassification','NOT_REQUIRED','identityCreated',false,'recordCreated',false,'persisted',true);
    INSERT INTO fid.fid_identifier_issuance_idempotency(idempotency_ref,transaction_ref,reservation_ref,issuance_ledger_ref,request_ref,operation_ref,authorization_ref,generation_invocation_ref,generation_result_ref,candidate_identifier,identifier_layer,namespace,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,outcome_status,result_payload,created_at) VALUES(idempotency_ref,v_transaction_ref,NULL,NULL,request_id,operation_id,authorization_ref,generation_invocation_ref,generation_result_ref,candidate_identifier,identifier_layer,namespace,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,'IDENTIFIER_COLLISION_DETECTED',v_result,v_now);
    RETURN v_result;
  END IF;

  v_reservation_ref:=pg_catalog.gen_random_uuid();
  IF v_reservation_ref=v_transaction_ref THEN RAISE EXCEPTION USING ERRCODE='integrity_constraint_violation',MESSAGE='persistence reference uniqueness failure'; END IF;
  INSERT INTO fid.fid_identifier_reservations(reservation_ref,transaction_ref,candidate_identifier,identifier_layer,namespace,request_ref,operation_ref,authorization_ref,generation_invocation_ref,generation_result_ref,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,reservation_status,created_at) VALUES(v_reservation_ref,v_transaction_ref,candidate_identifier,identifier_layer,namespace,request_id,operation_id,authorization_ref,generation_invocation_ref,generation_result_ref,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,'RESERVED_AND_ISSUED',v_now);
  v_issuance_ledger_ref:=pg_catalog.gen_random_uuid();
  IF v_issuance_ledger_ref=v_transaction_ref OR v_issuance_ledger_ref=v_reservation_ref THEN RAISE EXCEPTION USING ERRCODE='integrity_constraint_violation',MESSAGE='persistence reference uniqueness failure'; END IF;
  INSERT INTO fid.fid_identifier_issuance_ledger(issuance_ledger_ref,transaction_ref,reservation_ref,candidate_identifier,identifier_layer,namespace,request_ref,operation_ref,authorization_ref,generation_invocation_ref,generation_result_ref,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,issuance_status,created_at) VALUES(v_issuance_ledger_ref,v_transaction_ref,v_reservation_ref,candidate_identifier,identifier_layer,namespace,request_id,operation_id,authorization_ref,generation_invocation_ref,generation_result_ref,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,'ISSUANCE_RECORDED',v_now);
  v_result:=jsonb_build_object('contractId','PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT','contractVersion','1.1.0','status','IDENTIFIER_RESERVED_AND_RECORDED','idempotencyRef',idempotency_ref,'transactionRef',lower(v_transaction_ref::text),'reservationRef',lower(v_reservation_ref::text),'issuanceLedgerRef',lower(v_issuance_ledger_ref::text),'replayClassification','NOT_REPLAY','recoveryClassification','NOT_REQUIRED','identityCreated',false,'recordCreated',false,'persisted',true);
  INSERT INTO fid.fid_identifier_issuance_idempotency(idempotency_ref,transaction_ref,reservation_ref,issuance_ledger_ref,request_ref,operation_ref,authorization_ref,generation_invocation_ref,generation_result_ref,candidate_identifier,identifier_layer,namespace,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,outcome_status,result_payload,created_at) VALUES(idempotency_ref,v_transaction_ref,v_reservation_ref,v_issuance_ledger_ref,request_id,operation_id,authorization_ref,generation_invocation_ref,generation_result_ref,candidate_identifier,identifier_layer,namespace,strategy_ref,convention_ref,generator_port_ref,adapter_ref,provider_ref,attempt_number,attempt_policy_ref,environment,actor_ref,expected_policy_refs,audit_refs,'IDENTIFIER_RESERVED_AND_RECORDED',v_result,v_now);
  RETURN v_result;
END;
$function$;

ALTER FUNCTION fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb) OWNER TO fid_function_owner;
COMMENT ON FUNCTION fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb) IS 'Server-boundary-only non-production atomic identifier issuance transaction. Candidate values and persistence references must not be written to general logs.';

ALTER TABLE fid.fid_identifier_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fid.fid_identifier_reservations FORCE ROW LEVEL SECURITY;
ALTER TABLE fid.fid_identifier_issuance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fid.fid_identifier_issuance_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE fid.fid_identifier_issuance_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE fid.fid_identifier_issuance_idempotency FORCE ROW LEVEL SECURITY;

CREATE POLICY fid_identifier_reservations_public_deny ON fid.fid_identifier_reservations AS PERMISSIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_reservations_anon_deny ON fid.fid_identifier_reservations AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_reservations_authenticated_deny ON fid.fid_identifier_reservations AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_reservations_owner_select ON fid.fid_identifier_reservations AS PERMISSIVE FOR SELECT TO fid_function_owner USING (true);
CREATE POLICY fid_identifier_reservations_owner_insert ON fid.fid_identifier_reservations AS PERMISSIVE FOR INSERT TO fid_function_owner WITH CHECK (true);
CREATE POLICY fid_identifier_issuance_ledger_public_deny ON fid.fid_identifier_issuance_ledger AS PERMISSIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_ledger_anon_deny ON fid.fid_identifier_issuance_ledger AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_ledger_authenticated_deny ON fid.fid_identifier_issuance_ledger AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_ledger_owner_select ON fid.fid_identifier_issuance_ledger AS PERMISSIVE FOR SELECT TO fid_function_owner USING (true);
CREATE POLICY fid_identifier_issuance_ledger_owner_insert ON fid.fid_identifier_issuance_ledger AS PERMISSIVE FOR INSERT TO fid_function_owner WITH CHECK (true);
CREATE POLICY fid_identifier_issuance_idempotency_public_deny ON fid.fid_identifier_issuance_idempotency AS PERMISSIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_idempotency_anon_deny ON fid.fid_identifier_issuance_idempotency AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_idempotency_authenticated_deny ON fid.fid_identifier_issuance_idempotency AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY fid_identifier_issuance_idempotency_owner_select ON fid.fid_identifier_issuance_idempotency AS PERMISSIVE FOR SELECT TO fid_function_owner USING (true);
CREATE POLICY fid_identifier_issuance_idempotency_owner_insert ON fid.fid_identifier_issuance_idempotency AS PERMISSIVE FOR INSERT TO fid_function_owner WITH CHECK (true);

REVOKE ALL ON TABLE fid.fid_identifier_reservations,fid.fid_identifier_issuance_ledger,fid.fid_identifier_issuance_idempotency FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON TABLE fid.fid_identifier_reservations,fid.fid_identifier_issuance_ledger,fid.fid_identifier_issuance_idempotency TO fid_function_owner;
GRANT USAGE ON SCHEMA fid TO service_role;
GRANT EXECUTE ON FUNCTION fid.fid_execute_prospect_identifier_issuance_transaction(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,jsonb,jsonb) TO service_role;
