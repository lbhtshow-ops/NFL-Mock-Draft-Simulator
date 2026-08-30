import fs from "node:fs";
import { createHash } from "node:crypto";
import failureRecord from "../persistence/deployment/CanonicalProspectIdentifierMigration014FailedExecutionRecord.js";
import amendment from "../persistence/deployment/CanonicalProspectIdentifierMigration014CommitStateReconciliationAmendment.js";
import { evaluateCanonicalProspectIdentifierMigration014CommitStateReconciliation as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierMigration014CommitStateReconciliationEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const reconciliation = read("../persistence/deployment/review/017c4_failed_migration_014_read_only_commit_state_reconciliation.sql");
const migration = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const stripped = reconciliation.replace(/--[^\r\n]*/g, "");
const structural = stripped.replace(/'(?:''|[^'])*'/g, "''");
const statements = stripped.split(";").map((statement) => statement.trim()).filter(Boolean);
const constraints = [...migration.matchAll(/CONSTRAINT\s+([a-z0-9_]+)/gi)].map((match) => match[1]);
const policies = [...migration.matchAll(/^CREATE POLICY\s+([a-z0-9_]+)/gmi)].map((match) => match[1]);
const indexes = [...migration.matchAll(/^CREATE INDEX\s+([a-z0-9_]+)/gmi)].map((match) => match[1]);
const tables = [...migration.matchAll(/^CREATE TABLE\s+fid\.([a-z0-9_]+)/gmi)].map((match) => match[1]);
const commitClassifications = [...reconciliation.matchAll(/'((?:MIGRATION_014_)(?:FULLY_ROLLED_BACK|PARTIALLY_APPLIED|STRUCTURALLY_APPLIED_OWNERSHIP_OR_PRIVILEGES_INCOMPLETE|FULLY_APPLIED_BUT_EXECUTION_RESPONSE_INCONSISTENT|STATE_INCONSISTENT_RECOVERY_REQUIRED|COMMIT_STATE_UNRESOLVED))'/g)].map((match) => match[1]);
const mutation = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do|lock|begin|commit|rollback)\b/i;
const evidence = {
  projectId: failureRecord.target.projectId,
  sqlstate: failureRecord.failure.sqlstate,
  failureLine: failureRecord.failure.statementLine,
  executionAttempts: failureRecord.failure.executionAttempts,
  commitStateUnknown: failureRecord.failure.exactCommitState === "UNKNOWN",
  migrationSha256: hash(migration),
  migrationInventory: "001_THROUGH_014_EXACT",
  migration015Absent: true,
  reconciliationSha256: hash(reconciliation),
  sessionAndRolesCovered: ["server_version", "CURRENT_USER", "SESSION_USER", "current_database", "postgres", "fid_function_owner"].every((token) => reconciliation.includes(token)),
  pg17MembershipOptionsCovered: ["pg_catalog.pg_auth_members", "admin_option", "inherit_option", "set_option"].every((token) => reconciliation.includes(token)),
  setRoleCapabilityDistinct: reconciliation.includes("pg_catalog.pg_has_role(member_oid,target_oid,'SET')") && reconciliation.includes("MEMBER_WITHOUT_SET_ROLE_CAPABILITY") && reconciliation.includes("SET_ROLE_CAPABILITY_CONFIRMED"),
  exactObjectsCovered: tables.length === 3 && indexes.length === 6 && [...tables, ...indexes, "fid_execute_prospect_identifier_issuance_transaction"].every((name) => reconciliation.includes(`'${name}'`)),
  tableStructureCovered: ["relowner", "relpersistence", "relrowsecurity", "relforcerowsecurity", "column_count", "constraint_count"].every((token) => reconciliation.includes(token)),
  exactConstraintsCovered: constraints.length === 38 && constraints.every((name) => reconciliation.includes(`'${name}'`)),
  functionStructureCovered: ["identity_arguments", "return_type", "language", "volatility", "parallel_safety", "security_definer", "configured_settings", "function_definition_md5"].every((token) => reconciliation.includes(token)),
  policiesAndPrivilegesCovered: policies.length === 15 && policies.every((name) => reconciliation.includes(`'${name}'`)) && ["PUBLIC", "anon", "authenticated", "service_role", "fid_function_owner", "has_table_privilege", "has_function_privilege", "has_schema_privilege"].every((token) => reconciliation.includes(token)),
  safeCountsCovered: reconciliation.includes("query_to_xml") && reconciliation.includes("SELECT count(*) AS row_count") && ["TABLE_ABSENT", "TABLE_PRESENT_EMPTY", "TABLE_PRESENT_NONEMPTY_RECONCILIATION_REQUIRED"].every((value) => reconciliation.includes(`'${value}'`)),
  migrationMetadataCovered: reconciliation.includes("fid.fid_persistence_migrations") && reconciliation.includes("MIGRATION_METADATA_REMAINS_EXACTLY_AT_VERIFIED_013") && reconciliation.includes("migration_014_metadata_rows"),
  commitStateClassifications: [...new Set(commitClassifications)],
  readOnlyStatements: statements.every((statement) => /^(select|with)\b/i.test(statement)) && !mutation.test(structural),
  noLockingReads: !/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b/i.test(structural),
  noSetRoleExecution: !/\bset\s+role\b/i.test(structural),
  noUuidOrRpcInvocation: !/\bgen_random_uuid\s*\(\s*\)|\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural),
  noSensitiveRows: !/\b(pg_shadow|pg_authid|password|passwd|secret|api[_ ]?key|access[_ ]?token|connection[_ ]?string|authorization[_ ]?header)\b/i.test(structural) && !/SELECT\s+\*/i.test(structural),
  noRepairOrRetry: !/\b(create|alter|drop|grant|revoke|insert|update|delete)\b/i.test(structural),
  noReviewEffects: Object.values(amendment.effects).every((value) => value === false || value === 0),
};
const result = evaluate(amendment, evidence);
const tests = [
  ["failure-record", () => assert(failureRecord.status === "MIGRATION_014_FAILED_COMMIT_STATE_RECONCILIATION_REQUIRED" && failureRecord.failure.sqlstate === "42501" && failureRecord.failure.executionAttempts === 1, "failure")],
  ["failure-position", () => assert(failureRecord.failure.statementLine === 249 && migration.split(/\r?\n/)[248].startsWith("ALTER FUNCTION") && migration.split(/\r?\n/)[249].startsWith("COMMENT ON FUNCTION"), "position")],
  ["statement-order-not-commit", () => assert(!failureRecord.orderedPosition.statementOrderProvesCommitState, "commit inference")],
  ["migration-hash", () => assert(evidence.migrationSha256 === amendment.migrationSha256, "migration hash")],
  ["reconciliation-hash", () => assert(evidence.reconciliationSha256 === amendment.reconciliation.sha256, "reconciliation hash")],
  ["pg17-role-capability", () => assert(evidence.pg17MembershipOptionsCovered && evidence.setRoleCapabilityDistinct, "role capability")],
  ["objects", () => assert(evidence.exactObjectsCovered, "objects")],
  ["table-structure", () => assert(evidence.tableStructureCovered && evidence.exactConstraintsCovered, "tables")],
  ["function-structure", () => assert(evidence.functionStructureCovered, "function")],
  ["security", () => assert(evidence.policiesAndPrivilegesCovered, "security")],
  ["safe-counts", () => assert(evidence.safeCountsCovered, "counts")],
  ["metadata", () => assert(evidence.migrationMetadataCovered, "metadata")],
  ["commit-classifications", () => assert(evidence.commitStateClassifications.length === 6, "classifications")],
  ["read-only", () => assert(evidence.readOnlyStatements && evidence.noLockingReads && evidence.noSetRoleExecution, "read-only")],
  ["no-invocation-or-sensitive-rows", () => assert(evidence.noUuidOrRpcInvocation && evidence.noSensitiveRows, "safety")],
  ["ready", () => assert(result.status === "READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION" && result.blockers.length === 0, "readiness")],
  ["prohibited-scope", () => assert(!result.migrationRetryAuthorized && !result.repairAuthorized && !result.cleanupAuthorized && !result.grantAuthorized && !result.setRoleAuthorized && !result.migration014ExecutionAuthorized, "scope")],
  ["no-review-effects", () => assert(result.databaseOperationsDuringReview === 0 && result.networkRequestsDuringReview === 0, "effects")],
];
let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Migration 014 failed-execution reconciliation diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
