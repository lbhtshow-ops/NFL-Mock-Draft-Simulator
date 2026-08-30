import {
  NFL_CANONICAL_2020_2021_MATCHED_ATT_EXPANSION_GOVERNANCE,
  getNFLCanonical2020_2021MatchedATTExpansionGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLCanonical2020_2021MatchedATTExpansionGovernance.js";

const g = getNFLCanonical2020_2021MatchedATTExpansionGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_CANONICAL_2020_2021_MATCHED_ATT_EXPANSION_GOVERNANCE,

  expansionScope:
    JSON.stringify(g.expansionSeasons) === JSON.stringify([2020, 2021]),

  canonicalResidualFunctions:
    g.residualConstruction.canonicalFunctionsRequired.length === 4,

  noLegacyV1Overwrite:
    g.residualConstruction.legacyNoArgumentRunnerMayOverwriteV1 === false,

  isolatedResidualArtifacts:
    g.residualConstruction.isolatedExpansionArtifactsRequired === true,

  rawMarginNotImpact:
    g.residualConstruction.rawPointMarginMayRepresentObservedPlayerImpact === false,

  residualNotImpact:
    g.residualConstruction.gameResidualMayRepresentObservedPlayerImpact === false,

  canonicalControlCohort:
    g.controlCohort.canonicalBuilderRequired ===
      "buildHistoricalAvailabilityControlCohort",

  canonicalClassification:
    g.controlCohort.canonicalClassificationRequired === true,

  noExternalClassification:
    g.controlCohort.externalTreatmentControlInferenceAllowed === false,

  noUnsafeControl:
    g.controlCohort.unsafeControlAllowed === false,

  noExposedControl:
    g.controlCohort.exposedOutOrDoubtfulControlAllowed === false,

  legacy187NotExpansionGate:
    g.controlCohort.legacy187TreatedGameExpectationAppliesToExpansion === false,

  legacy286NotExpansionGate:
    g.controlCohort.legacy286ResidualExpectationAppliesToExpansion === false,

  frozenMatchingMode:
    g.matching.mode === "SAME_SEASON",

  frozenMatchingMethod:
    g.matching.method === "NEAREST_WITH_REPLACEMENT",

  frozenCaliper:
    g.matching.caliper === 0.7117676224413696,

  noThresholdRetuning:
    g.matching.thresholdRetuningAllowed === false,

  noNewCovariates:
    g.matching.newCovariatesAllowed === false,

  canonicalOutcome:
    g.outcome.canonicalBuilderRequired ===
      "buildHistoricalAvailabilityMatchedOutcomeJoin",

  sourceResidualRequired:
    g.outcome.sourceResidualRequired === true,

  noRawMarginSubstitution:
    g.outcome.rawMarginSubstitutionAllowed === false,

  canonicalATT:
    g.att.canonicalBuilderRequired ===
      "buildHistoricalAvailabilityMatchedATTEffect",

  frozenOrientation:
    g.att.orientation === "TREATED_MINUS_MATCHED_CONTROL",

  descriptiveOnly:
    g.att.semantics === "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",

  noCausalClaim:
    g.att.causalClaimAuthorized === false,

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
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Canonical 2020-2021 Matched ATT Expansion Governance",
  contractVersion:
    "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-GOVERNANCE-DIAGNOSTIC-1.0.1",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
