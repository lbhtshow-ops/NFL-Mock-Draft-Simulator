export const MDS_FIE_CONSUMER_ADAPTER_CONTRACT = "MDSFIEConsumerAdapterContract";
export const MDS_FIE_CONSUMER_ADAPTER_VERSION = "MDS-FIE-CONSUMER-ADAPTER-1.0.0";

export const MDS_FIE_CONSUMER_SOURCE_CONTRACTS = Object.freeze({
  TEAM: "NFLTeamIntelligenceResult",
  MATCHUP: "NFLMatchupIntelligenceResult",
});

export const MDS_FIE_CONSUMER_STATES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PARTIAL: "PARTIAL",
  UNKNOWN: "UNKNOWN",
  UNAVAILABLE: "UNAVAILABLE",
});

export const MDS_FIE_CONSUMER_OWNERSHIP = Object.freeze({
  footballReasoningOwner: "CANONICAL_FIE",
  draftSimulationOwner: "LBHT_MOCK_DRAFT_SIMULATOR",
  adapterMayRecomputeTeamStrength: false,
  adapterMayRecomputeAvailability: false,
  adapterMayRecomputeMatchupDirection: false,
  adapterMayMutateDecisionProbability: false,
  adapterMaySelectDraftProspect: false,
});

function array(value) { return Array.isArray(value) ? value : []; }
function finiteOrNull(value) { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export function createMDSFIETeamConsumerProjection(result = null) {
  if (!result || result.contract !== MDS_FIE_CONSUMER_SOURCE_CONTRACTS.TEAM) return null;
  return {
    sourceContract: result.contract,
    sourceContractVersion: result.contractVersion || null,
    teamAbbreviation: result.teamAbbreviation || null,
    state: result.state || MDS_FIE_CONSUMER_STATES.UNKNOWN,
    overallStrength: finiteOrNull(result.overallStrength),
    components: { ...(result.components || {}) },
    teamProfile: result.teamProfile ?? null,
    confidence: finiteOrNull(result.confidence),
    confidenceKnown: Boolean(result.confidenceKnown),
    evidenceCompleteness: finiteOrNull(result.evidenceCompleteness),
    summary: typeof result.summary === "string" ? result.summary : "",
    explanation: {
      positiveFactors: array(result.explanation?.positiveFactors),
      limitingFactors: array(result.explanation?.limitingFactors),
      contextualFactors: array(result.explanation?.contextualFactors),
    },
    evidence: array(result.evidence),
    missingEvidence: array(result.missingEvidence),
    sources: array(result.sources),
    evaluatedAt: result.evaluatedAt || null,
    versions: { ...(result.versions || {}) },
  };
}

export function createMDSFIEMatchupConsumerProjection(result = null) {
  if (!result || result.contract !== MDS_FIE_CONSUMER_SOURCE_CONTRACTS.MATCHUP) return null;
  return {
    sourceContract: result.contract,
    sourceContractVersion: result.version || null,
    game: { ...(result.game || {}) },
    state: result.state || MDS_FIE_CONSUMER_STATES.UNKNOWN,
    matchupEdge: finiteOrNull(result.matchupEdge),
    homeAdvantageIndex: finiteOrNull(result.homeAdvantageIndex),
    dimensions: { ...(result.dimensions || {}) },
    context: { ...(result.context || {}) },
    evidenceQuality: finiteOrNull(result.evidenceQuality),
    evidenceQualityKnown: Boolean(result.evidenceQualityKnown),
    keyAdvantages: array(result.keyAdvantages),
    counterweights: array(result.counterweights),
    limitations: array(result.limitations),
    sourceTeamIntelligence: { ...(result.sourceTeamIntelligence || {}) },
    evaluatedAt: result.evaluatedAt || null,
    calibratedWinProbability: result.calibratedWinProbability === true,
    expectedPointMargin: finiteOrNull(result.expectedPointMargin),
  };
}

export function createMDSFIEConsumerEnvelope({ teamIntelligence = null, matchupIntelligence = null } = {}) {
  return {
    contract: MDS_FIE_CONSUMER_ADAPTER_CONTRACT,
    version: MDS_FIE_CONSUMER_ADAPTER_VERSION,
    producer: "CANONICAL_FIE",
    consumer: "LBHT_MOCK_DRAFT_SIMULATOR",
    ownership: MDS_FIE_CONSUMER_OWNERSHIP,
    teamIntelligence: createMDSFIETeamConsumerProjection(teamIntelligence),
    matchupIntelligence: createMDSFIEMatchupConsumerProjection(matchupIntelligence),
  };
}
