// src/engines/contracts/IntelligenceResultContract.js

export const EVIDENCE_LEVELS = {
  NONE: "NONE",
  LIMITED: "LIMITED",
  MODERATE: "MODERATE",
  STRONG: "STRONG",
  VERY_STRONG: "VERY_STRONG",
};

export const DATA_STATES = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  UNKNOWN: "UNKNOWN",
  INSUFFICIENT_SAMPLE: "INSUFFICIENT_SAMPLE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

function clampConfidence(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function createIntelligenceResult({
  domain = "unknown",

  available = false,
  dataState = null,

  score = null,
  value = null,
  confidence = 0,
  evidenceLevel = EVIDENCE_LEVELS.NONE,

  playerId = null,
  competitionLevel = null,
  careerStage = null,

  summary = "",
  explanation = {
    positiveFactors: [],
    limitingFactors: [],
    contextualFactors: [],
  },

  evidence = [],
  missingEvidence = [],
  sources = [],

  rawData = null,

  lastUpdated = null,

  frameworkVersion = "1.0.0",
  modelVersion = "1.0.0",
  dataVersion = null,
} = {}) {
  const normalizedAvailable = Boolean(available);

  const resolvedDataState =
    dataState ||
    (normalizedAvailable
      ? DATA_STATES.AVAILABLE
      : DATA_STATES.UNAVAILABLE);

  return {
    domain,

    available: normalizedAvailable,
    dataState: resolvedDataState,

    score: normalizeScore(score),
    value,
    confidence: clampConfidence(confidence),
    evidenceLevel,

    playerId,
    competitionLevel,
    careerStage,

    summary,

    explanation: {
      positiveFactors: normalizeArray(
        explanation?.positiveFactors
      ),

      limitingFactors: normalizeArray(
        explanation?.limitingFactors
      ),

      contextualFactors: normalizeArray(
        explanation?.contextualFactors
      ),
    },

    evidence: normalizeArray(evidence),
    missingEvidence: normalizeArray(missingEvidence),
    sources: normalizeArray(sources),

    rawData,

    lastUpdated,

    versions: {
      framework: frameworkVersion,
      model: modelVersion,
      data: dataVersion,
    },
  };
}

export function createUnavailableIntelligenceResult({
  domain = "unknown",
  playerId = null,
  competitionLevel = null,
  careerStage = null,
  dataState = DATA_STATES.UNAVAILABLE,
  summary = "No intelligence evidence is currently available.",
  missingEvidence = [],
  frameworkVersion = "1.0.0",
  modelVersion = "1.0.0",
  dataVersion = null,
} = {}) {
  return createIntelligenceResult({
    domain,
    available: false,
    dataState,
    score: null,
    confidence: 0,
    evidenceLevel: EVIDENCE_LEVELS.NONE,
    playerId,
    competitionLevel,
    careerStage,
    summary,
    missingEvidence,
    frameworkVersion,
    modelVersion,
    dataVersion,
  });
}

export function isIntelligenceResult(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.domain === "string" &&
      typeof value.available === "boolean" &&
      Object.prototype.hasOwnProperty.call(value, "score") &&
      Object.prototype.hasOwnProperty.call(value, "confidence") &&
      Object.prototype.hasOwnProperty.call(value, "evidenceLevel") &&
      Object.prototype.hasOwnProperty.call(value, "dataState")
  );
}

export default {
  EVIDENCE_LEVELS,
  DATA_STATES,
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  isIntelligenceResult,
};
