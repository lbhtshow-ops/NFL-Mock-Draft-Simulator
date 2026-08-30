#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync(new URL("./reviewQualifiedAvailabilityProductionPolicyEvidence.mjs",import.meta.url),"utf8");

const defs=[
 ["qualified-seasons-locked",/qualifiedSeasons: \[2022, 2023, 2024\]/],
 ["matched-records-131",/matchedRecords: 131/],
 ["att-locked",/pointEstimate: -4\.159193203877429/],
 ["primary-probability-locked",/primaryProbabilityBelowZero: 0\.9391/],
 ["primary-lower-locked",/-9\.378357356060773/],
 ["primary-upper-locked",/1\.1276121539242592/],
 ["control-lower-locked",/-7\.576023726166446/],
 ["control-upper-locked",/-0\.6203451560768768/],
 ["season-pair-lower-locked",/-7\.091811656454302/],
 ["season-pair-upper-locked",/-1\.2140357168058442/],
 ["trimmed-lower-locked",/-7\.612974286056197/],
 ["trimmed-upper-locked",/1\.311551551219521/],
 ["primary-cross-zero-reviewed",/primaryIntervalCrossesZero/],
 ["probability-below-95-reviewed",/primaryProbabilityBelow95Percent/],
 ["leave-one-season-reviewed",/leaveOneSeasonOutAllNegative/],
 ["season-heterogeneity-reviewed",/notAllSeasonIntervalsExcludeZero/],
 ["direct-att-translation-rejected",/directPointTranslationRejected: true/],
 ["player-coefficient-rejected",/individualPlayerCoefficientInferenceRejected: true/],
 ["position-coefficient-rejected",/positionCoefficientInferenceRejected: true/],
 ["unrestricted-calibration-rejected",/unrestrictedProductionCalibrationRejected: true/],
 ["conservative-cap-required",/conservativeMagnitudeCapRequired: true/],
 ["confidence-gate-required",/confidenceGatingRequired: true/],
 ["completeness-gate-required",/evidenceCompletenessGatingRequired: true/],
 ["neutral-fallback-required",/fallbackToNeutralWhenEvidenceInsufficient: true/],
 ["provenance-required",/provenanceRequired: true/],
 ["explainability-required",/explainabilityRequired: true/],
 ["execution-still-locked",/boundedAvailabilityImpactPolicyExecutionAuthorized: false/],
 ["production-calibration-locked",/productionCalibrationAuthorized: false/],
 ["decision-model-locked",/decisionModelMutationAuthorized: false/],
 ["pickem-locked",/pickemMutationAuthorized: false/],
 ["database-locked",/databaseMutationAuthorized: false/],
 ["next-step-policy-v1",/DEFINE_BOUNDED_PLAYER_AVAILABILITY_IMPACT_POLICY_V1/],
 ["no-unquoted-leading-digit-object-key",!/^\s*\d[A-Za-z0-9_$]*\s*:/m.test(src)]
];

const tests=defs.map(([name,c])=>({name,passed:c instanceof RegExp?c.test(src):Boolean(c)}));
const passed=tests.filter(t=>t.passed).length, failed=tests.length-passed;
console.log(JSON.stringify({
 suite:"Qualified Availability Production Policy Evidence Review RC1 Diagnostics",
 sprint:"2.18.24-RC1",passed,failed,tests
},null,2));
if(failed) process.exitCode=1;
