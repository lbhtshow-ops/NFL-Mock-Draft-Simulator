import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityTargetEvidence017c36Declaration.js";
import authorityMap, { SESSION_EVIDENCE_AUTHORITY_MAP_017C36 } from "../persistence/deployment/FidFunctionOwnerCapabilityTargetEvidence017c36AuthorityMap.js";
import review, { combineFutureExecutionEvidence017c36 } from "../persistence/deployment/FidFunctionOwnerCapabilityTargetEvidence017c36Evaluator.js";
import { SPLIT_AUTHORITY_COMBINATION_SCENARIOS_017C36, TARGET_EVIDENCE_017C36_NEGATIVE_SCENARIOS } from "../persistence/deployment/FidFunctionOwnerCapabilityTargetEvidence017c36Scenarios.js";
import mapping, { ACL_MATRIX_INVENTORY_INVARIANTS_017C32, ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c32IncrementMapping.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const sql = bytes(declaration.sqlPath).toString("utf8").replace(/\r\n/g, "\n");
const predecessor = bytes("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c32_fid_function_owner_capability_mismatch_detail_correction.sql").toString("utf8").replace(/\r\n/g, "\n");
const preservedBody = (value) => value.slice(value.indexOf("identities AS ("), value.indexOf("\nSELECT '", value.indexOf("state_summary AS")));

assert.equal(hash(declaration.sqlPath), declaration.sqlSha256);
assert.equal(hash("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c32_fid_function_owner_capability_mismatch_detail_correction.sql"), declaration.predecessorSha256);
assert.equal(hash("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c34_fid_function_owner_capability_mismatch_detail_exact_target_binding_correction.sql"), declaration.protected017c34Sha256);
assert.equal(review(sql).passed, true, review(sql).failures.join(","));
assert.equal(preservedBody(sql), preservedBody(predecessor), "protected mismatch and ACL body changed");
assert.deepEqual(authorityMap.map(({ property }) => property), ["organization", "project_name", "project_id", "region", "branch", "database_source", "sql_role", "governed_environment"]);
assert.equal(authorityMap.filter(({ classification }) => classification === "DATABASE_SESSION_OBSERVABLE").length, 1);
assert.equal(authorityMap.filter(({ safelyIncludedInSqlClassification }) => safelyIncludedInSqlClassification).length, 1);
assert.equal(SESSION_EVIDENCE_AUTHORITY_MAP_017C36.length, 3);
assert.equal(new Set(TARGET_EVIDENCE_017C36_NEGATIVE_SCENARIOS).size, 20);
for (const scenario of SPLIT_AUTHORITY_COMBINATION_SCENARIOS_017C36) {
  assert.equal(combineFutureExecutionEvidence017c36(scenario.input).ready, scenario.ready, scenario.id);
}
assert.equal(mapping.length, 15);
assert.equal(ACL_MATRIX_OBJECT_BOUND_UNITS_017C32, 260);
assert.equal(ACL_MATRIX_INVENTORY_INVARIANTS_017C32, 1);
assert.match(sql, /count\(\*\)::integer mismatch_count[\s\S]*jsonb_array_length\(s\.mismatch_details\) detail_count/);
assert.match(sql, /FROM tables WHERE complete AND NOT acl_ready/);
assert.match(sql, /FROM table_acl WHERE complete AND acl_ready AND/);
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);

console.log(JSON.stringify({ status: declaration.status, model: declaration.model, sqlSha256: declaration.sqlSha256,
  targetFieldsClassified: authorityMap.length, negativeScenarios: TARGET_EVIDENCE_017C36_NEGATIVE_SCENARIOS.length,
  aclGovernanceUnits: ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 + ACL_MATRIX_INVENTORY_INVARIANTS_017C32,
  sqlExecuted: false, authorizationCreated: false }));
