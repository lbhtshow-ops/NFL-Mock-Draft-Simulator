import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c29AuthorizationReview.js";
import authorization, { RESULT_COLUMNS_017C29 } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c29ExecutionAuthorization.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c29AuthorizationEvaluator.js";
import scenarios, { VALID_017C29_CONTEXT } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c29Scenarios.js";
import prerequisite from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c28IndependentReviewDeclaration.js";
import independentReview from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c28IndependentReviewOracle.js";
import attempt017c24 from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24ConsumedAttemptRecord.js";
import attempt017c26 from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c27FailedAttemptRecord.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const protectedPath = "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql";
const protectedFiles = Object.freeze([
  [protectedPath, "C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql", "8A1FDAC9C00D87550B2E06078221AEFF8D20515906682D6C5B7E34B8E9A8152C"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql", "A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql", "2EE7BB6741D58D6ED04EB43DEBACB0C5E9E673FE42670BDD82F2A1B1B331F802"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql", "281723131FDCAAA0F04EFF929FD09264307939E21884B8A49659717C2B753E42"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql", "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7"],
  ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql", "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495"],
]);
assert.equal(hash(authorization.sqlPath), authorization.sqlSha256);
for (const [file, expected] of protectedFiles) assert.equal(hash(file), expected);
assert.equal(prerequisite.status, review.readiness);
assert.equal(prerequisite.executionAuthorizationCreated, false);
assert.equal(prerequisite.matrix.units, 261);
assert.equal(independentReview(bytes(authorization.sqlPath).toString("utf8"), bytes(protectedPath).toString("utf8")).passed, true);
assert.equal(attempt017c24.authorizationConsumed, true);
assert.equal(attempt017c26.authorizationConsumed, true);
assert.equal(attempt017c26.sqlstate, "42602");
assert.equal(attempt017c26.visibleResultRows, 0);
assert.equal(attempt017c26.aclOutcomeEstablished, false);
assert.equal(evaluate(VALID_017C29_CONTEXT).authorized, true);
for (const scenario of scenarios) {
  const result = evaluate(scenario.context);
  assert.equal(result.authorized, false, scenario.id);
  assert.equal(result.failures.includes(scenario.expectedFailure), true, scenario.id);
}
assert.deepEqual(authorization.resultColumns, RESULT_COLUMNS_017C29);
assert.equal(authorization.maximumExecutionCount, 1);
assert.equal(authorization.consumption.reusable, false);
assert.equal(authorization.consumption.retryAuthorized, false);
const migrations = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(3, "0")));
console.log(JSON.stringify({ status: review.status, assertions: 22 + protectedFiles.length + scenarios.length * 2, negativeScenariosRejected: scenarios.length, aclGovernanceUnits: review.aclGovernanceUnits, authorizationId: authorization.authorizationId, sqlExecuted: false }));
