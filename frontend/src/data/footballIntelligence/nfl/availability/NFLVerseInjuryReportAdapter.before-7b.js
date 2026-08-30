import {
  createNFLPlayerAvailabilityEvidence,
} from "./NFLPlayerAvailabilityEvidenceContract.js";

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

export function adaptNFLVerseInjuryRow(
  row,
  { sourceUrl = null } = {}
) {
  return createNFLPlayerAvailabilityEvidence({
    season: value(row, "season"),
    week: value(row, "week"),
    gameType: value(row, "game_type", "gameType") || "REG",
    team: value(row, "team", "club_code"),
    playerId: value(row, "gsis_id", "player_id", "playerId"),
    playerName: value(
      row,
      "full_name",
      "player_name",
      "playerName"
    ),
    position: value(row, "position"),
    primaryInjury: value(
      row,
      "report_primary_injury",
      "practice_primary_injury"
    ),
    secondaryInjury: value(
      row,
      "report_secondary_injury",
      "practice_secondary_injury"
    ),
    reportStatus: value(row, "report_status"),
    practiceStatus: value(row, "practice_status"),
    modifiedAt: value(row, "date_modified"),
    sourceUrl,
  });
}

export function adaptNFLVerseInjuryRows(
  rows = [],
  options = {}
) {
  const evidence = [];

  for (const row of rows) {
    try {
      evidence.push(
        adaptNFLVerseInjuryRow(row, options)
      );
    } catch {
      // Invalid/incomplete rows remain excluded rather than being
      // promoted into canonical evidence.
    }
  }

  return evidence;
}

export default {
  adaptNFLVerseInjuryRow,
  adaptNFLVerseInjuryRows,
};
