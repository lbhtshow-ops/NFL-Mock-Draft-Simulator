import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c35IndependentReviewDeclaration.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c35Oracle.js";
import scenarios, { evaluateTargetSourceIndependence017c35 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c35Scenarios.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const sql = bytes(declaration.reviewedPath).toString("utf8").replace(/\r\n/g, "\n");

assert.equal(hash(declaration.reviewedPath), declaration.reviewedSha256);
assert.equal(review(sql).correctionRequired, true);
assert.deepEqual(review(sql).failures, [
  "tautological_target_binding_validation",
  "visible_and_validated_target_share_literal_source",
]);
for (const scenario of scenarios) {
  const outcome = evaluateTargetSourceIndependence017c35(scenario);
  assert.equal(outcome.rejected, false, scenario.id);
  assert.equal(outcome.failure, "actual_target_not_bound_to_validation", scenario.id);
}
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, defect: declaration.defect,
  unrejectedRequiredTargetScenarios: scenarios.length, sqlExecuted: false, authorizationCreated: false }));
