import {
  aggregateNFLVersePlayByPlay,
} from "../../data/footballIntelligence/nfl/performance/NFLVersePlayByPlayTeamPerformanceAdapter.js";

import {
  buildNFLOpponentAdjustment,
} from "../../data/footballIntelligence/nfl/performance/NFLOpponentAdjustmentEngine.js";

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
  // BAL vs CIN — BAL stronger
  {season:2026,week:1,game_id:"G1",posteam:"BAL",defteam:"CIN",play_type:"pass",epa:"0.5",success:"1",season_type:"REG"},
  {season:2026,week:1,game_id:"G1",posteam:"CIN",defteam:"BAL",play_type:"pass",epa:"-0.2",success:"0",season_type:"REG"},

  // BAL vs KC — BAL faces strong opponent
  {season:2026,week:2,game_id:"G2",posteam:"BAL",defteam:"KC",play_type:"pass",epa:"0.1",success:"1",season_type:"REG"},
  {season:2026,week:2,game_id:"G2",posteam:"KC",defteam:"BAL",play_type:"pass",epa:"0.4",success:"1",season_type:"REG"},

  // KC vs CIN
  {season:2026,week:3,game_id:"G3",posteam:"KC",defteam:"CIN",play_type:"run",epa:"0.3",success:"1",season_type:"REG"},
  {season:2026,week:3,game_id:"G3",posteam:"CIN",defteam:"KC",play_type:"run",epa:"-0.1",success:"0",season_type:"REG"},

  // Postseason row should be removable by REGULAR scope.
  {season:2026,week:20,game_id:"P1",posteam:"BAL",defteam:"KC",play_type:"pass",epa:"9",success:"1",season_type:"POST"},
  {season:2026,week:20,game_id:"P1",posteam:"KC",defteam:"BAL",play_type:"pass",epa:"-9",success:"0",season_type:"POST"},
];

const regular = aggregateNFLVersePlayByPlay({
  rows,
  season: 2026,
  phaseScope: "REGULAR",
});

const all = aggregateNFLVersePlayByPlay({
  rows,
  season: 2026,
  phaseScope: "ALL",
});

check("regular-scope-excludes-postseason", () => {
  const bal = regular.find(
    (record) => record.teamAbbreviation === "BAL"
  );

  assert(
    bal.sample.gamesPlayed === 2,
    "REGULAR scope included postseason game."
  );

  assert(
    bal.scheduleContext.postseasonGames === 0,
    "Postseason count should be zero."
  );
});

check("all-scope-retains-postseason", () => {
  const bal = all.find(
    (record) => record.teamAbbreviation === "BAL"
  );

  assert(
    bal.sample.gamesPlayed === 3,
    "ALL scope should retain postseason game."
  );

  assert(
    bal.scheduleContext.postseasonGames === 1,
    "Postseason count missing."
  );
});

check("opponent-lists-are-captured", () => {
  const bal = regular.find(
    (record) => record.teamAbbreviation === "BAL"
  );

  const opponents =
    bal.scheduleContext.games
      .map((game) => game.opponent)
      .sort();

  assert(
    JSON.stringify(opponents) ===
      JSON.stringify(["CIN", "KC"]),
    "Opponent schedule context incorrect."
  );
});

check("opponent-adjustment-produces-sos", () => {
  const map =
    buildNFLOpponentAdjustment(regular);

  const bal = map.get("BAL");

  assert(Boolean(bal), "BAL adjustment missing.");

  assert(
    typeof bal.scheduleStrengthRawNetEpa === "number",
    "Strength-of-schedule value missing."
  );
});

check("opponent-adjusted-index-is-bounded", () => {
  const map =
    buildNFLOpponentAdjustment(regular);

  for (const result of map.values()) {
    assert(
      result.opponentAdjustedIndex >= 0 &&
        result.opponentAdjustedIndex <= 100,
      "Opponent-adjusted index outside 0-100."
    );
  }
});

check("early-sample-is-marked-prior-required", () => {
  const map =
    buildNFLOpponentAdjustment(regular);

  const bal = map.get("BAL");

  assert(
    bal.sampleMaturity.priorRequired === true,
    "Early sample should require prior handling."
  );

  assert(
    bal.sampleMaturity.state === "VERY_EARLY",
    "Expected VERY_EARLY maturity state."
  );
});

const failed =
  tests.filter((test) => !test.passed);

console.log(JSON.stringify({
  suite:
    "NFL Opponent Adjustment V1 Diagnostics",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));

if (failed.length) process.exitCode = 1;
