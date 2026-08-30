import {
  createNFLPlayerRoleEvidence,
} from "../../data/footballIntelligence/nfl/roles/NFLPlayerRoleEvidenceContract.js";

import {
  enrichNFLRosterWithRoleEvidence,
} from "../playerAvailability/NFLPlayerRoleEnrichmentEngine.js";

import {
  evaluateNFLPlayerAvailabilityImpact,
} from "../playerAvailability/NFLPlayerAvailabilityImpactEngine.js";

import {
  evaluateAvailabilityCalibration,
} from "../playerAvailability/NFLAvailabilityCalibrationEngine.js";

import {
  compareNFLTeamAvailability,
} from "../playerAvailability/NFLAvailabilityChangeComparator.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [];

function check(name, fn) {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message,
    });
  }
}

const roster = [
  {
    playerId: "qb1",
    identity: {
      playerName: "Quarterback One",
      position: "QB",
    },
    evaluation: {
      rosterValue: 94,
    },
    roster: {},
  },
  {
    playerId: "qb2",
    identity: {
      playerName: "Quarterback Two",
      position: "QB",
    },
    evaluation: {
      rosterValue: 68,
    },
    roster: {},
  },
  {
    playerId: "wr1",
    identity: {
      playerName: "Receiver One",
      position: "WR",
    },
    evaluation: {
      rosterValue: 88,
    },
    roster: {},
  },
];

const roles = [
  createNFLPlayerRoleEvidence({
    season: 2026,
    week: 1,
    team: "BAL",
    playerId: "qb1",
    playerName: "Quarterback One",
    position: "QB",
    depthPosition: "QB",
    depthRank: 1,
    offenseSnapPct: 0.97,
  }),
  createNFLPlayerRoleEvidence({
    season: 2026,
    week: 1,
    team: "BAL",
    playerId: "qb2",
    playerName: "Quarterback Two",
    position: "QB",
    depthPosition: "QB",
    depthRank: 2,
    offenseSnapPct: 0.03,
  }),
  createNFLPlayerRoleEvidence({
    season: 2026,
    week: 1,
    team: "BAL",
    playerId: "wr1",
    playerName: "Receiver One",
    position: "WR",
    offenseSnapPct: 0.86,
  }),
];

const enriched =
  enrichNFLRosterWithRoleEvidence({
    roster,
    roleEvidence: roles,
  });

check("depth-chart-identifies-qb1", () => {
  const qb1 =
    enriched.find(
      (player) =>
        player.playerId === "qb1"
    );

  assert(
    qb1.roster.roleEvidence.role === "QB1",
    "QB1 was not identified from depth chart."
  );

  assert(
    qb1.roster.roleEvidence.confidence >= 0.9,
    "QB1 role confidence too low."
  );
});

check("snap-usage-identifies-starter", () => {
  const wr1 =
    enriched.find(
      (player) =>
        player.playerId === "wr1"
    );

  assert(
    wr1.roster.roleEvidence.role === "STARTER",
    "High-snap WR should be inferred as starter."
  );
});

check("enriched-role-affects-impact", () => {
  const qb1 =
    enriched.find(
      (player) =>
        player.playerId === "qb1"
    );

  const qb2 =
    enriched.find(
      (player) =>
        player.playerId === "qb2"
    );

  const impact =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      replacementPlayer: qb2,
      evidence: {
        player: {
          playerId: "qb1",
          playerName: "Quarterback One",
          position: "QB",
        },
        injury: {
          primary: "Diagnostic",
          secondary: null,
        },
        status: {
          report: "OUT",
          practice: "UNKNOWN",
        },
      },
    });

  assert(
    impact.player.role === "QB1",
    "Availability impact did not consume enriched role."
  );

  assert(
    impact.adjustment <= -8,
    "Enriched QB1 OUT impact should remain material."
  );
});

check("calibration-report-is-non-authoritative", () => {
  const report =
    evaluateAvailabilityCalibration([
      {
        position: "QB",
        predicted: -10,
        observed: -8,
      },
      {
        position: "QB",
        predicted: -6,
        observed: -7,
      },
    ]);

  assert(
    report.calibrated === false,
    "Small diagnostic sample must not be marked calibrated."
  );

  assert(
    report.samples === 2,
    "Calibration sample count incorrect."
  );
});

check("calibration-computes-mae", () => {
  const report =
    evaluateAvailabilityCalibration([
      {
        position: "QB",
        predicted: -10,
        observed: -8,
      },
      {
        position: "WR",
        predicted: -4,
        observed: -5,
      },
    ]);

  assert(
    Math.abs(report.meanAbsoluteError - 1.5) < 0.000001,
    "Calibration MAE incorrect."
  );
});

check("availability-change-detects-delta", () => {
  const result =
    compareNFLTeamAvailability(
      {
        adjustment: -2,
        impacts: [
          {
            player: {
              playerId: "qb1",
              playerName: "Quarterback One",
            },
            adjustment: -2,
            availability: {
              status: "QUESTIONABLE",
            },
          },
        ],
      },
      {
        adjustment: -10,
        impacts: [
          {
            player: {
              playerId: "qb1",
              playerName: "Quarterback One",
            },
            adjustment: -10,
            availability: {
              status: "OUT",
            },
          },
        ],
      }
    );

  assert(
    result.changed === true,
    "Availability change was not detected."
  );

  assert(
    result.teamDelta === -8,
    "Team availability delta incorrect."
  );

  assert(
    result.changes[0].currentStatus === "OUT",
    "Current availability status missing."
  );
});

const failed =
  tests.filter((test) => !test.passed);

console.log(JSON.stringify({
  suite:
    "NFL Availability Calibration & Role Enrichment V1 Diagnostics",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
