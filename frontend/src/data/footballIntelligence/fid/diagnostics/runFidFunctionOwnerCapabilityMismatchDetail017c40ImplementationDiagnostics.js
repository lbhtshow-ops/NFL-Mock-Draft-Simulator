import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c40ImplementationDeclaration.js";
import contract from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c40ResultEvaluator.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c40StaticOracle.js";
import scenarios, { createValid017c40Result, STATIC_017C40_SCENARIOS } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c40Scenarios.js";
import mapping, { ACL_MATRIX_INVENTORY_INVARIANTS_017C32, ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c32IncrementMapping.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const predecessor = bytes(declaration.predecessorPath).toString("utf8").replace(/\r\n/g, "\n");
const successor = bytes(declaration.successorPath).toString("utf8").replace(/\r\n/g, "\n");

assert.equal(hash(declaration.predecessorPath), declaration.predecessorSha256);
assert.equal(hash(declaration.successorPath), declaration.successorSha256);
assert.equal(review(successor, predecessor).passed, true, review(successor, predecessor).failures.join(","));
assert.equal(contract.orderedFields.length, 25);
assert.equal(new Set(contract.orderedFields).size, 25);
assert.deepEqual(Object.keys(createValid017c40Result()), contract.orderedFields);
for (const scenario of scenarios) {
  const result = evaluate(scenario.transform(createValid017c40Result()), scenario.observed);
  assert.equal(result.accepted, scenario.failure === null, scenario.id);
  if (scenario.failure) assert.equal(result.failures.includes(scenario.failure), true, scenario.id);
}
assert.equal(scenarios.length + STATIC_017C40_SCENARIOS.length, 29);
assert.equal(mapping.length, 15);
assert.equal(ACL_MATRIX_OBJECT_BOUND_UNITS_017C32, 260);
assert.equal(ACL_MATRIX_INVENTORY_INVARIANTS_017C32, 1);
assert.equal(declaration.aclObjectBoundUnits + declaration.aclInventoryUnits, 261);
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, successorSha256: declaration.successorSha256,
  topLevelFields: contract.orderedFields.length, scenarios: scenarios.length + STATIC_017C40_SCENARIOS.length,
  mismatchIncrementClasses: mapping.length, aclGovernanceUnits: 261, sqlExecuted: false, authorizationCreated: false }));
