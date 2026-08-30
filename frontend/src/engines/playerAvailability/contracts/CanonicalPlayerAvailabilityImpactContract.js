import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract.js";
import {
  PLAYER_AVAILABILITY_STATUSES,
  AVAILABILITY_FRESHNESS_STATES,
} from "./PlayerAvailabilityEvidenceContract.js";

export const CANONICAL_PLAYER_AVAILABILITY_IMPACT_CONTRACT_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-1.1.0";

export const PLAYER_IMPACT_MODEL_STATES = Object.freeze({
  UNMODELED: "UNMODELED",
  PROVISIONAL: "PROVISIONAL",
  MODELED: "MODELED",
});

export const PLAYER_AVAILABILITY_READINESS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PARTIAL: "PARTIAL",
  UNAVAILABLE: "UNAVAILABLE",
});

const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const normalizeConfidence = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Math.round(value * 10000) / 10000
    : 0;

export function createCanonicalPlayerAvailabilityImpactResult({
  playerId = null,
  displayName = null,
  position = null,
  availability = {},
  caliber = null,
  impactContext = null,
  impact = {},
  readiness = PLAYER_AVAILABILITY_READINESS.UNAVAILABLE,
  missingEvidence = [],
  provenance = {},
  versions = {},
} = {}) {
  const status = Object.values(PLAYER_AVAILABILITY_STATUSES).includes(availability?.status)
    ? availability.status
    : PLAYER_AVAILABILITY_STATUSES.UNKNOWN;
  const dataState = Object.values(DATA_STATES).includes(availability?.dataState)
    ? availability.dataState
    : DATA_STATES.UNKNOWN;
  const evidenceLevel = Object.values(EVIDENCE_LEVELS).includes(availability?.evidenceLevel)
    ? availability.evidenceLevel
    : EVIDENCE_LEVELS.NONE;
  const freshness = Object.values(AVAILABILITY_FRESHNESS_STATES).includes(availability?.freshness)
    ? availability.freshness
    : AVAILABILITY_FRESHNESS_STATES.UNKNOWN;
  const modelState = Object.values(PLAYER_IMPACT_MODEL_STATES).includes(impact?.modelState)
    ? impact.modelState
    : PLAYER_IMPACT_MODEL_STATES.UNMODELED;

  return {
    contract: "CanonicalPlayerAvailabilityImpactResult",
    contractVersion: CANONICAL_PLAYER_AVAILABILITY_IMPACT_CONTRACT_VERSION,
    playerId: normalizeString(playerId),
    displayName: normalizeString(displayName),
    position: normalizeString(position),
    availability: {
      status,
      reason: normalizeString(availability?.reason),
      confidence: normalizeConfidence(availability?.confidence),
      evidenceLevel,
      dataState,
      freshness,
      observedAt: normalizeString(availability?.observedAt),
      effectiveAt: normalizeString(availability?.effectiveAt),
      expiresAt: normalizeString(availability?.expiresAt),
      evidenceRefs: normalizeArray(availability?.evidenceRefs),
      sourceRefs: normalizeArray(availability?.sourceRefs),
    },
    caliber: caliber ?? null,
    impactContext: impactContext ?? null,
    impact: {
      modelState,
      overallImpact: modelState !== PLAYER_IMPACT_MODEL_STATES.UNMODELED
        ? impact?.overallImpact ?? null
        : null,
      offensiveImpact: modelState !== PLAYER_IMPACT_MODEL_STATES.UNMODELED
        ? impact?.offensiveImpact ?? null
        : null,
      defensiveImpact: modelState !== PLAYER_IMPACT_MODEL_STATES.UNMODELED
        ? impact?.defensiveImpact ?? null
        : null,
      specialTeamsImpact: modelState !== PLAYER_IMPACT_MODEL_STATES.UNMODELED
        ? impact?.specialTeamsImpact ?? null
        : null,
      confidence: modelState !== PLAYER_IMPACT_MODEL_STATES.UNMODELED
        ? normalizeConfidence(impact?.confidence)
        : 0,
      methodology: impact?.methodology ?? null,
      featureVector: impact?.featureVector ?? null,
      explanation: normalizeArray(impact?.explanation),
      limitations: normalizeArray(impact?.limitations),
    },
    readiness: Object.values(PLAYER_AVAILABILITY_READINESS).includes(readiness)
      ? readiness
      : PLAYER_AVAILABILITY_READINESS.UNAVAILABLE,
    missingEvidence: normalizeArray(missingEvidence),
    provenance: {
      availability: provenance?.availability ?? null,
      availabilityRepository: provenance?.availabilityRepository ?? null,
      caliber: provenance?.caliber ?? null,
      impactContext: provenance?.impactContext ?? null,
    },
    versions: {
      contract: CANONICAL_PLAYER_AVAILABILITY_IMPACT_CONTRACT_VERSION,
      engine: normalizeString(versions?.engine),
      impactModel: normalizeString(versions?.impactModel),
    },
  };
}

export function validateCanonicalPlayerAvailabilityImpactResult(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return { valid: false, errors: ["RESULT_REQUIRED"] };
  }
  if (value.contract !== "CanonicalPlayerAvailabilityImpactResult") {
    errors.push("INVALID_CONTRACT");
  }
  if (value.contractVersion !== CANONICAL_PLAYER_AVAILABILITY_IMPACT_CONTRACT_VERSION) {
    errors.push("INVALID_CONTRACT_VERSION");
  }
  if (!Object.values(PLAYER_AVAILABILITY_STATUSES).includes(value.availability?.status)) {
    errors.push("INVALID_AVAILABILITY_STATUS");
  }
  if (!Object.values(PLAYER_IMPACT_MODEL_STATES).includes(value.impact?.modelState)) {
    errors.push("INVALID_IMPACT_MODEL_STATE");
  }
  if (value.impact?.modelState === PLAYER_IMPACT_MODEL_STATES.UNMODELED) {
    for (const field of ["overallImpact", "offensiveImpact", "defensiveImpact", "specialTeamsImpact"]) {
      if (value.impact?.[field] !== null) errors.push(`UNMODELED_${field.toUpperCase()}_MUST_BE_NULL`);
    }
  }
  if (
    value.impact?.modelState === PLAYER_IMPACT_MODEL_STATES.MODELED ||
    value.impact?.modelState === PLAYER_IMPACT_MODEL_STATES.PROVISIONAL
  ) {
    if (
      typeof value.impact?.overallImpact !== "number" ||
      !Number.isFinite(value.impact.overallImpact) ||
      value.impact.overallImpact < 0 ||
      value.impact.overallImpact > 100
    ) {
      errors.push("SCORED_OVERALL_IMPACT_MUST_BE_BOUNDED");
    }
    if (!value.impact?.methodology?.profileId || !value.impact?.methodology?.profileVersion) {
      errors.push("SCORED_IMPACT_REQUIRES_METHODOLOGY_IDENTITY");
    }
  }
  return { valid: errors.length === 0, errors };
}
