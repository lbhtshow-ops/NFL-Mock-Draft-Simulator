import playerStatRows from "../../../data/footballIntelligence/nfl/rosters/sources/generatedNFLVersePlayerStatsSource.json" with { type: "json" };

import {
  buildNFLPerformanceIndexes,
  getNFLTeamPerformanceEvidenceForSeason,
  getNFLTeamPerformanceEvidenceRecordsForSeason,
} from "../../../data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceRegistry.js";

import {
  createNFLTeamDependencyEvidence,
  createUnknownNFLTeamDependencyEvidence,
  NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES,
  NFL_TEAM_DEPENDENCY_STATES,
} from "./NFLTeamDependencyEvidenceContract.js";

export const NFL_PLAYER_TEAM_DEPENDENCY_INTELLIGENCE_VERSION =
  "FIE-NFL-PLAYER-TEAM-DEPENDENCY-INTELLIGENCE-1.0.0";

export const NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY = Object.freeze({
  profileId: "lbht:nfl-player-team-dependency:v1",
  profileVersion: "1.0.0",
  state: NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES.PROVISIONAL,
  productionCalibrated: false,
  purpose:
    "Estimate team-specific offensive responsibility from prior observed participation and opportunity concentration.",
  weights: Object.freeze({
    snapParticipation: 0.50,
    opportunityShare: 0.35,
    offensivePlayInvolvement: 0.15,
  }),
  thresholds: Object.freeze({
    veryHigh: 0.75,
    high: 0.60,
    moderate: 0.40,
    low: 0.20,
  }),
  limitations: Object.freeze([
    "V1 supports offensive dependency evidence only.",
    "The dependency index is not points, win probability, WAR, or a direct team-strength adjustment.",
    "The model is a transparent provisional policy and requires historical calibration before APPROVED use.",
    "Historical expected-replacement mapping remains a separate calibration domain and is not fabricated from roster order.",
  ]),
});

const normalizeName = (value = "") =>
  String(value)
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();

const upper = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;

const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

const clamp01 = (value) =>
  finite(value) ? Math.max(0, Math.min(1, value)) : null;

function dependencyLevel(index) {
  if (!finite(index)) return NFL_TEAM_DEPENDENCY_STATES.UNKNOWN;
  if (index >= NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.thresholds.veryHigh) {
    return NFL_TEAM_DEPENDENCY_STATES.VERY_HIGH;
  }
  if (index >= NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.thresholds.high) {
    return NFL_TEAM_DEPENDENCY_STATES.HIGH;
  }
  if (index >= NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.thresholds.moderate) {
    return NFL_TEAM_DEPENDENCY_STATES.MODERATE;
  }
  if (index >= NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.thresholds.low) {
    return NFL_TEAM_DEPENDENCY_STATES.LOW;
  }
  return NFL_TEAM_DEPENDENCY_STATES.VERY_LOW;
}

function latestEligibleSeason({
  targetSeason,
  team,
  playerId,
  playerName,
}) {
  const name = normalizeName(playerName);
  const code = upper(team);

  const seasons = playerStatRows
    .filter((row) =>
      upper(row?.team) === code &&
      Number.isInteger(Number(row?.season)) &&
      Number(row.season) <= Number(targetSeason) &&
      (
        (playerId && row?.player_id === playerId) ||
        normalizeName(row?.player_name) === name
      )
    )
    .map((row) => Number(row.season));

  return seasons.length ? Math.max(...seasons) : null;
}

function playerRowsForSeason({
  season,
  team,
  playerId,
  playerName,
}) {
  const name = normalizeName(playerName);
  const code = upper(team);
  return playerStatRows.filter((row) =>
    Number(row?.season) === Number(season) &&
    upper(row?.team) === code &&
    (
      (playerId && row?.player_id === playerId) ||
      normalizeName(row?.player_name) === name
    )
  );
}

function teamRowsForSeason({ season, team }) {
  const code = upper(team);
  return playerStatRows.filter((row) =>
    Number(row?.season) === Number(season) &&
    upper(row?.team) === code
  );
}

