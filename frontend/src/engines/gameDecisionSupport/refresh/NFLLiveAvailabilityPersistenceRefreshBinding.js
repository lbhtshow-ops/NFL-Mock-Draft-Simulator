import {
  loadNFLCanonicalAvailabilityFromResearchRepository,
} from "../../../data/footballIntelligence/nfl/availability/research/NFLCanonicalAvailabilityResearchProjection.js";

import {
  coordinateNFLLiveEvidenceRefresh,
} from "./NFLLiveEvidenceRefreshCoordinator.js";

export const NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_CONTRACT =
  "NFLLiveAvailabilityPersistenceRefreshBindingResult";
export const NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_VERSION = "1.0.0";

export const NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS = Object.freeze({
  REFRESH_PROCESSED: "REFRESH_PROCESSED",
  UNCHANGED: "UNCHANGED",
  PERSISTENCE_NOT_SUCCESSFUL: "PERSISTENCE_NOT_SUCCESSFUL",
  PREVIOUS_PROJECTION_UNAVAILABLE: "PREVIOUS_PROJECTION_UNAVAILABLE",
  CURRENT_PROJECTION_UNAVAILABLE: "CURRENT_PROJECTION_UNAVAILABLE",
  REFRESH_FAILED: "REFRESH_FAILED",
});

const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const canonicalTeam = value => {
  const team = clean(value)?.toUpperCase() ?? null;
  return team && /^[A-Z]{2,3}$/.test(team) ? team : null;
};

const uniqueTeams = values =>
  [...new Set((Array.isArray(values) ? values : []).map(canonicalTeam).filter(Boolean))];

function canonicalPlayers(projection) {
  return Array.isArray(projection?.resolution?.players)
    ? projection.resolution.players
    : [];
}

function governance() {
  return Object.freeze({
    lifecycleBindingOnly: true,
    repositoryContractMutationAuthorized: false,
    persistenceSemanticsMutationAuthorized: false,
    modelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    scheduleMutationAuthorized: false,
    pickemReasoningAuthorized: false,
    canonicalProjectionReused: true,
    canonicalRefreshCoordinatorReused: true,
  });
}

