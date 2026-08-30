import {
  createNFLPlayerRoleEvidence,
} from "./NFLPlayerRoleEvidenceContract.js";

function value(row, ...keys) {
  for (const key of keys) {
    if (
      row &&
      Object.prototype.hasOwnProperty.call(row, key) &&
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }

  return null;
}

function keyFor({
  season,
  week,
  team,
  playerId,
  playerName,
}) {
  return [
    season,
    week,
    String(team || "").toUpperCase(),
    playerId || "",
    String(playerName || "").toLowerCase(),
  ].join("|");
}

export function adaptNFLVerseDepthChartRows(
  rows = [],
  { sourceUrl = null, generatedAt = null } = {}
) {
  const evidence = [];

  for (const row of rows) {
    try {
      evidence.push(
        createNFLPlayerRoleEvidence({
          season: value(row, "season"),
          week: value(row, "week"),
          team: value(row, "team", "club_code"),
          playerId: value(
            row,
            "gsis_id",
            "player_id",
            "playerId",
            "espn_id"
          ),
          playerName: value(
            row,
            "full_name",
            "player_name",
            "playerName"
          ),
          position: value(
            row,
            "position",
            "pos_abb",
            "position_group"
          ),
          depthPosition: value(
            row,
            "depth_position",
            "pos_grp",
            "position"
          ),
          depthRank: value(
            row,
            "depth_team",
            "depth_rank",
            "rank"
          ),
          formation: value(
            row,
            "formation"
          ),
          source: "nflverse-depth-charts",
          sourceUrl,
          generatedAt,
        })
      );
    } catch {
      // Incomplete rows remain excluded.
    }
  }

  return evidence;
}

export function mergeNFLVerseSnapCountRows(
  roleEvidence = [],
  snapRows = [],
  { sourceUrl = null, generatedAt = null } = {}
) {
  const byKey = new Map();

  for (const evidence of roleEvidence) {
    byKey.set(
      keyFor({
        season: evidence.season,
        week: evidence.week,
        team: evidence.team,
        playerId: evidence.player.playerId,
        playerName: evidence.player.playerName,
      }),
      evidence
    );
  }

  for (const row of snapRows) {
    const season = Number(value(row, "season"));
    const week = Number(value(row, "week"));
    const team = value(row, "team");
    const playerId = value(
      row,
      "gsis_id",
      "player_id",
      "playerId"
    );
    const playerName = value(
      row,
      "full_name",
      "player_name",
      "playerName"
    );

    const key = keyFor({
      season,
      week,
      team,
      playerId,
      playerName,
    });

    const existing = byKey.get(key);

    try {
      const enriched =
        createNFLPlayerRoleEvidence({
          season,
          week,
          team,
          playerId:
            playerId ||
            existing?.player?.playerId,
          playerName:
            playerName ||
            existing?.player?.playerName,
          position:
            value(row, "position") ||
            existing?.player?.position,
          depthPosition:
            existing?.depthChart?.position,
          depthRank:
            existing?.depthChart?.rank,
          formation:
            existing?.depthChart?.formation,
          offenseSnapPct: value(
            row,
            "offense_pct",
            "offense_snap_pct",
            "offense_percent"
          ),
          defenseSnapPct: value(
            row,
            "defense_pct",
            "defense_snap_pct",
            "defense_percent"
          ),
          specialTeamsSnapPct: value(
            row,
            "st_pct",
            "special_teams_pct",
            "special_teams_percent"
          ),
          source:
            existing
              ? "nflverse-depth-charts+snap-counts"
              : "nflverse-snap-counts",
          sourceUrl:
            sourceUrl ||
            existing?.provenance?.sourceUrl,
          generatedAt:
            generatedAt ||
            existing?.provenance?.generatedAt,
        });

      byKey.set(key, enriched);
    } catch {
      // Invalid snap rows remain excluded.
    }
  }

  return [...byKey.values()];
}

export default {
  adaptNFLVerseDepthChartRows,
  mergeNFLVerseSnapCountRows,
};
