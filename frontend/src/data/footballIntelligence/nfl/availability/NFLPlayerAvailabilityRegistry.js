import generatedSource from "./sources/generatedNFLPlayerAvailabilitySource.js";
import generatedManifest from "./sources/generatedNFLPlayerAvailabilityManifest.js";

import {
  isNFLPlayerAvailabilityEvidence,
} from "./NFLPlayerAvailabilityEvidenceContract.js";

import {
  assessNFLAvailabilityRuntime,
} from "./NFLAvailabilityAcquisitionRuntime.js";

import {
  getNFLAvailabilityRuntimeEvidenceForTeam,
  getNFLAvailabilityRuntimeEvidenceState,
} from "./NFLAvailabilityRuntimeEvidenceStore.js";

export const nflPlayerAvailabilityEvidenceRecords =
  Array.isArray(generatedSource)
    ? generatedSource.filter(isNFLPlayerAvailabilityEvidence)
    : [];

function normalizeTeam(team) {
  return typeof team === "string"
    ? team.trim().toUpperCase()
    : null;
}

function generatedTeamEvidence(
  abbreviation,
  {
    season = null,
    week = null,
    gameType = null,
  } = {}
) {
  const candidates = nflPlayerAvailabilityEvidenceRecords
    .filter((record) => record.team === abbreviation)
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
        record.gameType === String(gameType).toUpperCase()
    );

  if (week !== null) return candidates;

  const latestWeek = candidates.reduce(
    (max, record) => Math.max(max, record.week),
    -1
  );

  return latestWeek >= 0
    ? candidates.filter((record) => record.week === latestWeek)
    : [];
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

  if (season !== null && week !== null) {
    const runtime = getNFLAvailabilityRuntimeEvidenceForTeam({
      season: Number(season),
      week: Number(week),
      gameType: gameType || "REG",
      team: abbreviation,
    });

    if (runtime.length) return runtime;
  }

  return generatedTeamEvidence(abbreviation, {
    season,
    week,
    gameType,
  });
}

export function getLatestNFLAvailabilityWeek(season) {
  return nflPlayerAvailabilityEvidenceRecords
    .filter(
      (record) =>
        season === null ||
        record.season === Number(season)
    )
    .reduce(
      (max, record) => Math.max(max, record.week),
      -1
    );
}

export function getNFLAvailabilityRuntimeStatus({
  season,
  week = null,
  team = null,
  gameType = "REG",
  now = new Date().toISOString(),
} = {}) {
  const normalizedTeam = normalizeTeam(team);

  if (normalizedTeam && season !== null && week !== null) {
    const runtimeState = getNFLAvailabilityRuntimeEvidenceState({
      season: Number(season),
      week: Number(week),
      gameType,
      team: normalizedTeam,
    });

    if (runtimeState.recordCount > 0) {
      return {
        version: "NFL-AVAILABILITY-RUNTIME-1.0.0",
        season: Number(season),
        week: Number(week),
        state: "READY",
        freshness: runtimeState.freshness || "UNKNOWN",
        recordCount: runtimeState.recordCount,
        seasonRecordCount: runtimeState.recordCount,
        latestWeek: Number(week),
        latestModifiedAt: null,
        ageHours: null,
        providerStatus: "RESEARCH_REPOSITORY",
        sourceUrl: null,
        checkedAt: runtimeState.loadedAt || null,
        evidenceSource: runtimeState.source || "RESEARCH_REPOSITORY",
        message: null,
      };
    }
  }

  return assessNFLAvailabilityRuntime({
    records: nflPlayerAvailabilityEvidenceRecords,
    manifest: generatedManifest,
    season,
    week,
    now,
  });
}

export function getNFLAvailabilityAcquisitionManifest() {
  return generatedManifest;
}

export default {
  nflPlayerAvailabilityEvidenceRecords,
  getNFLTeamAvailabilityEvidence,
  getLatestNFLAvailabilityWeek,
  getNFLAvailabilityRuntimeStatus,
  getNFLAvailabilityAcquisitionManifest,
};
