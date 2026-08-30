import snapCountRows from "../data/footballIntelligence/nfl/rosters/sources/generatedNFLVerseSnapCountsSource.json" with { type: "json" };

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTotalSnaps(row = {}) {
  return (
    (row.offense_snaps || 0) +
    (row.defense_snaps || 0) +
    (row.st_snaps || 0)
  );
}

function createEmptyUsageProfile(row = {}) {
  return {
    playerId: row.player_id || null,
    playerName: row.player_name || null,
    team: row.team || null,
    position: row.position || null,

    gamesTracked: 0,

    offenseSnaps: 0,
    defenseSnaps: 0,
    specialTeamsSnaps: 0,
    totalSnaps: 0,

    maxWeeklySnapShare: 0,
    averageWeeklySnapShare: 0,
  };
}

function addUsageRow(index, key, row) {
  if (!key) return;

  if (!index[key]) {
    index[key] = createEmptyUsageProfile(row);
  }

  const profile = index[key];

  const weeklySnapShare = Math.max(
    row.offense_pct || 0,
    row.defense_pct || 0,
    row.st_pct || 0
  );

  profile.gamesTracked += 1;

  profile.offenseSnaps += row.offense_snaps || 0;
  profile.defenseSnaps += row.defense_snaps || 0;
  profile.specialTeamsSnaps += row.st_snaps || 0;

  profile.totalSnaps += getTotalSnaps(row);

  profile.maxWeeklySnapShare = Math.max(
    profile.maxWeeklySnapShare,
    weeklySnapShare
  );

  profile.averageWeeklySnapShare =
    profile.gamesTracked > 0
      ? Math.round(
          (profile.totalSnaps / profile.gamesTracked) * 10
        ) / 10
      : 0;
}

export const playerUsageIndex = {};

snapCountRows.forEach((row) => {
  const playerId = row.player_id || null;
  const normalizedName = normalizeName(row.player_name);
  const team = row.team || null;

  addUsageRow(playerUsageIndex, playerId, row);

  addUsageRow(
    playerUsageIndex,
    `${team}-${normalizedName}`,
    row
  );

  addUsageRow(
    playerUsageIndex,
    normalizedName,
    row
  );
});

export function getPlayerUsageProfile(player = {}) {
  const playerId =
    player?.playerId ||
    player?.identity?.playerId ||
    player?.id ||
    null;

  const playerName =
    player?.identity?.playerName ||
    player?.name ||
    null;

  const normalizedName = normalizeName(playerName);

  const team =
    player?.identity?.team ||
    player?.team ||
    null;

  if (playerUsageIndex[playerId]) {
    return {
      ...playerUsageIndex[playerId],
      matchedBy: "playerId",
    };
  }

  if (playerUsageIndex[`${team}-${normalizedName}`]) {
    return {
      ...playerUsageIndex[`${team}-${normalizedName}`],
      matchedBy: "teamName",
    };
  }

  if (playerUsageIndex[normalizedName]) {
    return {
      ...playerUsageIndex[normalizedName],
      matchedBy: "normalizedName",
    };
  }

  return null;
}

export default {
  playerUsageIndex,
  getPlayerUsageProfile,
};