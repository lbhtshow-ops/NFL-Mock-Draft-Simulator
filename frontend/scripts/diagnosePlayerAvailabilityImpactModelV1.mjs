import assert from "node:assert/strict";

import {
  createCanonicalPlayerCaliberResult,
  PLAYER_CALIBER_SUBJECT_KINDS,
} from "../src/engines/playerEvaluation/caliber/CanonicalPlayerCaliberContract.js";

import {
  createPlayerAvailabilityEvidence,
  PLAYER_AVAILABILITY_STATUSES,
  AVAILABILITY_FRESHNESS_STATES,
} from "../src/engines/playerAvailability/contracts/PlayerAvailabilityEvidenceContract.js";

import {
  PLAYER_ROLE_LEVELS,
  REPLACEMENT_QUALITY_LEVELS,
  TEAM_DEPENDENCY_LEVELS,
  POSITION_IMPORTANCE_LEVELS,
} from "../src/engines/playerAvailability/contracts/PlayerAvailabilityImpactContextContract.js";

import {
  PLAYER_IMPACT_MODEL_STATES,
  validateCanonicalPlayerAvailabilityImpactResult,
} from "../src/engines/playerAvailability/contracts/CanonicalPlayerAvailabilityImpactContract.js";

import {
  validatePlayerAvailabilityImpactMethodologyProfile,
} from "../src/engines/playerAvailability/methodology/PlayerAvailabilityImpactMethodologyContract.js";

import {
  NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE,
} from "../src/engines/playerAvailability/methodology/NFLPlayerAvailabilityImpactMethodologyV1.js";

import {
  getCanonicalPlayerAvailabilityImpact,
} from "../src/engines/playerAvailability/CanonicalPlayerAvailabilityImpactService.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error?.message || String(error) });
  }
};

const caliber = createCanonicalPlayerCaliberResult({
  subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
  playerId: "nfl:test:qb1",
  displayName: "Test QB1",
  position: "QB",
  available: true,
  caliberGrade: 95,
  confidence: 0.9,
  evidenceLevel: "STRONG",
  readiness: "AVAILABLE",
  provenance: { contributors: [{ source: "diagnostic" }] },
});

const context = {
  role: PLAYER_ROLE_LEVELS.PRIMARY,
  replacementQuality: REPLACEMENT_QUALITY_LEVELS.AVERAGE,
  teamDependency: TEAM_DEPENDENCY_LEVELS.VERY_HIGH,
  positionImportance: POSITION_IMPORTANCE_LEVELS.VERY_HIGH,
  offensiveSnapShare: 0.98,
  defensiveSnapShare: 0,
  specialTeamsSnapShare: 0,
};

const evidence = (status) =>
  createPlayerAvailabilityEvidence({
    playerId: "nfl:test:qb1",
    status,
    reason: "diagnostic",
    confidence: 0.88,
    evidenceLevel: "STRONG",
    dataState: "AVAILABLE",
    freshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
    observedAt: "2026-08-15T00:00:00Z",
  });

const result = (status, impactContext = context) =>
  getCanonicalPlayerAvailabilityImpact({
    player: { id: "nfl:test:qb1", name: "Test QB1", position: "QB" },
    canonicalCaliber: caliber,
    availabilityEvidence: evidence(status),
    impactContext,
    impactMethodologyProfile: NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE,
  });

const available = result(PLAYER_AVAILABILITY_STATUSES.AVAILABLE);
const questionable = result(PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE);
const out = result(PLAYER_AVAILABILITY_STATUSES.OUT);
const backupOut = result(PLAYER_AVAILABILITY_STATUSES.OUT, {
  ...context,
  role: PLAYER_ROLE_LEVELS.BACKUP,
  teamDependency: TEAM_DEPENDENCY_LEVELS.LOW,
  offensiveSnapShare: 0.1,
});

