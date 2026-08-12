import generatedSource from "./sources/generatedNFLAdvancedMatchupSource.js";

import {
  isNFLAdvancedTeamMatchupEvidence,
} from "./NFLAdvancedTeamMatchupEvidenceContract.js";

export const nflAdvancedMatchupEvidenceRecords =
  Array.isArray(generatedSource)
    ? generatedSource.filter(
        isNFLAdvancedTeamMatchupEvidence
      )
    : [];

function normalizeTeam(team) {
  return typeof team === "string"
    ? team.trim().toUpperCase()
    : null;
}

export function getNFLAdvancedTeamMatchupEvidence(
  team,
  {
    season = null,
    throughWeek = null,
    phaseScope = null,
  } = {}
) {
  const abbreviation = normalizeTeam(team);

  if (!abbreviation) return null;

  return (
    nflAdvancedMatchupEvidenceRecords
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
          phaseScope === null ||
          record.phaseScope === phaseScope
      )
      .filter(
        (record) =>
          throughWeek === null ||
          record.throughWeek === null ||
          record.throughWeek <= Number(throughWeek)
      )
      .sort((a, b) => {
        if (a.season !== b.season) {
          return b.season - a.season;
        }

        return (
          (b.throughWeek ?? 999) -
          (a.throughWeek ?? 999)
        );
      })[0] || null
  );
}

export default {
  nflAdvancedMatchupEvidenceRecords,
  getNFLAdvancedTeamMatchupEvidence,
};
