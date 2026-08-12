import { normalizeNFLRosterPlayer } from "./normalizeNFLRosterPlayer.js";

export function importNFLRosterRecords(rawRoster = []) {
  return rawRoster.reduce((teamRosters, rawPlayer) => {
    const normalizedPlayer = normalizeNFLRosterPlayer(rawPlayer);
    const teamAbbreviation = normalizedPlayer?.identity?.team;

    if (!teamAbbreviation) {
      return teamRosters;
    }

    return {
      ...teamRosters,
      [teamAbbreviation]: [
        ...(teamRosters[teamAbbreviation] || []),
        normalizedPlayer,
      ],
    };
  }, {});
}

export default importNFLRosterRecords;