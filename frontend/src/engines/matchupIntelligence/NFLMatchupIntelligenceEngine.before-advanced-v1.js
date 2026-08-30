import {
  createNFLMatchupIntelligenceResult,
  NFL_MATCHUP_INTELLIGENCE_STATES,
} from "./NFLMatchupIntelligenceResultContract.js";

import {
  buildNFLMatchupDimensions,
} from "./NFLMatchupDimensionEngine.js";

import {
  buildNFLGameContext,
} from "./NFLGameContextEngine.js";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function weightedAverage(parts) {
  const valid = parts.filter(
    (part) =>
      finite(part?.value) &&
      finite(part?.weight) &&
      part.weight > 0
  );

  if (!valid.length) return null;

  const weight =
    valid.reduce(
      (sum, part) => sum + part.weight,
      0
    );

  return valid.reduce(
    (sum, part) =>
      sum + part.value * part.weight,
    0
  ) / weight;
}

function evidenceQuality({
  home,
  away,
  dimensions,
}) {
  const checks = [
    finite(home?.overallStrength),
    finite(away?.overallStrength),
    finite(dimensions.passMatchup),
    finite(dimensions.rushMatchup),
    finite(dimensions.recentForm),
    finite(dimensions.specialTeams),
    finite(dimensions.availability),
    finite(dimensions.quarterback),
  ];

  const available =
    checks.filter(Boolean).length;

  const ratio =
    checks.length
      ? available / checks.length
      : 0;

  const homeConfidence =
    home?.confidenceKnown
      ? home.confidence
      : null;

  const awayConfidence =
    away?.confidenceKnown
      ? away.confidence
      : null;

  const confidence =
    finite(homeConfidence) &&
    finite(awayConfidence)
      ? (
          homeConfidence +
          awayConfidence
        ) / 2
      : null;

  return {
    known:
      available > 0,
    value:
      confidence === null
        ? ratio
        : ratio * 0.65 +
          confidence * 0.35,
  };
}

function describe({
  dimensions,
  homeTeam,
  awayTeam,
}) {
  const factors = [
    {
      key: "overallStrength",
      label: "overall team strength",
      value: dimensions.overallStrength,
    },
    {
      key: "passMatchup",
      label: "passing matchup",
      value: dimensions.passMatchup,
    },
    {
      key: "rushMatchup",
      label: "rushing matchup",
      value: dimensions.rushMatchup,
    },
    {
      key: "recentForm",
      label: "recent form",
      value: dimensions.recentForm,
    },
    {
      key: "specialTeams",
      label: "special teams",
      value: dimensions.specialTeams,
    },
    {
      key: "quarterback",
      label: "quarterback availability",
      value: dimensions.quarterback,
    },
    {
      key: "availability",
      label: "overall player availability",
      value: dimensions.availability,
    },
  ]
    .filter((factor) => finite(factor.value))
    .sort(
      (a, b) =>
        Math.abs(b.value) -
        Math.abs(a.value)
    );

  const keyAdvantages = [];
  const counterweights = [];

  for (const factor of factors) {
    if (Math.abs(factor.value) < 4) {
      continue;
    }

    const favored =
      factor.value > 0
        ? homeTeam
        : awayTeam;

    const entry = {
      dimension: factor.key,
      team: favored,
      label: factor.label,
      magnitude:
        Number(
          Math.abs(factor.value).toFixed(2)
        ),
    };

    if (keyAdvantages.length < 4) {
      keyAdvantages.push(entry);
    } else {
      counterweights.push(entry);
    }
  }

  return {
    keyAdvantages,
    counterweights,
  };
}

export function evaluateNFLMatchupIntelligence({
  gameId = null,
  season = null,
  week = null,
  awayTeam,
  homeTeam,
  awayIntelligence,
  homeIntelligence,
  context = {},
} = {}) {
  if (
    !awayTeam ||
    !homeTeam ||
    !awayIntelligence ||
    !homeIntelligence
  ) {
    return createNFLMatchupIntelligenceResult({
      gameId,
      season,
      week,
      awayTeam: awayTeam || "UNKNOWN",
      homeTeam: homeTeam || "UNKNOWN",
      state:
        NFL_MATCHUP_INTELLIGENCE_STATES.UNAVAILABLE,
      limitations: [
        "Both canonical team-intelligence inputs are required.",
      ],
    });
  }

  const dimensions =
    buildNFLMatchupDimensions({
      home: homeIntelligence,
      away: awayIntelligence,
    });

  const gameContext =
    buildNFLGameContext(context);

  // V1 weights are intentionally versioned heuristics, not calibrated
  // game-outcome coefficients.
  const matchupEdge =
    weightedAverage([
      {
        key: "overallStrength",
        value: dimensions.overallStrength,
        weight: 0.36,
      },
      {
        key: "passMatchup",
        value: dimensions.passMatchup,
        weight: 0.19,
      },
      {
        key: "rushMatchup",
        value: dimensions.rushMatchup,
        weight: 0.11,
      },
      {
        key: "recentForm",
        value: dimensions.recentForm,
        weight: 0.10,
      },
      {
        key: "specialTeams",
        value: dimensions.specialTeams,
        weight: 0.06,
      },
      {
        key: "quarterback",
        value: dimensions.quarterback,
        weight: 0.09,
      },
      {
        key: "availability",
        value: dimensions.availability,
        weight: 0.05,
      },
      {
        key: "homeField",
        value: gameContext.homeField,
        weight: 0.03,
      },
      {
        key: "rest",
        value: gameContext.rest,
        weight: 0.01,
      },
    ]);

  const quality =
    evidenceQuality({
      home: homeIntelligence,
      away: awayIntelligence,
      dimensions,
    });

  const explanation =
    describe({
      dimensions,
      homeTeam,
      awayTeam,
    });

  const limitations = [
    "Matchup Edge is an intelligence index, not expected point margin.",
    "Matchup Edge is not a calibrated win probability.",
    dimensions.protectionPressure === null
      ? "Protection-vs-pressure intelligence is not yet connected."
      : null,
    ...gameContext.limitations,
  ].filter(Boolean);

  return createNFLMatchupIntelligenceResult({
    gameId,
    season,
    week,
    awayTeam,
    homeTeam,

    state:
      matchupEdge === null
        ? NFL_MATCHUP_INTELLIGENCE_STATES.UNKNOWN
        : quality.value < 0.65
          ? NFL_MATCHUP_INTELLIGENCE_STATES.PARTIAL
          : NFL_MATCHUP_INTELLIGENCE_STATES.AVAILABLE,

    matchupEdge,

    homeAdvantageIndex:
      gameContext.homeField,

    dimensions,

    context: gameContext,

    evidenceQuality:
      quality.value,
    evidenceQualityKnown:
      quality.known,

    keyAdvantages:
      explanation.keyAdvantages,
    counterweights:
      explanation.counterweights,
    limitations,

    sourceTeamIntelligence: {
      home: {
        team:
          homeIntelligence
            ?.teamAbbreviation ||
          homeTeam,
        overallStrength:
          homeIntelligence
            ?.overallStrength ?? null,
        confidence:
          homeIntelligence
            ?.confidence ?? null,
      },
      away: {
        team:
          awayIntelligence
            ?.teamAbbreviation ||
          awayTeam,
        overallStrength:
          awayIntelligence
            ?.overallStrength ?? null,
        confidence:
          awayIntelligence
            ?.confidence ?? null,
      },
    },
  });
}

export default {
  evaluateNFLMatchupIntelligence,
};
