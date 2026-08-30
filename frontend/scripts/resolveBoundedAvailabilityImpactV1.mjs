#!/usr/bin/env node

export const POLICY_VERSION = "1.0.0";
export const POLICY_ID = "FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1";

const BOUNDS = Object.freeze({
  OUT: [0, 0],
  DOUBTFUL: [0, 0.25],
  QUESTIONABLE: [0.75, 1],
  AVAILABLE: [1, 1],
  UNKNOWN: [1, 1]
});

const SUPPORTED = new Set(Object.keys(BOUNDS));
const CONFIDENCE_MIN = 0.60;
const COMPLETENESS_MIN = 0.70;

function finite01(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function neutral(input, reason) {
  const base = Number.isFinite(input?.basePlayerImpact) ? input.basePlayerImpact : null;
  return {
    contractVersion: "FIE-NFL-BOUNDED-AVAILABILITY-POLICY-RESOLVER-1.0.0",
    policyId: POLICY_ID,
    policyVersion: POLICY_VERSION,
    decision: "NEUTRAL_AVAILABILITY_ADJUSTMENT",
    availabilityStatus: String(input?.availabilityStatus ?? "UNKNOWN").toUpperCase(),
    selectedMultiplier: 1,
    basePlayerImpact: base,
    adjustedPlayerImpact: base,
    availabilityImpactDelta: 0,
    fallbackReason: reason,
    productionMutationAuthorized: false
  };
}

export function resolveBoundedAvailabilityImpact(input = {}) {
  const status = String(input.availabilityStatus ?? "UNKNOWN").toUpperCase();

  if (!SUPPORTED.has(status)) return neutral(input, "UNSUPPORTED_STATUS");
  if (status === "UNKNOWN") return neutral(input, "UNKNOWN_STATUS");

  if (!input.sourceClassification || !input.provider || !input.observedAtOrPublishedAt)
    return neutral(input, "MISSING_PROVENANCE");

  if (!finite01(input.availabilityConfidence) || input.availabilityConfidence < CONFIDENCE_MIN)
    return neutral(input, "MISSING_OR_LOW_CONFIDENCE");

  if (!finite01(input.evidenceCompleteness) || input.evidenceCompleteness < COMPLETENESS_MIN)
    return neutral(input, "MISSING_OR_LOW_EVIDENCE_COMPLETENESS");

  if (!Number.isFinite(input.basePlayerImpact) || !input.basePlayerImpactSource)
    return neutral(input, "MISSING_GOVERNED_BASE_PLAYER_IMPACT");

  const [minMultiplier, maxMultiplier] = BOUNDS[status];

  // RC3 deliberately uses the least aggressive multiplier inside each approved bound.
  // Later calibration may select another value only through a separately governed sprint.
  const selectedMultiplier = maxMultiplier;
  const adjustedPlayerImpact = input.basePlayerImpact * selectedMultiplier;

  return {
    contractVersion: "FIE-NFL-BOUNDED-AVAILABILITY-POLICY-RESOLVER-1.0.0",
    policyId: POLICY_ID,
    policyVersion: POLICY_VERSION,
    decision: selectedMultiplier === 1
      ? "NO_AVAILABILITY_REDUCTION"
      : "BOUNDED_AVAILABILITY_REDUCTION",
    availabilityStatus: status,
    availabilityConfidence: input.availabilityConfidence,
    evidenceCompleteness: input.evidenceCompleteness,
    sourceClassification: input.sourceClassification,
    provider: input.provider,
    observedAtOrPublishedAt: input.observedAtOrPublishedAt,
    basePlayerImpactSource: input.basePlayerImpactSource,
    basePlayerImpact: input.basePlayerImpact,
    multiplierBounds: { min: minMultiplier, max: maxMultiplier },
    selectedMultiplier,
    adjustedPlayerImpact,
    availabilityImpactDelta: adjustedPlayerImpact - input.basePlayerImpact,
    fallbackReason: null,
    productionMutationAuthorized: false
  };
}
