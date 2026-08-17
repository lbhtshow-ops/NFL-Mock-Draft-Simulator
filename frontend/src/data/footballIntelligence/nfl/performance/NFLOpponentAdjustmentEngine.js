import {
  isNFLTeamPerformanceEvidence,
} from "./NFLTeamPerformanceEvidenceContract.js";

export const NFL_OPPONENT_ADJUSTMENT_VERSION =
  "NFL-OPPONENT-ADJUSTMENT-1.0.0";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function rawNet(record) {
  const offense = record?.offense?.epaPerPlay;
  const defense =
    record?.defense?.epaAllowedPerPlay;

  if (!finite(offense) || !finite(defense)) {
    return null;
  }

  return offense - defense;
}

function average(values) {
  const valid = values.filter(finite);

  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) /
      valid.length
    : null;
}

function sampleMaturity(gamesPlayed) {
  const games = Number(gamesPlayed) || 0;

  if (games <= 2) {
    return {
      state: "VERY_EARLY",
      priorRequired: true,
      reliability: 0.25,
    };
  }

  if (games <= 4) {
    return {
      state: "EARLY",
      priorRequired: true,
      reliability: 0.5,
    };
  }

  if (games <= 7) {
    return {
      state: "DEVELOPING",
      priorRequired: true,
      reliability: 0.75,
    };
  }

  return {
    state: "MATURE",
    priorRequired: false,
    reliability: 1,
  };
}

function opponentList(record) {
  return Array.isArray(
    record?.scheduleContext?.games
  )
    ? record.scheduleContext.games
        .map((game) => game?.opponent)
        .filter(Boolean)
    : [];
}

export function buildNFLOpponentAdjustment(
  records,
  { iterations = 8 } = {}
) {
  const valid = (Array.isArray(records) ? records : [])
    .filter(isNFLTeamPerformanceEvidence);

  const byTeam = new Map(
    valid.map((record) => [
      record.teamAbbreviation,
      record,
    ])
  );

  const raw = new Map();

  for (const record of valid) {
    raw.set(
      record.teamAbbreviation,
      rawNet(record)
    );
  }

  const leagueRaw = average(
    [...raw.values()]
  ) ?? 0;

  let adjusted = new Map(
    [...raw.entries()].map(([team, value]) => [
      team,
      finite(value) ? value - leagueRaw : null,
    ])
  );

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = new Map();

    for (const record of valid) {
      const team = record.teamAbbreviation;
      const teamRaw = raw.get(team);

      if (!finite(teamRaw)) {
        next.set(team, null);
        continue;
      }

      const opponents =
        opponentList(record)
          .map((opponent) => adjusted.get(opponent))
          .filter(finite);

      const scheduleStrength =
        average(opponents) ?? 0;

      // Damped opponent adjustment prevents unstable feedback loops.
      const value =
        (teamRaw - leagueRaw) +
        0.5 * scheduleStrength;

      next.set(team, value);
    }

    adjusted = next;
  }

  const values = [...adjusted.values()]
    .filter(finite)
    .sort((a, b) => a - b);

  function percentile(value) {
    if (!finite(value) || values.length < 2) {
      return null;
    }

    const below =
      values.filter(
        (candidate) => candidate < value
      ).length;
    const equal =
      values.filter(
        (candidate) => candidate === value
      ).length;

    return (
      ((below + equal * 0.5) / values.length) *
      100
    );
  }

  const result = new Map();

  for (const record of valid) {
    const team = record.teamAbbreviation;
    const opponents = opponentList(record);

    const opponentRawStrengths = opponents
      .map((opponent) => raw.get(opponent))
      .filter(finite);

    const sosRaw =
      average(opponentRawStrengths);

    const adjustedValue =
      adjusted.get(team);

    const maturity = sampleMaturity(
      record?.sample?.gamesPlayed
    );

    result.set(team, {
      contract: "NFLOpponentAdjustment",
      version: NFL_OPPONENT_ADJUSTMENT_VERSION,
      teamAbbreviation: team,

      rawNetEpaPerPlay: raw.get(team),
      scheduleStrengthRawNetEpa:
        sosRaw,
      opponentAdjustedNetEpa:
        adjustedValue,
      opponentAdjustedIndex:
        percentile(adjustedValue),

      opponentsCount:
        opponentRawStrengths.length,

      sampleMaturity: maturity,

      scheduleScope: {
        phaseScope:
          record.phaseScope || "ALL",
        regularSeasonGames:
          record?.scheduleContext
            ?.regularSeasonGames || 0,
        postseasonGames:
          record?.scheduleContext
            ?.postseasonGames || 0,
      },

      methodology: {
        iterations,
        damping: 0.5,
        baseline:
          "league-centered raw net EPA/play",
      },
    });
  }

  return result;
}

export default {
  NFL_OPPONENT_ADJUSTMENT_VERSION,
  buildNFLOpponentAdjustment,
};
