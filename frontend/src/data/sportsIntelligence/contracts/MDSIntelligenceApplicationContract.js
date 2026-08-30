export const MDS_INTELLIGENCE_APPLICATION_CONTRACT = "MDSIntelligenceApplicationContract";
export const MDS_INTELLIGENCE_APPLICATION_VERSION = "MDS-INTELLIGENCE-APPLICATION-1.0.0";

export const MDS_INTELLIGENCE_CONSUMERS = Object.freeze([
  "SPORTS_INTELLIGENCE_ENGINE",
  "DRAFT_OPERATIONS_CENTER",
  "PROSPECT_INTELLIGENCE_CENTER",
  "DRAFT_WIRE",
  "CPU_DRAFT_DECISION_SUPPORT",
]);

export const MDS_INTELLIGENCE_APPLICATION_BOUNDARY = Object.freeze({
  acceptsCanonicalFIEConsumerEnvelope: true,
  mayRenderCanonicalFootballIntelligence: true,
  mayCombineWithMDSDraftContext: true,
  mayOwnDraftSimulationBehavior: true,
  mayRecomputeTeamStrength: false,
  mayRecomputeAvailability: false,
  mayRecomputeMatchupDirection: false,
  mayImportPickemSpecificLogic: false,
});

export function createMDSIntelligenceApplicationContext({ fie = null, draftContext = null } = {}) {
  return {
    contract: MDS_INTELLIGENCE_APPLICATION_CONTRACT,
    version: MDS_INTELLIGENCE_APPLICATION_VERSION,
    fie,
    draftContext,
    boundary: MDS_INTELLIGENCE_APPLICATION_BOUNDARY,
  };
}
