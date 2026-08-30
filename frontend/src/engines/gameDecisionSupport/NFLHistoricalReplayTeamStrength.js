import {
  buildNFLOpponentAdjustment,
} from "../../data/footballIntelligence/nfl/performance/NFLOpponentAdjustmentEngine.js";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(values, value, higherIsBetter = true) {
  const valid = values
    .filter(finite)
    .sort((a, b) => a - b);

  if (
    valid.length < 2 ||
    !finite(value)
  ) {
    return null;
  }

  const below =
    valid.filter(
      (candidate) => candidate < value
    ).length;

  const equal =
    valid.filter(
      (candidate) => candidate === value
    ).length;

  const raw =
    (below + equal * 0.5) /
    valid.length;

  return (
    higherIsBetter
      ? raw
      : 1 - raw
  ) * 100;
}

function average(values) {
  const valid = values.filter(finite);

  return valid.length
    ? valid.reduce(
        (sum, value) => sum + value,
        0
      ) / valid.length
    : null;
}

function weightedAverage(parts) {
  const valid = parts.filter(
    (part) =>
      finite(part?.value) &&
      finite(part?.weight) &&
      part.weight > 0
  );

  if (!valid.length) return null;

  const totalWeight =
    valid.reduce(
      (sum, part) => sum + part.weight,
      0
    );

  return valid.reduce(
    (sum, part) =>
      sum +
      part.value * part.weight,
    0
  ) / totalWeight;
}

function maturity(gamesPlayed) {
  const games =
    Number(gamesPlayed) || 0;

  if (games <= 0) {
    return {
      state: "NO_CURRENT_SAMPLE",
      reliability: 0,
      priorRequired: true,
    };
  }

  if (games <= 2) {
    return {
      state: "VERY_EARLY",
      reliability: 0.25,
      priorRequired: true,
    };
  }

  if (games <= 4) {
    return {
      state: "EARLY",
      reliability: 0.5,
      priorRequired: true,
    };
  }

  if (games <= 7) {
    return {
      state: "DEVELOPING",
      reliability: 0.75,
      priorRequired: true,
    };
  }

  return {
    state: "MATURE",
    reliability: 1,
    priorRequired: false,
  };
}

export function buildHistoricalReplayTeamIndexes(
  evidence,
  leagueRecords
) {
  if (!evidence) {
    return {
      offense: null,
      defense: null,
      recentForm: null,
      specialTeams: null,
    };
  }

  const offense =
    average([
      percentile(
        leagueRecords.map(
          (record) =>
            record?.offense?.epaPerPlay
        ),
        evidence?.offense?.epaPerPlay,
        true
      ),
      percentile(
        leagueRecords.map(
          (record) =>
            record?.offense?.successRate
        ),
        evidence?.offense?.successRate,
        true
      ),
    ]);

  const defense =
    average([
      percentile(
        leagueRecords.map(
          (record) =>
            record?.defense?.epaAllowedPerPlay
        ),
        evidence?.defense?.epaAllowedPerPlay,
        false
      ),
      percentile(
        leagueRecords.map(
          (record) =>
            record?.defense?.successRateAllowed
        ),
        evidence?.defense?.successRateAllowed,
        false
      ),
    ]);

  const recentForm =
    percentile(
      leagueRecords.map(
        (record) =>
          record?.recentForm?.netEpaPerPlay
      ),
      evidence?.recentForm?.netEpaPerPlay,
      true
    );

  const specialTeams =
    percentile(
      leagueRecords.map(
        (record) =>
          record?.specialTeams?.epaPerPlay
      ),
      evidence?.specialTeams?.epaPerPlay,
      true
    );

  return {
    offense,
    defense,
    recentForm,
    specialTeams,
  };
}

