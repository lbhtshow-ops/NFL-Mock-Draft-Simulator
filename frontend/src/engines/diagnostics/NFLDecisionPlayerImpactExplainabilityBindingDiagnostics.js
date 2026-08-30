import assert from "node:assert/strict";

import {
  NFL_DECISION_PLAYER_IMPACT_EXPLAINABILITY_GOVERNANCE as G,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLDecisionPlayerImpactExplainabilityGovernance.js";

import {
  projectCanonicalPlayerImpactExplainability,
} from "../gameDecisionSupport/canonical/NFLDecisionPlayerImpactExplainabilityProjection.js";

import {
  extendCanonicalDecisionAvailabilityExplainability,
} from "../gameDecisionSupport/canonical/NFLDecisionAvailabilityExplainabilityAdapter.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const integratedInputs = {
  contract: "NFLPlayerImpactIntegratedInputs",
  version: "FIE-NFL-PLAYER-IMPACT-INPUT-INTEGRATION-1.1.0",
  player: {
    playerId: "00-TEST-1",
    playerName: "Canonical Player",
    team: "BAL",
    position: "QB",
  },
  canonicalCaliber: {
    version: "FIE-NFL-PLAYER-CALIBER-1.0.0",
    tier: "ELITE",
  },
  replacement: {
    playerId: "00-TEST-2",
    playerName: "Replacement Player",
  },
  replacementCaliber: {
    version: "FIE-NFL-PLAYER-CALIBER-1.0.0",
    tier: "STARTER",
  },
  teamDependencyEvidence: {
    version: "FIE-NFL-TEAM-DEPENDENCY-EVIDENCE-1.0.0",
    dependency: "VERY_HIGH",
  },
  contextResolution: {
    role: {
      role: "STARTER",
      position: "QB",
      positionImportance: "PREMIUM",
    },
    replacementGap: 12,
  },
};

const availabilityResult = {
  contractVersion:
    "FIE-NFL-BOUNDED-AVAILABILITY-POLICY-RESOLVER-1.0.0",
  policyId: "FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1",
  policyVersion: "1.0.0",
  availabilityStatus: "OUT",
  basePlayerImpact: 8,
  adjustedPlayerImpact: 0,
  availabilityImpactDelta: -8,
};

const projection =
  projectCanonicalPlayerImpactExplainability({
    integratedInputs,
    availabilityResult,
  });

test("governance-contract", () =>
  assert.equal(
    G.contractVersion,
    "FIE-NFL-DECISION-PLAYER-IMPACT-EXPLAINABILITY-GOVERNANCE-1.0.0"
  ));

test("all-requested-fields", () => {
  for (const field of G.requestedFields) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(projection, field),
      `missing ${field}`
    );
  }
});

test("player-id", () =>
  assert.equal(projection.playerId, "00-TEST-1"));
test("player-name", () =>
  assert.equal(projection.playerName, "Canonical Player"));
test("team", () => assert.equal(projection.team, "BAL"));
test("position", () => assert.equal(projection.position, "QB"));
test("role", () => assert.equal(projection.role, "STARTER"));
test("availability-status", () =>
  assert.equal(projection.availabilityStatus, "OUT"));
test("player-caliber-tier", () =>
  assert.equal(projection.playerCaliberTier, "ELITE"));
test("replacement-id", () =>
  assert.equal(
    projection.expectedReplacementPlayerId,
    "00-TEST-2"
  ));
test("replacement-name", () =>
  assert.equal(
    projection.expectedReplacementName,
    "Replacement Player"
  ));
test("replacement-caliber-tier", () =>
  assert.equal(
    projection.expectedReplacementCaliberTier,
    "STARTER"
  ));
test("replacement-gap", () =>
  assert.equal(projection.replacementGap, 12));
test("team-dependency", () =>
  assert.equal(projection.teamDependency, "VERY_HIGH"));
test("position-importance", () =>
  assert.equal(projection.positionImportance, "PREMIUM"));
test("base-impact", () =>
  assert.equal(projection.basePlayerImpact, 8));
test("adjusted-impact", () =>
  assert.equal(projection.adjustedPlayerImpact, 0));
