#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("./defineHistoricalAvailabilityCausalCohortRestriction.mjs", import.meta.url),
  "utf8"
);

const definitions = [
  ["restricted-season-2025", /const RESTRICTED_SEASON = 2025/],
  ["qualified-seasons-2022-2024", /const QUALIFIED_SEASONS = \[2022, 2023, 2024\]/],
  ["rc17-evidence-locked", /2\.18\.23-RC17/],
  ["rc17-decision-locked", /ONLY_DERIVED_OR_INCOMPLETE_2025_TEMPORAL_CANDIDATES_SURVIVE_SEMANTIC_VALIDATION/],
  ["treatment-season-gate", /treatmentConstructionRequiresQualifiedSeason: true/],
  ["control-season-gate", /controlConstructionRequiresQualifiedSeason: true/],
  ["matching-season-gate", /matchingRequiresQualifiedSeason: true/],
  ["causal-season-gate", /causalEffectEstimationRequiresQualifiedSeason: true/],
  ["uncertainty-season-gate", /uncertaintyEstimationRequiresQualifiedSeason: true/],
  ["silent-expansion-prohibited", /silentSeasonExpansionProhibited: true/],
  ["future-season-requalification", /futureSeasonAdmissionRequiresSeparateTemporalQualification: true/],
  ["2025-admission-locked", /"2025CausalCohortAdmissionAuthorized": false/],
  ["production-review-may-advance", /productionPolicyEvidenceReviewMayAdvance: true/],
  ["bounded-policy-not-yet-authorized", /boundedAvailabilityImpactPolicyMayAdvance: false/],
  ["att-recompute-locked", /attRecomputationAuthorized: false/],
  ["uncertainty-recompute-locked", /uncertaintyRecomputationAuthorized: false/],
  ["learned-weights-locked", /learnedAvailabilityWeightsAuthorized: false/],
  ["calibration-locked", /productionCalibrationAuthorized: false/],
  ["team-strength-locked", /teamStrengthMutationAuthorized: false/],
  ["decision-model-locked", /decisionModelMutationAuthorized: false/],
  ["pickem-locked", /pickemMutationAuthorized: false/],
  ["database-locked", /databaseMutationAuthorized: false/],
  ["no-cohort-rebuild", /treatmentControlCohortRebuilt: false/],
  ["no-matching-rerun", /matchingRerun: false/],
  ["next-step-production-policy", /REVIEW_QUALIFIED_2022_2024_EVIDENCE_FOR_BOUNDED_PRODUCTION_AVAILABILITY_IMPACT_POLICY/],
  ["no-unquoted-leading-digit-object-key", !/^\s*\d[A-Za-z0-9_$]*\s*:/m.test(src)]
];

const tests = definitions.map(([name, check]) => ({
  name,
  passed: check instanceof RegExp ? check.test(src) : Boolean(check)
}));
const passed = tests.filter(t => t.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Historical Availability Causal Cohort Restriction RC18 Diagnostics",
  sprint: "2.18.23-RC18",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
