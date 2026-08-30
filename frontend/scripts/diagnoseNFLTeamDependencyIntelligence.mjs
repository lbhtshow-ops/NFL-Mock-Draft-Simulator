import assert from "node:assert/strict";

import {
  NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
  resolveNFLPlayerTeamDependencyEvidence,
} from "../src/engines/teamIntelligence/dependency/NFLPlayerTeamDependencyIntelligence.js";

import {
  NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES,
  NFL_TEAM_DEPENDENCY_STATES,
} from "../src/engines/teamIntelligence/dependency/NFLTeamDependencyEvidenceContract.js";

import {
  resolveNFLPlayerImpactIntegratedInputs,
} from "../src/engines/playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error?.message || String(error),
    });
  }
};

const usageEvidence = {
  season: 2025,
  gamesTracked: 13,
  usage: {
    offenseSnapPct: 0.9223076923076925,
    defenseSnapPct: 0,
    specialTeamsSnapPct: 0,
  },
};

const dependency =
  resolveNFLPlayerTeamDependencyEvidence({
    targetSeason: 2026,
    week: 1,
    team: "BAL",
    playerId: "00-0034796",
    playerName: "Lamar Jackson",
    position: "QB",
    usageEvidence,
  });

test("dependency-resolves-from-real-evidence", () =>
  assert.notEqual(
    dependency.dependency,
    NFL_TEAM_DEPENDENCY_STATES.UNKNOWN
  )
);

test("dependency-index-bounded", () =>
  assert.ok(
    typeof dependency.dependencyIndex === "number" &&
    dependency.dependencyIndex >= 0 &&
    dependency.dependencyIndex <= 100
  )
);

test("dependency-methodology-provisional", () =>
  assert.equal(
    dependency.provenance.methodology.state,
    NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES.PROVISIONAL
  )
);

test("dependency-not-production-calibrated", () =>
  assert.equal(
    dependency.provenance.methodology.productionCalibrated,
    false
  )
);

test("dependency-uses-2025-evidence-season", () =>
  assert.equal(
    dependency.provenance.methodology.evidenceSeason,
    2025
  )
);

test("snap-component-preserved", () =>
  assert.equal(
    dependency.components.snapParticipation,
    usageEvidence.usage.offenseSnapPct
  )
);

test("opportunity-share-resolved", () =>
  assert.ok(
    typeof dependency.components.opportunityShare === "number" &&
    dependency.components.opportunityShare > 0
  )
);

test("play-involvement-resolved", () =>
  assert.ok(
    typeof dependency.components.offensivePlayInvolvement === "number" &&
    dependency.components.offensivePlayInvolvement > 0
  )
);

test("team-performance-context-connected", () =>
  assert.equal(
    typeof dependency.components.teamOffenseIndex,
    "number"
  )
);

test("confidence-bounded", () =>
  assert.ok(
    dependency.confidence >= 0 &&
    dependency.confidence <= 1
  )
);

test("dependency-does-not-use-caliber", () =>
  assert.equal(
    JSON.stringify(NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY)
      .toLowerCase()
      .includes("caliber"),
    false
  )
);

test("dependency-does-not-use-replacement-quality", () => {
  const scoringInputs = [
    ...Object.keys(NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.weights || {}),
    ...Object.keys(dependency.components || {}),
  ].join(" ").toLowerCase();
  assert.equal(scoringInputs.includes("replacement"), false);
});

test("dependency-is-not-win-probability", () =>
  assert.match(
    NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.limitations.join(" "),
    /not points, win probability/i
  )
);

const lamar = {
  player: {
    playerId: "e06a9c07-453a-4bb0-a7e9-2c3a64166dad",
    playerName: "Lamar Jackson",
    position: "QB",
  },
  canonicalAvailabilityStatus: "AVAILABLE",
  role: {
    depthPosition: "QB",
    depthRank: 1,
    starter: true,
  },
  evidenceRefs: ["lamar:roster", "lamar:depth"],
};

const huntley = {
  player: {
    playerId: "7c226f73-a59f-4db6-ad98-2766d05d4d5a",
    playerName: "Tyler Huntley",
    position: "QB",
  },
  canonicalAvailabilityStatus: "AVAILABLE",
  role: {
    depthPosition: "QB",
    depthRank: 2,
    starter: false,
  },
  evidenceRefs: ["huntley:roster", "huntley:depth"],
};

const integrated = resolveNFLPlayerImpactIntegratedInputs({
  canonicalAvailabilityPlayer: lamar,
  canonicalAvailabilityRoster: [lamar, huntley],
  season: 2026,
  week: 1,
  team: "BAL",
});

test("integration-resolves-team-dependency", () =>
  assert.notEqual(
    integrated.teamDependencyEvidence.dependency,
    NFL_TEAM_DEPENDENCY_STATES.UNKNOWN
  )
);

test("integration-context-ready", () =>
  assert.equal(integrated.readiness, "READY")
);

test("integration-has-no-missing-dimensions", () =>
  assert.deepEqual(integrated.missingDimensions, [])
);

test("integration-preserves-real-caliber-gap", () => {
  assert.equal(integrated.canonicalCaliber.caliberGrade, 83);
  assert.equal(integrated.replacementCaliber.caliberGrade, 65);
});

test("integration-preserves-usage-evidence", () =>
  assert.ok(
    integrated.usageEvidence.usage.offenseSnapPct > 0.9
  )
);

test("integration-does-not-score-impact", () =>
  assert.equal(
    integrated.safeguards.directImpactScoringInvoked,
    false
  )
);

test("integration-does-not-score-predictions", () =>
  assert.equal(
    integrated.safeguards.predictionScoringInvoked,
    false
  )
);

const passed = tests.filter((item) => item.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "NFL Team Dependency Intelligence V1 Diagnostics",
  passed,
  failed,
  sample: {
    lamar: {
      dependency: dependency.dependency,
      dependencyIndex: dependency.dependencyIndex,
      confidence: dependency.confidence,
      evidenceSeason:
        dependency.provenance.methodology.evidenceSeason,
      components: dependency.components,
      integratedReadiness: integrated.readiness,
      missingDimensions: integrated.missingDimensions,
    },
  },
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