export async function persistNFLAvailabilityBundleWithLiveRefresh({
  repositoryService,
  bundle,
  season,
  week,
  gameType = "REG",
  teams = [],
  scheduleRecords = [],
  asOf = null,
  provenance = {},
  availabilityRuntime = null,
  buildMatchup = null,
  getDecision = null,
  now = () => new Date().toISOString(),
  loadProjection = loadNFLCanonicalAvailabilityFromResearchRepository,
  coordinateRefresh = coordinateNFLLiveEvidenceRefresh,
} = {}) {
  if (!repositoryService || typeof repositoryService.persistBundle !== "function") {
    throw new Error("repositoryService.persistBundle is required.");
  }
  if (typeof loadProjection !== "function") {
    throw new Error("A canonical availability projection loader is required.");
  }
  if (typeof coordinateRefresh !== "function") {
    throw new Error("A live evidence refresh coordinator is required.");
  }

  const normalizedSeason = Number(season);
  const normalizedWeek = Number(week);
  const normalizedGameType = String(gameType || "REG").trim().toUpperCase();
  const selectedTeams = uniqueTeams(teams);
  const detectedAt = clean(asOf) ?? now();

  if (!Number.isInteger(normalizedSeason)) throw new Error("Valid season is required.");
  if (!Number.isInteger(normalizedWeek) || normalizedWeek < 1) throw new Error("Valid week is required.");
  if (!selectedTeams.length) throw new Error("At least one canonical team is required.");

  const previousByTeam = new Map();
  for (const team of selectedTeams) {
    const projection = await loadProjection({
      repositoryService,
      season: normalizedSeason,
      week: normalizedWeek,
      gameType: normalizedGameType,
      team,
    });
    previousByTeam.set(team, projection);
  }

  const persistence = await repositoryService.persistBundle(bundle);
  const teamResultsByTeam = new Map(
    (Array.isArray(persistence?.teamResults) ? persistence.teamResults : [])
      .map(result => [canonicalTeam(result?.team), result])
      .filter(([team]) => team),
  );

  const refreshResults = [];

  for (const team of selectedTeams) {
    const teamPersistence = teamResultsByTeam.get(team) ?? null;
    const previousProjection = previousByTeam.get(team) ?? null;

    if (teamPersistence?.status === "UNCHANGED") {
      refreshResults.push(Object.freeze({
        team,
        status: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS.UNCHANGED,
        persistenceStatus: "UNCHANGED",
        previousProjectionStatus: previousProjection?.status ?? null,
        currentProjectionStatus: null,
        refresh: null,
      }));
      continue;
    }

    if (teamPersistence?.status !== "SUCCESS") {
      refreshResults.push(Object.freeze({
        team,
        status: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS.PERSISTENCE_NOT_SUCCESSFUL,
        persistenceStatus: teamPersistence?.status ?? null,
        previousProjectionStatus: previousProjection?.status ?? null,
        currentProjectionStatus: null,
        refresh: null,
      }));
      continue;
    }

    const currentProjection = await loadProjection({
      repositoryService,
      season: normalizedSeason,
      week: normalizedWeek,
      gameType: normalizedGameType,
      team,
    });

    if (currentProjection?.status !== "READY") {
      refreshResults.push(Object.freeze({
        team,
        status: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS.CURRENT_PROJECTION_UNAVAILABLE,
        persistenceStatus: teamPersistence.status,
        previousProjectionStatus: previousProjection?.status ?? null,
        currentProjectionStatus: currentProjection?.status ?? null,
        refresh: null,
      }));
      continue;
    }

    try {
      const refresh = await coordinateRefresh({
        affectedTeam: team,
        previousPlayers: canonicalPlayers(previousProjection),
        currentPlayers: canonicalPlayers(currentProjection),
        scheduleRecords,
        asOf: detectedAt,
        provenance: {
          ...provenance,
          bindingContract: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_CONTRACT,
          bindingVersion: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_VERSION,
          persistenceStatus: teamPersistence.status,
        },
        availabilityRuntime,
        buildMatchup,
        getDecision,
        now,
      });

      refreshResults.push(Object.freeze({
        team,
        status: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS.REFRESH_PROCESSED,
        persistenceStatus: teamPersistence.status,
        previousProjectionStatus: previousProjection?.status ?? null,
        currentProjectionStatus: currentProjection.status,
        refresh,
      }));
    } catch (error) {
      refreshResults.push(Object.freeze({
        team,
        status: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS.REFRESH_FAILED,
        persistenceStatus: teamPersistence.status,
        previousProjectionStatus: previousProjection?.status ?? null,
        currentProjectionStatus: currentProjection.status,
        refresh: null,
        error: Object.freeze({
          name: error?.name ?? "Error",
          message: error?.message ?? String(error),
        }),
      }));
    }
  }

  const summary = Object.freeze({
    teams: selectedTeams.length,
    unchanged: refreshResults.filter(result => result.status === "UNCHANGED").length,
    persistenceNotSuccessful: refreshResults.filter(result => result.status === "PERSISTENCE_NOT_SUCCESSFUL").length,
    refreshProcessed: refreshResults.filter(result => result.status === "REFRESH_PROCESSED").length,
    refreshFailed: refreshResults.filter(result => result.status === "REFRESH_FAILED").length,
    refreshExecutions: refreshResults.reduce(
      (count, result) => count + Number(result.refresh?.summary?.executed ?? 0),
      0,
    ),
  });

  return Object.freeze({
    contract: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_CONTRACT,
    version: NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_VERSION,
    season: normalizedSeason,
    week: normalizedWeek,
    gameType: normalizedGameType,
    asOf: detectedAt,
    persistence,
    teamResults: Object.freeze(refreshResults),
    summary,
    governance: governance(),
  });
}

export default {
  NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_CONTRACT,
  NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_BINDING_VERSION,
  NFL_LIVE_AVAILABILITY_PERSISTENCE_REFRESH_TEAM_STATUS,
  persistNFLAvailabilityBundleWithLiveRefresh,
};
