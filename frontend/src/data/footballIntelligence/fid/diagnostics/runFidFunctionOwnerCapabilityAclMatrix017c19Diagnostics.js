import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import matrix from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19.js";
import snapshots from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19Snapshots.js";
import { evaluateMatrix017c19, evaluateSuccessor017c19 } from "../persistence/deployment/FidFunctionOwnerCapabilityAclMatrix017c19Oracle.js";

const review = new URL("../persistence/deployment/review/", import.meta.url);
const read = (name) => fs.readFileSync(fileURLToPath(new URL(name, review)), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const units = [
  ["017c19a_fid_function_owner_capability_acl_matrix_preflight.sql", "preflight"],
  ["017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql", "reconciliation"],
  ["017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql", "postVerification"],
];
assert.equal(evaluateMatrix017c19(matrix).passed, true);
for (const [name, kind] of units) assert.deepEqual(evaluateSuccessor017c19(read(name), kind).failures, [], name);
assert.ok(snapshots.length >= 200);
assert.equal(matrix.membership.expectedBefore.set, false);
assert.equal(matrix.membership.expectedAfter.set, true);
assert.equal(Object.isFrozen(matrix.entries[0].coverage), true);
console.log(JSON.stringify({ status: "17C.19 ACL matrix diagnostics passed", hashes: Object.fromEntries(units.map(([name]) => [name, sha(read(name))])), scenarios: snapshots.length }));
