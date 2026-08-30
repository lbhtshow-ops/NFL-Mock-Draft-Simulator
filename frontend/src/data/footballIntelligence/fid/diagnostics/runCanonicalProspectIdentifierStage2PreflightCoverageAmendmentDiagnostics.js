import fs from "node:fs";
import { createHash } from "node:crypto";
import amendment from "../persistence/deployment/CanonicalProspectIdentifierStage2PreflightCoverageAmendment.js";
import { evaluateCanonicalProspectIdentifierStage2PreflightSuccessorStaticEvidence as evaluate } from "../persistence/deployment/CanonicalProspectIdentifierStage2PreflightSuccessorStaticEvaluator.js";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
const sha256 = (text) => createHash("sha256").update(text).digest("hex").toUpperCase();
const assert = (value, message) => { if (!value) throw new Error(message); };
const original = read("../persistence/deployment/review/017c_read_only_target_preflight.sql");
const successor = read("../persistence/deployment/review/017c2_stage2_read_only_target_preflight_successor.sql");
const migration002 = read("../persistence/deployment/sql/002_create_fid_schema_version_storage.sql");
const migration013 = read("../persistence/deployment/sql/013_record_fid_deployment_metadata.sql");
const migration014 = read("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql");
const withoutComments = successor.replace(/--[^\r\n]*/g, "");
const withoutCommentsOrStrings = withoutComments.replace(/'(?:''|[^'])*'/g, "''");
const statements = withoutComments.split(";").map((statement) => statement.trim()).filter(Boolean);
const derivedIndexNames = [...migration014.matchAll(/^CREATE INDEX\s+([a-z0-9_]+)\s+/gmi)].map((match) => match[1]);
const governedArrayLiteral = migration013.match(/ARRAY\[(.*?)\]::text\[\]/s)?.[1] ?? "";
const governedIds = [...governedArrayLiteral.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const expectedApprovedCoverage = [
  "server_version", "CURRENT_USER", "SESSION_USER", "current_database", "gen_random_uuid",
  "service_role", "anon", "authenticated", "fid_function_owner", "has_schema_privilege",
  "fid_identifier_reservations", "fid_identifier_issuance_ledger", "fid_identifier_issuance_idempotency",
  "fid_execute_prospect_identifier_issuance_transaction", "planner_estimated_rows",
];
const prohibitedMutation = /\b(create|alter|drop|truncate|insert|update|delete|merge|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do|lock|begin|commit|rollback)\b/i;
const evidence = {
  stage1Status: "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
  exactTargetAuthorized: true,
  originalPreflightSha256: sha256(original),
  successorSha256: sha256(successor),
  migration014Sha256: sha256(migration014),
  migrationInventory: "001_THROUGH_014_EXACT",
  migration015Absent: true,
  approvedChecksPreserved: expectedApprovedCoverage.every((token) => successor.includes(token)),
  exactMigrationMetadataCovered: migration002.includes("CREATE TABLE fid.fid_persistence_migrations")
    && successor.includes("FROM fid.fid_persistence_migrations")
    && governedIds.length === 13
    && JSON.stringify(governedIds) === JSON.stringify(amendment.expectedMigrationIds)
    && amendment.expectedMigrationIds.every((id) => successor.includes(`'${id}'`)),
  metadataFailureClassificationsCovered: ["MIGRATION_METADATA_MISSING", "MIGRATION_METADATA_CONFLICTING_OR_PARTIAL", "MIGRATION_METADATA_DUPLICATED_OR_UNEXPECTED", "MISSING", "DUPLICATED", "UNEXPECTED"].every((value) => successor.includes(`'${value}'`)),
  ownershipTransferCovered: successor.includes("pg_catalog.pg_has_role(executing_role.oid,target_role.oid,'MEMBER')")
    && successor.includes("executing_role.rolsuper")
    && successor.includes("executing_role_schema_create")
    && successor.includes("target_owner_schema_usage"),
  exactSixIndexesCovered: derivedIndexNames.length === 6
    && JSON.stringify(derivedIndexNames) === JSON.stringify(amendment.expectedIndexNames)
    && derivedIndexNames.every((name) => successor.includes(`'${name}'`)),
  readOnlyStatements: statements.every((statement) => /^(select|with)\b/i.test(statement)) && !prohibitedMutation.test(withoutCommentsOrStrings),
  noLockingRead: !/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b/i.test(withoutCommentsOrStrings),
  noUuidInvocation: !/\bgen_random_uuid\s*\(\s*\)/i.test(withoutCommentsOrStrings),
  noIssuanceRpcInvocation: !/\bfid_execute_prospect_identifier_issuance_transaction\s*\(/i.test(withoutCommentsOrStrings),
  noSensitiveCatalog: !/\b(pg_shadow|pg_authid|password|passwd|secret|api[_ ]?key|access[_ ]?token|connection[_ ]?string|authorization[_ ]?header)\b/i.test(withoutCommentsOrStrings),
  sanitizedOutput: ["sanitized_classification", "occurrence_count", "conflicting_relation_count"].every((token) => successor.includes(token))
    && !/result_payload|candidate_identifier|audit_refs/i.test(withoutCommentsOrStrings),
  noExternalEffects: Object.values(amendment.effects).every((value) => value === false || value === 0),
};
const result = evaluate(amendment, evidence);
const tests = [
  ["original-preflight-hash", () => assert(evidence.originalPreflightSha256 === amendment.originalPreflight.sha256, "original preflight hash")],
  ["successor-hash", () => assert(evidence.successorSha256 === amendment.authorizedSuccessor.sha256, "successor hash")],
  ["migration-014-hash", () => assert(evidence.migration014Sha256 === amendment.migration.approvedSha256, "migration hash")],
  ["approved-coverage", () => assert(evidence.approvedChecksPreserved, "approved coverage")],
  ["metadata-schema-derived", () => assert(evidence.exactMigrationMetadataCovered, "metadata coverage")],
  ["metadata-classifications", () => assert(evidence.metadataFailureClassificationsCovered, "metadata classifications")],
  ["ownership-transfer", () => assert(evidence.ownershipTransferCovered, "ownership transfer")],
  ["six-derived-indexes", () => assert(evidence.exactSixIndexesCovered, "index coverage")],
  ["read-only", () => assert(evidence.readOnlyStatements, "mutating statement")],
  ["no-locking-read", () => assert(evidence.noLockingRead, "locking read")],
  ["no-uuid-invocation", () => assert(evidence.noUuidInvocation, "UUID invocation")],
  ["no-rpc-invocation", () => assert(evidence.noIssuanceRpcInvocation, "RPC invocation")],
  ["no-sensitive-catalog", () => assert(evidence.noSensitiveCatalog, "sensitive catalog")],
  ["sanitized-output", () => assert(evidence.sanitizedOutput, "unsanitized output")],
  ["ready", () => assert(result.status === "READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_EXECUTION" && result.blockers.length === 0, "readiness")],
  ["migration-still-prohibited", () => assert(!result.migration014ExecutionAuthorized && !result.originalPreflightExecutionAuthorized, "scope")],
  ["no-review-effects", () => assert(!result.sqlExecutedDuringReview && result.databaseOperations === 0 && result.networkRequests === 0, "effects")],
];
let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Stage 2 preflight coverage amendment diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
