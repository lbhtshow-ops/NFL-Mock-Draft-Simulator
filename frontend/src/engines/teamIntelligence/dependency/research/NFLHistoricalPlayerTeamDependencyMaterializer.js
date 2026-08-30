export const NFL_HISTORICAL_PLAYER_TEAM_DEPENDENCY_MATERIALIZER_VERSION =
  "FIE-NFL-HISTORICAL-PLAYER-TEAM-DEPENDENCY-MATERIALIZER-1.0.0";

export const HISTORICAL_TEAM_DEPENDENCY_METHODOLOGY = Object.freeze({
  profileId: "lbht:nfl-player-team-dependency:v1",
  profileVersion: "1.0.0",
  state: "PROVISIONAL",
  productionCalibrated: false,
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
  historicalRestriction:
    "ONLY_ROWS_STRICTLY_BEFORE_TARGET_GAME_WEEK_OR_PRIOR_SEASON_MAY_ENTER_PREGAME_CALIBRATION_EVIDENCE",
  limitations: Object.freeze([
    "Historical V1 dependency evidence supports offensive positions only.",
    "Snap counts are postgame observations and are eligible only from games before the target game.",
    "Target-week and future-week evidence are excluded.",
    "Dependency index is research evidence, not points, win probability, WAR, or Team Strength.",
    "No production coefficient or Player Impact to Team Strength transformation is authorized.",
  ]),
});

const finite = (value) => Number.isFinite(Number(value));
const num = (value) => (finite(value) ? Number(value) : null);
const upper = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
const clamp01 = (value) =>
  finite(value) ? Math.max(0, Math.min(1, Number(value))) : null;

function positionUsageField(position) {
  const pos = upper(position);
  if (["QB", "RB", "FB", "WR", "LWR", "RWR", "TE", "C", "G", "OG", "T", "OT", "IOL"].includes(pos)) {
    return "offense_pct";
  }
  if (["EDGE", "DE", "DT", "NT", "LB", "CB", "S", "DB"].includes(pos)) {
    return "defense_pct";
  }
  return null;
}

function priorRows(rows, { season, week, team, playerId = null }) {
  const targetSeason = Number(season);
  const targetWeek = Number(week);
  const code = upper(team);
  return rows.filter((row) => {
    const rowSeason = Number(row?.season);
    const rowWeek = Number(row?.week);
    const samePlayer = playerId && row?.gsis_id === playerId;
    const sameTeam = upper(row?.team) === code;
    if (!samePlayer || !sameTeam || !Number.isInteger(rowSeason) || !Number.isInteger(rowWeek)) return false;
    return rowSeason < targetSeason || (rowSeason === targetSeason && rowWeek < targetWeek);
  });
}

function latestEvidenceSeason(rows) {
  const seasons = rows.map((row) => Number(row?.season)).filter(Number.isInteger);
  return seasons.length ? Math.max(...seasons) : null;
}

function seasonRows(rows, season) {
  return rows.filter((row) => Number(row?.season) === Number(season));
}

