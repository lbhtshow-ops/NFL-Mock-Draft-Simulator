import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import baseline from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19.js";
import corrected from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c22ReviewEvaluator.js";
import snapshots from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c22ReviewSnapshots.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const review = path.resolve(here, "../persistence/deployment/review");
const sqlByStage = {
  preflight: fs.readFileSync(path.join(review, "017c19a_fid_function_owner_capability_acl_matrix_preflight.sql"), "utf8"),
  reconciliation: fs.readFileSync(path.join(review, "017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql"), "utf8"),
  postVerification: fs.readFileSync(path.join(review, "017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql"), "utf8"),
};
const result = evaluate({ baseline, corrected, sqlByStage, hashesMatch: true });

assert.equal(result.passed, true);
assert.equal(result.status, snapshots.finalStatus);
assert.equal(baseline.entries.length, snapshots.originalEntries);
assert.equal(corrected.entries.length, snapshots.retainedObjectBoundEntries);
assert.equal(corrected.inventoryInvariants.length, snapshots.inventoryInvariants);
assert.equal(corrected.entries.length + corrected.inventoryInvariants.length, snapshots.governanceUnits);
assert.equal(result.failures.length, 0);

for (const mutation of [
  { baseline, corrected, sqlByStage, hashesMatch: false },
  { baseline, corrected: { ...corrected, entries: corrected.entries.slice(1) }, sqlByStage, hashesMatch: true },
  { baseline, corrected: { ...corrected, inventoryInvariants: [] }, sqlByStage, hashesMatch: true },
  { baseline, corrected, sqlByStage: { ...sqlByStage, reconciliation: sqlByStage.reconciliation.replace("relkind='S'", "relkind='r'") }, hashesMatch: true },
]) assert.equal(evaluate(mutation).passed, false);

console.log("Sprint 17C.22 independent repeat-review diagnostics passed: execution-authorization review ready");
