export const NFL_HISTORICAL_STARTER_REPLACEMENT_CALIBER_ENRICHMENT_GOVERNANCE=Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-STARTER-REPLACEMENT-CALIBER-ENRICHMENT-GOVERNANCE-1.0.0",
  sprint:"9D.1C2B2C2",
  resolvedReplacementIdentityRequired:true,
  canonicalHistoricalCaliberSnapshotRequired:true,
  playerAndReplacementBothRequireSnapshotsForDelta:true,
  asOfRequired:true,
  kickoffRequired:true,
  asOfMustPrecedeKickoff:true,
  exactPlayerTeamWeekJoinRequired:true,
  currentRatingBackfillAllowed:false,
  rankProxyAllowed:false,
  rosterValueProxyAllowed:false,
  syntheticCaliberAllowed:false,
  missingCaliberRemainsNull:true,
  partialEnrichmentAllowed:true,
  replacementDeltaRequiresBothCalibers:true,
  modelVersionPreserved:true,
  provenancePreserved:true,
  calibrationAuthorized:false,
  learnedWeightsAuthorized:false,
  datasetMutationAuthorized:false,
});
export function getNFLHistoricalStarterReplacementCaliberEnrichmentGovernance(){
  return NFL_HISTORICAL_STARTER_REPLACEMENT_CALIBER_ENRICHMENT_GOVERNANCE;
}
