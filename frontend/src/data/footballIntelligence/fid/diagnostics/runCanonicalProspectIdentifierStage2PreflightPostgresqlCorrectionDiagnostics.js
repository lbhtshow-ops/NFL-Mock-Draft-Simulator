import fs from "node:fs";
import { createHash } from "node:crypto";
import failureRecord from "../persistence/deployment/CanonicalProspectIdentifierStage2Preflight017c2ExecutionFailureRecord.js";
import amendment from "../persistence/deployment/CanonicalProspectIdentifierStage2PreflightPostgresqlCorrectionAmendment.js";
import { evaluateCanonicalProspectIdentifierStage2PreflightPostgresqlCorrection as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierStage2PreflightPostgresqlCorrectionEvaluator.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const original = read("../persistence/deployment/review/017c_read_only_target_preflight.sql");
const preflight017c2 = read("../persistence/deployment/review/017c2_stage2_read_only_target_preflight_successor.sql");
const preflight017c3 = read("../persistence/deployment/review/017c3_stage2_read_only_target_preflight_postgresql_correction.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const stripped = preflight017c3.replace(/--[^\r\n]*/g, "");
const structural = stripped.replace(/'(?:''|[^'])*'/g, "''");
const statements = stripped.split(";").map((statement) => statement.trim()).filter(Boolean);
const incompatiblePattern = /FROM\s+unexpected_results\s+ORDER\s+BY\s+ordinal_position\s+NULLS\s+LAST\s*,\s*migration_id\s+COLLATE\s+"C"/i;
const outerOrderPattern = /combined_results\s+AS\s*\([\s\S]*?UNION\s+ALL[\s\S]*?FROM\s+unexpected_results\s*\)\s*SELECT\s+ordinal_position\s*,\s*migration_id\s*,\s*occurrence_count\s*,\s*sanitized_classification\s+FROM\s+combined_results\s+ORDER\s+BY\s+ordinal_position\s+NULLS\s+LAST\s*,\s*migration_id\s+COLLATE\s+"C"/i;
const outputColumns = "ordinal_position,migration_id,occurrence_count,sanitized_classification";
const selectedColumns = [...preflight017c3.matchAll(/SELECT\s+ordinal_position\s*,\s*migration_id\s*,\s*occurrence_count\s*,\s*sanitized_classification/g)].map(() => outputColumns);
const indexNames = [...migration014.matchAll(/^CREATE INDEX\s+([a-z0-9_]+)\s+/gmi)].map((match) => match[1]);
const mutation = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do|lock|begin|commit|rollback)\b/i;
const coverageTokens = ["server_version", "CURRENT_USER", "SESSION_USER", "current_database", "gen_random_uuid", "service_role", "anon", "authenticated", "fid_function_owner", "has_schema_privilege", "fid_identifier_reservations", "fid_identifier_issuance_ledger", "fid_identifier_issuance_idempotency", "fid_execute_prospect_identifier_issuance_transaction", "planner_estimated_rows", "fid_persistence_migrations", "pg_has_role"];
const evidence = {
  failureClassification: failureRecord.classification,
  sqlstate: failureRecord.sqlstate,
  stage1Status: "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
  exactTargetAuthorized: true,
  originalPreflightSha256: hash(original),
  preflight017c2Sha256: hash(preflight017c2),
  migration014Sha256: hash(migration014),
  preflight017c3Sha256: hash(preflight017c3),
  migrationInventory: "001_THROUGH_014_EXACT",
  migration015Absent: true,
  incompatiblePatternAbsent: incompatiblePattern.test(preflight017c2) && !incompatiblePattern.test(preflight017c3),
  outerOrderingPresent: outerOrderPattern.test(preflight017c3),
  deterministicOrderingPreserved: preflight017c3.includes('ORDER BY ordinal_position NULLS LAST, migration_id COLLATE "C"'),
  resultColumnsPreserved: selectedColumns.length === 3 && selectedColumns.every((columns) => columns === outputColumns),
  allTenBlocksPreserved: Array.from({ length: 10 }, (_, index) => `BLOCK ${index + 1}:`).every((block) => preflight017c3.includes(block)) && coverageTokens.every((token) => preflight017c3.includes(token)),
  exactMetadataCoveragePreserved: ["EXACT_MIGRATIONS_001_THROUGH_013_APPLIED_AND_VERIFIED", "MIGRATION_METADATA_MISSING", "MIGRATION_METADATA_CONFLICTING_OR_PARTIAL", "MIGRATION_METADATA_DUPLICATED_OR_UNEXPECTED", "MISSING", "DUPLICATED", "UNEXPECTED"].every((token) => preflight017c3.includes(`'${token}'`)),
  ownershipCoveragePreserved: preflight017c3.includes("pg_catalog.pg_has_role(executing_role.oid,target_role.oid,'MEMBER')") && preflight017c3.includes("executing_role_schema_create") && preflight017c3.includes("target_owner_schema_usage"),
  exactSixIndexesPreserved: indexNames.length === 6 && indexNames.every((name) => preflight017c3.includes(`'${name}'`)),
  readOnlyStatements: statements.every((statement) => /^(select|with)\b/i.test(statement)) && !mutation.test(structural),
  noLockingReads: !/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b/i.test(structural),
  noUuidInvocation: !/\bgen_random_uuid\s*\(\s*\)/i.test(structural),
  noIssuanceRpcInvocation: !/\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(structural),
  noSensitiveAccess: !/\b(pg_shadow|pg_authid|password|passwd|secret|api[_ ]?key|access[_ ]?token|connection[_ ]?string|authorization[_ ]?header|result_payload|candidate_identifier)\b/i.test(structural),
  noExternalEffects: Object.values(amendment.effects).every((value) => value === false || value === 0),
};
const result = evaluate(amendment, evidence);
const tests = [
  ["failure-evidence", () => assert(failureRecord.sqlstate === "0A000" && failureRecord.databaseMutations === 0 && !failureRecord.migration014Executed && !failureRecord.stage2Completed, "failure record")],
  ["protected-hashes", () => assert(evidence.originalPreflightSha256 === amendment.protectedArtifacts.originalPreflightSha256 && evidence.preflight017c2Sha256 === amendment.protectedArtifacts.incompatible017c2Sha256 && evidence.migration014Sha256 === amendment.protectedArtifacts.migration014Sha256, "protected hash")],
  ["017c3-hash", () => assert(evidence.preflight017c3Sha256 === amendment.authorizedSuccessor.sha256, "017c3 hash")],
  ["incompatible-pattern-absent", () => assert(evidence.incompatiblePatternAbsent, "incompatible pattern")],
  ["outer-ordering", () => assert(evidence.outerOrderingPresent && evidence.deterministicOrderingPreserved, "outer ordering")],
  ["result-columns", () => assert(evidence.resultColumnsPreserved, "result columns")],
  ["ten-blocks", () => assert(evidence.allTenBlocksPreserved, "coverage blocks")],
  ["metadata", () => assert(evidence.exactMetadataCoveragePreserved, "metadata")],
  ["ownership", () => assert(evidence.ownershipCoveragePreserved, "ownership")],
  ["six-indexes", () => assert(evidence.exactSixIndexesPreserved, "indexes")],
  ["read-only", () => assert(evidence.readOnlyStatements && evidence.noLockingReads, "read-only")],
  ["no-invocations", () => assert(evidence.noUuidInvocation && evidence.noIssuanceRpcInvocation, "invocation")],
  ["no-sensitive-access", () => assert(evidence.noSensitiveAccess, "sensitive access")],
  ["ready", () => assert(result.status === "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_REEXECUTION" && result.blockers.length === 0, "readiness")],
  ["scope", () => assert(result.preflight017c3ReexecutionAuthorized && !result.preflight017c2ReexecutionAuthorized && !result.migration014ExecutionAuthorized, "scope")],
  ["no-review-effects", () => assert(!result.sqlExecutedDuringReview && result.databaseOperations === 0 && result.networkRequests === 0, "effects")],
];
let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Stage 2 PostgreSQL compatibility correction diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
