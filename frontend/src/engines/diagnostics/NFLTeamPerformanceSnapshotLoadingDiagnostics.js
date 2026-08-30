import {
  buildNFLversePlayByPlayCsvGzipUrl,
  createNFLversePlayByPlayDatasetLoader,
  createNFLTeamPerformanceSnapshotCache,
  createNFLTeamPerformanceSnapshotLoader,
  buildNFLTeamPerformanceSnapshotKey,
  defaultNFLTeamPerformanceMethodology,
} from "../teamIntelligence/performance/index.js";

let clockMs = Date.parse("2026-09-20T12:00:00Z");
const rows = [
  { game_id: "2025_01_BAL_BUF", season: 2025, week: 1, season_type: "REG", posteam: "BAL", defteam: "BUF", epa: 0.2, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2025_01_BAL_BUF", season: 2025, week: 1, season_type: "REG", posteam: "BUF", defteam: "BAL", epa: -0.1, success: 0, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2025_02_BAL_CLE", season: 2025, week: 2, season_type: "REG", posteam: "BAL", defteam: "CLE", epa: 0.3, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2025_02_BAL_CLE", season: 2025, week: 2, season_type: "REG", posteam: "CLE", defteam: "BAL", epa: 0.05, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2025_03_BAL_PIT", season: 2025, week: 3, season_type: "REG", posteam: "BAL", defteam: "PIT", epa: 0.9, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
];
let providerCalls = 0;
const datasetLoader = createNFLversePlayByPlayDatasetLoader({
  now: () => new Date(clockMs).toISOString(),
  loadRows: async ({ season, sourceUrl }) => {
    providerCalls += 1;
    if (season === 9999) throw new Error("offline");
    return {
      rows,
      retrievedAt: new Date(clockMs).toISOString(),
      providerUpdatedAt: "2026-09-20T11:45:00Z",
      datasetVersion: "DIAGNOSTIC-2025",
      sourceRefs: [sourceUrl],
    };
  },
});
const cache = createNFLTeamPerformanceSnapshotCache({ maxAgeMs: 60_000, now: () => clockMs });
const loader = createNFLTeamPerformanceSnapshotLoader({
  datasetLoader,
  methodology: defaultNFLTeamPerformanceMethodology,
  cache,
  now: () => new Date(clockMs).toISOString(),
});

const first = await loader.load({ team: "BAL", season: 2025, throughWeek: 2 });
const second = await loader.load({ team: "BAL", season: 2025, throughWeek: 2 });
clockMs += 61_000;
const third = await loader.load({ team: "BAL", season: 2025, throughWeek: 2 });
const forced = await loader.load({ team: "BAL", season: 2025, throughWeek: 2, forceRefresh: true });
const failure = await loader.load({ team: "BAL", season: 9999, throughWeek: 2, forceRefresh: true });
const malformed = await loader.load({ team: null, season: 2025, throughWeek: 2 });
const keyA = buildNFLTeamPerformanceSnapshotKey({ team: "bal", season: 2025, throughWeek: 2, provider: "NFLVERSE", dataset: "NFLVERSE_PLAY_BY_PLAY", methodologyVersion: defaultNFLTeamPerformanceMethodology.version });
const keyB = buildNFLTeamPerformanceSnapshotKey({ team: "BAL", season: 2025, throughWeek: 2, provider: "nflverse", dataset: "nflverse_play_by_play", methodologyVersion: defaultNFLTeamPerformanceMethodology.version });

const checks = {
  official_release_url_shape: buildNFLversePlayByPlayCsvGzipUrl(2025) === "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2025.csv.gz",
  deterministic_cache_key: keyA === keyB && Boolean(keyA),
  first_load_is_cache_miss: first.status === "OK" && first.cacheStatus === "MISS",
  first_snapshot_valid: first.snapshot?.validation?.valid === true,
  requested_week_enforced: first.snapshot?.evidence?.sample?.games === 2,
  future_week_rows_excluded: first.snapshot?.evidence?.offense?.epaPerPlay === 0.25,
  provenance_preserved: first.snapshot?.sourceUrl?.includes("nflverse-data/releases/download/pbp") && first.snapshot?.datasetVersion === "DIAGNOSTIC-2025",
  provider_freshness_preserved: first.snapshot?.providerUpdatedAt === "2026-09-20T11:45:00.000Z",
  second_load_hits_cache: second.cacheStatus === "HIT" && providerCalls === 3,
  stale_entry_refreshes_provider: third.cacheStatus === "MISS",
  force_refresh_bypasses_cache: forced.cacheStatus === "REFRESHED",
  provider_failure_is_explicit: failure.status === "PROVIDER_UNAVAILABLE" && failure.snapshot === null,
  malformed_request_is_explicit: malformed.status === "INVALID_REQUEST" && malformed.snapshot === null,
  scoring_still_unauthorized: defaultNFLTeamPerformanceMethodology.scoring.status === "UNAUTHORIZED",
  opponent_adjustment_still_unmodeled: first.snapshot?.evidence?.opponentAdjustedRating === null,
  strength_of_schedule_still_unmodeled: first.snapshot?.evidence?.strengthOfSchedule === null,
};

// Provider call count after first, second, stale refresh, forced refresh, failed refresh = 4 successful/attempted loads.
checks.second_load_hits_cache = second.cacheStatus === "HIT" && providerCalls === 4;
const failures = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
console.log(JSON.stringify({
  suite: "NFL Team Performance Governed Data Loading, Cache & Snapshot Validation",
  contractVersion: "FIE-NFL-TEAM-PERFORMANCE-SPRINT2B-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
