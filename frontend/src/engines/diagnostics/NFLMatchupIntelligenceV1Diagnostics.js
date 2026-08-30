import {
  evaluateNFLMatchupIntelligence,
} from "../matchupIntelligence/NFLMatchupIntelligenceEngine.js";

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

function team({
  abbreviation,
  strength,
  passOff,
  rushOff,
  passDefAllowed,
  rushDefAllowed,
  recent,
  special,
  qb,
  availability,
  confidence = 0.85,
}) {
  return {
    teamAbbreviation: abbreviation,
    overallStrength: strength,
    confidence,
    confidenceKnown: true,
    performance: {
      offense: {
        passEpaPerPlay: passOff,
        rushEpaPerPlay: rushOff,
      },
      defense: {
        passEpaPerPlay: passDefAllowed,
        rushEpaPerPlay: rushDefAllowed,
      },
      recentFormIndex: recent,
      specialTeamsIndex: special,
    },
    components: {
      quarterback: qb,
      availability,
    },
  };
}

const BAL = team({
  abbreviation: "BAL",
  strength: 78,
  passOff: 0.14,
  rushOff: 0.10,
  passDefAllowed: -0.04,
  rushDefAllowed: -0.06,
  recent: 82,
  special: 58,
  qb: 100,
  availability: 95,
});

const CIN = team({
  abbreviation: "CIN",
  strength: 68,
  passOff: -0.02,
  rushOff: 0.01,
  passDefAllowed: 0.08,
  rushDefAllowed: 0.02,
  recent: 61,
  special: 47,
  qb: 100,
  availability: 90,
});

check("stronger-team-produces-edge", () => {
  const result =
    evaluateNFLMatchupIntelligence({
      season: 2026,
      week: 1,
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: BAL,
    });

  assert(
    result.matchupEdge > 0,
    "Expected BAL/home positive matchup edge."
  );
});

check("pass-matchup-is-contextual", () => {
  const result =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: BAL,
    });

  assert(
    result.dimensions.passMatchup > 0,
    "BAL pass offense vs CIN pass defense should create a positive home pass edge."
  );
});

check("qb-loss-can-flip-matchup", () => {
  const impactedBAL = {
    ...BAL,
    overallStrength: 64,
    components: {
      ...BAL.components,
      quarterback: 30,
      availability: 55,
    },
  };

  const result =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: impactedBAL,
      context: {
        homeField: false,
      },
    });

  assert(
    result.matchupEdge < 0,
    `Expected QB/availability loss to flip edge; got ${result.matchupEdge}.`
  );
});

check("home-field-is-explicit-not-hidden", () => {
  const neutral =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: BAL,
      context: {
        homeField: false,
      },
    });

  const home =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: BAL,
      context: {
        homeField: true,
        homeFieldIndex: 5,
      },
    });

  assert(
    home.matchupEdge > neutral.matchupEdge,
    "Explicit home field should increase home matchup edge."
  );

  assert(
    home.context.homeField === 5,
    "Home field context was not retained."
  );
});

check("missing-dimensions-reduce-quality", () => {
  const sparse = {
    teamAbbreviation: "BAL",
    overallStrength: 78,
    confidenceKnown: false,
    confidence: null,
    performance: {
      offense: {},
      defense: {},
    },
    components: {},
  };

  const result =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: sparse,
    });

  assert(
    result.evidenceQuality < 0.65,
    "Sparse evidence should not be high quality."
  );

  assert(
    result.state === "PARTIAL",
    "Sparse result should be PARTIAL."
  );
});

check("result-is-not-win-probability", () => {
  const result =
    evaluateNFLMatchupIntelligence({
      awayTeam: "CIN",
      homeTeam: "BAL",
      awayIntelligence: CIN,
      homeIntelligence: BAL,
    });

  assert(
    result.calibratedWinProbability === false,
    "Matchup V1 must not claim calibrated win probability."
  );

  assert(
    result.expectedPointMargin === null,
    "Matchup V1 must not fabricate expected point margin."
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
        "NFL Matchup Intelligence V1 Diagnostics",
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
