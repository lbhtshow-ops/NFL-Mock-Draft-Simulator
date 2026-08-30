export const PROSPECT_IDENTIFIER_MIGRATION_014_FILENAME = "014_create_fid_identifier_issuance_transaction.sql";
export const PROSPECT_IDENTIFIER_MIGRATION_014_REQUIRED_TABLES = Object.freeze(["fid_identifier_reservations", "fid_identifier_issuance_ledger", "fid_identifier_issuance_idempotency"]);

export function evaluateProspectIdentifierMigration014Sql(sql = "") {
  const lower = sql.toLowerCase();
  const replayStart = lower.indexOf("if found then");
  const uuidStart = lower.indexOf("v_transaction_ref:=pg_catalog.gen_random_uuid()");
  const replay = replayStart >= 0 && uuidStart > replayStart ? lower.slice(replayStart, uuidStart) : "";
  const checks = {
    threeTables: PROSPECT_IDENTIFIER_MIGRATION_014_REQUIRED_TABLES.every((table) => new RegExp(`create table fid\\.${table}\\s*\\(`, "i").test(sql)) && (lower.match(/create table fid\./g) ?? []).length === 3,
    rpc: /create function fid\.fid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(sql),
    uuidCapability: /pg_catalog\.gen_random_uuid\(\)/i.test(sql) && !/create extension/i.test(sql),
    uuidLifecycleOrder: lower.indexOf("v_transaction_ref:=pg_catalog.gen_random_uuid()") < lower.indexOf("v_reservation_ref:=pg_catalog.gen_random_uuid()") && lower.indexOf("v_reservation_ref:=pg_catalog.gen_random_uuid()") < lower.indexOf("v_issuance_ledger_ref:=pg_catalog.gen_random_uuid()"),
    uuidColumns: ["transaction_ref uuid", "reservation_ref uuid", "issuance_ledger_ref uuid"].every((value) => lower.includes(value)),
    pairwiseDistinct: lower.includes("refs_distinct"), candidateUnique: lower.includes("namespace_candidate_unique"), idempotencyUnique: lower.includes("primary key (idempotency_ref)"),
    reservationLedgerForeignKeys: lower.includes("issuance_ledger_reservation_fkey") && lower.includes("idempotency_ledger_fkey"),
    replayBeforeUuid: replayStart >= 0 && replayStart < uuidStart,
    replayConsistencyValidation: replay.includes("v_replay_consistent") && replay.includes("jsonb_typeof(v_existing.result_payload)='object'"),
    replayNoDirectPayloadReturn: !/return\s+v_existing\.result_payload/i.test(replay),
    replayStatusComparison: replay.includes("result_payload->>'status'=v_existing.outcome_status"),
    replayIdempotencyComparison: replay.includes("result_payload->>'idempotencyref'=v_existing.idempotency_ref"),
    replayTransactionComparison: replay.includes("result_payload->>'transactionref'=pg_catalog.lower(v_existing.transaction_ref::text)"),
    replayReservationComparison: replay.includes("result_payload->>'reservationref'=pg_catalog.lower(v_existing.reservation_ref::text)"),
    replayLedgerComparison: replay.includes("result_payload->>'issuanceledgerref'=pg_catalog.lower(v_existing.issuance_ledger_ref::text)"),
    replaySuccessCombination: replay.includes("outcome_status='identifier_reserved_and_recorded'") && replay.includes("reservation_ref is not null") && replay.includes("issuance_ledger_ref is not null"),
    replayCollisionCombination: replay.includes("outcome_status='identifier_collision_detected'") && replay.includes("reservation_ref is null") && replay.includes("issuance_ledger_ref is null"),
    replayRecoveryRequired: replay.includes("identifier_transaction_recovery_required") && replay.includes("inconsistent_stored_state"),
    replayNoRepair: !/update\s+fid\.fid_identifier_issuance_idempotency|result_payload\s*:=|set\s+result_payload/i.test(replay),
    replayNoUuid: !/gen_random_uuid/i.test(replay),
    replayNoCollisionQuery: !/select\s+exists[\s\S]+candidate_identifier/i.test(replay),
    locks: (lower.match(/pg_catalog\.pg_advisory_xact_lock/g) ?? []).length === 3 && lower.includes("pg_catalog.hashtextextended"),
    lockOrder: lower.indexOf("'idempotency:'") < lower.indexOf("'candidate:'") && lower.indexOf("'candidate:'") < lower.indexOf("'operation:'"),
    fixedSearchPath: /set search_path = pg_catalog, fid/i.test(sql), securityDefiner: /security definer/i.test(sql),
    rls: (lower.match(/enable row level security/g) ?? []).length === 3 && (lower.match(/force row level security/g) ?? []).length === 3,
    revokeFirst: lower.indexOf("revoke all on table") < lower.indexOf("grant select,insert on table") && lower.indexOf("revoke execute on function") < lower.lastIndexOf("grant execute on function"),
    narrowGrant: /grant execute on function[\s\S]+to service_role/i.test(sql),
    candidateCaseSensitive: lower.includes('collate "c"') && !/citext|lower\s*\(candidate_identifier|upper\s*\(candidate_identifier/i.test(sql),
    noDynamicSql: !/execute\s+(format|immediate)|\bexecute\s+\$/i.test(sql), noIdentityCreation: !/insert into fid\.(person|player|prospect|profile|fid_record_revisions)/i.test(sql),
    noForbiddenDomains: !/\bfiis\b|\bpromotion\b|\bsimulator\b/i.test(sql), noCredentials: !/service[_-]?role[_-]?key|access[_-]?token|refresh[_-]?token|jwt[_-]?secret/i.test(sql),
    noDestructiveExistingChange: !/drop\s+(table|function|schema)|alter table fid\.(fid_record_revisions|fid_persistence_)/i.test(sql),
  };
  return Object.freeze({ status: Object.values(checks).every(Boolean) ? "MIGRATION_014_STATIC_ORACLE_PASSED" : "MIGRATION_014_STATIC_ORACLE_FAILED", checks: Object.freeze(checks), staticOnly: true, sqlExecuted: false, databaseValidated: false });
}

export default Object.freeze({ PROSPECT_IDENTIFIER_MIGRATION_014_FILENAME, PROSPECT_IDENTIFIER_MIGRATION_014_REQUIRED_TABLES, evaluateProspectIdentifierMigration014Sql });
