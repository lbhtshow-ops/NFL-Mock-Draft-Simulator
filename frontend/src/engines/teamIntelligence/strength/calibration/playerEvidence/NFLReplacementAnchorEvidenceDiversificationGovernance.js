export const NFL_REPLACEMENT_ANCHOR_EVIDENCE_DIVERSIFICATION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-REPLACEMENT-ANCHOR-EVIDENCE-DIVERSIFICATION-GOVERNANCE-2D2D-R2-1.0.0",
  sprint: "2D.2D-R2",
  temporalProvenanceRequired: true,
  targetGameWeekRequired: true,
  officialAvailabilityMayDefineTreatment: true,
  officialAvailabilityMayDefineReplacementIdentity: false,
  rosterStatusAloneMayDefineReplacementIdentity: false,
  transactionAloneMayDefineReplacementIdentity: false,
  weeklyDepthRoleWithoutTimestampMayDefinePregameReplacement: false,
  explicitStarterAnnouncementMaySupportRoleSuccession: true,
  officialDepthPublicationMaySupportRoleSuccession: true,
  postgameSnapMayDefineReplacementIdentity: false,
  fuzzyMatchingAllowed: false,
  canonicalReplacementMutationAuthorized: false,
  replacementCaliberFitAuthorized: false,
  productionPlayerImpactFitAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLReplacementAnchorEvidenceDiversificationGovernance() {
  return NFL_REPLACEMENT_ANCHOR_EVIDENCE_DIVERSIFICATION_GOVERNANCE;
}
