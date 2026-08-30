import assert from "node:assert/strict";

import {
  integrateNFLPlayerImpactIntoTeamStrengthShadow,
} from "../src/engines/teamIntelligence/strength/integration/NFLPlayerImpactTeamStrengthShadowIntegration.js";

import {
  validateNFLPlayerImpactTeamStrengthShadowResult,
} from "../src/engines/teamIntelligence/strength/integration/NFLPlayerImpactTeamStrengthShadowContract.js";

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

const baseline = {
  contract: "NFLTeamStrengthResult",
  version: "NFL-TEAM-STRENGTH-V1.0.0",
  teamAbbreviation: "BAL",
  targetSeason: 2026,
  phaseScope: "ALL",
  state: "AVAILABLE",
  overallStrength: 74.25,
  confidence: 0.81,
  mode: "PRIOR_ONLY",
  sampleMaturity: {
    state: "NO_CURRENT_SAMPLE",
    reliability: 0,
    priorRequired: true,
  },
  current: null,
  prior: {
    season: 2025,
    gamesPlayed: 17,
    strength: 74.25,
  },
};

const availabilityEvidence = {
  teamAbbreviation: "BAL",
  players: [
    {
      playerId: "lamar",
      displayName: "Lamar Jackson",
      position: "QB",
      availability: {
        status: "OUT",
        evidenceRefs: ["availability:lamar"],
        sourceRefs: ["source:official"],
      },
      caliber: {
        caliberGrade: 83,
      },
      impactContext: {
        role: "PRIMARY",
        replacementPlayerId: "huntley",
        replacementQuality: "REPLACEMENT_LEVEL",
        teamDependency: "VERY_HIGH",
        positionImportance: "VERY_HIGH",
        offensiveSnapShare: 0.9223,
      },
      impact: {
        modelState: "MODELED",
        overallImpact: 90.36,
        confidence: 0.86,
        methodology: {
          profileId: "PROVISIONAL",
          profileVersion: "1.0.0",
        },
      },
      readiness: "READY",
    },
  ],
};

const result = integrateNFLPlayerImpactIntoTeamStrengthShadow({
  team: "BAL",
  targetSeason: 2026,
  teamStrength: baseline,
  availabilityEvidence,
});

test("canonical-shadow-contract", () =>
  assert.equal(
    result.contract,
    "NFLPlayerImpactTeamStrengthShadowIntegration"
  )
);

test("shadow-mode-only", () =>
  assert.equal(result.mode, "SHADOW_ONLY")
);

test("baseline-strength-preserved", () =>
  assert.equal(result.baseline.performanceStrength, 74.25)
);

test("baseline-source-preserved", () =>
  assert.equal(result.baseline.sourceContract, "NFLTeamStrengthResult")
);

test("modeled-player-impact-connected", () =>
  assert.equal(result.availabilityModifierEvidence.modeledPlayerCount, 1)
);

test("lamar-impact-preserved-not-transformed", () =>
  assert.equal(
    result.availabilityModifierEvidence.players[0].overallImpact,
    90.36
  )
);

test("lamar-dependency-preserved", () =>
  assert.equal(
    result.availabilityModifierEvidence.players[0].teamDependency,
    "VERY_HIGH"
  )
);

test("replacement-context-preserved", () =>
  assert.equal(
    result.availabilityModifierEvidence.players[0].replacementPlayerId,
    "huntley"
  )
);

test("numeric-delta-remains-null", () =>
  assert.equal(result.shadowAdjustment.numericDelta, null)
);

test("adjusted-strength-remains-null", () =>
  assert.equal(result.shadowAdjustment.adjustedTeamStrength, null)
);

test("shadow-adjustment-unauthorized", () =>
  assert.equal(result.shadowAdjustment.authorized, false)
);

test("calibration-blocker-explicit", () =>
  assert.ok(result.blockers.includes("CALIBRATION_REQUIRED"))
);

test("injury-calibration-required", () =>
  assert.equal(
    result.calibration.injuryAvailabilityCalibrationRequired,
    true
  )
);

test("replacement-sensitivity-validation-required", () =>
  assert.equal(
    result.calibration.positionAndReplacementSensitivityValidationRequired,
    true
  )
);

test("current-strength-output-not-authorized", () =>
  assert.equal(result.calibration.currentStrengthAuthorized, false)
);

test("win-probability-remains-null", () =>
  assert.equal(result.outputs.winProbability, null)
);

test("point-spread-remains-null", () =>
  assert.equal(result.outputs.pointSpread, null)
);

test("pick-recommendation-remains-null", () =>
  assert.equal(result.outputs.pickRecommendation, null)
);

test("pickem-adjustment-remains-null", () =>
  assert.equal(result.outputs.pickemAdjustment, null)
);

test("player-impact-not-treated-as-strength-points", () =>
  assert.equal(
    result.safeguards.playerImpactTreatedAsStrengthPoints,
    false
  )
);

test("no-uncalibrated-availability-weight", () =>
  assert.equal(
    result.safeguards.uncalibratedAvailabilityWeightIntroduced,
    false
  )
);

test("existing-performance-formula-not-mutated", () =>
  assert.equal(
    result.safeguards.existingPerformanceStrengthFormulaMutated,
    false
  )
);

test("contract-validation-passes", () => {
  const validation =
    validateNFLPlayerImpactTeamStrengthShadowResult(result);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

const passed = tests.filter((item) => item.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Player Impact -> Team Strength Shadow Integration V1 Diagnostics",
  passed,
  failed,
  sample: result,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
