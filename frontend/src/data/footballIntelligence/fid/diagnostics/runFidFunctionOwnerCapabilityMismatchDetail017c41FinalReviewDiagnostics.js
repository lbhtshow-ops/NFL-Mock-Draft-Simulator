import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41IndependentReviewDeclaration.js";
import fixedHash from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41FinalFixedHash.js";
import contract from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41StaticOracle.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41ResultEvaluator.js";
import scenarios, { STATIC_017C41_SCENARIOS } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c41Scenarios.js";
import mapping, { ACL_MATRIX_INVENTORY_INVARIANTS_017C32, ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c32IncrementMapping.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const read = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
const sqlBytes = read(fixedHash.finalSqlPath);
const sql = sqlBytes.toString("utf8").replace(/\r\n/g, "\n");
const predecessor = read("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c36_fid_function_owner_capability_mismatch_detail_split_authority_correction.sql")
  .toString("utf8").replace(/\r\n/g, "\n");

assert.equal(sha256(sqlBytes), fixedHash.sha256);
assert.equal(review(sql, predecessor).passed, true, review(sql, predecessor).failures.join(","));
assert.equal(contract.orderedFields.length, 25);
assert.equal(new Set(contract.orderedFields).size, 25);
for (const scenario of scenarios) {
  const result = evaluate(scenario.input);
  assert.equal(result.classification, scenario.classification, scenario.id);
  assert.equal(result.accepted, scenario.accepted, scenario.id);
  assert.equal(result.repairAuthorized || result.amendmentAuthorized || result.migration014Authorized || result.retryAuthorized, false, scenario.id);
}
assert.equal(scenarios.length + STATIC_017C41_SCENARIOS.length, 24);
assert.equal(mapping.length, 15);
assert.equal(ACL_MATRIX_OBJECT_BOUND_UNITS_017C32, 260);
assert.equal(ACL_MATRIX_INVENTORY_INVARIANTS_017C32, 1);
assert.equal(declaration.boundedCorrectionRequired || fixedHash.boundedSuccessorCreated, false);
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.activeExecutionAuthorizationCreated, false);

console.log(JSON.stringify({ status: declaration.status, finalSqlFilename: fixedHash.finalSqlFilename,
  finalSha256: fixedHash.sha256, topLevelFields: contract.orderedFields.length,
  resultAndStaticScenarios: scenarios.length + STATIC_017C41_SCENARIOS.length,
  mismatchIncrementClasses: mapping.length, aclGovernanceUnits: 261,
  boundedCorrectionRequired: false, sqlExecuted: false, activeExecutionAuthorizationCreated: false }));