test("availability-delta", () =>
  assert.equal(projection.availabilityImpactDelta, -8));
test("policy-version", () =>
  assert.equal(projection.policyVersion, "1.0.0"));

test("null-preservation", () => {
  const empty =
    projectCanonicalPlayerImpactExplainability({});
  for (const field of G.requestedFields) {
    assert.equal(empty[field], null, `${field} not null`);
  }
});

test("no-caliber-inference", () =>
  assert.equal(
    projection.safeguards.caliberInferredByAdapter,
    false
  ));
test("no-replacement-inference", () =>
  assert.equal(
    projection.safeguards.replacementQualityInferredByAdapter,
    false
  ));
test("no-gap-calculation", () =>
  assert.equal(
    projection.safeguards.replacementGapCalculatedByAdapter,
    false
  ));
test("no-impact-recalculation", () =>
  assert.equal(
    projection.safeguards.playerImpactRecalculatedByAdapter,
    false
  ));
test("no-availability-reapplication", () =>
  assert.equal(
    projection.safeguards.availabilityMathReappliedByAdapter,
    false
  ));

test("missing-availability-is-noop", () => {
  const baseline = { favorite: "BAL", expectedHomeMargin: 3.5 };
  const result =
    extendCanonicalDecisionAvailabilityExplainability({
      baselineDecision: baseline,
    });
  assert.equal(result, baseline);
});

test("baseline-fields-preserved", () => {
  const baseline = {
    favorite: "BAL",
    expectedHomeMargin: 3.5,
    confidence: 0.7,
    availabilityIntelligence: {
      status: "AVAILABLE",
      applied: false,
      applicationChannel: null,
      playerAdjustments: [],
      aggregateAvailabilityDelta: 0,
      provenance: {},
      fallbackReasons: [],
      policyVersion: "1.0.0",
    },
  };

  const result =
    extendCanonicalDecisionAvailabilityExplainability({
      baselineDecision: baseline,
      playerContexts: [
        { integratedInputs, availabilityResult },
      ],
    });

  assert.equal(result.favorite, baseline.favorite);
  assert.equal(
    result.expectedHomeMargin,
    baseline.expectedHomeMargin
  );
  assert.equal(result.confidence, baseline.confidence);
  assert.equal(
    result.availabilityIntelligence.status,
    "AVAILABLE"
  );
  assert.equal(
    result.availabilityIntelligence.aggregateAvailabilityDelta,
    0
  );
  assert.equal(
    result.availabilityIntelligence.playerAdjustments.length,
    1
  );
});

test("existing-adjustments-preserved-without-new-context", () => {
  const existing = [{ legacy: true }];
  const baseline = {
    availabilityIntelligence: {
      playerAdjustments: existing,
    },
  };
  const result =
    extendCanonicalDecisionAvailabilityExplainability({
      baselineDecision: baseline,
      playerContexts: [],
    });
  assert.deepEqual(
    result.availabilityIntelligence.playerAdjustments,
    existing
  );
});

test("production-execution-locked", () =>
  assert.equal(
    G.authorizationBoundary.productionAdapterExecutionAuthorized,
    false
  ));
test("player-impact-production-locked", () =>
  assert.equal(
    G.authorizationBoundary.playerImpactProductionActivationAuthorized,
    false
  ));
test("team-strength-locked", () =>
  assert.equal(
    G.authorizationBoundary.teamStrengthMutationAuthorized,
    false
  ));
test("decision-scoring-locked", () =>
  assert.equal(
    G.authorizationBoundary.decisionScoringMutationAuthorized,
    false
  ));
test("pickem-scoring-locked", () =>
  assert.equal(
    G.authorizationBoundary.pickemScoringMutationAuthorized,
    false
  ));

const passed = tests.filter((t) => t.passed).length;
const failed = tests.length - passed;

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Decision Player Impact Explainability Binding Diagnostics",
      sprint: "2D.5B",
      status: failed ? "FAIL" : "PASS",
      passed,
      failed,
      tests,
      sampleProjection: projection,
      authorizationBoundary: G.authorizationBoundary,
    },
    null,
    2
  )
);

if (failed) process.exitCode = 1;
