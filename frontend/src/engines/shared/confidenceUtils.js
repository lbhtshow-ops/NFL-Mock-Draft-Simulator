import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../contracts/IntelligenceResultContract.js";

export function normalizeConfidence(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(1, value));
}

export function getEvidenceLevelForConfidence(value) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    return null;
  }

  if (value >= 0.9) return EVIDENCE_LEVELS.VERY_STRONG;
  if (value >= 0.75) return EVIDENCE_LEVELS.STRONG;
  if (value >= 0.5) return EVIDENCE_LEVELS.MODERATE;
  if (value > 0) return EVIDENCE_LEVELS.LIMITED;

  return EVIDENCE_LEVELS.NONE;
}

export function assessConfidence(value) {
  const unknown = value === null || value === undefined;
  const normalizedConfidence = normalizeConfidence(value);
  const valid = unknown || normalizedConfidence !== null;
  const known = normalizedConfidence !== null;

  return {
    confidence: normalizedConfidence,
    evidenceLevel: known
      ? getEvidenceLevelForConfidence(normalizedConfidence)
      : null,
    known,
    valid,
    dataState: known
      ? DATA_STATES.AVAILABLE
      : unknown
        ? DATA_STATES.UNKNOWN
        : DATA_STATES.UNAVAILABLE,
    errors: valid
      ? []
      : [
          {
            code: "INVALID_CONFIDENCE",
            message: "Confidence must be a finite number from 0 to 1.",
          },
        ],
  };
}

export default {
  normalizeConfidence,
  getEvidenceLevelForConfidence,
  assessConfidence,
};