const sum = (rows, key) =>
  rows.reduce(
    (total, row) =>
      total + (finite(Number(row?.[key])) ? Number(row[key]) : 0),
    0
  );

function opportunityShareForPosition({
  position,
  playerRows,
  teamRows,
}) {
  const pos = upper(position);

  if (pos === "QB") {
    const player = sum(playerRows, "attempts");
    const team = sum(teamRows, "attempts");
    return team > 0 ? clamp01(player / team) : null;
  }

  if (pos === "RB" || pos === "FB") {
    const player = sum(playerRows, "carries") + sum(playerRows, "targets");
    const team = sum(teamRows, "carries") + sum(teamRows, "targets");
    return team > 0 ? clamp01(player / team) : null;
  }

  if (["WR", "LWR", "RWR", "TE"].includes(pos)) {
    const player = sum(playerRows, "targets");
    const team = sum(teamRows, "targets");
    return team > 0 ? clamp01(player / team) : null;
  }

  return null;
}

function offensivePlayInvolvement({
  position,
  playerRows,
  offensivePlays,
}) {
  if (!finite(offensivePlays) || offensivePlays <= 0) return null;
  const pos = upper(position);

  let playerOpportunities = 0;

  if (pos === "QB") {
    playerOpportunities =
      sum(playerRows, "attempts") +
      sum(playerRows, "carries") +
      sum(playerRows, "sacks");
  } else if (pos === "RB" || pos === "FB") {
    playerOpportunities =
      sum(playerRows, "carries") +
      sum(playerRows, "targets");
  } else if (["WR", "LWR", "RWR", "TE"].includes(pos)) {
    playerOpportunities = sum(playerRows, "targets");
  } else {
    return null;
  }

  return clamp01(playerOpportunities / offensivePlays);
}

function weightedIndex(components) {
  const candidates = [
    {
      value: components.snapParticipation,
      weight:
        NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.weights.snapParticipation,
    },
    {
      value: components.opportunityShare,
      weight:
        NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.weights.opportunityShare,
    },
    {
      value: components.offensivePlayInvolvement,
      weight:
        NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY.weights.offensivePlayInvolvement,
    },
  ].filter((item) => finite(item.value));

  if (candidates.length < 2) return null;

  const totalWeight = candidates.reduce(
    (total, item) => total + item.weight,
    0
  );

  return candidates.reduce(
    (total, item) => total + item.value * item.weight,
    0
  ) / totalWeight;
}

function confidenceFor({
  playerGames,
  teamGames,
  componentCount,
  performanceAvailable,
  seasonAligned,
}) {
  const coverage =
    finite(playerGames) &&
    finite(teamGames) &&
    teamGames > 0
      ? clamp01(playerGames / teamGames)
      : 0;

  const componentCoverage = Math.min(1, componentCount / 3);

  return clamp01(
    0.35 +
    0.25 * coverage +
    0.20 * componentCoverage +
    (performanceAvailable ? 0.10 : 0) +
    (seasonAligned ? 0.10 : 0)
  ) ?? 0;
}

