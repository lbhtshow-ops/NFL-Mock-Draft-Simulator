import fs from "node:fs";
import { createHash } from "node:crypto";
import review from "../persistence/deployment/CanonicalProspectIdentifierStage2ReadOnlyPreflightAuthorizationReview.js";
import { evaluateCanonicalProspectIdentifierStage2ReadOnlyPreflightAuthorizationReview as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierStage2ReadOnlyPreflightAuthorizationReviewEvaluator.js";

const assert = (value, message) => { if (!value) throw new Error(message); };
const path = new URL("../persistence/deployment/review/017c_read_only_target_preflight.sql", import.meta.url);
const sql = fs.readFileSync(path, "utf8");
const hash = createHash("sha256").update(sql).digest("hex").toUpperCase();
const withoutComments = sql.replace(/--[^\r\n]*/g, "");
const withoutCommentsOrStrings = withoutComments.replace(/'(?:''|[^'])*'/g, "''");
const statements = withoutComments.split(";").map((statement) => statement.trim()).filter(Boolean);
const mutating = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|copy|call|do|vacuum|analyze|refresh|reindex|cluster|set|reset)\b/i;
const uuidInvocation = /\bgen_random_uuid\s*\(\s*\)/i;
const rpcInvocation = /\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i;
const sensitiveSource = /\b(password|passwd|secret|api[_ ]?key|access[_ ]?token|authorization[_ ]?header|connection[_ ]?string|pg_shadow|pg_authid)\b/i;
const evidence = {
  stage1Status: "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
  exactTargetAuthorized: true,
  migrationInventory: "001_THROUGH_014_EXACT",
  migration015Absent: true,
  migration014Sha256: review.migration.approvedSha256,
  preflightSha256: hash,
  selectOnlyStatements: statements.every((statement) => /^select\b/i.test(statement)),
  noMutatingSql: !mutating.test(withoutCommentsOrStrings),
  uuidNotInvoked: !uuidInvocation.test(withoutComments),
  issuanceRpcNotInvoked: !rpcInvocation.test(withoutComments),
  sensitiveSourcesAbsent: !sensitiveSource.test(withoutComments),
  migrationMetadataCovered: /fid_persistence_migrations/i.test(withoutComments),
  ownerTransferCapabilityCovered: /pg_has_role\s*\([^)]*fid_function_owner[^)]*(member|usage)/i.test(withoutComments),
  indexConflictsCovered: [
    "fid_identifier_reservations_operation_idx",
    "fid_identifier_reservations_authorization_idx",
    "fid_identifier_issuance_ledger_operation_idx",
    "fid_identifier_issuance_ledger_authorization_idx",
    "fid_identifier_issuance_idempotency_request_idx",
    "fid_identifier_issuance_idempotency_recovery_idx",
  ].every((name) => withoutComments.includes(name)),
};
const result = evaluate(review, evidence);
const tests = [
  ["preflight-hash", () => assert(hash === review.preflight.sha256, "preflight hash")],
  ["select-only", () => assert(evidence.selectOnlyStatements, "non-SELECT statement")],
  ["no-mutating-sql", () => assert(evidence.noMutatingSql, "mutating SQL")],
  ["uuid-not-invoked", () => assert(evidence.uuidNotInvoked, "UUID invocation")],
  ["rpc-not-invoked", () => assert(evidence.issuanceRpcNotInvoked, "RPC invocation")],
  ["sensitive-sources-absent", () => assert(evidence.sensitiveSourcesAbsent, "sensitive source")],
  ["metadata-gap-detected", () => assert(!evidence.migrationMetadataCovered, "metadata gap not detected")],
  ["owner-transfer-gap-detected", () => assert(!evidence.ownerTransferCapabilityCovered, "owner-transfer gap not detected")],
  ["index-conflict-gap-detected", () => assert(!evidence.indexConflictsCovered, "index gap not detected")],
  ["blocked", () => assert(result.status === "CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_BLOCKED" && result.blockers.length === 3, "decision")],
  ["migration-not-authorized", () => assert(!result.migration014ExecutionAuthorized, "migration authorized")],
  ["no-effects", () => assert(!result.sqlExecutedDuringReview && result.databaseOperations === 0 && result.networkRequests === 0, "review effects")],
];
let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Stage 2 read-only preflight authorization review diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
