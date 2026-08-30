import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c37IndependentReviewDeclaration.js";
import review, { RESULT_FIELD_ORDER_017C36 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c37Oracle.js";
import scenarios, { evaluateRequiredVisibleContract017c37 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c37Scenarios.js";
import mapping, { ACL_MATRIX_INVENTORY_INVARIANTS_017C32, ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c32IncrementMapping.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();
const sql = bytes(declaration.reviewedPath).toString("utf8").replace(/\r\n/g, "\n");
const result = review(sql);

assert.equal(hash(declaration.reviewedPath), declaration.reviewedSha256);
assert.equal(hash("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c34_fid_function_owner_capability_mismatch_detail_exact_target_binding_correction.sql"), declaration.protected.sprint017c34);
assert.equal(hash("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c32_fid_function_owner_capability_mismatch_detail_correction.sql"), declaration.protected.sprint017c32);
assert.equal(hash("frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c30_fid_function_owner_capability_mismatch_detail_read_only_diagnostic.sql"), declaration.protected.sprint017c30);
assert.equal(result.correctionRequired, true);
for (const finding of ["missing_result_mode", "missing_visible_metadata_storage_evidence", "missing_visible_migration_014_metadata_evidence",
  "missing_result_evidence_complete", "missing_external_project_reference_key", "missing_external_dashboard_database_source_key",
  "noncontract_external_project_id_key", "noncontract_external_database_source_key"]) assert.equal(result.failures.includes(finding), true, finding);
assert.deepEqual(RESULT_FIELD_ORDER_017C36.length, 21);
const contract = evaluateRequiredVisibleContract017c37({ externally_authorized_target_binding: { project_id: "ahmorpzcaapvoymiqlkv", database_source: "Primary Database" } });
assert.equal(contract.accepted, false);
assert.equal(contract.failures.length, 6);
assert.equal(new Set(scenarios).size, 29);
assert.equal(mapping.length, 15);
assert.equal(ACL_MATRIX_OBJECT_BOUND_UNITS_017C32 + ACL_MATRIX_INVENTORY_INVARIANTS_017C32, 261);
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, blockingFindings: declaration.blockingFindings,
  oracleFailures: result.failures, visibleFieldCount: RESULT_FIELD_ORDER_017C36.length, negativeScenarios: scenarios.length,
  aclGovernanceUnits: 261, sqlExecuted: false, authorizationCreated: false }));
