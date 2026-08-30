import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import baseline from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19.js";
import corrected from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21.js";
import snapshots from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21Snapshots.js";
import {
  evaluateInventoryModel,
  evaluateMatrix017c21,
  evaluateSqlSequenceCoverage,
  REQUIRED_SCENARIOS_017C21,
} from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c21Oracle.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const review = path.resolve(here, "../persistence/deployment/review");
const sqlByStage = {
  preflight: fs.readFileSync(path.join(review, "017c19a_fid_function_owner_capability_acl_matrix_preflight.sql"), "utf8"),
  reconciliation: fs.readFileSync(path.join(review, "017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql"), "utf8"),
  postVerification: fs.readFileSync(path.join(review, "017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql"), "utf8"),
};
const clone = (value) => structuredClone(value);
const invariantCandidate = (override = {}, entries = []) => ({
  entries,
  inventoryInvariants: [{
    schema: "fid", objectClass: "sequence", invariantType: "EXACT_OBJECT_INVENTORY",
    expectedCountBefore: 0, expectedCountAfter: 0, expectedGovernedIdentities: [],
    perObjectPrivilegeEntriesPermitted: false, perObjectOwnershipEntriesPermitted: false,
    perObjectGrantOptionEntriesPermitted: false,
    coverage: { preflight: { required: true }, reconciliation: { required: true }, postVerification: { required: true } },
    ...override,
  }],
});
const expectFailure = (candidate, token) => assert.ok(evaluateInventoryModel(candidate).some((item) => item.includes(token)), token);

assert.equal(evaluateMatrix017c21().passed, true);
assert.equal(baseline.entries.length, snapshots.originalEntries);
assert.equal(corrected.entries.length, snapshots.retainedObjectBoundEntries);
assert.equal(corrected.inventoryInvariants.length, snapshots.addedInventoryInvariants);
assert.equal(corrected.cardinalityDerivation.totalGovernanceUnits, snapshots.totalGovernanceUnits);
assert.equal(REQUIRED_SCENARIOS_017C21.length, snapshots.requiredScenarioCount);
assert.equal(baseline.entries.filter((item) => item.objectClass === "sequence").length, snapshots.removedSyntheticSequenceEntries);
assert.equal(corrected.entries.some((item) => item.objectClass === "sequence"), false);

for (const [stage, sql] of Object.entries(sqlByStage)) assert.deepEqual(evaluateSqlSequenceCoverage(sql, stage), []);
assert.deepEqual(evaluateInventoryModel(invariantCandidate()), []); // exact zero
assert.ok(/mismatch_count/.test(sqlByStage.preflight)); // one unexpected sequence
assert.ok(/EXISTS \(SELECT 1 FROM pg_catalog\.pg_class/.test(sqlByStage.reconciliation)); // multiple unexpected sequences
assert.ok(/relnamespace=fid_oid/.test(sqlByStage.postVerification)); // other-schema sequence is outside governed set
expectFailure(invariantCandidate({}, [{ objectClass: "sequence", schema: "fid", object: "synthetic_sequence", principal: "x", privilege: "USAGE" }]), "synthetic_or_wildcard");
expectFailure(invariantCandidate({}, [{ objectClass: "sequence", schema: "fid", object: "*", principal: "x", privilege: "USAGE" }]), "synthetic_or_wildcard");
expectFailure(invariantCandidate({}, [{ objectClass: "sequence", schema: "fid", object: "GOVERNED_SET_MUST_BE_EMPTY", principal: "x", privilege: "USAGE" }]), "synthetic_or_wildcard");
for (const privilege of ["USAGE", "OWNER", "GRANT_OPTION"]) {
  expectFailure(invariantCandidate({}, [{ objectClass: "sequence", schema: "fid", object: "fid_sequence", principal: "x", privilege }]), "per_object_rows");
}
expectFailure(invariantCandidate({ expectedGovernedIdentities: ["fid.real_sequence"] }), "empty_inventory_has_identities");
expectFailure(invariantCandidate({ expectedCountBefore: 1, expectedCountAfter: 1 }), "nonempty_inventory_lacks_bound_identities");
for (const stage of ["preflight", "reconciliation", "postVerification"]) {
  const candidate = invariantCandidate(); candidate.inventoryInvariants[0].coverage[stage].required = false;
  expectFailure(candidate, `inventory_coverage_missing:${stage}`);
}
assert.deepEqual(evaluateInventoryModel(invariantCandidate({ expectedCountBefore: 1, expectedCountAfter: 1,
  expectedGovernedIdentities: ["fid.real_sequence"] }, [{ objectClass: "sequence", schema: "fid", object: "real_sequence", principal: "service_role", privilege: "USAGE" }])), []);

for (const mutate of [
  (value) => value.entries.splice(value.entries.findIndex((item) => item.objectClass === "table"), 1),
  (value) => { value.entries.find((item) => item.objectClass === "function").expectedEffective = false; },
  (value) => { value.membership.expectedAfter.set = false; },
]) {
  const value = clone(corrected); mutate(value); assert.equal(evaluateMatrix017c21(value).passed, false);
}

console.log("Sprint 17C.21 ACL matrix empty-sequence correction diagnostics: 19/19 scenarios passed");
