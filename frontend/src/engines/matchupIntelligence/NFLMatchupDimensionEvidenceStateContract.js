export const NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_CONTRACT =
  "NFLMatchupDimensionEvidenceState";

export const NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_VERSION =
  "GI-V2-EVIDENCE-STATE-1.0.0-RC1";

export const NFL_MATCHUP_DIMENSION_EVIDENCE_STATES =
  Object.freeze({
    UNAVAILABLE: "UNAVAILABLE",
    INSUFFICIENT_SAMPLE: "INSUFFICIENT_SAMPLE",
    STALE: "STALE",
    OBSERVED_NEUTRAL: "OBSERVED_NEUTRAL",
    OBSERVED_DIRECTIONAL: "OBSERVED_DIRECTIONAL",
  });

const OBSERVED_STATES = new Set([
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_NEUTRAL,
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_DIRECTIONAL,
]);

const USABLE_STATES = new Set(OBSERVED_STATES);
const QUALITY_STATES = new Set(OBSERVED_STATES);

export function isNFLMatchupDimensionEvidenceState(value) {
  return Object.values(
    NFL_MATCHUP_DIMENSION_EVIDENCE_STATES
  ).includes(value);
}

export function isNFLMatchupDimensionEvidenceObserved(state) {
  return OBSERVED_STATES.has(state);
}

export function isNFLMatchupDimensionEvidenceUsable(state) {
  return USABLE_STATES.has(state);
}

export function doesNFLMatchupDimensionEvidenceCountTowardQuality(
  state
) {
  return QUALITY_STATES.has(state);
}

export function createNFLMatchupDimensionEvidenceState({
  dimension = null,
  state = NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE,
  score = null,
  sampleSize = null,
  minimumSampleSize = null,
  freshness = null,
  observedAt = null,
  source = null,
  reason = null,
  metadata = {},
} = {}) {
  const normalizedState =
    isNFLMatchupDimensionEvidenceState(state)
      ? state
      : NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE;

  const numericScore =
    typeof score === "number" && Number.isFinite(score)
      ? score
      : null;

  return Object.freeze({
    contract: NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_CONTRACT,
    version: NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_VERSION,
    dimension:
      typeof dimension === "string" && dimension.trim()
        ? dimension.trim()
        : null,
    state: normalizedState,
    score: numericScore,
    observed:
      isNFLMatchupDimensionEvidenceObserved(normalizedState),
    scoringAuthority:
      isNFLMatchupDimensionEvidenceUsable(normalizedState),
    qualityAuthority:
      doesNFLMatchupDimensionEvidenceCountTowardQuality(
        normalizedState
      ),
    sampleSize:
      Number.isFinite(Number(sampleSize))
        ? Number(sampleSize)
        : null,
    minimumSampleSize:
      Number.isFinite(Number(minimumSampleSize))
        ? Number(minimumSampleSize)
        : null,
    freshness:
      typeof freshness === "string"
        ? freshness
        : null,
    observedAt:
      typeof observedAt === "string"
        ? observedAt
        : null,
    source:
      typeof source === "string"
        ? source
        : null,
    reason:
      typeof reason === "string"
        ? reason
        : null,
    metadata:
      metadata && typeof metadata === "object"
        ? Object.freeze({ ...metadata })
        : Object.freeze({}),
  });
}

export default {
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_CONTRACT,
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATE_VERSION,
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATES,
  isNFLMatchupDimensionEvidenceState,
  isNFLMatchupDimensionEvidenceObserved,
  isNFLMatchupDimensionEvidenceUsable,
  doesNFLMatchupDimensionEvidenceCountTowardQuality,
  createNFLMatchupDimensionEvidenceState,
};
