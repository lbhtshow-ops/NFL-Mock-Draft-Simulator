import {
  createNFLPlayerAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityEvidenceContract.js";

import {
  evaluateNFLPlayerAvailabilityImpact,
} from "../playerAvailability/NFLPlayerAvailabilityImpactEngine.js";

import {
  buildNFLTeamAvailabilityImpactFromInputs,
} from "../playerAvailability/NFLTeamAvailabilityImpactEngine.js";

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

function player({
  id,
  name,
  position,
  starter = false,
  depth = null,
  value = null,
}) {
  return {
    playerId: id,
    identity: {
      playerName: name,
      position,
    },
    roster: {
      starter,
      depthChartRank: depth,
    },
    evaluation: {
      rosterValue: value,
    },
  };
}

function evidence({
  id,
  name,
  position,
  reportStatus,
  practiceStatus = null,
}) {
  return createNFLPlayerAvailabilityEvidence({
    season: 2026,
    week: 1,
    team: "BAL",
    playerId: id,
    playerName: name,
    position,
    reportStatus,
    practiceStatus,
    primaryInjury: "Diagnostic",
  });
}

const qb1 = player({
  id: "qb1",
  name: "QB One",
  position: "QB",
  starter: true,
  depth: 1,
  value: 95,
});

const qb2 = player({
  id: "qb2",
  name: "QB Two",
  position: "QB",
  depth: 2,
  value: 65,
});

const wr1 = player({
  id: "wr1",
  name: "WR One",
  position: "WR",
  starter: true,
  depth: 1,
  value: 90,
});

const wr2 = player({
  id: "wr2",
  name: "WR Two",
  position: "WR",
  depth: 2,
  value: 70,
});

check("qb1-out-is-high-impact", () => {
  const impact =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Out",
      }),
      replacementPlayer: qb2,
    });

  assert(
    impact.adjustment <= -8,
    `Expected major QB1 impact, got ${impact.adjustment}.`
  );
});

check("qb1-out-exceeds-wr1-out", () => {
  const qbImpact =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Out",
      }),
      replacementPlayer: qb2,
    });

  const wrImpact =
    evaluateNFLPlayerAvailabilityImpact({
      player: wr1,
      evidence: evidence({
        id: "wr1",
        name: "WR One",
        position: "WR",
        reportStatus: "Out",
      }),
      replacementPlayer: wr2,
    });

  assert(
    Math.abs(qbImpact.adjustment) >
      Math.abs(wrImpact.adjustment),
    "QB1 OUT should exceed WR1 OUT."
  );
});

check("questionable-is-less-than-out", () => {
  const out =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Out",
      }),
      replacementPlayer: qb2,
    });

  const questionable =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Questionable",
      }),
      replacementPlayer: qb2,
    });

  assert(
    Math.abs(questionable.adjustment) <
      Math.abs(out.adjustment),
    "Questionable must be lower impact than OUT."
  );
});

check("stronger-replacement-reduces-impact", () => {
  const weakReplacement =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Out",
      }),
      replacementPlayer: player({
        id: "weak",
        name: "Weak Backup",
        position: "QB",
        depth: 2,
        value: 50,
      }),
    });

  const strongReplacement =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Out",
      }),
      replacementPlayer: player({
        id: "strong",
        name: "Strong Backup",
        position: "QB",
        depth: 2,
        value: 85,
      }),
    });

  assert(
    Math.abs(strongReplacement.adjustment) <
      Math.abs(weakReplacement.adjustment),
    "Better replacement should reduce availability impact."
  );
});

check("active-player-has-zero-impact", () => {
  const impact =
    evaluateNFLPlayerAvailabilityImpact({
      player: qb1,
      evidence: evidence({
        id: "qb1",
        name: "QB One",
        position: "QB",
        reportStatus: "Active",
      }),
      replacementPlayer: qb2,
    });

  assert(
    impact.adjustment === 0,
    "ACTIVE player should not reduce team strength."
  );
});

check("team-impact-identifies-qb-state", () => {
  const team =
    buildNFLTeamAvailabilityImpactFromInputs({
      team: "BAL",
      roster: [qb1, qb2, wr1, wr2],
      evidence: [
        evidence({
          id: "qb1",
          name: "QB One",
          position: "QB",
          reportStatus: "Out",
        }),
        evidence({
          id: "wr1",
          name: "WR One",
          position: "WR",
          reportStatus: "Questionable",
        }),
      ],
    });

  assert(
    team.quarterbackState.state === "IMPACTED",
    "QB1 state should be IMPACTED."
  );

  assert(
    team.adjustment < -8,
    "Team adjustment should reflect major QB1 loss."
  );
});

const failed =
  tests.filter((test) => !test.passed);

console.log(JSON.stringify({
  suite:
    "NFL Player Availability & Impact V1 Diagnostics",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
