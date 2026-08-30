export const NFL_HISTORICAL_REPLACEMENT_EVIDENCE_GOVERNANCE = Object.freeze({
  contractVersion: "FIE-NFL-HISTORICAL-REPLACEMENT-EVIDENCE-GOVERNANCE-1.0.0",
  acceptedEvidenceTypes: Object.freeze([
    "EXPLICIT_DEPTH_CHART",
    "EXPLICIT_STARTER_ANNOUNCEMENT",
    "PREGAME_ROLE_EVIDENCE",
    "PRIOR_USAGE",
  ]),
  pregameEvidencePreferred: true,
  postgameOutcomeAsPregameEvidenceAllowed: false,
  samePositionRosterOrderInferenceAllowed: false,
  replacementByNameGuessAllowed: false,
  ambiguousReplacementRemainsNull: true,
  provenanceRequired: true,
  asOfRequired: true,
  confidenceRequired: true,
  learnedWeightsAuthorized: false,
});

export function getNFLHistoricalReplacementEvidenceGovernance() {
  return NFL_HISTORICAL_REPLACEMENT_EVIDENCE_GOVERNANCE;
}
