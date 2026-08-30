import {
  createMDSFIEConsumerEnvelope,
  MDS_FIE_CONSUMER_ADAPTER_CONTRACT,
} from "../adapters/MDSFIEConsumerAdapterContract.js";
import {
  createMDSIntelligenceApplicationContext,
  MDS_INTELLIGENCE_APPLICATION_CONTRACT,
} from "../contracts/MDSIntelligenceApplicationContract.js";

export const MDS_FIE_APPLICATION_SERVICE_CONTRACT =
  "MDSFIEIntelligenceApplicationService";

export const MDS_FIE_APPLICATION_SERVICE_VERSION =
  "MDS-FIE-APPLICATION-SERVICE-1.0.0";

export const MDS_FIE_APPLICATION_SERVICE_BOUNDARY = Object.freeze({
  producer: "CANONICAL_FIE",
  consumer: "LBHT_MOCK_DRAFT_SIMULATOR",
  footballReasoningOwner: "CANONICAL_FIE",
  draftSimulationOwner: "LBHT_MOCK_DRAFT_SIMULATOR",
  mayRecomputeTeamStrength: false,
  mayRecomputeAvailability: false,
  mayRecomputeMatchupDirection: false,
  mayMutateDecisionProbability: false,
  maySelectDraftProspect: false,
  mayMutateDraftRuntime: false,
});

export function createMDSFIEIntelligenceApplicationServiceResult({
  teamIntelligence = null,
  matchupIntelligence = null,
  draftContext = null,
} = {}) {
  const fie = createMDSFIEConsumerEnvelope({
    teamIntelligence,
    matchupIntelligence,
  });

  const application = createMDSIntelligenceApplicationContext({
    fie,
    draftContext,
  });

  return {
    contract: MDS_FIE_APPLICATION_SERVICE_CONTRACT,
    version: MDS_FIE_APPLICATION_SERVICE_VERSION,
    producer: "CANONICAL_FIE",
    consumer: "LBHT_MOCK_DRAFT_SIMULATOR",
    boundary: MDS_FIE_APPLICATION_SERVICE_BOUNDARY,
    adapterContract: MDS_FIE_CONSUMER_ADAPTER_CONTRACT,
    applicationContract: MDS_INTELLIGENCE_APPLICATION_CONTRACT,
    application,
  };
}

export function isMDSFIEIntelligenceApplicationServiceResult(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.contract === MDS_FIE_APPLICATION_SERVICE_CONTRACT &&
      value.version === MDS_FIE_APPLICATION_SERVICE_VERSION &&
      value.application?.fie?.producer === "CANONICAL_FIE" &&
      value.application?.fie?.consumer === "LBHT_MOCK_DRAFT_SIMULATOR"
  );
}

export default {
  MDS_FIE_APPLICATION_SERVICE_CONTRACT,
  MDS_FIE_APPLICATION_SERVICE_VERSION,
  MDS_FIE_APPLICATION_SERVICE_BOUNDARY,
  createMDSFIEIntelligenceApplicationServiceResult,
  isMDSFIEIntelligenceApplicationServiceResult,
};
