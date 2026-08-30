import {
  NFL_FIVE_SEASON_PLAYER_IMPACT_VALIDATION_GOVERNANCE,
  getNFLFiveSeasonPlayerImpactValidationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonPlayerImpactValidationGovernance.js";

const g = getNFLFiveSeasonPlayerImpactValidationGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_PLAYER_IMPACT_VALIDATION_GOVERNANCE,
  fiveSeasonScope:
    JSON.stringify(g.targetSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  sixRequiredDimensions:
    g.requiredDimensions.length === 6,
  caliberGateFrozen:
    g.minimumCaliberPairCoverageRate === 0.75,
  partialCannotPromote:
    g.partialValidationMayPromoteToProduction === false,
  missingDimensionCannotBeIgnored:
    g.missingDimensionMayBeSilentlyIgnored === false,
  noProductionWeightFit:
    g.productionWeightFitAuthorized === false,
  noThresholdRetuning:
    g.validationThresholdRetuningAllowed === false,
  noLeakage:
    g.targetGameFutureLeakageAllowed === false,
  noSyntheticEffectEvidence:
    g.syntheticEffectEvidenceAllowed === false,
  noIndependentPickemWeights:
    g.independentPickemWeightsAllowed === false,
  calibrationAfterPassOnly:
    g.calibrationAndHoldoutMayProceedOnlyAfterValidationPass === true,
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
  suite: "NFL Five-Season Player Impact Validation Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-PLAYER-IMPACT-VALIDATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
