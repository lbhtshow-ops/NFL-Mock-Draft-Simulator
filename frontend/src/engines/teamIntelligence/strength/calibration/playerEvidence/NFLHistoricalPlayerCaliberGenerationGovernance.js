export const NFL_HISTORICAL_PLAYER_CALIBER_GENERATION_GOVERNANCE = Object.freeze({
  contractVersion: "FIE-NFL-HISTORICAL-PLAYER-CALIBER-GENERATION-GOVERNANCE-1.0.0",
  canonicalEvaluationRequired: true,
  historicalAsOfBoundaryRequired: true,
  currentRatingBackfillAllowed: false,
  futureEvidenceAllowed: false,
  rankProxyAllowed: false,
  rosterValueProxyAllowed: false,
  missingEvaluationRemainsNull: true,
  modelVersionRequired: true,
  confidenceRequiredWhenAvailable: true,
  provenanceRequired: true,
  outputIsEvidenceArtifactNotLearnedWeight: true,
});

export function getNFLHistoricalPlayerCaliberGenerationGovernance() {
  return NFL_HISTORICAL_PLAYER_CALIBER_GENERATION_GOVERNANCE;
}
