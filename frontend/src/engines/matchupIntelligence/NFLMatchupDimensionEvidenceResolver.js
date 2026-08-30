import {
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATES,
  createNFLMatchupDimensionEvidenceState,
} from "./NFLMatchupDimensionEvidenceStateContract.js";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeFreshness(value) {
  return typeof value === "string"
    ? value.trim().toUpperCase()
    : null;
}

export function resolveNFLMatchupDimensionEvidenceState({
  dimension = null,
  score = null,
  evidenceObserved = false,
  sampleSize = null,
  minimumSampleSize = null,
  freshness = null,
  observedAt = null,
  source = null,
  reason = null,
  metadata = {},
} = {}) {
  const normalizedFreshness =
    normalizeFreshness(freshness);

  const numericSample =
    Number.isFinite(Number(sampleSize))
      ? Number(sampleSize)
      : null;

  const numericMinimum =
    Number.isFinite(Number(minimumSampleSize))
      ? Number(minimumSampleSize)
      : null;

  let state =
    NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE;

  let resolvedReason =
    reason ||
    "MATCHUP_DIMENSION_EVIDENCE_UNAVAILABLE";

  if (!evidenceObserved || !finite(score)) {
    state =
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE;
  }
  else if (
    numericMinimum !== null &&
    (
      numericSample === null ||
      numericSample < numericMinimum
    )
  ) {
    state =
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.INSUFFICIENT_SAMPLE;

    resolvedReason =
      reason ||
      "MATCHUP_DIMENSION_EVIDENCE_INSUFFICIENT_SAMPLE";
  }
  else if (normalizedFreshness === "STALE") {
    state =
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.STALE;

    resolvedReason =
      reason ||
      "MATCHUP_DIMENSION_EVIDENCE_STALE";
  }
  else if (score === 0) {
    state =
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_NEUTRAL;

    resolvedReason =
      reason ||
      "MATCHUP_DIMENSION_EVIDENCE_OBSERVED_NEUTRAL";
  }
  else {
    state =
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_DIRECTIONAL;

    resolvedReason =
      reason ||
      "MATCHUP_DIMENSION_EVIDENCE_OBSERVED_DIRECTIONAL";
  }

  return createNFLMatchupDimensionEvidenceState({
    dimension,
    state,
    score,
    sampleSize: numericSample,
    minimumSampleSize: numericMinimum,
    freshness: normalizedFreshness,
    observedAt,
    source,
    reason: resolvedReason,
    metadata,
  });
}

export default {
  resolveNFLMatchupDimensionEvidenceState,
};