export function resolveNFLPlayerTeamDependencyEvidence({
  targetSeason,
  week = null,
  team,
  playerId = null,
  playerName,
  position,
  usageEvidence = null,
} = {}) {
  const target = Number(targetSeason);
  const code = upper(team);

  if (!Number.isInteger(target) || !code || !playerName) {
    return createUnknownNFLTeamDependencyEvidence({
      season: Number.isInteger(target) ? target : null,
      week,
      team: code,
      playerId,
      playerName,
      source: "NFL_TEAM_DEPENDENCY_INPUTS_INCOMPLETE",
      methodology: NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
    });
  }

  const evidenceSeason =
    latestEligibleSeason({
      targetSeason: target,
      team: code,
      playerId,
      playerName,
    });

  if (!Number.isInteger(evidenceSeason)) {
    return createUnknownNFLTeamDependencyEvidence({
      season: target,
      week,
      team: code,
      playerId,
      playerName,
      source: "NFLVERSE_PLAYER_STATS_UNAVAILABLE",
      methodology: NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
    });
  }

  const playerRows =
    playerRowsForSeason({
      season: evidenceSeason,
      team: code,
      playerId,
      playerName,
    });

  const teamRows =
    teamRowsForSeason({
      season: evidenceSeason,
      team: code,
    });

  const teamPerformance =
    getNFLTeamPerformanceEvidenceForSeason(
      code,
      evidenceSeason
    );

  const peerPerformance =
    getNFLTeamPerformanceEvidenceRecordsForSeason(
      evidenceSeason
    );

  const performanceIndexes =
    teamPerformance
      ? buildNFLPerformanceIndexes(
          teamPerformance,
          peerPerformance
        )
      : null;

  const snapParticipation =
    Number(usageEvidence?.season) === evidenceSeason
      ? clamp01(usageEvidence?.usage?.offenseSnapPct)
      : null;

  const opportunityShare =
    opportunityShareForPosition({
      position,
      playerRows,
      teamRows,
    });

  const offensivePlayInvolvementValue =
    offensivePlayInvolvement({
      position,
      playerRows,
      offensivePlays:
        teamPerformance?.sample?.offensivePlays ??
        teamPerformance?.sample?.offensivePlays ??
        null,
    });

  const components = {
    snapParticipation,
    opportunityShare,
    offensivePlayInvolvement: offensivePlayInvolvementValue,
  };

  const rawIndex = weightedIndex(components);
  const componentCount =
    Object.values(components).filter(finite).length;

  if (!finite(rawIndex)) {
    return createUnknownNFLTeamDependencyEvidence({
      season: target,
      week,
      team: code,
      playerId,
      playerName,
      source: "NFL_TEAM_DEPENDENCY_INSUFFICIENT_COMPONENTS",
      evidenceRefs: [
        "generatedNFLVersePlayerStatsSource",
        ...(usageEvidence
          ? ["generatedNFLVerseSnapCountsSource"]
          : []),
      ],
      methodology: NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
    });
  }

  const playerGames =
    new Set(
      playerRows
        .map((row) => Number(row?.week))
        .filter(Number.isInteger)
    ).size;

  const teamGames =
    teamPerformance?.sample?.gamesPlayed ??
    teamPerformance?.sample?.games ??
    null;

  const confidence =
    confidenceFor({
      playerGames,
      teamGames,
      componentCount,
      performanceAvailable: Boolean(teamPerformance?.available),
      seasonAligned:
        Number(usageEvidence?.season) === evidenceSeason,
    });

  return createNFLTeamDependencyEvidence({
    season: target,
    week,
    team: code,
    playerId,
    playerName,
    dependency: dependencyLevel(rawIndex),
    dependencyIndex: rawIndex * 100,
    confidence,
    source: "NFLPlayerTeamDependencyIntelligence",
    evidenceRefs: [
      "generatedNFLVersePlayerStatsSource",
      ...(usageEvidence
        ? ["generatedNFLVerseSnapCountsSource"]
        : []),
      ...(teamPerformance?.provenance?.sourceRefs || []),
    ],
    observedAt:
      teamPerformance?.freshness?.generatedAt ||
      teamPerformance?.freshness?.observedThrough ||
      null,
    methodology: {
      ...NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
      evidenceSeason,
    },
    components: {
      ...components,
      teamOffenseIndex:
        performanceIndexes?.offense ?? null,
      teamRecentFormIndex:
        performanceIndexes?.recentForm ?? null,
    },
    sample: {
      evidenceSeason,
      playerGames,
      teamGames,
      playerStatRows: playerRows.length,
      teamPerformanceAvailable:
        Boolean(teamPerformance?.available),
    },
  });
}

export default {
  NFL_PLAYER_TEAM_DEPENDENCY_INTELLIGENCE_VERSION,
  NFL_PLAYER_TEAM_DEPENDENCY_METHODOLOGY,
  resolveNFLPlayerTeamDependencyEvidence,
};
