import {
  NFL_FIVE_SEASON_MATCHED_ATT_EXPANSION_GOVERNANCE,
  getNFLFiveSeasonMatchedATTExpansionGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonMatchedATTExpansionGovernance.js";

const g = getNFLFiveSeasonMatchedATTExpansionGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_MATCHED_ATT_EXPANSION_GOVERNANCE,
  expansion2020And2021:
    JSON.stringify(g.expansionSeasons) === JSON.stringify([2020,2021]),
  canonicalReuseRequired:
    g.canonicalMatcherReuseRequired === true,
  frozenMethodRequired:
    g.frozenLegacyMatchingMethodRequired === true,
  approximateMatcherBlocked:
    g.approximateMatcherAllowed === false,
  thresholdRetuningBlocked:
    g.matchingThresholdRetuningAllowed === false,
  newCovariatesBlocked:
    g.newMatchingCovariatesAllowed === false,
  orientationFrozen:
    g.matchedEffectOrientation === "TREATED_MINUS_MATCHED_CONTROL",
  descriptiveOnly:
    g.matchedEffectSemantics === "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  rawMarginBlocked:
    g.rawPointMarginMayRepresentObservedPlayerImpact === false,
  sourceEntryPointRequired:
    g.sourceEntryPointMustBeProvenBeforeConstruction === true,
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
  suite: "NFL Five-Season Matched ATT Expansion Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-MATCHED-ATT-EXPANSION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
