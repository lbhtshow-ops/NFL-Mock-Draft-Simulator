import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c33IndependentReview.js";
import review from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c33Oracle.js";
import scenarios, { VALID_017C33_TARGET_BINDING, evaluate017c33TargetBinding } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c33Scenarios.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();

assert.equal(hash(declaration.targetPath), declaration.targetSha256);
assert.equal(hash(declaration.predecessorPath), declaration.predecessorSha256);
const outcome = review(bytes(declaration.targetPath).toString("utf8"));
assert.equal(outcome.correctionRequired, true);
for (const finding of ["missing_organization_binding", "missing_project_name_binding", "missing_region_binding"]) {
  assert.equal(outcome.failures.includes(finding), true, finding);
}
for (const finding of ["mutating_or_locking_sql", "rpc_invocation", "table_prerequisite_skip_failure", "count_detail_reconciliation_failure"]) {
  assert.equal(outcome.failures.includes(finding), false, finding);
}
assert.equal(evaluate017c33TargetBinding(VALID_017C33_TARGET_BINDING).accepted, true);
for (const scenario of scenarios) {
  const result = evaluate017c33TargetBinding(scenario.binding);
  assert.equal(result.accepted, false, scenario.id);
  assert.equal(result.failures.includes(scenario.expectedFailure), true, scenario.id);
}
const migrations = fs.readdirSync(path.join(frontend, "src/data/footballIntelligence/fid/persistence/deployment/sql"))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.deepEqual(migrations.map((name) => name.slice(0, 3)), Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(3, "0")));
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted, false);
assert.equal(declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, blockingFindings: declaration.blockingFindings,
  negativeTargetScenariosRejected: scenarios.length, sqlExecuted: false, authorizationCreated: false }));
