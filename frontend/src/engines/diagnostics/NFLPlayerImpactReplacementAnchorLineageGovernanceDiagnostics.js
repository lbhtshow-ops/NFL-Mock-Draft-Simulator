import {
  NFL_PLAYER_IMPACT_REPLACEMENT_ANCHOR_LINEAGE_GOVERNANCE,
  getNFLPlayerImpactReplacementAnchorLineageGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactReplacementAnchorLineageGovernance.js";

const g = getNFLPlayerImpactReplacementAnchorLineageGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_PLAYER_IMPACT_REPLACEMENT_ANCHOR_LINEAGE_GOVERNANCE,
  exactLineageRequired: g.exactPregameSourceLineageRequired === true,
  weekScopeRejected:
    g.depthChartWeekScopeAloneAcceptedAsPregameProof === false,
  injuryTimestampSubstitutionRejected:
    g.injuryTimestampMayStandInForDepthChartPublicationTime === false,
  postgameSnapRejected:
    g.postgameSnapMayDefineExpectedReplacement === false,
  rosterOrderRejected: g.rosterOrderHeuristicAllowed === false,
  replacementBeforeCaliber:
    g.replacementIdentityMustPrecedeReplacementCaliber === true,
  caliberBeforeCalibration:
    g.replacementCaliberMustPrecedePlayerImpactCalibration === true,
  mismatchBlocksExtension:
    g.lineageMismatchBlocksFiveSeasonExtension === true,
  failedLineageHoldsShadow: g.failedLineageDecision === "HOLD_SHADOW",
  calibrationBlocked: g.calibrationAuthorized === false,
  learnedWeightsBlocked: g.learnedWeightsAuthorized === false,
  teamStrengthBlocked: g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked: g.decisionModelMutationAuthorized === false,
  pickemBlocked: g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Player Impact Replacement Anchor Lineage Governance",
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-REPLACEMENT-ANCHOR-LINEAGE-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
