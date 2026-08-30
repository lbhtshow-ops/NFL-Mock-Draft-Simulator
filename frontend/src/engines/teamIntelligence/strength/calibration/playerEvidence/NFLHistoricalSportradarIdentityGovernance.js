export const NFL_HISTORICAL_SPORTRADAR_IDENTITY_GOVERNANCE = Object.freeze({
  contractVersion:
    "FIE-NFL-HISTORICAL-SPORTRADAR-IDENTITY-GOVERNANCE-1.0.0",
  provider: "sportradar-nfl-v7",
  crosswalkSource: "nflverse weekly rosters",
  sourceIdentityField: "sportradar_id",
  canonicalIdentityField: "gsis_id",
  canonicalPrimaryKey: "gsis_id",
  exactIdMappingRequired: true,
  nameFallbackAllowed: false,
  fuzzyNameFallbackAllowed: false,
  teamPositionGuessAllowed: false,
  missingMappingRemainsUnresolved: true,
  conflictingMappingRemainsUnresolved: true,
  providerToCanonicalDirection: "SPORTRADAR_UUID_TO_GSIS_ID",
  canonicalJacksonvilleTeamCode: "JAX",
  acceptedJacksonvilleProviderAlias: "JAC",
  temporalQualificationRequiredSeparately: true,
  historicalNormalizationAuthorized: false,
  treatmentConstructionAuthorized: false,
  matchingAuthorized: false,
  attRecomputationAuthorized: false,
  learnedWeightsAuthorized: false,
  calibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
});

export function getNFLHistoricalSportradarIdentityGovernance() {
  return NFL_HISTORICAL_SPORTRADAR_IDENTITY_GOVERNANCE;
}
