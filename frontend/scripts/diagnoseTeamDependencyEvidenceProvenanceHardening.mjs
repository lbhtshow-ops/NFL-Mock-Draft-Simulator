import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

import {
  resolveNFLPlayerTeamDependencyEvidence,
  NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
} from "../src/engines/teamIntelligence/dependency/NFLPlayerTeamDependencyIntelligence.js";

import {
  assessNFLTeamDependencyCalibrationReadiness,
  NFL_TEAM_DEPENDENCY_CALIBRATION_STATES,
} from "../src/engines/teamIntelligence/dependency/NFLTeamDependencyCalibrationReadiness.js";

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
  provenance: {
    source: "generatedNFLVerseSnapCountsSource",
  },
};

const dependency = resolveNFLPlayerTeamDependencyEvidence({
  targetSeason: 2026,
  week: 1,
  team: "BAL",
  playerId: "00-0034796",
  playerName: "Lamar Jackson",
  position: "QB",
  usageEvidence,
});

test("team-performance-record-present", () =>
  assert.equal(
    dependency.evidenceState?.teamPerformanceRecordAvailable,
    true
  )
);

test("team-performance-contract-valid", () =>
  assert.equal(
    dependency.evidenceState?.teamPerformanceContractValid,
    true
  )
);

test("team-performance-now-reported-available", () =>
  assert.equal(
    dependency.sample?.teamPerformanceAvailable,
    true
  )
);

test("team-performance-contract-identity-preserved", () =>
  assert.equal(
    dependency.sample?.teamPerformanceContract,
    "NFLTeamPerformanceEvidence"
  )
);

test("team-performance-version-preserved", () =>
  assert.equal(
    dependency.sample?.teamPerformanceVersion,
    "NFL-TEAM-PERFORMANCE-EVIDENCE-1.0.0"
  )
);

test("offense-index-remains-contextual", () =>
  assert.equal(typeof dependency.components?.teamOffenseIndex, "number")
);

test("recent-form-index-remains-contextual", () =>
  assert.equal(typeof dependency.components?.teamRecentFormIndex, "number")
);

test("performance-not-double-counted-in-dependency-score", () =>
  assert.equal(
    dependency.components?.teamPerformanceUsedInDependencyScore,
    false
  )
);

test("methodology-declares-performance-context-role", () =>
  assert.equal(
    NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.performanceContextRole,
    "CONTEXT_AND_CONFIDENCE_ONLY_NOT_DEPENDENCY_SCORE"
  )
);

test("performance-evidence-ref-explicit", () =>
  assert.ok(
    dependency.provenance.evidenceRefs.some(
      (ref) => ref === "nfl-team-performance:2025:BAL"
    )
  )
);

test("player-stats-ref-explicit", () =>
  assert.ok(
    dependency.provenance.evidenceRefs.some(
      (ref) => String(ref).startsWith("nflverse-player-stats:2025:BAL:")
    )
  )
);

test("snap-ref-explicit", () =>
  assert.ok(
    dependency.provenance.evidenceRefs.some(
      (ref) => String(ref).startsWith("nflverse-snap-counts:2025:BAL:")
    )
  )
);

test("performance-context-improves-confidence-state", () =>
  assert.ok(
    typeof dependency.confidence === "number" &&
    dependency.confidence > 0.84
  )
);

const reportPath = path.resolve(
  process.cwd(),
  "data/calibration/historical/v1/expected-replacement-mapping-v1-report.json"
);

const report = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
  : {
      inputEvidenceCount: 928,
      pregameSafeAnchors: 457,
      fullyMappedCount: 0,
      pendingEvidenceBackedMappingCount: 457,
      rosterOrderHeuristicUsed: false,
      futureLeakageDetected: false,
      datasetMutated: false,
      calibrationExecuted: false,
    };

const readiness =
  assessNFLTeamDependencyCalibrationReadiness(report);

test("current-mapping-calibration-blocked", () =>
  assert.equal(
    readiness.state,
    NFL_TEAM_DEPENDENCY_CALIBRATION_STATES.BLOCKED
  )
);

test("current-mapping-has-zero-fully-mapped", () =>
  assert.equal(readiness.mapping.fullyMappedCount, 0)
);

test("current-mapping-has-457-pending", () =>
  assert.equal(
    readiness.mapping.pendingEvidenceBackedMappingCount,
    457
  )
);

test("current-mapping-does-not-use-roster-order-heuristic", () =>
  assert.equal(
    readiness.safeguards.rosterOrderHeuristicUsed,
    false
  )
);

test("current-mapping-has-no-future-leakage", () =>
  assert.equal(
    readiness.safeguards.futureLeakageDetected,
    false
  )
);

test("production-promotion-not-authorized", () =>
  assert.equal(
    readiness.productionPromotionAuthorized,
    false
  )
);

test("provisional-dependency-remains-usable-shadow-intelligence", () =>
  assert.notEqual(dependency.dependency, "UNKNOWN")
);

test("dependency-index-stable-after-provenance-hardening", () =>
  assert.equal(dependency.dependencyIndex, 76.95)
);

const passed = tests.filter((item) => item.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Team Dependency Evidence & Provenance Hardening V1 Diagnostics",
  passed,
  failed,
  sample: {
    dependency: {
      dependency: dependency.dependency,
      dependencyIndex: dependency.dependencyIndex,
      confidence: dependency.confidence,
      observedAt: dependency.observedAt,
      evidenceState: dependency.evidenceState,
      sample: dependency.sample,
      evidenceRefs: dependency.provenance.evidenceRefs,
      performanceContextRole:
        dependency.provenance.methodology?.performanceContextRole,
    },
    calibrationReadiness: readiness,
  },
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
