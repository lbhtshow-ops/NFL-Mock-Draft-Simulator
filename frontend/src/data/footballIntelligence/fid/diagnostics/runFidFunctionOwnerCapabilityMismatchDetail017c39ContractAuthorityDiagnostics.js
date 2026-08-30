import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import amendment from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39AuthorityAmendment.js";
import contract from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Evaluator.js";
import mapping from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39NestedKeyMapping.js";
import { AUTHORITATIVE_25_FIELD_ORDER_017C39, HISTORICAL_21_FIELD_ORDER_017C37 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39OrderedFields.js";
import scenarios from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c39Scenarios.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const hash = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(frontend, relative))).digest("hex").toUpperCase();

assert.equal(HISTORICAL_21_FIELD_ORDER_017C37.length, 21);
assert.equal(new Set(HISTORICAL_21_FIELD_ORDER_017C37).size, 21);
assert.equal(AUTHORITATIVE_25_FIELD_ORDER_017C39.length, 25);
assert.equal(new Set(AUTHORITATIVE_25_FIELD_ORDER_017C39).size, 25);
assert.equal(AUTHORITATIVE_25_FIELD_ORDER_017C39.indexOf("mode"), AUTHORITATIVE_25_FIELD_ORDER_017C39.indexOf("result_version") + 1);
const databaseIndex = AUTHORITATIVE_25_FIELD_ORDER_017C39.indexOf("database_observed_target_evidence");
assert.deepEqual(AUTHORITATIVE_25_FIELD_ORDER_017C39.slice(databaseIndex - 3, databaseIndex), ["metadata_storage_present", "migration_014_metadata_count", "evidence_complete"]);
assert.deepEqual(AUTHORITATIVE_25_FIELD_ORDER_017C39.filter((field) => HISTORICAL_21_FIELD_ORDER_017C37.includes(field)), HISTORICAL_21_FIELD_ORDER_017C37);
assert.equal(contract.mode.requiredValue, "MISMATCH_DETAIL_DIAGNOSTIC");
assert.equal(contract.evidenceComplete.externalMetadataAloneSufficient, false);
assert.equal(contract.authoritySplit.externalAttestationRequired, true);
assert.equal(contract.authoritySplit.sqlOnlyOverallVerificationProhibited, true);
assert.equal(mapping.project_id.successorKey, "project_reference");
assert.equal(mapping.database_source.successorKey, "dashboard_database_source");
for (const count of [21, 22, 23, 24, 26]) {
  const fields = count < 25 ? contract.orderedFields.slice(0, count) : [...contract.orderedFields, "extra"];
  assert.equal(evaluate({ orderedFields: fields, externalTargetKeys: contract.externalTargetKeys, mode: contract.mode.requiredValue }).accepted, false, `count-${count}`);
}
for (const scenario of scenarios) {
  const result = evaluate(scenario.candidate);
  assert.equal(result.accepted, scenario.accepted, scenario.id);
  if (scenario.failure) assert.equal(result.failures.includes(scenario.failure), true, scenario.id);
}
assert.equal(amendment.sqlImplementationIncluded, false);
assert.equal(amendment.sqlExecutionAuthorized || amendment.migration014Authorized || amendment.capabilityAmendmentAuthorized, false);
assert.equal(amendment.authorization017c23Consumed && amendment.authorization017c26Consumed && amendment.authorization017c29Consumed, true);
assert.equal(hash("src/data/footballIntelligence/fid/persistence/deployment/review/017c36_fid_function_owner_capability_mismatch_detail_split_authority_correction.sql"), "ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C");
console.log(JSON.stringify({ status: amendment.statusResult, contractIdentity: contract.contractIdentity,
  contractVersion: contract.contractVersion, historicalFieldsPreserved: 21, authoritativeFields: 25,
  scenarios: scenarios.length, sqlCreated: false, sqlExecuted: false, authorizationCreated: false }));
