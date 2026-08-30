#!/usr/bin/env node

export const ADAPTER_CONTRACT_VERSION =
  "FIE-NFL-DECISION-AVAILABILITY-ADAPTER-CONTRACT-1.0.0";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function neutralNamespace(reason = null, policyVersion = null) {
  return {
    status: reason ? "NEUTRAL_FALLBACK" : "NOT_APPLIED",
    applied: false,
    applicationChannel: null,
    playerAdjustments: [],
    aggregateAvailabilityDelta: 0,
    provenance: [],
    fallbackReasons: reason ? [reason] : [],
    policyVersion
  };
}

export function applyAvailabilityToCanonicalDecision({
  baselineDecision,
  availabilityResults = []
} = {}) {
  if (!baselineDecision || typeof baselineDecision !== "object") {
    throw new Error("baselineDecision is required");
  }

  const output = clone(baselineDecision);

  if (!Array.isArray(availabilityResults) || availabilityResults.length === 0) {
    output.availabilityIntelligence = neutralNamespace("MISSING_AVAILABILITY");
    return output;
  }

  const nonNeutral = [];
  const fallbackReasons = [];
  const provenance = [];

  for (const result of availabilityResults) {
    if (!result || typeof result !== "object") {
      fallbackReasons.push("INVALID_AVAILABILITY_RESULT");
      continue;
    }

    if (result.decision === "NEUTRAL_AVAILABILITY_ADJUSTMENT" ||
        result.selectedMultiplier === 1 ||
        result.availabilityImpactDelta === 0) {
      if (result.fallbackReason) fallbackReasons.push(result.fallbackReason);
      continue;
    }

    const required = [
      "policyId","policyVersion","availabilityStatus",
      "availabilityConfidence","evidenceCompleteness",
      "sourceClassification","provider","observedAtOrPublishedAt",
      "basePlayerImpactSource","selectedMultiplier",
      "availabilityImpactDelta"
    ];

    const missing = required.filter(k => result[k] === undefined || result[k] === null || result[k] === "");
    if (missing.length) {
      fallbackReasons.push("NON_NEUTRAL_RESULT_MISSING_PROVENANCE");
      continue;
    }

    nonNeutral.push(result);
    provenance.push(Object.fromEntries(required.map(k => [k, result[k]])));
  }

  if (nonNeutral.length === 0) {
    output.availabilityIntelligence = neutralNamespace(
      fallbackReasons[0] ?? "NO_NON_NEUTRAL_AVAILABILITY",
      availabilityResults[0]?.policyVersion ?? null
    );
    return output;
  }

  const aggregateAvailabilityDelta =
    nonNeutral.reduce((sum, r) => sum + Number(r.availabilityImpactDelta || 0), 0);

  output.availabilityIntelligence = {
    status: "APPLIED",
    applied: true,
    applicationChannel: "DECISION_OUTPUT_AVAILABILITY_NAMESPACE_ONLY",
    playerAdjustments: nonNeutral.map(r => ({
      availabilityStatus: r.availabilityStatus,
      basePlayerImpact: r.basePlayerImpact,
      adjustedPlayerImpact: r.adjustedPlayerImpact,
      availabilityImpactDelta: r.availabilityImpactDelta,
      selectedMultiplier: r.selectedMultiplier,
      basePlayerImpactSource: r.basePlayerImpactSource
    })),
    aggregateAvailabilityDelta,
    provenance,
    fallbackReasons,
    policyVersion: nonNeutral[0].policyVersion
  };

  // RC4.2 is intentionally non-mutating with respect to baseline scoring fields.
  // The availability delta is exposed only through the optional namespace.
  return output;
}
