import fs from "node:fs";
import { createHash } from "node:crypto";
import failureRecord from "../persistence/deployment/CanonicalProspectIdentifierMigration014Reconciliation017c4ExecutionFailureRecord.js";
import amendment from "../persistence/deployment/CanonicalProspectIdentifierMigration014ReconciliationPostgresqlCorrectionAmendment.js";
import { evaluateCanonicalProspectIdentifierMigration014ReconciliationPostgresqlCorrection as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierMigration014ReconciliationPostgresqlCorrectionEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const reconciliation017c4 = read("../persistence/deployment/review/017c4_failed_migration_014_read_only_commit_state_reconciliation.sql");
const successor = read("../persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const migrationFiles = fs.readdirSync(new URL("../persistence/deployment/sql/", import.meta.url)).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
const expectedSuccessor = reconciliation017c4
  .replace("SPRINT 17C.4 FAILED MIGRATION 014 COMMIT-STATE RECONCILIATION. READ-ONLY.", "SPRINT 17C.5 FAILED MIGRATION 014 COMMIT-STATE RECONCILIATION POSTGRESQL CORRECTION. READ-ONLY.")
  .replace(/\bAS constraint\b/g, "AS constraint_record")
  .replace(/\bconstraint\./g, "constraint_record.");
const stripped = successor.replace(/--[^\r\n]*/g, "");
const structural = stripped.replace(/'(?:''|[^'])*'/g, "''");
const statements = stripped.split(";").map((statement) => statement.trim()).filter(Boolean);
const prohibitedAlias = /\bAS\s+(?:constraint|select|where|group|order|limit|offset|values|with|recursive|returning|window|over|case|when|then|else|end)\b/i;
const mutation = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do|lock|begin|commit|rollback)\b/i;
const classifications = [...new Set([...successor.matchAll(/'(MIGRATION_014_(?:FULLY_ROLLED_BACK|PARTIALLY_APPLIED|STRUCTURALLY_APPLIED_OWNERSHIP_OR_PRIVILEGES_INCOMPLETE|FULLY_APPLIED_BUT_EXECUTION_RESPONSE_INCONSISTENT|STATE_INCONSISTENT_RECOVERY_REQUIRED|COMMIT_STATE_UNRESOLVED))'/g)].map((match) => match[1]))];
const coveredTokens = [
  "server_version", "CURRENT_USER", "SESSION_USER", "current_database", "postgres", "fid_function_owner",
  "pg_catalog.pg_auth_members", "set_option", "inherit_option", "admin_option", "pg_catalog.pg_has_role(member_oid,target_oid,'SET')",
  "fid_identifier_reservations", "fid_identifier_issuance_ledger", "fid_identifier_issuance_idempotency",
  "fid_identifier_reservations_operation_idx", "fid_identifier_reservations_authorization_idx",
  "fid_identifier_issuance_ledger_operation_idx", "fid_identifier_issuance_ledger_authorization_idx",
  "fid_identifier_issuance_idempotency_request_idx", "fid_identifier_issuance_idempotency_recovery_idx",
  "fid_execute_prospect_identifier_issuance_transaction", "relowner", "relpersistence", "relrowsecurity", "relforcerowsecurity",
  "identity_arguments", "return_type", "security_definer", "configured_settings", "function_definition_md5",
  "has_table_privilege", "has_schema_privilege", "has_function_privilege", "query_to_xml", "fid.fid_persistence_migrations",
];
const delimitersBalanced = (text) => {
  const stack = [];
  for (const character of text) {
    if (character === "(") stack.push(character);
    if (character === ")" && stack.pop() !== "(") return false;
  }
  return stack.length === 0;
};
const evidence = {
  projectId: failureRecord.target.projectId,
  sqlstate: failureRecord.failure.sqlstate,
  failureLine: failureRecord.failure.line,
  failureClassification: failureRecord.failure.classification,
  attempts: failureRecord.failure.reconciliationAttempts,
  migration014Sha256: hash(migration014),
  reconciliation017c4Sha256: hash(reconciliation017c4),
  successorSha256: hash(successor),
  exactMechanicalCorrection: successor.replace(/\r\n/g, "\n") === expectedSuccessor.replace(/\r\n/g, "\n"),
  invalidAliasAbsent: !/\bAS constraint\b|\bconstraint\./.test(successor),
  safeAliasConsistent: (successor.match(/\bAS constraint_record\b/g) ?? []).length === 5 && (successor.match(/\bconstraint_record\./g) ?? []).length === 10,
  reservedTableAliasesAbsent: !prohibitedAlias.test(structural),
  syntaxStructureBalanced: delimitersBalanced(structural),
  coveragePreserved: coveredTokens.every((token) => successor.includes(token)),
  classifierComplete: classifications.length === 6 && amendment.preservedCommitStateClassifications.every((classification) => classifications.includes(classification)),
  readOnly: statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)) && !mutation.test(structural),
  noLockingOrInvocation: !/\bFOR\s+(?:UPDATE|NO\s+KEY\s+UPDATE|SHARE|KEY\s+SHARE)\b|\bSET\s+ROLE\b|\bgen_random_uuid\s*\(\s*\)|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural),
  noRepairOrRetry: !/\b(create|alter|drop|grant|revoke|insert|update|delete|call)\b/i.test(structural),
  inventoryExact: migrationFiles.length === 14 && migrationFiles.every((name, index) => name.startsWith(`${String(index + 1).padStart(3, "0")}_`)),
  migration015Absent: !migrationFiles.some((name) => name.startsWith("015_")),
  noReviewEffects: Object.values(amendment.effects).every((value) => value === false || value === 0),
};
const result = evaluate(amendment, evidence);
const tests = [
  ["failure-evidence", () => assert(evidence.sqlstate === "42601" && evidence.failureLine === 135 && failureRecord.failure.databaseMutations === 0 && !failureRecord.failure.commitStateDetermined, "failure evidence")],
  ["failure-location", () => assert(reconciliation017c4.split(/\r?\n/)[134].includes("pg_constraint AS constraint") && reconciliation017c4.split(/\r?\n/)[134].includes("constraint.conrelid"), "line 135")],
  ["protected-hashes", () => assert(evidence.migration014Sha256 === amendment.migration014Sha256 && evidence.reconciliation017c4Sha256 === amendment.protected017c4Sha256, "protected hash")],
  ["successor-hash", () => assert(evidence.successorSha256 === amendment.successor.sha256, "successor hash")],
  ["exact-correction", () => assert(evidence.exactMechanicalCorrection && !amendment.successor.semanticsChanged, "mechanical correction")],
  ["invalid-alias-absent", () => assert(evidence.invalidAliasAbsent, "invalid alias")],
  ["safe-alias-consistent", () => assert(evidence.safeAliasConsistent, "safe alias")],
  ["whole-file-alias-audit", () => assert(evidence.reservedTableAliasesAbsent, "reserved alias")],
  ["structural-balance", () => assert(evidence.syntaxStructureBalanced, "delimiters")],
  ["coverage-preserved", () => assert(evidence.coveragePreserved, "coverage")],
  ["classifier-complete", () => assert(evidence.classifierComplete, "classifier")],
  ["read-only", () => assert(evidence.readOnly, "read-only")],
  ["no-locking-or-invocation", () => assert(evidence.noLockingOrInvocation, "locking or invocation")],
  ["no-repair-or-retry", () => assert(evidence.noRepairOrRetry, "repair or retry")],
  ["inventory", () => assert(evidence.inventoryExact && evidence.migration015Absent, "inventory")],
  ["target", () => assert(evidence.projectId === "ahmorpzcaapvoymiqlkv", "target")],
  ["ready", () => assert(result.status === "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION_REEXECUTION" && result.blockers.length === 0, "readiness")],
  ["prohibited-scope", () => assert(!result.migration014RetryAuthorized && !result.repairAuthorized && !result.roleChangeAuthorized && !result.grantAuthorized && !result.rpcInvocationAuthorized, "scope")],
  ["no-review-effects", () => assert(result.databaseOperationsDuringReview === 0 && result.networkRequestsDuringReview === 0, "effects")],
];

let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Migration 014 reconciliation PostgreSQL correction diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
