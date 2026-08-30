export const NFL_HISTORICAL_PLAYER_IDENTITY_RESOLUTION_GOVERNANCE = Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-PLAYER-IDENTITY-RESOLUTION-GOVERNANCE-1.0.0",
  provider:"nflverse/nflverse-data",
  releaseTag:"players",
  csvUrl:"https://github.com/nflverse/nflverse-data/releases/download/players/players.csv",
  sourceIdentityField:"pfr_id",
  canonicalIdentityField:"gsis_id",
  canonicalPrimaryKey:"gsis_id",
  exactIdMappingRequired:true,
  nameFallbackAllowed:false,
  fuzzyNameFallbackAllowed:false,
  teamPositionGuessAllowed:false,
  ambiguousMappingRemainsUnresolved:true,
  missingMappingRemainsUnresolved:true,
  canonicalJoinRequiresResolvedIdentity:true,
  pregameReplacementDeterminationAuthorized:false,
  learnedWeightsAuthorized:false,
  calibrationAuthorized:false,
});
export function getNFLHistoricalPlayerIdentityResolutionGovernance(){
  return NFL_HISTORICAL_PLAYER_IDENTITY_RESOLUTION_GOVERNANCE;
}
