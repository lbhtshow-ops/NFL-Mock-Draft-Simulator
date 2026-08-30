import {
  NFL_FIVE_SEASON_STRICT_REPLACEMENT_EVIDENCE_COVERAGE_GOVERNANCE,
  getNFLFiveSeasonStrictReplacementEvidenceCoverageGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonStrictReplacementEvidenceCoverageGovernance.js";

const g = getNFLFiveSeasonStrictReplacementEvidenceCoverageGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_STRICT_REPLACEMENT_EVIDENCE_COVERAGE_GOVERNANCE,
  fiveSeasonTarget:
    JSON.stringify(g.targetSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  depthReleaseOnly: g.acceptedPublicationType === "DEPTH_CHART_RELEASE",
  officialDomainRequired: g.officialTeamDomainRequired === true,
  resolvedWeekRequired: g.resolvedWeekRequired === true,
  pregameSafeRequired: g.pregameSafeRequired === true,
  seasonBreadthFive: g.minimumSeasonBreadth === 5,
  canonicalTeamBreadthRetained: g.minimumTeamBreadth === 16,
  canonicalPregameBreadthRetained: g.minimumStrictTeamWeeks === 100,
  concentrationGuard: g.maximumSingleTeamShare === 0.35,
  weekScopeRejected: g.genericWeekScopeAcceptedAsPregameProof === false,
  injuryTimestampSubstitutionRejected:
    g.injuryTimestampMayStandInForDepthPublicationTime === false,
  postgameSnapRejected: g.postgameSnapMayDefineReplacement === false,
  canonicalMutationBlocked:
    g.canonicalReplacementArtifactMutationAuthorized === false,
  calibrationBlocked: g.replacementCaliberFitAuthorized === false,
  playerImpactFitBlocked: g.productionPlayerImpactFitAuthorized === false,
  teamStrengthBlocked: g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked: g.decisionModelMutationAuthorized === false,
  pickemBlocked: g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Five-Season Strict Replacement Evidence Coverage Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-STRICT-REPLACEMENT-EVIDENCE-COVERAGE-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
