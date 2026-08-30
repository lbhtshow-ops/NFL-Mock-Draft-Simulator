import generatedSource from "./sources/generatedNFLPlayerAvailabilitySource.js";

import {
  isNFLPlayerAvailabilityEvidence,
} from "./NFLPlayerAvailabilityEvidenceContract.js";

export const nflPlayerAvailabilityEvidenceRecords =
  Array.isArray(generatedSource)
    ? generatedSource.filter(
        isNFLPlayerAvailabilityEvidence
      )
    : [];

function normalizeTeam(team) {
  return typeof team === "string"
    ? team.trim().toUpperCase()
    : null;
}

export function getNFLTeamAvailabilityEvidence(
  team,
  {
    season = null,
    week = null,
    gameType = null,
  } = {}
) {
  const abbreviation = normalizeTeam(team);

  if (!abbreviation) return [];

  const candidates =
    nflPlayerAvailabilityEvidenceRecords
      .filter(
        (record) =>
          record.team === abbreviation
      )
      .filter(
        (record) =>
          season === null ||
          record.season === Number(season)
      )
      .filter(
        (record) =>
          week === null ||
          record.week === Number(week)
      )
      .filter(
        (record) =>
          gameType === null ||
          record.gameType ===
            String(gameType).toUpperCase()
      );

  if (week !== null) return candidates;

  const latestWeek = candidates.reduce(
    (max, record) =>
      Math.max(max, record.week),
    -1
  );

  return latestWeek >= 0
    ? candidates.filter(
        (record) =>
          record.week === latestWeek
      )
    : [];
}

export function getLatestNFLAvailabilityWeek(
  season
) {
  return nflPlayerAvailabilityEvidenceRecords
    .filter(
      (record) =>
        season === null ||
        record.season === Number(season)
    )
    .reduce(
      (max, record) =>
        Math.max(max, record.week),
      -1
    );
}

export default {
  nflPlayerAvailabilityEvidenceRecords,
  getNFLTeamAvailabilityEvidence,
  getLatestNFLAvailabilityWeek,
};
