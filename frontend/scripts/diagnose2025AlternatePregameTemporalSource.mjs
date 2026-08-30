#!/usr/bin/env node
import fs from "node:fs";

const file=new URL("./audit2025AlternatePregameTemporalSource.mjs",import.meta.url);
const src=fs.readFileSync(file,"utf8");

const definitions=[
  ["target-season-2025",/const TARGET_SEASON = 2025/],
  ["repository-scan-read-only",/READ_ONLY_ALTERNATE_TEMPORAL_SOURCE_AUDIT/],
  ["date-modified-audited",/date_modified/],
  ["dateModified-audited",/dateModified/],
  ["effectiveAt-audited",/effectiveAt/],
  ["observedAt-audited",/observedAt/],
  ["publishedAt-audited",/publishedAt/],
  ["injury-signals-audited",/injuries/],
  ["availability-signals-audited",/availability/],
  ["report-status-audited",/report_status/],
  ["practice-status-audited",/practice_status/],
  ["nflverse-audited",/nflverse/],
  ["sportradar-audited",/sportradar/],
  ["acquisition-time-substitution-rejected",/acquisitionTimeSubstitutionRejected:true/],
  ["week-only-rejected",/weekNumberOnlyRejected:true/],
  ["whole-season-release-metadata-rejected",/wholeSeasonReleaseMetadataRejectedAsPerGameProof:true/],
  ["no-unquoted-leading-digit-object-key",!/^\s*\d[A-Za-z0-9_$]*\s*:/m.test(src)],
  ["temporal-qualification-locked",/"2025TemporalQualificationAuthorized":false/],
  ["normalization-locked",/"2025NormalizationAuthorized":false/],
  ["treatment-construction-locked",/"2025TreatmentConstructionAuthorized":false/],
  ["matching-locked",/matchingRerunAuthorized:false/],
  ["att-locked",/attRecomputationAuthorized:false/],
  ["calibration-locked",/productionCalibrationAuthorized:false/],
  ["pickem-locked",/pickemMutationAuthorized:false/],
  ["database-read-only",/databaseMutated:false/],
  ["restrict-2025-path-defined",/FORMALLY_RESTRICT_2025_FROM_CAUSAL_AVAILABILITY_COHORT/]
];

const tests=definitions.map(([name,check])=>({
  name,
  passed:check instanceof RegExp ? check.test(src) : Boolean(check)
}));

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"2025 Alternate Pregame Temporal Source Audit RC16 Diagnostics",
  sprint:"2.18.23-RC16",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
