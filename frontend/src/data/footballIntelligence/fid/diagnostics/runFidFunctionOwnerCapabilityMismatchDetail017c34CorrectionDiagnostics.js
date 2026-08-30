import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c34CorrectionDeclaration.js";
import review, { normalize017c34To017c32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c34Oracle.js";
import scenarios, { EXACT_TARGET_017C34, evaluateExactTarget017c34 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c34Scenarios.js";
import mapping, { ACL_MATRIX_INVENTORY_INVARIANTS_017C32, ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c32IncrementMapping.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const predecessor = bytes(declaration.predecessorPath).toString("utf8").replace(/\r\n/g, "\n");
const successor = bytes(declaration.successorPath).toString("utf8").replace(/\r\n/g, "\n");

assert.equal(hash(declaration.predecessorPath), declaration.predecessorSha256);
assert.equal(hash(declaration.successorPath), declaration.successorSha256);
assert.equal(normalize017c34To017c32(successor), predecessor, "bounded semantic delta");
assert.equal(review(successor).passed, true, review(successor).failures.join(","));
assert.equal(evaluateExactTarget017c34({ target: EXACT_TARGET_017C34 }).accepted, true);
for (const scenario of scenarios) {
  const outcome = evaluateExactTarget017c34(scenario.input);
  assert.equal(outcome.accepted, false, scenario.id);
  assert.equal(outcome.failures.includes(scenario.expectedFailure), true, scenario.id);
}
assert.equal(mapping.length, 15);
assert.equal(ACL_MATRIX_OBJECT_BOUND_UNITS_017C32, 260);
assert.equal(ACL_MATRIX_INVENTORY_INVARIANTS_017C32, 1);
assert.equal(declaration.aclObjectBoundUnits + declaration.aclInventoryUnits, 261);
const migrations = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(3, "0")));
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, successorSha256: declaration.successorSha256,
  negativeScenariosRejected: scenarios.length, aclGovernanceUnits: 261, boundedDelta: true, sqlExecuted: false, authorizationCreated: false }));
