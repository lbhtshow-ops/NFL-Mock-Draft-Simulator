import {
  createClient,
} from "@supabase/supabase-js";

import {
  createSupabaseResearchRepositoryAdapter,
} from "../../src/data/researchRepository/persistence/supabase/createSupabaseResearchRepositoryAdapter.js";

import {
  createNFLAvailabilityResearchRepositoryService,
  loadNFLAvailabilityEvidenceFromResearchRepository,
} from "../../src/data/footballIntelligence/nfl/availability/research/index.js";

import {
  replaceNFLAvailabilityRuntimeEvidenceForTeam,
} from "../../src/data/footballIntelligence/nfl/availability/NFLAvailabilityRuntimeEvidenceStore.js";

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function environment() {
  return {
    url:
      process.env.RESEARCH_REPOSITORY_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      null,
    serviceRoleKey:
      process.env.RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      null,
  };
}

function cacheKey({ season, week, gameType = "REG", team } = {}) {
  return `${season}:${week}:${gameType}:${team}`;
}

export function createFieResearchRepositoryAvailabilityRuntime({
  now = () => new Date().toISOString(),
  ttlMs = DEFAULT_TTL_MS,
  supabase = null,
  repositoryService = null,
} = {}) {
  const injectedRepositoryService =
    repositoryService && typeof repositoryService.readTeamWeek === "function"
      ? repositoryService
      : null;

  const configured = environment();
  const client =
    injectedRepositoryService
      ? null
      : supabase ||
        (configured.url && configured.serviceRoleKey
          ? createClient(configured.url, configured.serviceRoleKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            })
          : null);

  if (!injectedRepositoryService && !client) {
    return {
      configured: false,
      invalidateTeamAvailability({ season, week, gameType = "REG", team } = {}) {
        return {
          status: "NOT_CONFIGURED",
          invalidated: false,
          key: cacheKey({ season, week, gameType, team }),
        };
      },
      async loadForMatchup() {
        return {
          status: "NOT_CONFIGURED",
          teams: [],
        };
      },
    };
  }

  const adapter = injectedRepositoryService
    ? null
    : createSupabaseResearchRepositoryAdapter({
        supabase: client,
        options: {
          adapterName: "SUPABASE_RESEARCH_REPOSITORY_FIE_AVAILABILITY_RUNTIME",
          allowSoftDelete: true,
          allowArchive: true,
          allowHardDelete: false,
        },
      });

  if (!injectedRepositoryService && !adapter) {
    return {
      configured: false,
      invalidateTeamAvailability({ season, week, gameType = "REG", team } = {}) {
        return {
          status: "ADAPTER_UNAVAILABLE",
          invalidated: false,
          key: cacheKey({ season, week, gameType, team }),
        };
      },
      async loadForMatchup() {
        return {
          status: "ADAPTER_UNAVAILABLE",
          teams: [],
        };
      },
    };
  }

  const resolvedRepositoryService =
    injectedRepositoryService ||
    createNFLAvailabilityResearchRepositoryService({ adapter });
  const cache = new Map();

  function invalidateTeamAvailability({
    season,
    week,
    gameType = "REG",
    team,
  } = {}) {
    const key = cacheKey({ season, week, gameType, team });
    const invalidated = cache.delete(key);

    return {
      status: invalidated ? "INVALIDATED" : "NOT_CACHED",
      invalidated,
      key,
    };
  }

  async function loadTeam({ season, week, gameType, team }) {
    const key = cacheKey({ season, week, gameType, team });
    const cached = cache.get(key);
    const currentMs = Date.parse(now());

    if (
      cached &&
      Number.isFinite(currentMs) &&
      currentMs - cached.loadedAtMs < ttlMs
    ) {
      replaceNFLAvailabilityRuntimeEvidenceForTeam(cached.records, {
        season,
        week,
        gameType,
        team,
        source: "RESEARCH_REPOSITORY",
        loadedAt: new Date(cached.loadedAtMs).toISOString(),
        freshness: cached.freshness,
      });

      return {
        status: "CACHE_HIT",
        freshness: cached.freshness,
        recordCount: cached.records.length,
      };
    }

    const projection = await loadNFLAvailabilityEvidenceFromResearchRepository({
      repositoryService: resolvedRepositoryService,
      season,
      week,
      team,
      gameType,
      now: now(),
    });

    if (projection.status === "READY") {
      const loadedAtMs = Number.isFinite(currentMs) ? currentMs : Date.now();
      cache.set(key, {
        loadedAtMs,
        freshness: projection.freshness,
        records: projection.records,
      });

      replaceNFLAvailabilityRuntimeEvidenceForTeam(projection.records, {
        season,
        week,
        gameType,
        team,
        source: "RESEARCH_REPOSITORY",
        loadedAt: new Date(loadedAtMs).toISOString(),
        freshness: projection.freshness,
      });
    }

    return {
      status: projection.status,
      freshness: projection.freshness,
      recordCount: projection.records.length,
    };
  }

  return {
    configured: true,
    invalidateTeamAvailability,
    async loadForMatchup({
      season,
      week,
      gameType = "REG",
      teams = [],
    } = {}) {
      const results = [];

      for (const team of teams) {
        if (!team) continue;
        results.push({
          team,
          ...(await loadTeam({
            season,
            week,
            gameType,
            team,
          })),
        });
      }

      return {
        status: results.some((result) => ["READY", "CACHE_HIT"].includes(result.status))
          ? "READY"
          : results.some((result) => result.status === "STALE")
            ? "STALE"
            : "UNAVAILABLE",
        teams: results,
      };
    },
  };
}

export default {
  createFieResearchRepositoryAvailabilityRuntime,
};
