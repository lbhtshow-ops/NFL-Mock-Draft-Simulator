import { createNFLverseTeamPerformanceAdapter } from "../adapters/NFLverseTeamPerformanceAdapter.js";
import { defaultNFLTeamPerformanceMethodology } from "../NFLTeamPerformanceMethodologyContract.js";
import { createNFLTeamPerformanceSnapshot } from "./NFLTeamPerformanceSnapshotContract.js";
import { createNFLTeamPerformanceSnapshotCache } from "./NFLTeamPerformanceSnapshotCache.js";

export const NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_CONTRACT = "NFLTeamPerformanceSnapshotLoader";
export const NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_VERSION = "NFL-TEAM-PERFORMANCE-SNAPSHOT-LOADER-1.0.0";

function code(value) {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

export function createNFLTeamPerformanceSnapshotLoader({
  datasetLoader,
  methodology = defaultNFLTeamPerformanceMethodology,
  cache = createNFLTeamPerformanceSnapshotCache(),
  now = () => new Date().toISOString(),
} = {}) {
  if (!datasetLoader || typeof datasetLoader.load !== "function") {
    throw new Error("datasetLoader required");
  }

  const keyBase = {
    provider: datasetLoader.provider,
    dataset: datasetLoader.dataset,
    methodologyVersion: methodology.version,
  };

  async function load({ team, season, throughWeek, forceRefresh = false } = {}) {
    const teamAbbreviation = code(team);
    if (!teamAbbreviation || !Number.isInteger(season) || !Number.isInteger(throughWeek) || throughWeek < 0) {
      return { status: "INVALID_REQUEST", snapshot: null, cacheStatus: "BYPASSED" };
    }

    const keyParts = { ...keyBase, team: teamAbbreviation, season, throughWeek };
    if (!forceRefresh) {
      const cached = cache.get(keyParts);
      if (cached.status === "HIT" && cached.snapshot) {
        return {
          status: "OK",
          cacheStatus: "HIT",
          snapshot: createNFLTeamPerformanceSnapshot({
            ...cached.snapshot,
            cache: {
              status: "HIT",
              key: cached.key,
              storedAt: cached.storedAt,
              expiresAt: cached.expiresAt,
              ageMs: cached.ageMs,
              stale: false,
            },
          }),
        };
      }
    }

    const providerResult = await datasetLoader.load({ season, throughWeek, team: teamAbbreviation });
    if (providerResult?.status !== "OK") {
      return {
        status: providerResult?.status || "PROVIDER_UNAVAILABLE",
        cacheStatus: forceRefresh ? "REFRESH_FAILED" : "MISS",
        snapshot: null,
        providerResult,
      };
    }

    const adapter = createNFLverseTeamPerformanceAdapter({
      datasetVersion: providerResult.datasetVersion,
      retrievedAt: providerResult.retrievedAt,
      sourceRefs: providerResult.sourceRefs,
      methodology,
    });
    const evidence = adapter.aggregate(providerResult.rows, {
      team: teamAbbreviation,
      season,
      throughWeek,
    });
    if (!evidence?.validation?.valid) {
      return { status: "INVALID_EVIDENCE", cacheStatus: "MISS", snapshot: null };
    }

    const generatedAt = now();
    let snapshot = createNFLTeamPerformanceSnapshot({
      teamAbbreviation,
      season,
      throughWeek,
      provider: datasetLoader.provider,
      dataset: datasetLoader.dataset,
      methodologyVersion: methodology.version,
      generatedAt,
      retrievedAt: providerResult.retrievedAt,
      providerUpdatedAt: providerResult.providerUpdatedAt,
      sourceUrl: providerResult.sourceUrl,
      datasetVersion: providerResult.datasetVersion,
      evidence,
      cache: { status: forceRefresh ? "REFRESHED" : "MISS", stale: false },
    });

    const stored = cache.set(keyParts, snapshot);
    snapshot = createNFLTeamPerformanceSnapshot({
      ...snapshot,
      cache: {
        status: forceRefresh ? "REFRESHED" : "MISS",
        key: stored.key,
        storedAt: stored.storedAt,
        expiresAt: stored.expiresAt,
        ageMs: 0,
        stale: false,
      },
    });

    return { status: "OK", cacheStatus: forceRefresh ? "REFRESHED" : "MISS", snapshot };
  }

  return Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_VERSION,
    provider: datasetLoader.provider,
    dataset: datasetLoader.dataset,
    methodologyVersion: methodology.version,
    load,
    cache,
  });
}

export default {
  NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_CONTRACT,
  NFL_TEAM_PERFORMANCE_SNAPSHOT_LOADER_VERSION,
  createNFLTeamPerformanceSnapshotLoader,
};
