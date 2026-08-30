import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract.js";

export const PLAYER_AVAILABILITY_EVIDENCE_CONTRACT_VERSION =
  "FIE-PLAYER-AVAILABILITY-EVIDENCE-1.0.0";

export const PLAYER_AVAILABILITY_STATUSES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  LIMITED: "LIMITED",
  QUESTIONABLE: "QUESTIONABLE",
  DOUBTFUL: "DOUBTFUL",
  OUT: "OUT",
  INJURED_RESERVE: "INJURED_RESERVE",
  PUP: "PUP",
  SUSPENDED: "SUSPENDED",
  UNKNOWN: "UNKNOWN",
});

export const AVAILABILITY_FRESHNESS_STATES = Object.freeze({
  FRESH: "FRESH",
  STALE: "STALE",
  UNKNOWN: "UNKNOWN",
});

const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const normalizeConfidence = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Math.round(value * 10000) / 10000
    : 0;

export function createPlayerAvailabilityEvidence({
  playerId = null,
  status = PLAYER_AVAILABILITY_STATUSES.UNKNOWN,
  reason = null,
  confidence = 0,
  evidenceLevel = EVIDENCE_LEVELS.NONE,
  dataState = DATA_STATES.UNKNOWN,
  freshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
  observedAt = null,
  effectiveAt = null,
  expiresAt = null,
  sourceRefs = [],
  evidenceRefs = [],
  provenance = {},
  repository = {},
} = {}) {
  const normalizedStatus = Object.values(PLAYER_AVAILABILITY_STATUSES).includes(status)
    ? status
    : PLAYER_AVAILABILITY_STATUSES.UNKNOWN;
  const normalizedDataState = Object.values(DATA_STATES).includes(dataState)
    ? dataState
    : DATA_STATES.UNKNOWN;
  const normalizedEvidenceLevel = Object.values(EVIDENCE_LEVELS).includes(evidenceLevel)
    ? evidenceLevel
    : EVIDENCE_LEVELS.NONE;
  const normalizedFreshness = Object.values(AVAILABILITY_FRESHNESS_STATES).includes(freshness)
    ? freshness
    : AVAILABILITY_FRESHNESS_STATES.UNKNOWN;

  return {
    contract: "PlayerAvailabilityEvidence",
    contractVersion: PLAYER_AVAILABILITY_EVIDENCE_CONTRACT_VERSION,
    playerId: normalizeString(playerId),
    status: normalizedStatus,
    reason: normalizeString(reason),
    confidence: normalizeConfidence(confidence),
    evidenceLevel: normalizedEvidenceLevel,
    dataState: normalizedDataState,
    freshness: normalizedFreshness,
    observedAt: normalizeString(observedAt),
    effectiveAt: normalizeString(effectiveAt),
    expiresAt: normalizeString(expiresAt),
    sourceRefs: normalizeArray(sourceRefs),
    evidenceRefs: normalizeArray(evidenceRefs),
    provenance: {
      contributors: normalizeArray(provenance?.contributors),
      sourceArtifacts: normalizeArray(provenance?.sourceArtifacts),
    },
    repository: {
      adapter: normalizeString(repository?.adapter),
      snapshotId: normalizeString(repository?.snapshotId),
      retrievedAt: normalizeString(repository?.retrievedAt),
    },
  };
}

export function validatePlayerAvailabilityEvidence(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return { valid: false, errors: ["EVIDENCE_REQUIRED"] };
  }
  if (value.contract !== "PlayerAvailabilityEvidence") errors.push("INVALID_CONTRACT");
  if (value.contractVersion !== PLAYER_AVAILABILITY_EVIDENCE_CONTRACT_VERSION) {
    errors.push("INVALID_CONTRACT_VERSION");
  }
  if (!Object.values(PLAYER_AVAILABILITY_STATUSES).includes(value.status)) {
    errors.push("INVALID_STATUS");
  }
  if (!Object.values(AVAILABILITY_FRESHNESS_STATES).includes(value.freshness)) {
    errors.push("INVALID_FRESHNESS");
  }
  if (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1) {
    errors.push("INVALID_CONFIDENCE");
  }
  return { valid: errors.length === 0, errors };
}
