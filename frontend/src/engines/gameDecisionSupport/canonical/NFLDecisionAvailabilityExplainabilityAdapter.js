import {
  projectCanonicalPlayerImpactExplainability,
} from "./NFLDecisionPlayerImpactExplainabilityProjection.js";

export const NFL_DECISION_AVAILABILITY_EXPLAINABILITY_ADAPTER_VERSION =
  "FIE-NFL-DECISION-AVAILABILITY-EXPLAINABILITY-ADAPTER-1.0.0";

const array = (value) => (Array.isArray(value) ? value : []);

export function extendCanonicalDecisionAvailabilityExplainability({
  baselineDecision = {},
  availabilityIntelligence = null,
  playerContexts = [],
} = {}) {
  const baseline =
    baselineDecision && typeof baselineDecision === "object"
      ? baselineDecision
      : {};

  const existingAvailability =
    availabilityIntelligence &&
    typeof availabilityIntelligence === "object"
      ? availabilityIntelligence
      : baseline?.availabilityIntelligence &&
        typeof baseline.availabilityIntelligence === "object"
      ? baseline.availabilityIntelligence
      : null;

  if (!existingAvailability) {
    // Backward-compatible no-op: no availability namespace means
    // the baseline decision is returned unchanged.
    return baseline;
  }

  const contexts = array(playerContexts);

  const projected = contexts.map((entry) =>
    projectCanonicalPlayerImpactExplainability({
      integratedInputs: entry?.integratedInputs ?? null,
      availabilityResult: entry?.availabilityResult ?? null,
    })
  );

  const existingAdjustments = array(
    existingAvailability.playerAdjustments
  );

  const playerAdjustments =
    projected.length > 0
      ? projected
      : existingAdjustments;

  return {
    ...baseline,
    availabilityIntelligence: {
      ...existingAvailability,
      playerAdjustments,
      explainability: {
        contract: "NFLDecisionAvailabilityExplainability",
        version:
          NFL_DECISION_AVAILABILITY_EXPLAINABILITY_ADAPTER_VERSION,
        mode: "READ_ONLY_CANONICAL_PROJECTION",
        canonicalValuesOnly: true,
        missingCanonicalValuesRemainNull: true,
      },
    },
  };
}

export default {
  NFL_DECISION_AVAILABILITY_EXPLAINABILITY_ADAPTER_VERSION,
  extendCanonicalDecisionAvailabilityExplainability,
};
