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

import {
  resolveNFLAdvancedEarlySeasonMatchupPolicyV1,
} from "./canonical/NFLAdvancedEarlySeasonMatchupPolicyV1.js";

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
    finite(dimensions.protectionPressure),
    finite(dimensions.explosivePlay),
    finite(dimensions.redZone),
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
    {
      key: "protectionPressure",
      label: "pass protection vs pressure",
      value: dimensions.protectionPressure,
    },
    {
      key: "explosivePlay",
      label: "explosive-play matchup",
      value: dimensions.explosivePlay,
    },
    {
      key: "redZone",
      label: "red-zone matchup",
      value: dimensions.redZone,
    },
    {
      key: "weatherStyle",
      label: "weather/style interaction",
      value: dimensions.weatherStyle,
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

function teamAvailabilityEvidence(teamIntelligence) {
  const evidence =
    Array.isArray(teamIntelligence?.evidence)
      ? teamIntelligence.evidence
      : [];

  return (
    evidence.find(
      (entry) =>
        entry?.type === "NFL_PLAYER_AVAILABILITY_IMPACT"
    ) || null
  );
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
      weather: context?.weather || null,
    });

  const gameContext =
    buildNFLGameContext(context);

  const advancedEarlySeasonPolicy =
    resolveNFLAdvancedEarlySeasonMatchupPolicyV1({
      season,
      week,
      homeIntelligence,
      awayIntelligence,
    });

  const advancedWeightMultiplier =
    advancedEarlySeasonPolicy.multiplier;

  // V1 base weights remain unchanged. PI.5 authorizes maturity alignment
  // only for protectionPressure, explosivePlay, and redZone.
  const matchupEdge =
    weightedAverage([
      {
        key: "overallStrength",
        value: dimensions.overallStrength,
        weight: 0.30,
      },
      {
        key: "passMatchup",
        value: dimensions.passMatchup,
        weight: 0.14,
      },
      {
        key: "rushMatchup",
        value: dimensions.rushMatchup,
        weight: 0.08,
      },
      {
        key: "protectionPressure",
        value: dimensions.protectionPressure,
        weight: 0.10 * advancedWeightMultiplier,
      },
      {
        key: "explosivePlay",
        value: dimensions.explosivePlay,
        weight: 0.08 * advancedWeightMultiplier,
      },
      {
        key: "redZone",
        value: dimensions.redZone,
        weight: 0.06 * advancedWeightMultiplier,
      },
      {
        key: "recentForm",
        value: dimensions.recentForm,
        weight: 0.07,
      },
      {
        key: "specialTeams",
        value: dimensions.specialTeams,
        weight: 0.04,
      },
      {
        key: "quarterback",
        value: dimensions.quarterback,
        weight: 0.06,
      },
      {
        key: "availability",
        value: dimensions.availability,
        weight: 0.03,
      },
      {
        key: "weatherStyle",
        value: dimensions.weatherStyle,
        weight: 0.01,
      },
      {
        key: "homeField",
        value: gameContext.homeField,
        weight: 0.02,
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
      ? "Protection-vs-pressure evidence is unavailable for one or both teams."
      : null,
    dimensions.explosivePlay === null
      ? "Explosive-play interaction evidence is unavailable."
      : null,
    dimensions.redZone === null
      ? "Red-zone interaction evidence is unavailable."
      : null,
    "Scheme tendencies are descriptive in V1.1 and are not yet assigned a standalone advantage score.",
    "Travel effects remain unmodeled until canonical location/travel evidence is connected.",
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
      advancedEarlySeasonPolicy,
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
        availabilityEvidence:
          teamAvailabilityEvidence(homeIntelligence),
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
        availabilityEvidence:
          teamAvailabilityEvidence(awayIntelligence),
      },
    },
  });
}

export default {
  evaluateNFLMatchupIntelligence,
};
