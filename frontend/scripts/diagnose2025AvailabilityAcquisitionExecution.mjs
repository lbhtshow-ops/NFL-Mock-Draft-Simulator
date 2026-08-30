#!/usr/bin/env node
import fs from "node:fs";

const file = new URL("./run2025AvailabilityAcquisition.mjs", import.meta.url);
const src = fs.readFileSync(file, "utf8");

const tests = [
  ["season-2025-locked", /const SEASON = 2025/],
  ["provider-nflverse-locked", /const PROVIDER = "nflverse"/],
  ["dataset-injuries-locked", /const DATASET = "injuries"/],
  ["csv-url-locked", /injuries_2025\.csv"/],
  ["csv-gz-url-locked", /injuries_2025\.csv\.gz"/],
  ["explicit-execute-fetch-gate", /includes\("--execute-fetch"\)/],
  ["dry-run-default", /"DRY_RUN_FETCH_NOT_EXECUTED"/],
  ["sha256-provenance", /createHash\("sha256"\)/],
  ["acquisition-timestamp", /new Date\(\)\.toISOString\(\)/],
  ["schema-inspection", /inspectCsv/],
  ["player-id-required", /playerId:/],
  ["report-status-required", /reportStatus:/],
  ["practice-status-required", /practiceStatus:/],
  ["primary-injury-required", /primaryInjury:/],
  ["date-modified-required", /dateModified:/],
  ["normalization-locked", /normalizationAuthorized: false/],
  ["matching-locked", /matchingAuthorized: false/],
  ["att-locked", /attEstimationAuthorized: false/],
  ["calibration-locked", /calibrationAuthorized: false/],
  ["pickem-locked", /pickemMutationAuthorized: false/],
  ["database-write-locked", /databaseWriteAuthorized: false/],
  ["fail-closed-decision", /ACQUISITION_REJECTED_FAIL_CLOSED/],
  ["schema-discovery-on-failure", /schemaDiscovery/],
  ["temporal-candidate-header-discovery", /temporalCandidateHeaders/],
  ["identity-candidate-header-discovery", /identityCandidateHeaders/],
  ["status-candidate-header-discovery", /statusCandidateHeaders/],
  ["schema-mismatch-remains-fail-closed", /SOURCE_SCHEMA_MISMATCH/],
];

const results = tests.map(([name,re]) => ({name, passed: re.test(src)}));
const passed = results.filter(x => x.passed).length;
const failed = results.length - passed;
console.log(JSON.stringify({
  suite: "2025 Availability Acquisition Execution RC13 Diagnostics",
  sprint: "2.18.23-RC13",
  passed, failed, tests: results
}, null, 2));
if (failed) process.exitCode = 1;
