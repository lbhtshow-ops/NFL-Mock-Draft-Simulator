export const NFL_PLAYER_ROLE_EVIDENCE_CONTRACT =
  "NFLPlayerRoleEvidence";

export const NFL_PLAYER_ROLE_EVIDENCE_VERSION =
  "NFL-PLAYER-ROLE-EVIDENCE-1.0.0";

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createNFLPlayerRoleEvidence({
  season,
  week,
  team,
  playerId = null,
  playerName = null,
  position = null,
  depthPosition = null,
  depthRank = null,
  formation = null,
  offenseSnapPct = null,
  defenseSnapPct = null,
  specialTeamsSnapPct = null,
  source = null,
  sourceUrl = null,
  generatedAt = null,
} = {}) {
  const normalizedSeason = integerOrNull(season);
  const normalizedWeek = integerOrNull(week);
  const normalizedTeam = stringOrNull(team)?.toUpperCase() || null;

  if (!normalizedSeason || !normalizedWeek || !normalizedTeam) {
    throw new Error(
      "NFL Player Role Evidence requires season, week, and team."
    );
  }

  const normalizePct = (value) => {
    const numeric = finiteOrNull(value);

    if (numeric === null) return null;

    const zeroToOne =
      numeric > 1 ? numeric / 100 : numeric;

    return clamp(zeroToOne, 0, 1);
  };

  return {
    contract: NFL_PLAYER_ROLE_EVIDENCE_CONTRACT,
    version: NFL_PLAYER_ROLE_EVIDENCE_VERSION,

    season: normalizedSeason,
    week: normalizedWeek,
    team: normalizedTeam,

    player: {
      playerId: stringOrNull(playerId),
      playerName: stringOrNull(playerName),
      position: stringOrNull(position)?.toUpperCase() || null,
    },

    depthChart: {
      position:
        stringOrNull(depthPosition)?.toUpperCase() || null,
      rank: integerOrNull(depthRank),
      formation: stringOrNull(formation),
    },

    usage: {
      offenseSnapPct: normalizePct(offenseSnapPct),
      defenseSnapPct: normalizePct(defenseSnapPct),
      specialTeamsSnapPct:
        normalizePct(specialTeamsSnapPct),
    },

    provenance: {
      source: stringOrNull(source),
      sourceUrl: stringOrNull(sourceUrl),
      generatedAt: stringOrNull(generatedAt),
    },
  };
}

export function isNFLPlayerRoleEvidence(value) {
  return Boolean(
    value &&
      value.contract === NFL_PLAYER_ROLE_EVIDENCE_CONTRACT &&
      value.version === NFL_PLAYER_ROLE_EVIDENCE_VERSION &&
      Number.isInteger(value.season) &&
      Number.isInteger(value.week) &&
      typeof value.team === "string"
  );
}

export default {
  NFL_PLAYER_ROLE_EVIDENCE_CONTRACT,
  NFL_PLAYER_ROLE_EVIDENCE_VERSION,
  createNFLPlayerRoleEvidence,
  isNFLPlayerRoleEvidence,
};
