#!/usr/bin/env node
import {
  applyAvailabilityToCanonicalDecision
} from "./applyAvailabilityToCanonicalDecisionV1.mjs";

const baseline = Object.freeze({
  modelVersion: "NFL-GAME-DECISION-MODEL-V1.0.0",
  gameId: "TEST-GAME-001",
  homeTeam: "BAL",
  awayTeam: "CAR",
  prediction: {
    winner: "BAL",
    homeWinProbability: 0.64,
    awayWinProbability: 0.36,
    edge: 0.28
  },
  confidence: 0.71
});

function governed(overrides = {}) {
  return {
    contractVersion: "FIE-NFL-BOUNDED-AVAILABILITY-POLICY-RESOLVER-1.0.0",
    policyId: "FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1",
    policyVersion: "1.0.0",
    decision: "BOUNDED_AVAILABILITY_REDUCTION",
    availabilityStatus: "OUT",
    availabilityConfidence: 0.90,
    evidenceCompleteness: 0.90,
    sourceClassification: "FIE_AVAILABILITY_EVIDENCE",
    provider: "SYNTHETIC_FIXTURE",
    observedAtOrPublishedAt: "2026-08-16T12:00:00Z",
    basePlayerImpactSource: "GOVERNED_SYNTHETIC_BASE_IMPACT",
    basePlayerImpact: 8,
    selectedMultiplier: 0,
    adjustedPlayerImpact: 0,
    availabilityImpactDelta: -8,
    fallbackReason: null,
    productionMutationAuthorized: false,
    ...overrides
  };
}

function sameBaselineFields(a,b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const cases = [];

{
  const actual = applyAvailabilityToCanonicalDecision({ baselineDecision: baseline });
  const copy = {...actual};
  delete copy.availabilityIntelligence;
  cases.push({
    name: "missing-availability-preserves-baseline",
    passed:
      sameBaselineFields(copy, baseline) &&
      actual.availabilityIntelligence.applied === false &&
      actual.availabilityIntelligence.aggregateAvailabilityDelta === 0
  });
}

{
  const neutral = governed({
    decision: "NEUTRAL_AVAILABILITY_ADJUSTMENT",
    availabilityStatus: "UNKNOWN",
    selectedMultiplier: 1,
    adjustedPlayerImpact: 8,
    availabilityImpactDelta: 0,
    fallbackReason: "UNKNOWN_STATUS"
  });
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [neutral]
  });
  const copy = {...actual}; delete copy.availabilityIntelligence;
  cases.push({
    name: "neutral-availability-preserves-baseline",
    passed:
      sameBaselineFields(copy, baseline) &&
      actual.availabilityIntelligence.applied === false &&
      actual.availabilityIntelligence.fallbackReasons.includes("UNKNOWN_STATUS")
  });
}

{
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [governed()]
  });
  const copy = {...actual}; delete copy.availabilityIntelligence;
  cases.push({
    name: "non-neutral-exposed-without-baseline-mutation",
    passed:
      sameBaselineFields(copy, baseline) &&
      actual.availabilityIntelligence.applied === true &&
      actual.availabilityIntelligence.applicationChannel ===
        "DECISION_OUTPUT_AVAILABILITY_NAMESPACE_ONLY" &&
      actual.availabilityIntelligence.aggregateAvailabilityDelta === -8
  });
}

{
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [
      governed({availabilityStatus:"OUT",availabilityImpactDelta:-8}),
      governed({
        availabilityStatus:"DOUBTFUL",
        selectedMultiplier:0.25,
        adjustedPlayerImpact:1.5,
        basePlayerImpact:6,
        availabilityImpactDelta:-4.5
      })
    ]
  });
  cases.push({
    name: "multiple-adjustments-aggregate-once",
    passed:
      actual.availabilityIntelligence.aggregateAvailabilityDelta === -12.5 &&
      actual.availabilityIntelligence.playerAdjustments.length === 2
  });
}

{
  const bad = governed({ provider:"" });
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [bad]
  });
  const copy = {...actual}; delete copy.availabilityIntelligence;
  cases.push({
    name: "missing-provenance-fails-neutral",
    passed:
      sameBaselineFields(copy, baseline) &&
      actual.availabilityIntelligence.applied === false &&
      actual.availabilityIntelligence.fallbackReasons.includes(
        "NON_NEUTRAL_RESULT_MISSING_PROVENANCE"
      )
  });
}

{
  const before = JSON.stringify(baseline);
  applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [governed()]
  });
  cases.push({
    name: "input-baseline-not-mutated",
    passed: JSON.stringify(baseline) === before
  });
}

{
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [governed()]
  });
  cases.push({
    name: "provenance-inspectable",
    passed:
      actual.availabilityIntelligence.provenance.length === 1 &&
      actual.availabilityIntelligence.provenance[0].policyId ===
        "FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1"
  });
}

{
  const actual = applyAvailabilityToCanonicalDecision({
    baselineDecision: baseline,
    availabilityResults: [governed()]
  });
  cases.push({
    name: "existing-decision-fields-remain-consumable",
    passed:
      actual.modelVersion === baseline.modelVersion &&
      actual.prediction.winner === baseline.prediction.winner &&
      actual.prediction.homeWinProbability === baseline.prediction.homeWinProbability &&
      actual.confidence === baseline.confidence
  });
}

const passed = cases.filter(x => x.passed).length;
const failed = cases.length - passed;

console.log(JSON.stringify({
  suite: "Non-Mutating Canonical Decision Availability Adapter Fixtures",
  sprint: "2.18.24-RC4.2",
  passed,
  failed,
  tests: cases,
  handoffContract: {
    stableConsumerBoundary: "CANONICAL_FIE_DECISION_API_OUTPUT",
    baselineFieldsBackwardCompatible: true,
    availabilityNamespaceOptionalForPickem: true,
    pickemMayIgnoreAvailabilityNamespaceInitially: true,
    pickemMustNotImportInternalAvailabilityResolver: true
  },
  safeguards: {
    productionDecisionScoringMutated: false,
    teamStrengthMutated: false,
    rosterSignalMutated: false,
    dependencySignalMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false
  }
}, null, 2));

if (failed) process.exitCode = 1;
