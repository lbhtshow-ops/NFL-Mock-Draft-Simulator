import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import attempt from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24ConsumedAttemptRecord.js";
import correction from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24VisibleResultCorrectionDeclaration.js";
import evaluate, { reviewVisiblePreflightSql017c24 } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24VisibleResultOracle.js";
import scenarios from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24VisibleResultScenarios.js";
import matrix from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, "../../../../..");
const reviewDir = path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/review");
const oldSql = fs.readFileSync(path.join(reviewDir, "017c19a_fid_function_owner_capability_acl_matrix_preflight.sql"), "utf8");
const sql = fs.readFileSync(path.join(frontend, correction.successorPath.replace(/^frontend\//, "")), "utf8");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex").toUpperCase();

assert.equal(attempt.authorizationId, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_ONE_EXECUTION_017C23_V1");
assert.equal(attempt.authorizationVersion, "17C.23.1");
assert.equal(attempt.attemptNumber, 1);
assert.equal(attempt.authorizationConsumed, true);
assert.equal(attempt.dashboardResponseClassification, "SUCCESS_NO_ROWS_RETURNED");
assert.equal(attempt.visibleResultSetCount, 0);
assert.equal(attempt.visibleGovernedClassification, null);
assert.equal(attempt.preflightAssessment, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_RESULT_INCOMPLETE");
assert.equal(attempt.retryAuthorized, false);
assert.equal(attempt.amendmentExecutionAuthorized, false);

assert.match(oldSql, /RAISE NOTICE 'classification=%/);
assert.doesNotMatch(oldSql, /SELECT\s+[\s\S]*AS result_identity/i);
assert.equal(reviewVisiblePreflightSql017c24(sql).passed, true);
assert.equal(sha256(sql), correction.successorSha256);
assert.equal(correction.expectedVisibleResultSets, 1);
assert.equal(correction.expectedRows, 1);
assert.equal(correction.stableColumns.length, 16);
assert.equal(matrix.entries.length, 260);
assert.equal(matrix.inventoryInvariants.length, 1);
assert.equal(matrix.entries.length + matrix.inventoryInvariants.length, correction.aclMatrix.governanceUnits);

assert.equal(evaluate(scenarios.exactBeforeState).accepted, true);
assert.equal(evaluate(scenarios.aclMismatch).accepted, true);
assert.equal(evaluate(scenarios.missingMetadata).accepted, true);
assert.equal(evaluate(scenarios.missingRole).accepted, true);
assert.equal(evaluate(scenarios.sqlError).reason, "SQL_ERROR_BEFORE_FINAL_RESULT");
assert.equal(evaluate(scenarios.noticeOnly).reason, "VISIBLE_RESULT_MISSING");
assert.equal(evaluate(scenarios.successNoRows).reason, "VISIBLE_RESULT_MISSING");
assert.equal(evaluate(scenarios.incompleteFinalRow).reason, "INCOMPLETE_FINAL_ROW");
assert.equal(evaluate(scenarios.staleSessionValue).reason, "RESULT_CONTRACT_IDENTITY_MISMATCH");
assert.equal(evaluate(scenarios.conflictingRows).reason, "MULTIPLE_OR_CONFLICTING_SUMMARY_ROWS");
assert.equal(evaluate(scenarios.optionalRelationAbsent).classification, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED");
assert.equal(scenarios.exactZeroSequenceInventory.expectedSequenceCount, 0);
assert.equal(evaluate(scenarios.unexpectedSequence).classification, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED");

for (const token of [
  "fid_record_revisions", "fid_persistence_effect_receipts", "fid_persistence_audit_events",
  "fid_persistence_idempotency", "fid_persistence_batches", "fid_persistence_batch_operations",
  "fid_persistence_migrations", "fid_execute_atomic_persistence_batch", "service_role", "anon",
  "authenticated", "PUBLIC", "relkind='S'", "admin_option AND NOT inherit_option", "set_option",
]) assert.match(sql, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.equal(reviewVisiblePreflightSql017c24(sql.replaceAll("fid_record_revisions", "")).passed, false);
assert.equal(reviewVisiblePreflightSql017c24(sql.replaceAll(scenarios.lostFunctionCoverage.sqlMutation, "")).passed, false);
assert.equal(reviewVisiblePreflightSql017c24(sql.replaceAll(scenarios.lostBrowserRoleDenial.sqlMutation, "")).passed, false);
assert.equal(reviewVisiblePreflightSql017c24(`${sql}\n${scenarios.unsafeDynamicIdentifier.sqlMutation};`).passed, false);
assert.equal(scenarios.consumedAuthorization.authorizationConsumed, true);
assert.equal(scenarios.consumedAuthorization.retryAuthorized, false);
assert.equal(scenarios.attemptedRetry.retryAuthorized, true);
assert.equal(scenarios.amendmentExecutionIncluded.amendmentAuthorized, true);

console.log(JSON.stringify({
  status: correction.status,
  successorSha256: sha256(sql),
  scenarios: Object.keys(scenarios).length,
  authorizationCreated: false,
}));
