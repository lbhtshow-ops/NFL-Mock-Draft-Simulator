import fs from "node:fs";
import { createHash } from "node:crypto";
import record from "../persistence/deployment/CanonicalProspectIdentifierStage2Preflight017c3ResultRecord.js";
import authorization from "../persistence/deployment/CanonicalProspectIdentifierMigration014ExecutionAuthorization.js";
import { evaluateCanonicalProspectIdentifierMigration014ExecutionReadiness as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierMigration014ExecutionReadinessEvaluator.js";
import { evaluateProspectIdentifierMigration014Sql } from "../persistence/deployment/ProspectIdentifierMigration014StaticOracle.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url));
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const preflightHash = hash(read("../persistence/deployment/review/017c3_stage2_read_only_target_preflight_postgresql_correction.sql"));
const migrationBuffer = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const migrationHash = hash(migrationBuffer);
const migrationSql = migrationBuffer.toString("utf8");
const oracle = evaluateProspectIdentifierMigration014Sql(migrationSql);
const evidence = {
  exactTargetAuthorized: true,
  preflight017c3Sha256: preflightHash,
  migrationInventory: "001_THROUGH_014_EXACT",
  migration015Absent: true,
  migration014Sha256: migrationHash,
  originalHashDeployable: false,
  executeOnce: true,
  stopOnError: true,
  adHocRepairProhibited: true,
  uncertainResponseRequiresReconciliation: true,
  postExecutionAcceptanceSeparatelyAuthorized: false,
  stopAfterExecution: true,
  databaseAccessDuringReview: false,
  sqlExecutedDuringReview: false,
  networkAccessDuringReview: false,
};
const result = evaluate(record, evidence);
const tests = [
  ["exact-target", () => assert(record.target.projectId === authorization.exactProjectId && record.target.projectState === "ACTIVE_UNPAUSED" && record.target.purpose === "TEST_ONLY", "target")],
  ["preflight-success", () => assert(record.execution.completeRunSucceeded && record.execution.allTenBlocksCaptured && record.execution.sqlErrors === 0 && record.execution.databaseMutations === 0, "execution")],
  ["preflight-hash", () => assert(preflightHash === record.execution.artifactSha256, "preflight hash")],
  ["postgres-uuid", () => assert(record.blocks.session.serverVersion === "17.6" && record.blocks.uuidCapability.resultType === "uuid" && !record.blocks.uuidCapability.invoked, "postgres/uuid")],
  ["roles", () => assert(record.blocks.roles.length === 4 && record.blocks.roles.find((role) => role.name === "fid_function_owner")?.inherit === false, "roles")],
  ["schema", () => assert(Object.values(record.blocks.schema).filter((value) => typeof value === "boolean").every(Boolean), "schema")],
  ["object-conflicts", () => assert(record.blocks.migration014ObjectConflicts.rowCount === 0 && record.blocks.migration014ObjectConflicts.rpcAbsent, "objects")],
  ["planner-estimates", () => assert(record.blocks.fidInventory.plannerEstimates.every((value) => value === -1) && record.blocks.fidInventory.interpretation === "UNANALYZED_PLANNER_ESTIMATES_NOT_ROW_COUNTS", "planner")],
  ["metadata", () => assert(record.blocks.migrationMetadata.classification === "EXACT_MIGRATIONS_001_THROUGH_013_APPLIED_AND_VERIFIED" && record.blocks.migrationIdentifiers.length === 13 && record.blocks.migrationIdentifiers.every((item) => item.occurrenceCount === 1 && item.classification === "EXACT"), "metadata")],
  ["ownership", () => assert(record.blocks.ownershipTransfer.classification === "OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_MEMBERSHIP", "ownership")],
  ["indexes", () => assert(record.blocks.indexConflicts.length === 6 && record.blocks.indexConflicts.every((item) => item.conflictingRelationCount === 0 && item.classification === "AVAILABLE"), "indexes")],
  ["migration-hash", () => assert(migrationHash === authorization.migrationSha256 && migrationHash !== authorization.prohibitedMigrationSha256, "migration hash")],
  ["migration-oracle", () => assert(oracle.status === "MIGRATION_014_STATIC_ORACLE_PASSED", "oracle")],
  ["security-model", () => assert(migrationSql.includes("SECURITY DEFINER") && (migrationSql.match(/FORCE ROW LEVEL SECURITY/g) ?? []).length === 3 && migrationSql.includes("REVOKE ALL ON TABLE") && migrationSql.includes("GRANT EXECUTE ON FUNCTION"), "security")],
  ["ready", () => assert(result.status === "READY_FOR_CONTROLLED_CORRECTED_MIGRATION_014_EXECUTION" && result.blockers.length === 0 && result.executionCountAuthorized === 1, "readiness")],
  ["scope", () => assert(!result.issuanceRpcAuthorized && !result.prospectOperationsAuthorized && !result.postDeploymentAcceptanceAuthorized, "scope")],
  ["safeguards", () => assert(authorization.safeguards.stopImmediatelyOnAnyError && authorization.safeguards.adHocRepairProhibited && authorization.safeguards.partialRerunProhibited && authorization.safeguards.stopAfterExecution, "safeguards")],
  ["no-review-effects", () => assert(result.databaseOperationsDuringReview === 0 && result.networkRequestsDuringReview === 0, "effects")],
];
let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Stage 2 result and migration 014 authorization diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
