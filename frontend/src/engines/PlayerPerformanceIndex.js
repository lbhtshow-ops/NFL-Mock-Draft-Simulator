import playerStatRows from "../data/footballIntelligence/nfl/rosters/sources/generatedNFLVersePlayerStatsSource.json";

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createEmptyPerformanceProfile(row = {}) {
  return {
    playerId: row.player_id || null,
    playerName: row.player_name || null,
    team: row.team || null,
    position: row.position || null,

    gamesTracked: 0,

    completions: 0,
    attempts: 0,
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    sacksTaken: 0,
    sackYardsLost: 0,
    passingAirYards: 0,
    passingYardsAfterCatch: 0,
    passingFirstDowns: 0,
    passingEPA: 0,

    carries: 0,
    rushingYards: 0,
    rushingTDs: 0,
    rushingFirstDowns: 0,
    rushingEPA: 0,
    fumbles: 0,
    fumblesLost: 0,

    targets: 0,
    receptions: 0,
    receivingYards: 0,
    receivingTDs: 0,

    sacks: 0,
    tackles: 0,
    defensiveInterceptions: 0,

    fantasyPoints: 0,
  };
}

function addStatRow(index, key, row) {
  if (!key) return;

  if (!index[key]) {
    index[key] = createEmptyPerformanceProfile(row);
  }

  const profile = index[key];

  profile.gamesTracked += 1;

  profile.completions += row.completions || 0;
  profile.attempts += row.attempts || 0;
  profile.passingYards += row.passing_yards || 0;
  profile.passingTDs += row.passing_tds || 0;
  profile.interceptions += row.interceptions || 0;
  profile.sacksTaken += row.sacks || 0;
  profile.sackYardsLost += row.sack_yards || 0;
  profile.passingAirYards += row.passing_air_yards || 0;
  profile.passingYardsAfterCatch += row.passing_yards_after_catch || 0;
  profile.passingFirstDowns += row.passing_first_downs || 0;
  profile.passingEPA += row.passing_epa || 0;

  profile.carries += row.carries || 0;
  profile.rushingYards += row.rushing_yards || 0;
  profile.rushingTDs += row.rushing_tds || 0;
  profile.rushingFirstDowns += row.rushing_first_downs || 0;
  profile.rushingEPA += row.rushing_epa || 0;
  profile.fumbles += row.fumbles || 0;
  profile.fumblesLost += row.fumbles_lost || 0;

  profile.targets += row.targets || 0;
  profile.receptions += row.receptions || 0;
  profile.receivingYards += row.receiving_yards || 0;
  profile.receivingTDs += row.receiving_tds || 0;

  profile.sacks += row.def_sacks || row.sacks_defense || 0;
  profile.tackles += row.tackles || 0;
  profile.defensiveInterceptions += row.interceptions_defense || 0;

  profile.fantasyPoints += row.fantasy_points || 0;
}

export const playerPerformanceIndex = {};

playerStatRows.forEach((row) => {
  const playerId = row.player_id || null;
  const playerName = row.player_name || null;
  const normalizedName = normalizeName(playerName);
  const team = row.team || null;

  addStatRow(playerPerformanceIndex, playerId, row);
  addStatRow(playerPerformanceIndex, `${team}-${playerName}`, row);
  addStatRow(playerPerformanceIndex, `${team}-${normalizedName}`, row);
  addStatRow(playerPerformanceIndex, normalizedName, row);
});

export function getPlayerPerformanceProfile(player = {}) {
  const playerId =
    player?.playerId ||
    player?.identity?.playerId ||
    player?.id ||
    null;

  const playerName = player?.identity?.playerName || player?.name || null;
  const normalizedName = normalizeName(playerName);
  const team = player?.identity?.team || player?.team || null;

  const byPlayerId = playerPerformanceIndex[playerId];
  if (byPlayerId) {
    return {
      ...byPlayerId,
      matchedBy: "playerId",
    };
  }

  const byTeamName = playerPerformanceIndex[`${team}-${playerName}`];
  if (byTeamName) {
    return {
      ...byTeamName,
      matchedBy: "teamName",
    };
  }

  const byTeamNormalizedName =
    playerPerformanceIndex[`${team}-${normalizedName}`];
  if (byTeamNormalizedName) {
    return {
      ...byTeamNormalizedName,
      matchedBy: "teamNormalizedName",
    };
  }

  const byNormalizedName = playerPerformanceIndex[normalizedName];
  if (byNormalizedName) {
    return {
      ...byNormalizedName,
      matchedBy: "normalizedName",
    };
  }

  return null;
}

export default {
  playerPerformanceIndex,
  getPlayerPerformanceProfile,
};