test("candidate-profile-valid", () =>
  assert.equal(validatePlayerAvailabilityImpactMethodologyProfile(
    NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE,
    { requireApproved: false },
  ).valid, true)
);

test("candidate-profile-not-production-approved", () =>
  assert.equal(NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.state, "VALIDATED")
);

test("candidate-score-is-provisional", () =>
  assert.equal(out.impact.modelState, PLAYER_IMPACT_MODEL_STATES.PROVISIONAL)
);

test("provisional-contract-valid", () =>
  assert.equal(validateCanonicalPlayerAvailabilityImpactResult(out).valid, true)
);

test("available-player-has-zero-degradation", () =>
  assert.equal(available.impact.overallImpact, 0)
);

test("questionable-between-available-and-out", () =>
  assert.ok(
    questionable.impact.overallImpact > available.impact.overallImpact &&
    questionable.impact.overallImpact < out.impact.overallImpact
  )
);

test("out-primary-qb-has-material-provisional-impact", () =>
  assert.ok(out.impact.overallImpact > 50)
);

test("primary-qb-out-exceeds-backup-out", () =>
  assert.ok(out.impact.overallImpact > backupOut.impact.overallImpact)
);

test("impact-confidence-bounded", () =>
  assert.ok(out.impact.confidence >= 0 && out.impact.confidence <= 1)
);

test("methodology-identity-preserved", () =>
  assert.equal(
    out.impact.methodology?.profileId,
    "lbht:nfl-player-availability-impact:v1"
  )
);

test("profile-declares-not-production-calibrated", () =>
  assert.equal(
    NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.calibration?.validationMetrics?.productionCalibrated,
    false
  )
);

test("scale-is-not-win-probability", () =>
  assert.match(
    String(out.impact.methodology?.scale?.semantics || ""),
    /not points, win probability/i
  )
);

test("no-direct-win-probability-output", () =>
  assert.equal("winProbability" in out.impact, false)
);

test("no-direct-team-score-output", () =>
  assert.equal("teamStrengthAdjustment" in out.impact, false)
);

test("available-score-remains-provisional-not-modeled", () =>
  assert.equal(available.impact.modelState, PLAYER_IMPACT_MODEL_STATES.PROVISIONAL)
);

test("missing-profile-remains-unmodeled", () => {
  const noProfile = getCanonicalPlayerAvailabilityImpact({
    player: { id: "nfl:test:qb1", name: "Test QB1", position: "QB" },
    canonicalCaliber: caliber,
    availabilityEvidence: evidence(PLAYER_AVAILABILITY_STATUSES.OUT),
    impactContext: context,
  });
  assert.equal(noProfile.impact.modelState, PLAYER_IMPACT_MODEL_STATES.UNMODELED);
  assert.equal(noProfile.impact.overallImpact, null);
});

test("production-modeled-state-reserved-for-approved-profile", () =>
  assert.notEqual(out.impact.modelState, PLAYER_IMPACT_MODEL_STATES.MODELED)
);

test("candidate-preserves-independent-dimensions", () => {
  const f = out.impact.featureVector?.features || {};
  for (const key of [
    "CALIBER",
    "ROLE",
    "REPLACEMENT_GAP",
    "TEAM_DEPENDENCY",
    "POSITION_IMPORTANCE",
    "SNAP_SHARE",
  ]) assert.equal(typeof f[key], "number");
});

const passed = tests.filter((t) => t.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Player Availability & Impact Model V1 Diagnostics",
  passed,
  failed,
  profile: {
    profileId: NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.profileId,
    profileVersion: NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.profileVersion,
    state: NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.state,
    productionCalibrated:
      NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE.calibration?.validationMetrics?.productionCalibrated,
  },
  samples: {
    available: available.impact.overallImpact,
    questionable: questionable.impact.overallImpact,
    outPrimaryQB: out.impact.overallImpact,
    outBackup: backupOut.impact.overallImpact,
  },
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
