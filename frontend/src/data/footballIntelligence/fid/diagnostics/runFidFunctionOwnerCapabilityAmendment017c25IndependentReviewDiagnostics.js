import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c25IndependentReviewDeclaration.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c25IndependentReviewOracle.js";
import scenarios from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c25IndependentReviewScenarios.js";
import attempt from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c24ConsumedAttemptRecord.js";
import matrix from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, "../../../../..");
const read = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")), "utf8");
const hash = (relative) => crypto.createHash("sha256").update(read(relative)).digest("hex").toUpperCase();
const sql = read(declaration.successorPath);
const oldSql = read("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql");

assert.equal(hash(declaration.successorPath), declaration.successorSha256);
const protectedPaths = Object.freeze({
  amendment: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql",
  preflight017c19: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19a_fid_function_owner_capability_acl_matrix_preflight.sql",
  reconciliation017c19: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql",
  postVerification017c19: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql",
  migration014: "frontend/src/data/footballIntelligence/fid/persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql",
  reconciliation017c5: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql",
  preflight017c8: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql",
});
for (const [id, file] of Object.entries(protectedPaths)) assert.equal(hash(file), declaration.protectedHashes[id]);

assert.equal(review(sql).passed, true);
assert.equal(attempt.authorizationConsumed, true);
assert.equal(attempt.preflightAssessment, declaration.priorResult);
assert.equal(attempt.retryAuthorized, false);
assert.equal(declaration.executionAuthorizationCreated, false);
assert.equal(declaration.retryAuthorized, false);
assert.equal(matrix.id, declaration.aclMatrix.id);
assert.equal(matrix.version, declaration.aclMatrix.version);
assert.equal(matrix.entries.length, declaration.aclMatrix.objectBoundEntries);
assert.equal(matrix.inventoryInvariants.length, declaration.aclMatrix.inventoryInvariants);
assert.equal(matrix.entries.length + matrix.inventoryInvariants.length, declaration.aclMatrix.governanceUnits);

const parityTokens = [
  "governed_tables constant text[]", "privileges constant text[]", "rolcanlogin OR rolsuper",
  "admin_option AND NOT inherit_option", "set_option", "has_schema_privilege", "has_table_privilege",
  "has_function_privilege", "aclexplode", "relkind='S'", "relkind='r'", "prosecdef",
  "search_path=pg_catalog, fid", "metadata_total<>1", "metadata_014<>0",
];
for (const token of parityTokens) {
  assert.equal(oldSql.includes(token), true, `17C.19 missing parity token ${token}`);
  assert.equal(sql.includes(token), true, `17C.24 missing parity token ${token}`);
}
assert.match(oldSql, /RAISE NOTICE 'classification=%/);
assert.doesNotMatch(sql, /RAISE\s+(?:NOTICE|INFO)/i);
assert.match(sql, /WITH payload AS \([\s\S]*current_setting[\s\S]*SELECT[\s\S]*FROM payload/i);

let negativeCount = 0;
for (const scenario of scenarios) {
  if (scenario.expectedPass) {
    assert.equal(review(sql).passed, true, scenario.id);
  } else if (scenario.governanceReject) {
    assert.match(scenario.governanceReject, /PROHIBITED/);
  } else if (scenario.structural) {
    assert.match(scenario.structural, /VISIBLE_UNRESOLVED|TRANSACTION_ABORTS/);
  } else {
    let mutated = sql;
    if (scenario.remove) mutated = mutated.replaceAll(scenario.remove, "");
    if (scenario.replace) mutated = mutated.replace(scenario.replace[0], scenario.replace[1]);
    if (scenario.append) mutated += scenario.append;
    const result = review(mutated);
    assert.equal(result.passed, false, scenario.id);
    assert.equal(result.failures.includes(scenario.expectedFailure), true, `${scenario.id}: ${result.failures.join(",")}`);
    negativeCount += 1;
  }
}

const migrationNames = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrationNames.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(3, "0")));

console.log(JSON.stringify({
  status: declaration.status,
  scenarios: scenarios.length,
  negativeMutationsRejected: negativeCount,
  aclGovernanceUnits: declaration.aclMatrix.governanceUnits,
  executionAuthorizationCreated: false,
}));
