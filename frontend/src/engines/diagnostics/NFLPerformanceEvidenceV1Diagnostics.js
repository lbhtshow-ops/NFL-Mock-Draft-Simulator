import {
  aggregateNFLVersePlayByPlay,
} from "../../data/footballIntelligence/nfl/performance/NFLVersePlayByPlayTeamPerformanceAdapter.js";

import {
  buildNFLPerformanceIndexes,
} from "../../data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceRegistry.js";

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

const rows = [
  { season: 2026, week: 1, game_id: "A", posteam: "BAL", defteam: "CIN", play_type: "pass", epa: "0.5", success: "1" },
  { season: 2026, week: 1, game_id: "A", posteam: "BAL", defteam: "CIN", play_type: "run", epa: "-0.1", success: "0" },
  { season: 2026, week: 1, game_id: "A", posteam: "CIN", defteam: "BAL", play_type: "pass", epa: "-0.4", success: "0" },
  { season: 2026, week: 1, game_id: "A", posteam: "CIN", defteam: "BAL", play_type: "run", epa: "0.0", success: "0" },
  { season: 2026, week: 2, game_id: "B", posteam: "BAL", defteam: "CLE", play_type: "pass", epa: "0.3", success: "1" },
  { season: 2026, week: 2, game_id: "B", posteam: "CLE", defteam: "BAL", play_type: "run", epa: "-0.2", success: "0" },
];

const evidence = aggregateNFLVersePlayByPlay({
  rows,
  season: 2026,
  throughWeek: 2,
  sourceUrl: "diagnostic://fixture",
  generatedAt: "2026-08-10T00:00:00Z",
});

check("adapter-produces-team-records", () => {
  assert(evidence.length === 3, "Expected three teams.");
});

check("offense-epa-is-correct", () => {
  const bal = evidence.find((record) => record.teamAbbreviation === "BAL");
  assert(Boolean(bal), "BAL evidence missing.");
  assert(
    Math.abs(bal.offense.epaPerPlay - (0.7 / 3)) < 0.000001,
    "BAL offense EPA/play incorrect."
  );
});

check("defense-epa-is-correct", () => {
  const bal = evidence.find((record) => record.teamAbbreviation === "BAL");
  assert(
    Math.abs(bal.defense.epaAllowedPerPlay - (-0.6 / 3)) < 0.000001,
    "BAL defense EPA allowed/play incorrect."
  );
});

check("recent-form-is-derived", () => {
  const bal = evidence.find((record) => record.teamAbbreviation === "BAL");
  assert(
    Array.isArray(bal.recentForm?.weeks) &&
      bal.recentForm.weeks.length === 2,
    "Recent-form weeks were not derived."
  );
});

check("league-relative-index-is-bounded", () => {
  const bal = evidence.find((record) => record.teamAbbreviation === "BAL");
  const indexes = buildNFLPerformanceIndexes(bal, evidence);

  assert(
    indexes.offense >= 0 && indexes.offense <= 100,
    "Offense index outside 0-100."
  );

  assert(
    indexes.defense >= 0 && indexes.defense <= 100,
    "Defense index outside 0-100."
  );
});

check("no-play-is-excluded", () => {
  const extended = aggregateNFLVersePlayByPlay({
    rows: [
      ...rows,
      {
        season: 2026,
        week: 2,
        game_id: "B",
        posteam: "BAL",
        defteam: "CLE",
        play_type: "pass",
        epa: "100",
        success: "1",
        no_play: "1",
      },
    ],
    season: 2026,
  });

  const bal = extended.find((record) => record.teamAbbreviation === "BAL");
  assert(
    bal.offense.epaPerPlay < 1,
    "No-play EPA contaminated the aggregate."
  );
});

const failed = tests.filter((test) => !test.passed);

console.log(JSON.stringify({
  suite: "NFL Performance Evidence V1 Diagnostics",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));

if (failed.length) process.exitCode = 1;
