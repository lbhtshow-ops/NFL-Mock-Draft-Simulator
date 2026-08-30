import {
  NFL_CANONICAL_MATCHED_ATT_CONSTRUCTION_BINDING_GOVERNANCE,
  getNFLCanonicalMatchedATTConstructionBindingGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLCanonicalMatchedATTConstructionBindingGovernance.js";

const g = getNFLCanonicalMatchedATTConstructionBindingGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_CANONICAL_MATCHED_ATT_CONSTRUCTION_BINDING_GOVERNANCE,
  expansionScope:
    JSON.stringify(g.expansionSeasons) === JSON.stringify([2020, 2021]),
  threeCanonicalBuilders:
    g.requiredCanonicalBuilders.length === 3,
  frozenMethod:
    g.frozenMatchingMethod === "NEAREST_WITH_REPLACEMENT",
  frozenMode:
    g.frozenMatchingMode === "SAME_SEASON",
  frozenCaliperLabel:
    g.frozenCaliperLabel === "p75",
  frozenCaliper:
    g.frozenCaliper === 0.7117676224413696,
  frozenOrientation:
    g.effectOrientation === "TREATED_MINUS_MATCHED_CONTROL",
  descriptiveOnly:
    g.effectSemantics === "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  sourceClassificationRequired:
    g.sourceTreatmentClassificationRequired === true,
  noClassificationInference:
    g.treatmentClassificationInferenceAllowed === false,
  sourceResidualRequired:
    g.sourceResidualRequired === true,
  noRawMarginSubstitution:
    g.rawPointMarginResidualSubstitutionAllowed === false,
  noApproximateMatcher:
    g.approximateMatcherAllowed === false,
  noThresholdRetuning:
    g.matchingThresholdRetuningAllowed === false,
  noNewCovariates:
    g.newMatchingCovariatesAllowed === false,
  isolatedWriteOnly:
    g.isolatedResearchWriteAllowed === true,
  noLegacyMutation:
    g.legacyMatchedEffectMutationAuthorized === false,
  productionImpactBlocked:
    g.productionPlayerImpactCalibrationAuthorized === false,
  shadowOnly:
    g.playerImpactTeamStrengthMode === "SHADOW_ONLY",
  teamStrengthBlocked:
    g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked:
    g.decisionModelMutationAuthorized === false,
  pickemBlocked:
    g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Canonical Matched ATT Construction Binding Governance",
  contractVersion:
    "FIE-NFL-CANONICAL-MATCHED-ATT-CONSTRUCTION-BINDING-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
