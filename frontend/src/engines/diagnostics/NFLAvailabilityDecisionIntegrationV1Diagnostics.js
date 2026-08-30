import {
  createNFLTeamIntelligenceInput,
} from "../teamIntelligence/NFLTeamIntelligenceInputProjection.js";

import {
  getNFLTeamIntelligenceResult,
} from "../teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";

import {
  buildNFLMatchupDimensions,
} from "../matchupIntelligence/NFLMatchupDimensionEngine.js";

import {
  buildNFLMatchupIntelligenceProfile,
} from "../../data/footballIntelligence/services/NFLMatchupIntelligenceService.js";

const tests = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function check(name, fn) {
  try {
    await fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message,
    });
  }
}

function activeAvailability({
  adjustment = -8,
  qbAdjustment = -5,
} = {}) {
  return {
    contract: "NFLTeamAvailabilityImpact",
    version: "NFL-TEAM-AVAILABILITY-IMPACT-V1.0.0",
    state: "AVAILABLE",
    team: "BAL",
    adjustment,
    confidence: 0.82,
    impacts: [
      {
        contract: "NFLPlayerAvailabilityImpact",
        state: "AVAILABLE",
        adjustment: qbAdjustment,
        confidence: 0.9,
        player: {
          playerId: "qb-1",
          playerName: "Test QB",
          position: "QB",
          role: "QB1",
        },
        availability: {
          status: "OUT",
        },
      },
    ],
    quarterbackState: {
      state: "IMPACTED",
      qb1: {
        playerId: "qb-1",
        playerName: "Test QB",
        rosterValue: 95,
      },
      impact: {
        adjustment: qbAdjustment,
      },
    },
    evidenceCount: 2,
    resolvedPlayerCount: 2,
    report: {
      available: true,
      season: 2026,
      week: 1,
      gameType: "REG",
      latestModifiedAt: "2026-09-08T20:00:00Z",
      sourceRefs: [
        {
          playerId: "qb-1",
          playerName: "Test QB",
          reportStatus: "OUT",
          source: "diagnostic",
          modifiedAt: "2026-09-08T20:00:00Z",
        },
      ],
    },
  };
}

function noReportAvailability() {
  return {
    contract: "NFLTeamAvailabilityImpact",
    version: "NFL-TEAM-AVAILABILITY-IMPACT-V1.0.0",
    state: "NO_REPORT",
    team: "BAL",
    adjustment: 0,
    confidence: null,
    impacts: [],
    quarterbackState: {
      state: "AVAILABLE",
      qb1: null,
      impact: null,
    },
    evidenceCount: 0,
    report: {
      available: false,
      season: 2026,
      week: 1,
      gameType: "REG",
      latestModifiedAt: null,
      sourceRefs: [],
    },
  };
}

await check(
  "requested-season-week-reach-availability-resolver",
  async () => {
    let observed = null;

    createNFLTeamIntelligenceInput(
      "BAL",
      {
        targetSeason: 2026,
        availabilityWeek: 4,
        gameType: "REG",
        availabilityResolver: (
          team,
          options
        ) => {
          observed = {
            team,
            ...options,
          };

          return noReportAvailability();
        },
      }
    );

    assert(
      observed?.team === "BAL" &&
      observed?.season === 2026 &&
      observed?.week === 4 &&
      observed?.gameType === "REG",
      "Availability resolver did not receive the requested game boundary."
    );
  }
);

await check(
  "no-report-does-not-assume-health",
  async () => {
    const input =
      createNFLTeamIntelligenceInput(
        "BAL",
        {
          targetSeason: 2026,
          availabilityWeek: 1,
          availabilityResolver:
            () =>
              noReportAvailability(),
        }
      );

    assert(
      input.availability.reportAvailable === false,
      "Missing report was marked available."
    );

    assert(
      input.availability.score === null &&
      input.availability.quarterbackScore === null,
      "Missing report silently created healthy availability scores."
    );

    assert(
      input.missingEvidence.includes(
        "availability.playerImpact"
      ),
      "Missing availability evidence was not retained."
    );
  }
);

await check(
  "active-report-projects-team-and-qb-scores",
  async () => {
    const input =
      createNFLTeamIntelligenceInput(
        "BAL",
        {
          targetSeason: 2026,
          availabilityWeek: 1,
          availabilityResolver:
            () =>
              activeAvailability(),
        }
      );

    assert(
      input.availability.score === 92,
      `Expected availability score 92, got ${input.availability.score}.`
    );

    assert(
      input.availability.quarterbackScore === 95,
      `Expected quarterback score 95, got ${input.availability.quarterbackScore}.`
    );

    assert(
      input.availability.injuryReportRefs.length === 1,
      "Availability provenance was not projected."
    );
  }
);

await check(
  "canonical-team-result-consumes-availability",
  async () => {
    const result =
      getNFLTeamIntelligenceResult(
        "BAL",
        {
          targetSeason: 2026,
          availabilityWeek: 1,
          availabilityResolver:
            () =>
              activeAvailability(),
        }
      );

    assert(
      result.components.availability === 92 &&
      result.components.quarterback === 95,
      "Canonical Team Intelligence did not activate availability components."
    );

    assert(
      result.evidence.some(
        (item) =>
          item.type ===
          "NFL_PLAYER_AVAILABILITY"
      ),
      "Canonical Team Intelligence omitted availability evidence."
    );
  }
);

await check(
  "matchup-dimensions-consume-availability-components",
  async () => {
    const home =
      getNFLTeamIntelligenceResult(
        "BAL",
        {
          targetSeason: 2026,
          availabilityWeek: 1,
          availabilityResolver:
            () =>
              activeAvailability(),
        }
      );

    const away = {
      ...home,
      teamAbbreviation: "CIN",
      components: {
        ...home.components,
        availability: 100,
        quarterback: 100,
      },
    };

    const dimensions =
      buildNFLMatchupDimensions({
        home,
        away,
      });

    assert(
      dimensions.availability === -8,
      `Expected availability dimension -8, got ${dimensions.availability}.`
    );

    assert(
      dimensions.quarterback === -5,
      `Expected quarterback dimension -5, got ${dimensions.quarterback}.`
    );
  }
);

await check(
  "matchup-service-forwards-availability-boundary",
  async () => {
    const calls = [];

    buildNFLMatchupIntelligenceProfile({
      gameId: 1,
      season: 2026,
      week: 3,
      awayTeam: "CIN",
      homeTeam: "BAL",
      availabilityWeek: 3,
      availabilityResolver: (
        team,
        options
      ) => {
        calls.push({
          team,
          ...options,
        });

        return activeAvailability({
          adjustment: 0,
          qbAdjustment: 0,
        });
      },
    });

    assert(
      calls.length === 2,
      `Expected two availability resolver calls, got ${calls.length}.`
    );

    assert(
      calls.every(
        (call) =>
          call.season === 2026 &&
          call.week === 3
      ),
      "Matchup service did not preserve season/week boundary."
    );
  }
);

const failed =
  tests.filter(
    (test) => !test.passed
  );

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Availability Decision Integration V1 Diagnostics",
      passed:
        tests.length - failed.length,
      failed:
        failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) {
  process.exitCode = 1;
}
