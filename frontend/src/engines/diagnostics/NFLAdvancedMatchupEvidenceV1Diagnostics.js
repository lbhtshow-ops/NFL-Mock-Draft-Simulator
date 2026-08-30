import {
  aggregateNFLAdvancedMatchupEvidence,
} from "../../data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupPbpAdapter.js";

import {
  buildNFLAdvancedMatchupDimensions,
} from "../matchupIntelligence/NFLAdvancedMatchupDimensionEngine.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const tests = [];

function check(name, fn) {
  try {
    fn();
    tests.push({
      name,
      passed: true,
    });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message,
    });
  }
}

const rows = [
  // BAL offense, CIN defense
  {season:2026,week:1,season_type:"REG",posteam:"BAL",defteam:"CIN",play_type:"pass",yards_gained:"25",epa:"0.5",success:"1",qb_hit:"0",sack:"0",shotgun:"1",no_huddle:"0",yardline_100:"45"},
  {season:2026,week:1,season_type:"REG",posteam:"BAL",defteam:"CIN",play_type:"pass",yards_gained:"8",epa:"0.1",success:"1",qb_hit:"0",sack:"0",shotgun:"1",no_huddle:"1",yardline_100:"18"},
  {season:2026,week:1,season_type:"REG",posteam:"BAL",defteam:"CIN",play_type:"run",yards_gained:"12",epa:"0.2",success:"1",shotgun:"1",no_huddle:"0",yardline_100:"12"},

  // CIN offense, BAL defense — more pressure, fewer explosives
  {season:2026,week:1,season_type:"REG",posteam:"CIN",defteam:"BAL",play_type:"pass",yards_gained:"4",epa:"-0.3",success:"0",qb_hit:"1",sack:"0",shotgun:"1",no_huddle:"0",yardline_100:"40"},
  {season:2026,week:1,season_type:"REG",posteam:"CIN",defteam:"BAL",play_type:"pass",yards_gained:"-7",epa:"-0.8",success:"0",qb_hit:"1",sack:"1",shotgun:"1",no_huddle:"0",yardline_100:"16"},
  {season:2026,week:1,season_type:"REG",posteam:"CIN",defteam:"BAL",play_type:"run",yards_gained:"3",epa:"-0.1",success:"0",shotgun:"0",no_huddle:"0",yardline_100:"10"},
];

const evidence =
  aggregateNFLAdvancedMatchupEvidence({
    rows,
    season: 2026,
    phaseScope: "REGULAR",
  });

const bal = evidence.find(
  (record) =>
    record.team === "BAL"
);

const cin = evidence.find(
  (record) =>
    record.team === "CIN"
);

check("pressure-evidence-is-derived", () => {
  assert(
    bal.defense.pressureGeneratedRate > 0,
    "BAL pressure generated rate missing."
  );

  assert(
    cin.offense.pressureAllowedRate > 0,
    "CIN pressure allowed rate missing."
  );
});

check("sacks-are-part-of-pressure", () => {
  assert(
    cin.offense.sackAllowedRate > 0,
    "Sack allowed rate missing."
  );

  assert(
    bal.defense.sackGeneratedRate > 0,
    "Sack generated rate missing."
  );
});

check("explosive-plays-are-derived", () => {
  assert(
    bal.offense.explosivePassRate > 0,
    "BAL explosive pass rate missing."
  );

  assert(
    bal.offense.explosiveRushRate > 0,
    "BAL explosive rush rate missing."
  );
});

check("red-zone-evidence-is-derived", () => {
  assert(
    typeof bal.offense.redZoneEpaPerPlay === "number",
    "BAL red-zone EPA missing."
  );

  assert(
    typeof cin.defense.redZoneSuccessRateAllowed === "number",
    "CIN red-zone defense rate missing."
  );
});

check("scheme-tendencies-are-descriptive", () => {
  assert(
    bal.tendencies.shotgunRate > 0,
    "Shotgun tendency missing."
  );

  assert(
    bal.tendencies.passRate > 0,
    "Pass-rate tendency missing."
  );
});

check("advanced-matchup-favors-better-protection-pressure-side", () => {
  const dimensions =
    buildNFLAdvancedMatchupDimensions({
      homeEvidence: bal,
      awayEvidence: cin,
    });

  assert(
    dimensions.protectionPressure > 0,
    `Expected BAL protection/pressure edge; got ${dimensions.protectionPressure}.`
  );
});

check("advanced-explosive-matchup-is-generated", () => {
  const dimensions =
    buildNFLAdvancedMatchupDimensions({
      homeEvidence: bal,
      awayEvidence: cin,
    });

  assert(
    typeof dimensions.explosivePlay === "number",
    "Explosive-play matchup missing."
  );
});

check("weather-style-penalizes-more-pass-dependent-team", () => {
  const passHeavy = {
    ...bal,
    tendencies: {
      ...bal.tendencies,
      passRate: 0.75,
    },
  };

  const runHeavy = {
    ...cin,
    tendencies: {
      ...cin.tendencies,
      passRate: 0.45,
    },
  };

  const dimensions =
    buildNFLAdvancedMatchupDimensions({
      homeEvidence: passHeavy,
      awayEvidence: runHeavy,
      weather: {
        windMph: 25,
        precipitation: true,
      },
    });

  assert(
    dimensions.weatherStyle < 0,
    "Pass-heavy home team should receive adverse-weather relative penalty."
  );
});

const failed =
  tests.filter(
    (test) => !test.passed
  );

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Advanced Matchup Evidence V1 Diagnostics",
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
