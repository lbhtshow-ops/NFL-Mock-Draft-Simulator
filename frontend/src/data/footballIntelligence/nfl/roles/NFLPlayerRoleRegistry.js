import generatedSource from "./sources/generatedNFLPlayerRoleSource.js";

import {
  isNFLPlayerRoleEvidence,
} from "./NFLPlayerRoleEvidenceContract.js";

export const nflPlayerRoleEvidenceRecords =
  Array.isArray(generatedSource)
    ? generatedSource.filter(
        isNFLPlayerRoleEvidence
      )
    : [];

function normalizeTeam(team) {
  return typeof team === "string"
    ? team.trim().toUpperCase()
    : null;
}

export function getNFLTeamPlayerRoleEvidence(
  team,
  {
    season = null,
    week = null,
  } = {}
) {
  const abbreviation = normalizeTeam(team);

  if (!abbreviation) return [];

  const candidates =
    nflPlayerRoleEvidenceRecords
      .filter(
        (record) =>
          record.team === abbreviation
      )
      .filter(
        (record) =>
          season === null ||
          record.season === Number(season)
      );

  if (!candidates.length) return [];

  const targetWeek =
    week === null
      ? candidates.reduce(
          (max, record) =>
            Math.max(max, record.week),
          -1
        )
      : Number(week);

  return candidates.filter(
    (record) =>
      record.week === targetWeek
  );
}

export default {
  nflPlayerRoleEvidenceRecords,
  getNFLTeamPlayerRoleEvidence,
};