export function buildHistoricalReplayTeamStrength({
  team,
  currentRecords = [],
  priorRecords = [],
} = {}) {
  const abbreviation =
    typeof team === "string"
      ? team.trim().toUpperCase()
      : null;

  const current =
    currentRecords.find(
      (record) =>
        record.teamAbbreviation ===
        abbreviation
    ) || null;

  const prior =
    priorRecords.find(
      (record) =>
        record.teamAbbreviation ===
        abbreviation
    ) || null;

  const currentIndexes =
    buildHistoricalReplayTeamIndexes(
      current,
      currentRecords
    );

  const priorIndexes =
    buildHistoricalReplayTeamIndexes(
      prior,
      priorRecords
    );

  const currentOpponent =
    buildNFLOpponentAdjustment(
      currentRecords
    ).get(abbreviation) || null;

  const priorOpponent =
    buildNFLOpponentAdjustment(
      priorRecords
    ).get(abbreviation) || null;

  function seasonStrength(
    indexes,
    opponent
  ) {
    const score =
      weightedAverage([
        {
          value:
            opponent?.opponentAdjustedIndex ??
            null,
          weight: 0.75,
        },
        {
          value:
            indexes?.recentForm ?? null,
          weight: 0.15,
        },
        {
          value:
            indexes?.specialTeams ?? null,
          weight: 0.10,
        },
      ]);

    return score === null
      ? null
      : clamp(score, 0, 100);
  }

  const currentStrength =
    seasonStrength(
      currentIndexes,
      currentOpponent
    );

  const priorStrength =
    seasonStrength(
      priorIndexes,
      priorOpponent
    );

  const currentMaturity =
    maturity(
      current?.sample?.gamesPlayed || 0
    );

  let overallStrength = null;
  let mode = "UNAVAILABLE";

  if (
    finite(currentStrength) &&
    currentMaturity.priorRequired &&
    finite(priorStrength)
  ) {
    mode = "BLENDED";

    overallStrength =
      currentStrength *
        currentMaturity.reliability +
      priorStrength *
        (
          1 -
          currentMaturity.reliability
        );
  } else if (
    finite(currentStrength)
  ) {
    mode = "CURRENT_ONLY";
    overallStrength =
      currentStrength;
  } else if (
    finite(priorStrength)
  ) {
    mode = "PRIOR_ONLY";
    overallStrength =
      priorStrength;
  }

  return {
    teamAbbreviation:
      abbreviation,
    overallStrength,
    mode,
    maturity:
      currentMaturity,

    performance: {
      offense: {
        passEpaPerPlay:
          current?.offense
            ?.passEpaPerPlay ??
          prior?.offense
            ?.passEpaPerPlay ??
          null,
        rushEpaPerPlay:
          current?.offense
            ?.rushEpaPerPlay ??
          prior?.offense
            ?.rushEpaPerPlay ??
          null,
      },

      defense: {
        passEpaPerPlay:
          current?.defense
            ?.passEpaAllowedPerPlay ??
          prior?.defense
            ?.passEpaAllowedPerPlay ??
          null,
        rushEpaPerPlay:
          current?.defense
            ?.rushEpaAllowedPerPlay ??
          prior?.defense
            ?.rushEpaAllowedPerPlay ??
          null,
      },

      recentFormIndex:
        currentIndexes.recentForm ??
        priorIndexes.recentForm ??
        null,

      specialTeamsIndex:
        currentIndexes.specialTeams ??
        priorIndexes.specialTeams ??
        null,
    },

    components: {
      quarterback: null,
      availability: null,
    },

    confidence:
      overallStrength === null
        ? null
        : (
            mode === "CURRENT_ONLY"
              ? 0.85
              : mode === "BLENDED"
                ? 0.72
                : 0.58
          ),

    confidenceKnown:
      overallStrength !== null,

    replayEvidence: {
      current,
      prior,
      currentOpponent,
      priorOpponent,
      currentIndexes,
      priorIndexes,
    },
  };
}

export default {
  buildHistoricalReplayTeamIndexes,
  buildHistoricalReplayTeamStrength,
};
