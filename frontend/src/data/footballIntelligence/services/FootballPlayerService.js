import {
  footballPlayerRecords,
  getFootballPlayerRecord,
} from "../database";

export function getAllFootballPlayers() {
  return Object.values(footballPlayerRecords);
}

export function getFootballPlayer(playerId) {
  return getFootballPlayerRecord(playerId);
}

export function getPlayersByPosition(position) {
  return getAllFootballPlayers().filter(
    (player) => player.identity.position === position
  );
}

export function getPlayersBySchool(school) {
  return getAllFootballPlayers().filter(
    (player) => player.identity.school === school
  );
}

export default {
  getAllFootballPlayers,
  getFootballPlayer,
  getPlayersByPosition,
  getPlayersBySchool,
};