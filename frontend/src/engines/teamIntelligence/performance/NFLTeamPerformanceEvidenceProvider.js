import {
  createNFLTeamPerformanceEvidence,
} from "./NFLTeamPerformanceEvidenceContract.js";

export const NFL_TEAM_PERFORMANCE_PROVIDER_CONTRACT =
  "NFLTeamPerformanceEvidenceProvider";
export const NFL_TEAM_PERFORMANCE_PROVIDER_VERSION =
  "NFL-TEAM-PERFORMANCE-PROVIDER-1.0.0";

function normalizeTeam(team) {
  if (typeof team === "string") return team.trim().toUpperCase();
  if (!team || typeof team !== "object") return null;
  const value =
    team.teamAbbreviation || team.abbreviation || team.team || team.code || team.id;
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

export function createNFLTeamPerformanceEvidenceProvider(records = []) {
  const normalizedRecords = Array.isArray(records)
    ? records.map(createNFLTeamPerformanceEvidence)
    : [];

  return Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_PROVIDER_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_PROVIDER_VERSION,

    resolve(team, { season = null, throughWeek = null } = {}) {
      const teamAbbreviation = normalizeTeam(team);
      if (!teamAbbreviation) return null;

      const candidates = normalizedRecords.filter((record) => {
        if (!record.validation.valid) return false;
        if (record.teamAbbreviation !== teamAbbreviation) return false;
        if (season !== null && record.season !== season) return false;
        if (throughWeek !== null && record.throughWeek !== throughWeek) return false;
        return true;
      });

      if (candidates.length === 0) return null;

      return candidates.sort((a, b) => {
        const seasonDelta = (b.season || 0) - (a.season || 0);
        if (seasonDelta !== 0) return seasonDelta;
        return (b.throughWeek || 0) - (a.throughWeek || 0);
      })[0];
    },
  });
}

export const emptyNFLTeamPerformanceEvidenceProvider =
  createNFLTeamPerformanceEvidenceProvider([]);

export default {
  NFL_TEAM_PERFORMANCE_PROVIDER_CONTRACT,
  NFL_TEAM_PERFORMANCE_PROVIDER_VERSION,
  createNFLTeamPerformanceEvidenceProvider,
  emptyNFLTeamPerformanceEvidenceProvider,
};
