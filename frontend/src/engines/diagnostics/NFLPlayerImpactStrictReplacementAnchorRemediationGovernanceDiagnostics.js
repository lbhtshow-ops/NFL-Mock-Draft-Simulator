import {
  NFL_PLAYER_IMPACT_STRICT_REPLACEMENT_ANCHOR_REMEDIATION_GOVERNANCE,
  getNFLPlayerImpactStrictReplacementAnchorRemediationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactStrictReplacementAnchorRemediationGovernance.js";

const g = getNFLPlayerImpactStrictReplacementAnchorRemediationGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_PLAYER_IMPACT_STRICT_REPLACEMENT_ANCHOR_REMEDIATION_GOVERNANCE,
  depthChartReleaseOnly:
    g.acceptedAnchorPublicationType === "DEPTH_CHART_RELEASE",
  officialDomainRequired: g.officialTeamDomainRequired === true,
  resolvedWeekRequired: g.resolvedWeekRequired === true,
  pregameSafeRequired: g.resolvedPregameSafeRequired === true,
  weekScopeRejected:
    g.genericWeekScopeAcceptedAsPregameProof === false,
  availabilityTimestampSubstitutionRejected:
    g.genericAvailabilityTimestampAcceptedAsDepthPublicationTime === false,
  explicitLineageRequired: g.explicitPublicationLineageRequired === true,
  legacyMutationBlocked: g.legacyArtifactMutationAuthorized === false,
  shadowCandidateAllowed: g.strictCandidateShadowArtifactAllowed === true,
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
  suite: "NFL Player Impact Strict Replacement Anchor Remediation Governance",
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-STRICT-REPLACEMENT-ANCHOR-REMEDIATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