function average(rows, field) {
  const values = rows.map((row) => num(row?.[field])).filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function usageEvidenceForObservation(observation, snapRows) {
  const identity = observation?.identity || {};
  const eligible = priorRows(snapRows, {
    season: identity.season,
    week: identity.week,
    team: identity.team,
    playerId: identity.unavailablePlayerId,
  });
  const evidenceSeason = latestEvidenceSeason(eligible);
  if (!Number.isInteger(evidenceSeason)) {
    return {
      status: "UNAVAILABLE",
      reason: "NO_PRIOR_SNAP_EVIDENCE",
      evidenceSeason: null,
      gamesTracked: 0,
      selectedSnapPct: null,
      usage: null,
      temporalSafe: true,
    };
  }
  const rows = seasonRows(eligible, evidenceSeason);
  const field = positionUsageField(identity.position);
  const offenseSnapPct = average(rows, "offense_pct");
  const defenseSnapPct = average(rows, "defense_pct");
  const specialTeamsSnapPct = average(rows, "st_pct");
  const selectedSnapPct = field ? average(rows, field) :
    offenseSnapPct ?? defenseSnapPct ?? specialTeamsSnapPct;
  return {
    contract: "NFLHistoricalPlayerUsageEvidence",
    version: "FIE-NFL-HISTORICAL-PLAYER-USAGE-EVIDENCE-1.0.0",
    status: selectedSnapPct === null ? "UNAVAILABLE" : "AVAILABLE",
    reason: selectedSnapPct === null ? "POSITION_RELEVANT_SNAP_PERCENTAGE_UNAVAILABLE" : null,
    evidenceSeason,
    throughWeek:
      evidenceSeason === Number(identity.season)
        ? Math.max(...rows.map((row) => Number(row.week)))
        : Math.max(...rows.map((row) => Number(row.week))),
    gamesTracked: rows.length,
    selectedSnapPct,
    usage: {
      offenseSnapPct,
      defenseSnapPct,
      specialTeamsSnapPct,
    },
    temporalSafe: rows.every((row) =>
      Number(row.season) < Number(identity.season) ||
      (Number(row.season) === Number(identity.season) && Number(row.week) < Number(identity.week))
    ),
    provenance: {
      source: "historical-snap-counts-resolved.jsonl",
      basis: evidenceSeason === Number(identity.season)
        ? "TARGET_SEASON_PRIOR_GAMES_AVERAGE"
        : "MOST_RECENT_PRIOR_SEASON_AVERAGE",
      evidenceTiming: "POSTGAME_PARTICIPATION_FROM_PRIOR_GAMES_ONLY",
    },
  };
}

function statsPriorRows(rows, { season, week, team }) {
  const targetSeason = Number(season);
  const targetWeek = Number(week);
  const code = upper(team);
  return rows.filter((row) => {
    const rowSeason = Number(row?.season);
    const rowWeek = Number(row?.week);
    if (upper(row?.team) !== code || !Number.isInteger(rowSeason) || !Number.isInteger(rowWeek)) return false;
    return rowSeason < targetSeason || (rowSeason === targetSeason && rowWeek < targetWeek);
  });
}

const sum = (rows, key) =>
  rows.reduce((total, row) => total + (finite(row?.[key]) ? Number(row[key]) : 0), 0);

function opportunityShareForPosition({ position, playerRows, teamRows }) {
  const pos = upper(position);
  if (pos === "QB") {
    const player = sum(playerRows, "attempts");
    const team = sum(teamRows, "attempts");
    return team > 0 ? clamp01(player / team) : null;
  }
  if (["RB", "FB"].includes(pos)) {
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

function offensivePlayInvolvement({ position, playerRows, teamRows }) {
  const offensivePlays = sum(teamRows, "attempts") + sum(teamRows, "carries") + sum(teamRows, "sacks");
  if (!finite(offensivePlays) || offensivePlays <= 0) return null;
  const pos = upper(position);
  let opportunities = 0;
  if (pos === "QB") {
    opportunities = sum(playerRows, "attempts") + sum(playerRows, "carries") + sum(playerRows, "sacks");
  } else if (["RB", "FB"].includes(pos)) {
    opportunities = sum(playerRows, "carries") + sum(playerRows, "targets");
  } else if (["WR", "LWR", "RWR", "TE"].includes(pos)) {
    opportunities = sum(playerRows, "targets");
  } else {
    return null;
  }
  return clamp01(opportunities / offensivePlays);
}

function weightedIndex(components) {
  const weights = HISTORICAL_TEAM_DEPENDENCY_METHODOLOGY.weights;
  const candidates = [
    [components.snapParticipation, weights.snapParticipation],
    [components.opportunityShare, weights.opportunityShare],
    [components.offensivePlayInvolvement, weights.offensivePlayInvolvement],
  ].filter(([value]) => finite(value));
  if (candidates.length < 2) return null;
  const totalWeight = candidates.reduce((sum, [, weight]) => sum + weight, 0);
  return candidates.reduce((sum, [value, weight]) => sum + Number(value) * weight, 0) / totalWeight;
}

function dependencyLevel(index) {
  if (!finite(index)) return "UNKNOWN";
  const t = HISTORICAL_TEAM_DEPENDENCY_METHODOLOGY.thresholds;
  if (index >= t.veryHigh) return "VERY_HIGH";
  if (index >= t.high) return "HIGH";
  if (index >= t.moderate) return "MODERATE";
  if (index >= t.low) return "LOW";
  return "VERY_LOW";
}

function confidenceFor({ playerWeeks, teamWeeks, componentCount, seasonAligned }) {
  const coverage = teamWeeks > 0 ? clamp01(playerWeeks / teamWeeks) : 0;
  const componentCoverage = Math.min(1, componentCount / 3);
  return clamp01(0.35 + 0.25 * coverage + 0.20 * componentCoverage + (seasonAligned ? 0.10 : 0)) ?? 0;
}

function dependencyEvidenceForObservation(observation, usageEvidence, playerStatRows) {
  const identity = observation?.identity || {};
  const position = upper(identity.position);
  const offensive = ["QB", "RB", "FB", "WR", "LWR", "RWR", "TE"].includes(position);
  if (!offensive) {
    return {
      status: "UNAVAILABLE",
      reason: "CANONICAL_DEPENDENCY_V1_OFFENSIVE_POSITIONS_ONLY",
      dependency: "UNKNOWN",
      dependencyIndex: null,
      confidence: 0,
      components: null,
    };
  }
  const eligibleTeamRows = statsPriorRows(playerStatRows, identity);
  const seasons = eligibleTeamRows.map((row) => Number(row.season)).filter(Number.isInteger);
  if (!seasons.length) {
    return {
      status: "UNAVAILABLE",
      reason: "NO_PRIOR_PLAYER_STATS_EVIDENCE",
      dependency: "UNKNOWN",
      dependencyIndex: null,
      confidence: 0,
      components: null,
    };
  }
  const evidenceSeason = Math.max(...seasons);
  const teamRows = eligibleTeamRows.filter((row) => Number(row.season) === evidenceSeason);
  const playerRows = teamRows.filter((row) => row?.player_id === identity.unavailablePlayerId);
  const snapParticipation = usageEvidence?.evidenceSeason === evidenceSeason
    ? usageEvidence?.selectedSnapPct ?? null
    : null;
  const opportunityShare = opportunityShareForPosition({ position, playerRows, teamRows });
  const offensivePlay = offensivePlayInvolvement({ position, playerRows, teamRows });
  const components = {
    snapParticipation,
    opportunityShare,
    offensivePlayInvolvement: offensivePlay,
  };
  const index01 = weightedIndex(components);
  const componentCount = Object.values(components).filter(finite).length;
  const playerWeeks = new Set(playerRows.map((row) => `${row.season}:${row.week}`)).size;
  const teamWeeks = new Set(teamRows.map((row) => `${row.season}:${row.week}`)).size;
  const seasonAligned = evidenceSeason === Number(identity.season);
  if (index01 === null) {
    return {
      status: "UNAVAILABLE",
      reason: "INSUFFICIENT_CANONICAL_DEPENDENCY_COMPONENTS",
      evidenceSeason,
      dependency: "UNKNOWN",
      dependencyIndex: null,
      confidence: 0,
      components,
      componentCount,
    };
  }
  return {
    contract: "NFLTeamDependencyEvidence",
    version: "FIE-NFL-TEAM-DEPENDENCY-EVIDENCE-1.2.0",
    status: "AVAILABLE",
    reason: null,
    season: Number(identity.season),
    week: Number(identity.week),
    team: upper(identity.team),
    player: { playerId: identity.unavailablePlayerId ?? null },
    evidenceSeason,
    dependency: dependencyLevel(index01),
    dependencyIndex: Math.round(index01 * 10000) / 100,
    confidence: confidenceFor({ playerWeeks, teamWeeks, componentCount, seasonAligned }),
    components,
    sample: { playerWeeks, teamWeeks },
    provenance: {
      source: "historical-prior-game-snap-and-player-stats-evidence",
      methodology: HISTORICAL_TEAM_DEPENDENCY_METHODOLOGY,
      evidenceTiming: "PRIOR_GAMES_ONLY",
    },
  };
}

export function materializeHistoricalObservedUsageDependency({
  observations = [],
  snapRows = [],
  playerStatRows = [],
} = {}) {
  return observations.map((observation) => {
    const usageEvidence = usageEvidenceForObservation(observation, snapRows);
    const teamDependencyEvidence = dependencyEvidenceForObservation(
      observation,
      usageEvidence,
      playerStatRows
    );
    return {
      contract: "NFLHistoricalObservedUsageDependencyEvidence",
      contractVersion: "FIE-NFL-HISTORICAL-OBSERVED-USAGE-DEPENDENCY-EVIDENCE-1.0.0",
      identity: { ...(observation?.identity || {}) },
      usageEvidence,
      teamDependencyEvidence,
      provenance: {
        calibrationObservation: "historical-availability-impact-calibration-observations-v1.jsonl",
        snapEvidence: "historical-snap-counts-resolved.jsonl",
        playerStatsEvidence: "generatedNFLVersePlayerStatsSource.json",
      },
      safeguards: {
        targetWeekSnapEvidenceUsed: false,
        futureSnapEvidenceUsed: false,
        targetWeekPlayerStatsUsed: false,
        futurePlayerStatsUsed: false,
        dependencyMethodologyState: "PROVISIONAL",
        productionCoefficientCreated: false,
        teamStrengthMutated: false,
        decisionModelMutated: false,
        pickemMutated: false,
        shadowOnlyPreserved: true,
      },
    };
  });
}

export default {
  NFL_HISTORICAL_PLAYER_TEAM_DEPENDENCY_MATERIALIZER_VERSION,
  HISTORICAL_TEAM_DEPENDENCY_METHODOLOGY,
  materializeHistoricalObservedUsageDependency,
};
