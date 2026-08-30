import pg from "pg";

import {
  createPostgresResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

import {
  createNFLAvailabilityResearchRepositoryService,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLAvailabilityResearchRepositoryService.js";

import {
  createNFLProviderNeutralAvailabilityResearchBundle,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLProviderNeutralAvailabilityResearchCapture.js";

import {
  acquireNFLVerseCurrentRosterDepthSignals,
} from "../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentAvailabilityAcquisition.js";

import {
  persistNFLAvailabilityBundleWithLiveRefresh,
} from "../src/engines/gameDecisionSupport/refresh/NFLLiveAvailabilityPersistenceRefreshBinding.js";

import {
  createNFLCanonicalScheduleRepositoryService,
} from "../src/engines/gameDecisionSupport/schedule/NFLCanonicalScheduleRepositoryService.js";

import {
  createFieDecisionProductionComposition,
} from "../services/fieDecisionApi/productionComposition.mjs";

const { Pool } = pg;
const args = process.argv.slice(2);

function value(flag, fallback = null) {
  const index = args.lastIndexOf(flag);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const season = Number(value("--season", "2026"));
const week = Number(value("--week"));
const gameType = String(value("--game-type", "REG")).toUpperCase();
const teams = [
  ...new Set(
    String(value("--teams", value("--team", "")))
      .split(",")
      .map((team) => team.trim().toUpperCase())
      .filter(Boolean)
  ),
];

const dryRun = args.includes("--dry-run");
const executeWrite = args.includes("--execute-write");

if (!Number.isInteger(season)) throw new Error("Valid --season is required.");
if (!Number.isInteger(week) || week < 1) {
  throw new Error("Positive --week is required.");
}
if (!teams.length) {
  throw new Error("At least one --team or comma-separated --teams is required.");
}
if (dryRun === executeWrite) {
  throw new Error("Choose exactly one: --dry-run or --execute-write.");
}

const databaseUrl =
  process.env.RESEARCH_REPOSITORY_DATABASE_URL || null;

if (executeWrite && !databaseUrl) {
  throw new Error(
    "RESEARCH_REPOSITORY_DATABASE_URL is required for --execute-write."
  );
}

function validateDatabaseUrl(input) {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error(
      "RESEARCH_REPOSITORY_DATABASE_URL must be a valid PostgreSQL URL."
    );
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(
      "RESEARCH_REPOSITORY_DATABASE_URL must use postgres:// or postgresql://."
    );
  }

  if (!parsed.hostname || !parsed.username) {
    throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is incomplete.");
  }

  return input;
}

const checkedAt = new Date().toISOString();
const results = [];

for (const team of teams) {
  const acquired = await acquireNFLVerseCurrentRosterDepthSignals({
    season,
    week,
    gameType,
    team,
  });

  results.push({ team, acquired });
}

const signals = results.flatMap((result) => result.acquired.signals);

if (!signals.length) {
  console.log("No canonical roster/depth signals were acquired.");
  console.log("Research Repository was not mutated.");
  process.exit(0);
}

const bundle = createNFLProviderNeutralAvailabilityResearchBundle(signals, {
  checkedAt,
});

const counts = Object.fromEntries(
  bundle.summary.signalClasses.map((signalClass) => [
    signalClass,
    signals.filter((signal) => signal.signalClass === signalClass).length,
  ])
);

console.log(
  `Selected scope: season=${season}, gameType=${gameType}, week=${week}, teams=${teams.join(",")}`
);
console.log(`Signals: ${signals.length} ${JSON.stringify(counts)}`);
console.log(`Providers: ${JSON.stringify(bundle.summary.providerSources)}`);
console.log(`Recorded observations: ${bundle.summary.observationCount}`);
console.log(`Evidence artifacts: ${bundle.summary.artifactCount}`);
console.log(`Research sessions: ${bundle.summary.sessionCount}`);
console.log("Sportradar required: false");

if (dryRun) {
  console.log("DRY RUN COMPLETE — Research Repository was not mutated.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: validateDatabaseUrl(databaseUrl),
  ssl: { rejectUnauthorized: false },
  max: 4,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  application_name: "lbht-fie-provider-neutral-nfl-availability",
});

try {
  const preflight = await pool.query(`
    select
      current_database() as database_name,
      to_regclass('public.research_sources') as research_sources,
      to_regclass('public.research_sessions') as research_sessions,
      to_regclass('public.recorded_observations') as recorded_observations,
      to_regclass('public.evidence_artifacts') as evidence_artifacts
  `);

  const state = preflight.rows[0] || {};
  const missing = [
    "research_sources",
    "research_sessions",
    "recorded_observations",
    "evidence_artifacts",
  ].filter((name) => !state[name]);

  if (missing.length) {
    throw new Error(
      `Research Repository preflight missing: ${missing.join(", ")}`
    );
  }

  console.log(
    `PostgreSQL preflight: connected database=${state.database_name ?? "unknown"}`
  );

  const adapter = createPostgresResearchRepositoryAdapter({
    pool,
    options: {
      allowSoftDelete: true,
      allowArchive: true,
      allowHardDelete: false,
    },
  });

  const repositoryService =
    createNFLAvailabilityResearchRepositoryService({ adapter });

  const scheduleService =
    createNFLCanonicalScheduleRepositoryService({ pool });

  const schedule = await scheduleService.readWeek({
    season,
    week,
    gameType,
  });

  if (schedule.status !== "SUCCESS") {
    throw new Error(`Canonical schedule unavailable: ${schedule.status}`);
  }

  const production = createFieDecisionProductionComposition({
    availabilityRepositoryService: repositoryService,
  });

  const binding = await persistNFLAvailabilityBundleWithLiveRefresh({
    repositoryService,
    bundle,
    season,
    week,
    gameType,
    teams,
    scheduleRecords: schedule.records,
    asOf: checkedAt,
    provenance: {
      acquisitionBoundary: "GOVERNED_PROVIDER_NEUTRAL_AVAILABILITY",
      providerSpecificReasoningAuthorized: false,
      sportradarRequired: false,
      providerSources: bundle.summary.providerSources,
    },
    availabilityRuntime: production.availabilityRuntime,
    buildMatchup: production.buildMatchup,
    getDecision: production.getDecision,
  });

  console.log(`Persistence status: ${binding.persistence?.status ?? "UNKNOWN"}`);
  console.log(`Refresh processed: ${binding.summary?.refreshProcessed ?? 0}`);
  console.log(`Unchanged: ${binding.summary?.unchanged ?? 0}`);
  console.log(`Refresh failed: ${binding.summary?.refreshFailed ?? 0}`);
  console.log(`Refresh executions: ${binding.summary?.refreshExecutions ?? 0}`);
  console.log(
    JSON.stringify(
      {
        contract: "NFLProviderNeutralCurrentAvailabilityRunReport",
        version: "1.0.0",
        season,
        week,
        gameType,
        teams,
        signalCount: signals.length,
        signalClasses: counts,
        providerSources: bundle.summary.providerSources,
        sportradarRequired: false,
        persistence: binding.persistence,
        refresh: binding.summary,
        governance: binding.governance,
      },
      null,
      2
    )
  );
} finally {
  await pool.end();
}
