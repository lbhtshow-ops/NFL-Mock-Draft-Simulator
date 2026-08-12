export const NFL_TEAM_INTELLIGENCE_CONTRACT_NAME =
  "NFLTeamIntelligenceResult";
export const NFL_TEAM_INTELLIGENCE_CONTRACT_VERSION =
  "NFL-TEAM-INTELLIGENCE-RESULT-1.0.0";
export const NFL_TEAM_INTELLIGENCE_MODEL_VERSION =
  "NFL-TEAM-INTELLIGENCE-V1.1.0";

export const NFL_TEAM_INTELLIGENCE_STATES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PARTIAL: "PARTIAL",
  UNKNOWN: "UNKNOWN",
  UNAVAILABLE: "UNAVAILABLE",
});

function finiteOrNull(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function normalizeZeroToOne(value) {
  const numeric = finiteOrNull(value);
  return numeric === null
    ? null
    : Math.max(0, Math.min(1, numeric));
}

function normalizeScore(value) {
  const numeric = finiteOrNull(value);
  return numeric === null
    ? null
    : Math.max(0, Math.min(100, numeric));
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

export function createNFLTeamIntelligenceResult({
  teamAbbreviation = null,
  state = NFL_TEAM_INTELLIGENCE_STATES.UNKNOWN,
  overallStrength = null,
  components = {},
  confidence = null,
  confidenceKnown = false,
  evidenceCompleteness = null,
  summary = "",
  explanation = {},
  evidence = [],
  missingEvidence = [],
  sources = [],
  evaluatedAt = null,
  modelVersion = NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
  inputVersion = null,
} = {}) {
  const normalizedConfidence =
    confidenceKnown
      ? normalizeZeroToOne(confidence)
      : null;

  return {
    contract: NFL_TEAM_INTELLIGENCE_CONTRACT_NAME,
    contractVersion:
      NFL_TEAM_INTELLIGENCE_CONTRACT_VERSION,

    teamAbbreviation,
    state,

    overallStrength: normalizeScore(overallStrength),

    components: {
      offense: normalizeScore(components.offense),
      defense: normalizeScore(components.defense),
      specialTeams: normalizeScore(components.specialTeams),
      roster: normalizeScore(components.roster),
      quarterback: normalizeScore(components.quarterback),
      availability: normalizeScore(components.availability),
      recentForm: normalizeScore(components.recentForm),
      opponentAdjusted: normalizeScore(
        components.opponentAdjusted
      ),
    },

    confidence: normalizedConfidence,
    confidenceKnown: Boolean(
      confidenceKnown && normalizedConfidence !== null
    ),

    evidenceCompleteness:
      normalizeZeroToOne(evidenceCompleteness),

    summary:
      typeof summary === "string" ? summary : "",

    explanation: {
      positiveFactors: array(
        explanation.positiveFactors
      ),
      limitingFactors: array(
        explanation.limitingFactors
      ),
      contextualFactors: array(
        explanation.contextualFactors
      ),
    },

    evidence: array(evidence),
    missingEvidence: array(missingEvidence),
    sources: array(sources),

    evaluatedAt,

    versions: {
      model: modelVersion,
      input: inputVersion,
    },
  };
}

export function isNFLTeamIntelligenceResult(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.contract ===
        NFL_TEAM_INTELLIGENCE_CONTRACT_NAME &&
      value.contractVersion ===
        NFL_TEAM_INTELLIGENCE_CONTRACT_VERSION &&
      typeof value.teamAbbreviation === "string" &&
      Object.prototype.hasOwnProperty.call(
        value,
        "confidenceKnown"
      ) &&
      Array.isArray(value.missingEvidence)
  );
}

export default {
  NFL_TEAM_INTELLIGENCE_CONTRACT_NAME,
  NFL_TEAM_INTELLIGENCE_CONTRACT_VERSION,
  NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
  NFL_TEAM_INTELLIGENCE_STATES,
  createNFLTeamIntelligenceResult,
  isNFLTeamIntelligenceResult,
};
