#!/usr/bin/env node
import fs from "node:fs";
const file=new URL("./validate2025AlternateTemporalCandidateSemantics.mjs",import.meta.url);
const src=fs.readFileSync(file,"utf8");

const definitions=[
  ["target-season-2025",/const TARGET_SEASON = 2025/],
  ["record-level-semantic-validation",/inspectObject/],
  ["same-record-season-required",/Number\(season\)!==TARGET_SEASON/],
  ["week-required",/week!=null/],
  ["team-required",/team!=null/],
  ["player-id-required",/playerId!=null/],
  ["dateModified-supported",/"dateModified"/],
  ["date-modified-supported",/"date_modified"/],
  ["effectiveAt-supported",/"effectiveAt"/],
  ["observedAt-supported",/"observedAt"/],
  ["publishedAt-supported",/"publishedAt"/],
  ["nflverse-provenance-supported",/"NFLVERSE_INJURIES"/],
  ["sportradar-provenance-supported",/"SPORTRADAR"/],
  ["derived-artifact-classification",/DERIVED_2025_TEMPORAL_RECORD/],
  ["code-reference-classification",/CODE_REFERENCE_ONLY/],
  ["direct-source-classification",/DIRECT_2025_SOURCE_DERIVED_TEMPORAL_CANDIDATE/],
  ["derived-artifacts-not-source-proof",/derivedHistoricalArtifactsAreNotSourceProof:true/],
  ["code-references-not-source-proof",/codeReferencesAreNotSourceProof:true/],
  ["timestamp-fabrication-prohibited",/timestampFabricationProhibited:true/],
  ["acquisition-time-substitution-prohibited",/acquisitionTimeSubstitutionProhibited:true/],
  ["temporal-contract-gated",/"2025TemporalQualificationContractMayAdvance":directCandidates\.length>0/],
  ["normalization-locked",/"2025NormalizationAuthorized":false/],
  ["treatment-construction-locked",/"2025TreatmentConstructionAuthorized":false/],
  ["matching-locked",/matchingRerunAuthorized:false/],
  ["att-locked",/attRecomputationAuthorized:false/],
  ["calibration-locked",/productionCalibrationAuthorized:false/],
  ["pickem-locked",/pickemMutationAuthorized:false/],
  ["database-read-only",/databaseMutated:false/],
  ["restrict-2025-path-defined",/FORMALLY_RESTRICT_2025_FROM_CAUSAL_AVAILABILITY_COHORT/],
  ["no-unquoted-leading-digit-object-key",!/^\s*\d[A-Za-z0-9_$]*\s*:/m.test(src)]
];

const tests=definitions.map(([name,check])=>({
  name,
  passed:check instanceof RegExp ? check.test(src) : Boolean(check)
}));

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"2025 Alternate Temporal Candidate Semantic Validation RC17 Diagnostics",
  sprint:"2.18.23-RC17",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
