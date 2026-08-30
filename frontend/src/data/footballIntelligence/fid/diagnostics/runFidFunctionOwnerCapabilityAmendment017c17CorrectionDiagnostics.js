import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c17CorrectionDeclaration.js";
import snapshots from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c17Snapshots.js";
import { inspect017c17Sql } from "../persistence/deployment/FidFunctionOwnerCapabilityAmendment017c17Evaluator.js";

const reviewUrl = new URL("../persistence/deployment/review/", import.meta.url);
const read = (name) => fs.readFileSync(fileURLToPath(new URL(name, reviewUrl)), "utf8");
const hash = (text) => createHash("sha256").update(text).digest("hex").toUpperCase();
const protectedFiles = Object.freeze({
  amendment017c15: "017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql",
  preflight017c15: "017c15b_fid_function_owner_capability_amendment_guarded_preflight_correction.sql",
  reconciliation017c15: "017c15c_fid_function_owner_capability_amendment_guarded_reconciliation_correction.sql",
  postVerification017c15: "017c15d_fid_function_owner_capability_amendment_complete_post_verification_correction.sql",
  amendment017c13: "017c13_fid_function_owner_capability_amendment.sql",
  preflight017c13: "017c13_fid_function_owner_capability_amendment_preflight.sql",
  reconciliation017c13: "017c13_fid_function_owner_capability_amendment_reconciliation.sql",
  postVerification017c13: "017c13_fid_function_owner_capability_amendment_post_verification.sql",
  reconciliation017c5: "017c5_failed_migration_014_read_only_commit_state_reconciliation_postgresql_correction.sql",
  preflight017c8: "017c8_supabase_function_owner_deployment_capability_read_only_preflight_distinct_order_correction.sql",
});
for (const [key, name] of Object.entries(protectedFiles)) assert.equal(hash(read(name)), declaration.protectedHashes[key]);
const migration014 = fs.readFileSync(fileURLToPath(new URL("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", import.meta.url)), "utf8");
assert.equal(hash(migration014), declaration.protectedHashes.migration014);

const successors = [
  read("017c17a_fid_function_owner_capability_amendment_guarded_preflight_second_correction.sql"),
  read("017c17b_fid_function_owner_capability_amendment_guarded_reconciliation_second_correction.sql"),
  read("017c17c_fid_function_owner_capability_amendment_complete_post_verification_second_correction.sql"),
];
successors.forEach((sql, index) => assert.equal(inspect017c17Sql(sql, { reconciliation: index === 1 }).passed, true));
snapshots.forEach(({ name, expected, observed }) => assert.equal(observed, expected, name));
assert.equal(declaration.executionAuthorized, false);
assert.equal(declaration.sqlExecuted, false);
console.log("17C.17 optional-metadata safety and distinct-reconciliation diagnostics passed");
