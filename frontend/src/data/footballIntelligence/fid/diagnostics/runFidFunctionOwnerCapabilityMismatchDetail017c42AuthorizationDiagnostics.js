import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c42AuthorizationReview.js";
import authorization from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c42ExecutionAuthorization.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c42AuthorizationEvaluator.js";
import scenarios, { VALID_017C42_CONTEXT } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c42Scenarios.js";
import prerequisite from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41IndependentReviewDeclaration.js";
import fixedHash from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41FinalFixedHash.js";
import contract from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import consumed017c23 from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24ConsumedAttemptRecord.js";
import consumed017c26 from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c27FailedAttemptRecord.js";
import consumed017c29 from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c30ExecutionResult.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const protectedFiles = Object.freeze([
  [fixedHash.finalSqlPath, fixedHash.sha256],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c36_fid_function_owner_capability_mismatch_detail_split_authority_correction.sql", "ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c34_fid_function_owner_capability_mismatch_detail_exact_target_binding_correction.sql", "E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c32_fid_function_owner_capability_mismatch_detail_correction.sql", "9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c30_fid_function_owner_capability_mismatch_detail_read_only_diagnostic.sql", "A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD"],
]);

for (const [file, expected] of protectedFiles) assert.equal(hash(file), expected, file);
assert.equal(hash(authorization.sqlPath), authorization.sqlSha256);
assert.equal(prerequisite.status, "READY_FOR_ONE_CONTROLLED_SPLIT_AUTHORITY_MISMATCH_DETAIL_DIAGNOSTIC_EXECUTION_AUTHORIZATION");
assert.equal(prerequisite.activeExecutionAuthorizationCreated, false);
assert.equal(review.authoritativeDatabaseState, "MIGRATION_014_FULLY_ROLLED_BACK");
assert.equal(consumed017c23.authorizationConsumed && consumed017c26.authorizationConsumed && consumed017c29.authorizationConsumed, true);
assert.equal(evaluate(VALID_017C42_CONTEXT).authorized, true);
for (const scenario of scenarios) {
  const result = evaluate(scenario.context);
  assert.equal(result.authorized, false, scenario.id);
  assert.equal(result.failures.includes(scenario.expectedFailure), true, scenario.id);
}
assert.deepEqual(authorization.resultColumns, contract.orderedFields);
assert.equal(authorization.resultColumns.length, 25);
assert.equal(authorization.status, "ACTIVE_UNCONSUMED");
assert.equal(authorization.maximumAttempts, 1);
assert.equal(authorization.maximumExecutions, 1);
assert.equal(authorization.consumption.retryAuthorized || authorization.consumption.reusable, false);
assert.equal(Object.values(authorization.exclusions).every((value) => value === "PROHIBITED"), true);
assert.equal(review.sqlExecuted || review.databaseConnected || review.databaseStateModified, false);
const migrations = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(3, "0")));

console.log(JSON.stringify({ status: review.status, authorizationId: authorization.authorizationId,
  authorizationStatus: authorization.status, finalSqlFilename: authorization.sqlFilename, finalSha256: authorization.sqlSha256,
  protectedHashes: protectedFiles.length, negativeScenariosRejected: scenarios.length, resultFields: authorization.resultColumns.length,
  maximumAttempts: authorization.maximumAttempts, maximumExecutions: authorization.maximumExecutions,
  sqlExecuted: false, databaseConnected: false, databaseStateModified: false }));
