import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c16ReviewDeclaration.js";
import { evaluate017c15CorrectedAmendment } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c15StaticOracle.js";
import { evaluate017c15SchemaGrantAuthority } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c15Evaluator.js";
import { evaluate017c16ReadOnlyFailureReachability, evaluate017c16ReconciliationCoverage, evaluate017c16Review } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c16ReviewEvaluator.js";

const read = (name) => fs.readFileSync(fileURLToPath(new URL(`../persistence/deployment/review/${name}`, import.meta.url)), "utf8");
const hash = (text) => createHash("sha256").update(text).digest("hex").toUpperCase();
const amendment = read("017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql");
const preflight = read("017c15b_fid_function_owner_capability_amendment_guarded_preflight_correction.sql");
const reconciliation = read("017c15c_fid_function_owner_capability_amendment_guarded_reconciliation_correction.sql");
const post = read("017c15d_fid_function_owner_capability_amendment_complete_post_verification_correction.sql");

assert.deepEqual([hash(amendment), hash(preflight), hash(reconciliation), hash(post)], Object.values(declaration.fixedHashes));
assert.equal(evaluate017c15CorrectedAmendment(amendment).passed, true);
assert.equal(evaluate017c15SchemaGrantAuthority({ effectiveCreate: true }), false);
assert.equal(evaluate017c15SchemaGrantAuthority({ directCreateGrantOption: true }), true);
assert.equal(evaluate017c15SchemaGrantAuthority({ schemaOwnedByExecutor: true }), true);

for (const sql of [preflight, reconciliation, post]) {
  const reachability = evaluate017c16ReadOnlyFailureReachability(sql);
  assert.equal(reachability.directOptionalMetadataReference, true);
  assert.equal(reachability.missingMetadataSanitized, false);
}
assert.equal(evaluate017c16ReconciliationCoverage(reconciliation).sixOutcomesExplicit, false);

const result = evaluate017c16Review({
  correctedHashesExact: true,
  protectedHashesExact: true,
  migrationInventoryExact: true,
  migration015Absent: true,
  amendmentBoundaryValid: true,
  preflightMissingMetadataSanitized: false,
  reconciliationMissingMetadataSanitized: false,
  postMissingMetadataSanitized: false,
  reconciliationSixOutcomesExplicit: false,
});
assert.equal(result.status, "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTION_REQUIRED");
assert.equal(result.executionAuthorized, false);
assert.equal(result.sqlExecuted, false);
console.log("17C.16 controlled-deployment review diagnostics passed: correction required");
