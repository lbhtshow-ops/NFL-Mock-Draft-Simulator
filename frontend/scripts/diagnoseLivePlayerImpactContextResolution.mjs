import assert from "node:assert/strict";

import {
  resolveNFLPlayerAvailabilityImpactContext,
  NFL_PLAYER_IMPACT_CONTEXT_READINESS,
} from "../src/engines/playerAvailability/context/NFLPlayerAvailabilityImpactContextResolver.js";

import {
  PLAYER_ROLE_LEVELS,
  REPLACEMENT_QUALITY_LEVELS,
  TEAM_DEPENDENCY_LEVELS,
  POSITION_IMPORTANCE_LEVELS,
} from "../src/engines/playerAvailability/contracts/PlayerAvailabilityImpactContextContract.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error?.message || String(error) });
  }
};

const lamar = {
  player: {
    playerId: "lamar",
    playerName: "Lamar Jackson",
    position: "QB",
  },
  canonicalAvailabilityStatus: "AVAILABLE",
  role: {
    depthPosition: "QB",
    depthRank: 1,
    starter: true,
  },
  evidenceRefs: ["obs:lamar:depth", "obs:lamar:roster"],
};

const huntley = {
  player: {
    playerId: "huntley",
    playerName: "Tyler Huntley",
    position: "QB",
  },
  canonicalAvailabilityStatus: "AVAILABLE",
  role: {
    depthPosition: "QB",
    depthRank: 2,
    starter: false,
  },
  evidenceRefs: ["obs:huntley:depth", "obs:huntley:roster"],
};

const partial = resolveNFLPlayerAvailabilityImpactContext({
  canonicalAvailabilityPlayer: lamar,
  canonicalAvailabilityRoster: [lamar, huntley],
});

test("live-depth-chart-identifies-primary-qb-role", () =>
  assert.equal(partial.context.role, PLAYER_ROLE_LEVELS.PRIMARY)
);

test("live-depth-chart-identifies-qb2-replacement", () =>
  assert.equal(partial.replacement?.playerId, "huntley")
);

test("qb-position-importance-is-explicit", () =>
  assert.equal(
    partial.context.positionImportance,
    POSITION_IMPORTANCE_LEVELS.VERY_HIGH
  )
);

test("no-caliber-does-not-fabricate-replacement-quality", () =>
  assert.equal(
    partial.context.replacementQuality,
    REPLACEMENT_QUALITY_LEVELS.UNKNOWN
  )
);

test("no-team-model-does-not-fabricate-dependency", () =>
  assert.equal(
    partial.context.teamDependency,
    TEAM_DEPENDENCY_LEVELS.UNKNOWN
  )
);

test("starter-does-not-fabricate-snap-share", () =>
  assert.equal(partial.context.offensiveSnapShare, null)
);

test("partial-context-is-explicit", () =>
  assert.equal(
    partial.readiness,
    NFL_PLAYER_IMPACT_CONTEXT_READINESS.PARTIAL
  )
);

test("partial-context-reports-caliber-gap", () =>
  assert.ok(partial.missingDimensions.includes("canonicalCaliber"))
);

test("partial-context-reports-team-dependency-gap", () =>
  assert.ok(partial.missingDimensions.includes("teamDependency"))
);

test("partial-context-reports-snap-share-gap", () =>
  assert.ok(partial.missingDimensions.includes("snapShare"))
);

const withInputs = resolveNFLPlayerAvailabilityImpactContext({
  canonicalAvailabilityPlayer: lamar,
  canonicalAvailabilityRoster: [lamar, huntley],
  canonicalCaliber: {
    caliberGrade: 96,
    evidenceRefs: ["caliber:lamar"],
    sourceEvaluation: { engine: "CanonicalNFLPlayerEvaluationService" },
  },
  replacementCaliber: {
    caliberGrade: 72,
    evidenceRefs: ["caliber:huntley"],
    sourceEvaluation: { engine: "CanonicalNFLPlayerEvaluationService" },
  },
  roleEvidence: {
    usage: {
      offenseSnapPct: 0.98,
      defenseSnapPct: null,
      specialTeamsSnapPct: 0,
    },
    provenance: { source: "authorized-role-evidence" },
  },
  teamDependency: TEAM_DEPENDENCY_LEVELS.VERY_HIGH,
});

test("caliber-gap-resolves-replacement-quality", () =>
  assert.equal(
    withInputs.context.replacementQuality,
    REPLACEMENT_QUALITY_LEVELS.REPLACEMENT_LEVEL
  )
);

test("authorized-role-evidence-preserves-snap-share", () =>
  assert.equal(withInputs.context.offensiveSnapShare, 0.98)
);

test("supplied-team-dependency-preserved", () =>
  assert.equal(
    withInputs.context.teamDependency,
    TEAM_DEPENDENCY_LEVELS.VERY_HIGH
  )
);

test("complete-context-becomes-ready", () =>
  assert.equal(
    withInputs.readiness,
    NFL_PLAYER_IMPACT_CONTEXT_READINESS.READY
  )
);

test("context-preserves-replacement-id", () =>
  assert.equal(withInputs.context.replacementPlayerId, "huntley")
);

test("context-preserves-evidence-provenance", () =>
  assert.ok(withInputs.context.evidenceRefs.length >= 4)
);

test("resolver-does-not-output-impact-score", () =>
  assert.equal("overallImpact" in withInputs, false)
);

test("resolver-does-not-output-win-probability", () =>
  assert.equal("winProbability" in withInputs, false)
);

test("missing-player-fails-explicitly", () => {
  const missing =
    resolveNFLPlayerAvailabilityImpactContext({});
  assert.equal(
    missing.readiness,
    NFL_PLAYER_IMPACT_CONTEXT_READINESS.UNAVAILABLE
  );
});

const passed = tests.filter((t) => t.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Live Player Impact Context Resolution V1 Diagnostics",
  passed,
  failed,
  samples: {
    partial: {
      readiness: partial.readiness,
      role: partial.context.role,
      replacement: partial.replacement,
      positionImportance: partial.context.positionImportance,
      replacementQuality: partial.context.replacementQuality,
      teamDependency: partial.context.teamDependency,
      offensiveSnapShare: partial.context.offensiveSnapShare,
      missingDimensions: partial.missingDimensions,
    },
    complete: {
      readiness: withInputs.readiness,
      replacementQuality: withInputs.context.replacementQuality,
      teamDependency: withInputs.context.teamDependency,
      offensiveSnapShare: withInputs.context.offensiveSnapShare,
    },
  },
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
