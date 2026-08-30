import generatedSource from "./sources/generatedNFLTeamPerformanceSource.js";

import {
  isNFLTeamPerformanceEvidence,
} from "./NFLTeamPerformanceEvidenceContract.js";

import {
  buildNFLOpponentAdjustment,
} from "./NFLOpponentAdjustmentEngine.js";

function normalizeTeam(team) {
  if (typeof team !== "string") return null;
  const code = team.trim().toUpperCase();
  if (!code) return null;

  // nflverse uses LA for the Rams while LBHT's canonical NFL API uses LAR.
  // Normalize only at this source-registry boundary so application/API identity
  // remains LAR and source-controlled performance evidence remains reusable.
  return code === "LAR" ? "LA" : code;
}

function latestByTeam(records) {
  const map = new Map();

  for (const record of records) {
    if (!isNFLTeamPerformanceEvidence(record)) continue;

    const team = normalizeTeam(record.teamAbbreviation);
    if (!team) continue;

    const existing = map.get(team);
    const existingWeek = existing?.throughWeek ?? -1;
    const candidateWeek = record?.throughWeek ?? -1;

    if (
      !existing ||
      record.season > existing.season ||
      (record.season === existing.season && candidateWeek >= existingWeek)
    ) {
      map.set(team, record);
    }
  }

  return map;
}

export const nflTeamPerformanceEvidenceRecords =
  Array.isArray(generatedSource)
    ? generatedSource.filter(isNFLTeamPerformanceEvidence)
    : [];

export function getNFLTeamPerformanceEvidence(
  team,
  { season = null, throughWeek = null } = {}
) {
  const abbreviation = normalizeTeam(team);
  if (!abbreviation) return null;

  return (
    nflTeamPerformanceEvidenceRecords
      .filter((record) => record.teamAbbreviation === abbreviation)
      .filter(
        (record) => season === null || record.season === Number(season)
      )
      .filter(
        (record) =>
          throughWeek === null ||
          (record.throughWeek !== null &&
            record.throughWeek <= Number(throughWeek))
      )
      .sort((a, b) => {
        if (a.season !== b.season) return b.season - a.season;
        return (b.throughWeek ?? -1) - (a.throughWeek ?? -1);
      })[0] || null
  );
}

export function getLatestNFLTeamPerformanceEvidenceMap() {
  return latestByTeam(nflTeamPerformanceEvidenceRecords);
}

function percentile(values, value, higherIsBetter) {
  const valid = values
    .filter(
      (candidate) =>
        typeof candidate === "number" && Number.isFinite(candidate)
    )
    .sort((a, b) => a - b);

  if (
    valid.length < 2 ||
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  const below = valid.filter((candidate) => candidate < value).length;
  const equal = valid.filter((candidate) => candidate === value).length;
  const raw = (below + equal * 0.5) / valid.length;
  const normalized = higherIsBetter ? raw : 1 - raw;

  return Math.max(0, Math.min(100, normalized * 100));
}

export function getNFLTeamPerformanceEvidenceForSeason(team, season, { throughWeek = null, phaseScope = null } = {}) {
  const abbreviation = normalizeTeam(team);
  if (!abbreviation || !Number.isInteger(Number(season))) return null;
  return nflTeamPerformanceEvidenceRecords
    .filter((record) => record.teamAbbreviation === abbreviation && record.season === Number(season))
    .filter((record) => phaseScope === null || record.phaseScope === phaseScope)
    .filter((record) => throughWeek === null || (record.throughWeek !== null && record.throughWeek <= Number(throughWeek)))
    .sort((a,b)=>(b.throughWeek ?? 999)-(a.throughWeek ?? 999))[0] || null;
}

export function getNFLTeamPerformanceEvidenceRecordsForSeason(season, { phaseScope = null } = {}) {
  return nflTeamPerformanceEvidenceRecords
    .filter((record)=>record.season === Number(season))
    .filter((record)=>phaseScope === null || record.phaseScope === phaseScope);
}

export function buildNFLPerformanceIndexes(
  evidence,
  allRecords = [...getLatestNFLTeamPerformanceEvidenceMap().values()]
) {
  if (!isNFLTeamPerformanceEvidence(evidence)) {
    return {
      offense: null,
      defense: null,
      recentForm: null,
      sampleSize: allRecords.length,
    };
  }

  const offenseEpa = allRecords.map(
    (record) => record.offense.epaPerPlay
  );
  const offenseSuccess = allRecords.map(
    (record) => record.offense.successRate
  );
  const defenseEpa = allRecords.map(
    (record) => record.defense.epaAllowedPerPlay
  );
  const defenseSuccess = allRecords.map(
    (record) => record.defense.successRateAllowed
  );
  const recentNet = allRecords.map((record) => record.recentForm?.netEpaPerPlay ?? null);
  const specialTeamsEpa = allRecords.map((record) => record.specialTeams?.epaPerPlay ?? null);

  const offenseParts = [
    percentile(offenseEpa, evidence.offense.epaPerPlay, true),
    percentile(offenseSuccess, evidence.offense.successRate, true),
  ].filter((value) => value !== null);

  const defenseParts = [
    percentile(defenseEpa, evidence.defense.epaAllowedPerPlay, false),
    percentile(
      defenseSuccess,
      evidence.defense.successRateAllowed,
      false
    ),
  ].filter((value) => value !== null);

  const average = (values) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  return {
    offense: average(offenseParts),
    defense: average(defenseParts),
    recentForm: percentile(recentNet, evidence.recentForm?.netEpaPerPlay, true),
    specialTeams: percentile(specialTeamsEpa, evidence.specialTeams?.epaPerPlay, true),
    sampleSize: allRecords.length,
  };
}

export function getNFLOpponentAdjustmentMap() {
  return buildNFLOpponentAdjustment(
    [...getLatestNFLTeamPerformanceEvidenceMap().values()]
  );
}

export function getNFLOpponentAdjustment(team) {
  const abbreviation = normalizeTeam(team);

  if (!abbreviation) return null;

  return (
    getNFLOpponentAdjustmentMap().get(
      abbreviation
    ) || null
  );
}

export default {
  nflTeamPerformanceEvidenceRecords,
  getNFLTeamPerformanceEvidence,
  getLatestNFLTeamPerformanceEvidenceMap,
  buildNFLPerformanceIndexes,
  getNFLTeamPerformanceEvidenceForSeason,
  getNFLTeamPerformanceEvidenceRecordsForSeason,
  getNFLOpponentAdjustmentMap,
  getNFLOpponentAdjustment,
};
