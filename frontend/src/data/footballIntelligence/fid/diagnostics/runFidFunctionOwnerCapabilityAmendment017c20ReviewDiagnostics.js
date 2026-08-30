import assert from "node:assert/strict";
import matrix from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c20ReviewEvaluator.js";
import snapshots from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c20ReviewSnapshots.js";

const migrationInventory = Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(3, "0"));
const result = evaluate({ matrix, protectedHashesMatch: true, migrationInventory });

assert.equal(matrix.entries.length, snapshots.exactMatrixEntryCount);
assert.equal(result.passed, false);
assert.equal(result.status, snapshots.finalStatus);
assert.equal(result.failures.filter((failure) => failure.startsWith("duplicate:")).length, snapshots.duplicateEntryCount);
assert.equal(result.failures.filter((failure) => failure.startsWith("unbound_sequence_expectation:")).length,
  snapshots.unboundEmptySequenceEntryCount);
assert.equal(Object.isFrozen(result), true);
assert.equal(Object.isFrozen(result.failures), true);

console.log("Sprint 17C.20 independent review diagnostics passed (bounded correction correctly required).");
