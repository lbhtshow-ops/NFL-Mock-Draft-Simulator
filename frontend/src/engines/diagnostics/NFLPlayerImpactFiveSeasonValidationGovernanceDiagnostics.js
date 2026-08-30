import {
  NFL_PLAYER_IMPACT_FIVE_SEASON_VALIDATION_GOVERNANCE,
  getNFLPlayerImpactFiveSeasonValidationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactFiveSeasonValidationGovernance.js";

const g = getNFLPlayerImpactFiveSeasonValidationGovernance();

const required = [
  "HISTORICAL_BACKTESTING",
  "EXPECTED_REPLACEMENT",
  "REPLACEMENT_CALIBER",
  "AVAILABILITY_IMPACT",
  "POSITION_REPLACEMENT_SENSITIVITY",
  "DEPENDENCY_USAGE",
  "INJURY_AVAILABILITY_CALIBRATION",
  "PERFORMANCE_WINDOW_CALIBRATION",
  "OPPONENT_ADJUSTMENT_VALIDATION",
  "SEASON_ERA_VALIDATION",
  "HOLDOUT_VALIDATION",
  "THRESHOLD_SENSITIVITY",
  "UNCERTAINTY_VALIDATION",
];

const checks = Object.freeze({
  contractExported:
    g === NFL_PLAYER_IMPACT_FIVE_SEASON_VALIDATION_GOVERNANCE,
  fiveSeasonScope:
    JSON.stringify(g.researchSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  minimumFiveSeasons: g.minimumSeasonCoverage === 5,
  legacySeasonsSeparated:
    JSON.stringify(g.legacyDevelopmentSeasons) === JSON.stringify([2022,2023,2024]),
  externalValidationSeparated:
    JSON.stringify(g.newlyAddedExternalValidationSeasons) === JSON.stringify([2020,2021]),
  specificationFrozen: g.specificationFrozenBeforeExpandedOutcomeAnalysis === true,
  noExternalValidationTuning:
    g.externalValidationSeasonsMayTuneSpecification === false,
  noFalseFutureHoldoutClaim:
    g.futureChronologicalHoldoutSatisfiedByThisExpansion === false &&
    g.newlyAddedSeasonsAreFutureChronologicalHoldout === false,
  allPickem2BDomainsPresent:
    required.every((name) => g.requiredValidationDomains.includes(name)),
  hardGatePromotionRequired: g.productionPromotionRequiresAllHardGates === true,
  failedGateHoldsShadow: g.failedOrIncompleteHardGateDecision === "HOLD_SHADOW",
  shadowOnlyPreserved: g.playerImpactTeamStrengthModeUntilPromotion === "SHADOW_ONLY",
  authorizationBlocked: g.playerImpactTeamStrengthAuthorized === false,
  numericDeltaBlocked: g.numericDeltaAuthorized === false,
  adjustedTeamStrengthBlocked: g.adjustedTeamStrengthAuthorized === false,
  noIndependentPickemWeights: g.independentPickemInjuryWeightsAllowed === false,
  calibrationBlocked: g.calibrationAuthorizedByThisContract === false,
  learnedWeightsBlocked: g.learnedWeightsAuthorizedByThisContract === false,
  teamStrengthBlocked: g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked: g.decisionModelMutationAuthorized === false,
  pickemBlocked: g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Player Impact Five-Season Validation Governance",
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-FIVE-SEASON-VALIDATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
