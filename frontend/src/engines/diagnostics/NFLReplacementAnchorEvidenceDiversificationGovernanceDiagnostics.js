import {
  NFL_REPLACEMENT_ANCHOR_EVIDENCE_DIVERSIFICATION_GOVERNANCE,
  getNFLReplacementAnchorEvidenceDiversificationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLReplacementAnchorEvidenceDiversificationGovernance.js";

const g = getNFLReplacementAnchorEvidenceDiversificationGovernance();

const checks = Object.freeze({
  contractExported: g === NFL_REPLACEMENT_ANCHOR_EVIDENCE_DIVERSIFICATION_GOVERNANCE,
  temporalRequired: g.temporalProvenanceRequired === true,
  targetWeekRequired: g.targetGameWeekRequired === true,
  availabilityDefinesTreatment: g.officialAvailabilityMayDefineTreatment === true,
  availabilityNotReplacement: g.officialAvailabilityMayDefineReplacementIdentity === false,
  rosterStatusNotEnough: g.rosterStatusAloneMayDefineReplacementIdentity === false,
  transactionNotEnough: g.transactionAloneMayDefineReplacementIdentity === false,
  untimestampedDepthRejected: g.weeklyDepthRoleWithoutTimestampMayDefinePregameReplacement === false,
  explicitStarterCanSupportRole: g.explicitStarterAnnouncementMaySupportRoleSuccession === true,
  depthPublicationCanSupportRole: g.officialDepthPublicationMaySupportRoleSuccession === true,
  postgameSnapRejected: g.postgameSnapMayDefineReplacementIdentity === false,
  noFuzzy: g.fuzzyMatchingAllowed === false,
  canonicalMutationBlocked: g.canonicalReplacementMutationAuthorized === false,
  caliberFitBlocked: g.replacementCaliberFitAuthorized === false,
  impactFitBlocked: g.productionPlayerImpactFitAuthorized === false,
  teamStrengthBlocked: g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked: g.decisionModelMutationAuthorized === false,
  pickemBlocked: g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({
  suite: "NFL Replacement Anchor Evidence Diversification Governance",
  contractVersion:
    "FIE-NFL-REPLACEMENT-ANCHOR-EVIDENCE-DIVERSIFICATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
