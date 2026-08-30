import fs from "node:fs";
import { createHash } from "node:crypto";
import { evaluateProspectIdentifierMigration014Sql } from "../persistence/deployment/ProspectIdentifierMigration014StaticOracle.js";
import { CANONICAL_PROSPECT_IDENTIFIER_MIGRATION_014_INCONSISTENT_REPLAY_CORRECTION as correction, evaluateProspectIdentifierMigration014ReplayCorrection as evaluate } from "../persistence/deployment/ProspectIdentifierMigration014ReplayCorrectionAssessment.js";
import snapshots from "../prospectIntake/fixtures/prospectIdentifierMigration014ReplayCorrectionSnapshots.js";
import { mapProspectIdentifierRpcResultV1_1 } from "../../../../../supabase/functions/canonical-prospect-identifier-issuance/server-v1_3-persistence.js";
const assert = (value, message) => { if (!value) throw new Error(message); };
const sql = fs.readFileSync(new URL("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", import.meta.url), "utf8");
const lower = sql.toLowerCase();
const start = lower.indexOf("if found then");
const end = lower.indexOf("v_transaction_ref:=pg_catalog.gen_random_uuid()");
const replay = lower.slice(start, end);
const correctedHash = createHash("sha256").update(sql).digest("hex").toUpperCase();
const oracle = evaluateProspectIdentifierMigration014Sql(sql);
const assessment = evaluate(correction, { oraclePassed: oracle.status === "MIGRATION_014_STATIC_ORACLE_PASSED", originalHash: "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13", correctedHash, migrationExecuted: false, migration015Count: 0 });
const tests = [
  ["assessment", () => assert(assessment.status === "MIGRATION_014_REPLAY_CORRECTION_READY_FOR_REVIEW", "assessment")],
  ["finding", () => assert(correction.finding === "DR-014-001" && correction.authority === "RELATIONAL_IDEMPOTENCY_COLUMNS", "finding")],
  ["oracle", () => assert(oracle.status === "MIGRATION_014_STATIC_ORACLE_PASSED" && Object.keys(oracle.checks).length >= 35, "oracle")],
  ["no-direct-return", () => assert(!/return\s+v_existing\.result_payload/i.test(replay), "direct payload return")],
  ["payload-shape", () => assert(replay.includes("jsonb_typeof(v_existing.result_payload)='object'") && replay.includes("contractid") && replay.includes("contractversion"), "payload shape")],
  ["status", () => assert(replay.includes("result_payload->>'status'=v_existing.outcome_status"), "status")],
  ["idempotency", () => assert(replay.includes("result_payload->>'idempotencyref'=v_existing.idempotency_ref"), "idempotency")],
  ["transaction", () => assert(replay.includes("result_payload->>'transactionref'=pg_catalog.lower(v_existing.transaction_ref::text)"), "transaction")],
  ["reservation", () => assert(replay.includes("result_payload->>'reservationref'=pg_catalog.lower(v_existing.reservation_ref::text)"), "reservation")],
  ["ledger", () => assert(replay.includes("result_payload->>'issuanceledgerref'=pg_catalog.lower(v_existing.issuance_ledger_ref::text)"), "ledger")],
  ["success-invariants", () => assert(replay.includes("identifier_reserved_and_recorded") && replay.includes("reservation_ref is not null") && replay.includes("replay_ledger.transaction_ref=v_existing.transaction_ref"), "success")],
  ["collision-invariants", () => assert(replay.includes("identifier_collision_detected") && replay.includes("reservation_ref is null") && replay.includes("issuance_ledger_ref is null"), "collision")],
  ["distinct", () => assert(replay.includes("transaction_ref<>v_existing.reservation_ref") && replay.includes("reservation_ref<>v_existing.issuance_ledger_ref"), "distinct")],
  ["malformed-cast-free", () => assert(!/result_payload[^;]*::uuid|result_payload[^;]*::boolean/i.test(replay), "unsafe cast")],
  ["recovery", () => assert(replay.includes("identifier_transaction_recovery_required") && replay.includes("inconsistent_stored_state"), "recovery")],
  ["adapter-recovery", () => { const mapped = mapProspectIdentifierRpcResultV1_1({ contractId: "PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT", contractVersion: "1.1.0", status: "IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED", idempotencyRef: "governed-reconciliation-ref", transactionRef: null, reservationRef: null, issuanceLedgerRef: null, replayClassification: "INCONSISTENT_STORED_STATE", recoveryClassification: "REQUIRED", identityCreated: false, recordCreated: false, persisted: false }); assert(mapped.ok && mapped.result.status === "IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED" && mapped.result.recoveryClassification === "REQUIRED", "adapter recovery"); }],
  ["reconstruct", () => assert(/return jsonb_build_object\('contractid'/.test(replay), "reconstruct")],
  ["before-uuid", () => assert(start >= 0 && start < end && !replay.includes("gen_random_uuid"), "uuid")],
  ["no-write", () => assert(!/\b(insert|update|delete)\s+(into|fid\.)/.test(replay), "write")],
  ["no-collision-query", () => assert(!/select exists\(select 1 from fid\.fid_identifier_reservations as reservation/.test(replay), "collision query")],
  ["no-repair-retry", () => assert(!/set\s+result_payload|result_payload\s*:=|retry/.test(replay), "repair or retry")],
  ["payload-idempotency", () => assert((lower.match(/'idempotencyref',idempotency_ref/g) ?? []).length >= 3, "stored idempotency")],
  ["scope", () => assert((lower.match(/create table fid\./g) ?? []).length === 3 && (lower.match(/create function fid\./g) ?? []).length === 1, "scope")],
  ["locks-security", () => assert(lower.indexOf("'idempotency:'") < lower.indexOf("'candidate:'") && lower.indexOf("'candidate:'") < lower.indexOf("'operation:'") && (lower.match(/force row level security/g) ?? []).length === 3, "architecture")],
  ["snapshots", () => assert(Object.keys(snapshots).length === 31 && Object.values(snapshots).filter((value) => value?.status === "MATCHING_REPLAY_ACCEPTED").length === 2 && Object.values(snapshots).filter((value) => value?.status === "RECOVERY_REQUIRED").length === 22, "snapshots")],
  ["cohort", () => assert(snapshots.cohort.length === 4 && snapshots.cohort.every((item) => Object.entries(item).filter(([key]) => key.endsWith("Count")).every(([, value]) => value === 0)), "cohort")],
  ["hash-changed", () => assert(correctedHash !== "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13", "hash")],
  ["no-effects", () => assert(Object.values(correction.permissions).every((value) => !value), "effects")],
];
let passed = 0;
for (const [name, test] of tests) { try { test(); passed += 1; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); } }
console.log(`Migration 014 inconsistent replay correction diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
