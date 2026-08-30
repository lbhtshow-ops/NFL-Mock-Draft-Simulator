#!/usr/bin/env node
import fs from "node:fs";
const file = new URL("./run2025SourceReleaseProvenanceAudit.mjs", import.meta.url);
const src = fs.readFileSync(file, "utf8");

const definitions = [
  ["season-2025-locked", /const SEASON = 2025/],
  ["nflverse-release-api-locked", /api\.github\.com\/repos\/nflverse\/nflverse-data\/releases\/tags\/injuries/],
  ["primary-asset-locked", /injuries_2025\.csv/],
  ["fallback-asset-locked", /injuries_2025\.csv\.gz/],
  ["explicit-provenance-fetch-gate", /includes\("--execute-provenance-fetch"\)/],
  ["dry-run-default", /DRY_RUN_PROVENANCE_FETCH_NOT_EXECUTED/],
  ["release-published-at-audited", /published_at/],
  ["asset-created-at-audited", /created_at/],
  ["asset-updated-at-audited", /updated_at/],
  ["per-week-provenance-required", /perWeekReleaseTimestampPresent/],
  ["per-team-week-provenance-required", /perTeamWeekReleaseTimestampPresent/],
  ["whole-season-metadata-not-enough", /wholeSeasonReleaseTimestampCanReplacePerRecordDateModified: false/],
  ["week-only-proof-prohibited", /weekNumberOnlyUsedAsProof: false/],
  ["temporal-qualification-locked", /temporalQualificationAuthorized: false/],
  ["raw-acquisition-locked", /rawAvailabilityAcquisitionAuthorized: false/],
  ["normalization-locked", /normalizationAuthorized: false/],
  ["matching-locked", /matchingAuthorized: false/],
  ["att-locked", /attEstimationAuthorized: false/],
  ["calibration-locked", /calibrationAuthorized: false/],
  ["pickem-locked", /pickemMutationAuthorized: false/],
  ["database-write-locked", /databaseWriteAuthorized: false/],
  ["fail-closed-decision", /PROVENANCE_AUDIT_REJECTED_FAIL_CLOSED/]
];

const tests = definitions.map(([name, pattern]) => ({
  name,
  passed: pattern.test(src)
}));

const passed = tests.filter(x => x.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "2025 Source Release Provenance Audit RC15 Diagnostics",
  sprint: "2.18.23-RC15",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
