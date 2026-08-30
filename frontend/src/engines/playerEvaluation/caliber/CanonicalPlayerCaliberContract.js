import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract.js";

export const CANONICAL_PLAYER_CALIBER_CONTRACT_VERSION =
  "FIE-CANONICAL-PLAYER-CALIBER-1.0.1";

export const PLAYER_CALIBER_SUBJECT_KINDS = Object.freeze({
  NFL_PLAYER: "NFL_PLAYER",
  PROSPECT: "PROSPECT",
});

export const PLAYER_CALIBER_READINESS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PARTIAL: "PARTIAL",
  UNAVAILABLE: "UNAVAILABLE",
});

const finiteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function normalizeGrade(value) {
  if (!finiteNumber(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100) / 100;
}

function normalizeConfidence(value) {
  if (!finiteNumber(value) || value < 0 || value > 1) return 0;
  return Math.round(value * 10000) / 10000;
}

function normalizeEvidenceLevel(value) {
  return Object.values(EVIDENCE_LEVELS).includes(value)
    ? value
    : EVIDENCE_LEVELS.NONE;
}

function normalizeDataState(value, available) {
  if (Object.values(DATA_STATES).includes(value)) return value;
  return available ? DATA_STATES.AVAILABLE : DATA_STATES.UNAVAILABLE;
}

function normalizeReadiness(value, available, missingEvidence) {
  if (Object.values(PLAYER_CALIBER_READINESS).includes(value)) return value;
  if (!available) return PLAYER_CALIBER_READINESS.UNAVAILABLE;
  return missingEvidence.length
    ? PLAYER_CALIBER_READINESS.PARTIAL
    : PLAYER_CALIBER_READINESS.AVAILABLE;
}

/**
 * Canonical semantics:
 * - caliberGrade = football playing quality on a 0-100 scale in the evaluator's
 *   governed context.
 * - caliberGrade is NOT roster value, positional value, draft value, contract
 *   value, availability impact, current form, career baseline, or confidence.
 * - confidence measures trust in evidence supporting the evaluation, never
 *   the quality of the player.
 *
 * This contract does not calculate caliber. Authorized evaluation engines do.
 */
export function createCanonicalPlayerCaliberResult({
  subjectKind = null,
  playerId = null,
  displayName = null,
  position = null,
  available = false,
  dataState = null,
  readiness = null,
  caliberGrade = null,
  caliberTier = null,
  currentFormGrade = null,
  careerBaselineGrade = null,
  rosterValue = null,
  confidence = 0,
  evidenceLevel = EVIDENCE_LEVELS.NONE,
  missingEvidence = [],
  evidenceRefs = [],
  sources = [],
  explanation = {},
  provenance = {},
  sourceEvaluation = {},
  versions = {},
} = {}) {
  const normalizedMissing = normalizeArray(missingEvidence);
  const normalizedGrade = normalizeGrade(caliberGrade);
  const normalizedAvailable = Boolean(available && normalizedGrade !== null);

  return {
    contract: "CanonicalPlayerCaliberResult",
    contractVersion: CANONICAL_PLAYER_CALIBER_CONTRACT_VERSION,
    subjectKind: Object.values(PLAYER_CALIBER_SUBJECT_KINDS).includes(subjectKind)
      ? subjectKind
      : null,
    playerId: normalizeString(playerId),
    displayName: normalizeString(displayName),
    position: normalizeString(position),
    available: normalizedAvailable,
    dataState: normalizeDataState(dataState, normalizedAvailable),
    readiness: normalizeReadiness(readiness, normalizedAvailable, normalizedMissing),
    caliberGrade: normalizedAvailable ? normalizedGrade : null,
    caliberTier: normalizedAvailable ? normalizeString(caliberTier) : null,
    currentFormGrade: normalizeGrade(currentFormGrade),
    careerBaselineGrade: normalizeGrade(careerBaselineGrade),
    rosterValue: normalizeGrade(rosterValue),
    confidence: normalizeConfidence(confidence),
    evidenceLevel: normalizeEvidenceLevel(evidenceLevel),
    missingEvidence: normalizedMissing,
    evidenceRefs: normalizeArray(evidenceRefs),
    sources: normalizeArray(sources),
    explanation: {
      strengths: normalizeArray(explanation?.strengths),
      concerns: normalizeArray(explanation?.concerns),
      contextualFactors: normalizeArray(explanation?.contextualFactors),
      caliberRationale: normalizeArray(explanation?.caliberRationale),
      confidenceRationale: normalizeArray(explanation?.confidenceRationale),
    },
    provenance: {
      contributors: normalizeArray(provenance?.contributors),
    },
    sourceEvaluation: {
      engine: normalizeString(sourceEvaluation?.engine),
      model: normalizeString(sourceEvaluation?.model),
      sourceField: normalizeString(sourceEvaluation?.sourceField),
    },
    versions: {
      contract: CANONICAL_PLAYER_CALIBER_CONTRACT_VERSION,
      evaluator: normalizeString(versions?.evaluator),
      model: normalizeString(versions?.model),
      weights: normalizeString(versions?.weights),
      data: versions?.data ?? null,
    },
  };
}

export function validateCanonicalPlayerCaliberResult(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return { valid: false, errors: ["RESULT_REQUIRED"] };
  }
  if (value.contract !== "CanonicalPlayerCaliberResult") errors.push("INVALID_CONTRACT");
  if (value.contractVersion !== CANONICAL_PLAYER_CALIBER_CONTRACT_VERSION) {
    errors.push("INVALID_CONTRACT_VERSION");
  }
  if (!Object.values(PLAYER_CALIBER_SUBJECT_KINDS).includes(value.subjectKind)) {
    errors.push("INVALID_SUBJECT_KIND");
  }
  if (value.available) {
    if (!finiteNumber(value.caliberGrade) || value.caliberGrade < 0 || value.caliberGrade > 100) {
      errors.push("INVALID_CALIBER_GRADE");
    }
  } else if (value.caliberGrade !== null) {
    errors.push("UNAVAILABLE_GRADE_MUST_BE_NULL");
  }
  if (!finiteNumber(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    errors.push("INVALID_CONFIDENCE");
  }
  if (!Object.values(EVIDENCE_LEVELS).includes(value.evidenceLevel)) {
    errors.push("INVALID_EVIDENCE_LEVEL");
  }
  if (!Object.values(PLAYER_CALIBER_READINESS).includes(value.readiness)) {
    errors.push("INVALID_READINESS");
  }
  return { valid: errors.length === 0, errors };
}

export default {
  CANONICAL_PLAYER_CALIBER_CONTRACT_VERSION,
  PLAYER_CALIBER_SUBJECT_KINDS,
  PLAYER_CALIBER_READINESS,
  createCanonicalPlayerCaliberResult,
  validateCanonicalPlayerCaliberResult,
};
