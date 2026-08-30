import playerRecords from "./players/index.js";

export const footballPlayerRecords = playerRecords;

export function getFootballPlayerRecord(playerId) {
  return footballPlayerRecords[playerId] || null;
}

export default footballPlayerRecords;