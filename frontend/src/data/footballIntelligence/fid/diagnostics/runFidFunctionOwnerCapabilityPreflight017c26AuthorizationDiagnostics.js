import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c26AuthorizationReview.js";
import authorization, { RESULT_COLUMNS_017C26 } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c26ExecutionAuthorization.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c26AuthorizationEvaluator.js";
import scenarios, { VALID_017C26_CONTEXT } from "../persistence/deployment/FidFunctionOwnerCapabilityPreflight017c26Scenarios.js";
import prerequisite from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c25IndependentReviewDeclaration.js";
import visibleReview from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c25IndependentReviewOracle.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, "../../../../..");
const readBytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(readBytes(relative)).digest("hex").toUpperCase();
const protectedFiles = Object.freeze({
  amendment: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql", "8A1FDAC9C00D87550B2E06078221AEFF8D20515906682D6C5B7E34B8E9A8152C"],
  preflight017c19: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql", "A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2"],
  reconciliation: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql", "2EE7BB6741D58D6ED04EB43DEBACB0C5E9E673FE42670BDD82F2A1B1B331F802"],
  postVerification: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql", "281723131FDCAAA0F04EFF929FD09264307939E21884B8A49659717C2B753E42"],
  migration014: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD"],
  reconciliation017c5: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql", "EF3F45440082D9558A6CCF60F9F91F1017D0EC8E3EC0338C37FCEB6DC4742AA7"],
  preflight017c8: ["frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql", "5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495"],
});

assert.equal(hash(authorization.sqlPath), authorization.sqlSha256);
for (const [, [file, expected]] of Object.entries(protectedFiles)) assert.equal(hash(file), expected);
assert.equal(prerequisite.status, review.readiness);
assert.equal(prerequisite.aclMatrix.governanceUnits, review.aclGovernanceUnits);
assert.equal(prerequisite.executionAuthorizationCreated, false);
assert.equal(visibleReview(readBytes(authorization.sqlPath).toString("utf8")).passed, true);
assert.equal(evaluate(VALID_017C26_CONTEXT).authorized, true);
for (const scenario of scenarios) {
  const result = evaluate(scenario.context);
  assert.equal(result.authorized, false, scenario.id);
  assert.equal(result.failures.includes(scenario.expectedFailure), true, scenario.id);
}
assert.deepEqual(authorization.resultColumns, RESULT_COLUMNS_017C26);
assert.equal(authorization.maximumExecutionCount, 1);
assert.equal(authorization.consumption.reusable, false);
assert.equal(authorization.consumption.retryAuthorized, false);

const migrations = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(3, "0")));

console.log(JSON.stringify({ status: review.status, assertions: 15 + scenarios.length + Object.keys(protectedFiles).length, negativeScenariosRejected: scenarios.length, aclGovernanceUnits: review.aclGovernanceUnits, sqlExecuted: false }));
