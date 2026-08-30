import pg from "pg";

import {
  createPostgresResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

import {
  PERSISTENCE_CONSISTENCY_MODES,
  PERSISTENCE_OPERATION_STATUSES,
  PERSISTENCE_OPERATION_TYPES,
  PERSISTENCE_RECORD_TYPES,
} from "../src/data/researchRepository/persistence/index.js";

import {
  getNFLMultiSignalAvailabilityEvidenceId,
  NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";

import {
  projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLCanonicalAvailabilityResearchProjection.js";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const season = Number(value("--season", "2026"));
const week = Number(value("--week", "1"));
const gameType = String(value("--game-type", "PRE")).trim().toUpperCase();
const team = String(value("--team", "BAL")).trim().toUpperCase();

if (!Number.isInteger(season) || season < 2000) throw new Error("A valid --season is required.");
if (!Number.isInteger(week) || week < 1) throw new Error("A valid --week is required.");
if (!gameType) throw new Error("--game-type is required.");
if (!team) throw new Error("--team is required.");

const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required.");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = createPostgresResearchRepositoryAdapter({
  pool,
  options: {
    allowSoftDelete: false,
    allowArchive: false,
    allowHardDelete: false,
  },
});

const success = (result) =>
  result?.status === PERSISTENCE_OPERATION_STATUSES.SUCCESS;

const readRequest = (recordType, recordId, requestId) => ({
  requestId,
  operation: PERSISTENCE_OPERATION_TYPES.READ,
  recordType,
  recordId,
  query: {
    includeArchived: false,
    includeDeleted: false,
  },
  consistency: PERSISTENCE_CONSISTENCY_MODES.STANDARD,
  context: {
    source: "LIVE_CANONICAL_AVAILABILITY_ACCEPTANCE",
  },
});

const read = async (recordType, recordId, requestId) =>
  adapter.read(readRequest(recordType, recordId, requestId));

try {
  const evidenceId =
    getNFLMultiSignalAvailabilityEvidenceId(season, gameType, week, team);

  const artifactResult = await read(
    PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
    evidenceId,
    `live-canonical-read-artifact:${evidenceId}`
  );

  if (!success(artifactResult) || !artifactResult.record) {
    console.log(JSON.stringify({
      acceptance: "LIVE_CANONICAL_AVAILABILITY_RESOLUTION",
      status: "FAIL",
      reason: "ACTIVE_MULTI_SIGNAL_ARTIFACT_NOT_FOUND",
      scope: { season, gameType, week, team },
      evidenceId,
      repositoryStatus: artifactResult?.status ?? null,
    }, null, 2));
    process.exitCode = 1;
  } else {
    const artifact = artifactResult.record;

    const sourceId =
      artifact?.sourceRefs?.[0] ||
      NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID;

    const sourceResult = await read(
      PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
      sourceId,
      `live-canonical-read-source:${sourceId}`
    );

    const observationRefs =
      Array.isArray(artifact?.recordedObservationRefs)
        ? artifact.recordedObservationRefs
        : [];

    const observations = [];
    const missingObservationRefs = [];

    for (const observationRef of observationRefs) {
      const result = await read(
        PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
        observationRef,
        `live-canonical-read-observation:${observationRef}`
      );

      if (success(result) && result.record) {
        observations.push(result.record);
      } else {
        missingObservationRefs.push(observationRef);
      }
    }

    const projected =
      projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot({
        artifact,
        source: success(sourceResult) ? sourceResult.record : null,
        observations,
        season,
        week,
        gameType,
        team,
      });

    const players =
      Array.isArray(projected?.resolution?.players)
        ? projected.resolution.players
        : [];

    const classCounts = {};
    for (const signal of projected?.signals || []) {
      const signalClass = signal?.signalClass || "UNKNOWN";
      classCounts[signalClass] = (classCounts[signalClass] || 0) + 1;
    }

    const canonicalCounts = {};
    for (const player of players) {
      const status = player?.canonicalAvailabilityStatus || "UNKNOWN";
      canonicalCounts[status] = (canonicalCounts[status] || 0) + 1;
    }

    const starters = players
      .filter((player) => player?.role?.starter === true)
      .map((player) => ({
        playerId: player?.player?.playerId ?? null,
        playerName: player?.player?.playerName ?? null,
        position:
          player?.role?.depthPosition ??
          player?.player?.position ??
          null,
        depthRank: player?.role?.depthRank ?? null,
        canonicalAvailabilityStatus:
          player?.canonicalAvailabilityStatus ?? null,
        availabilityConfidence:
          player?.availabilityConfidence ?? null,
        officialReportState:
          player?.officialReportState ?? null,
        officialDesignation:
          player?.officialDesignation ?? null,
        rosterStatus:
          player?.rosterStatus ?? null,
        conflict:
          player?.conflict ?? null,
        evidenceRefCount:
          Array.isArray(player?.evidenceRefs)
            ? player.evidenceRefs.length
            : 0,
      }));

    const lamar = players.find((player) => {
      const name = String(player?.player?.playerName || "").toLowerCase();
      return name === "lamar jackson";
    }) || null;

    const pass =
      projected?.status === "READY" &&
      observationRefs.length > 0 &&
      observations.length === observationRefs.length &&
      missingObservationRefs.length === 0 &&
      players.length > 0 &&
      classCounts.DEPTH_CHART > 0 &&
      classCounts.ROSTER_STATUS > 0;

    console.log(JSON.stringify({
      acceptance: "LIVE_CANONICAL_AVAILABILITY_RESOLUTION",
      mode: "READ_ONLY",
      status: pass ? "PASS" : "FAIL",

      scope: {
        season,
        gameType,
        week,
        team,
      },

      repository: {
        evidenceId,
        artifactFound: true,
        sourceFound: success(sourceResult),
        observationRefCount: observationRefs.length,
        observationsResolved: observations.length,
        missingObservationRefCount: missingObservationRefs.length,
      },

      projection: {
        status: projected?.status ?? null,
        signalCount: projected?.signalCount ?? 0,
        classCounts,
        resolvedPlayerCount: players.length,
        canonicalCounts,
        starterCount: starters.length,
      },

      lamarJackson: lamar
        ? {
            found: true,
            playerId: lamar?.player?.playerId ?? null,
            position: lamar?.player?.position ?? null,
            canonicalAvailabilityStatus:
              lamar?.canonicalAvailabilityStatus ?? null,
            availabilityConfidence:
              lamar?.availabilityConfidence ?? null,
            rosterStatus:
              lamar?.rosterStatus ?? null,
            starter:
              lamar?.role?.starter ?? null,
            depthPosition:
              lamar?.role?.depthPosition ?? null,
            depthRank:
              lamar?.role?.depthRank ?? null,
            officialReportState:
              lamar?.officialReportState ?? null,
            officialDesignation:
              lamar?.officialDesignation ?? null,
            latestTransaction:
              lamar?.latestTransaction ?? null,
            conflict:
              lamar?.conflict ?? null,
            evidenceRefCount:
              Array.isArray(lamar?.evidenceRefs)
                ? lamar.evidenceRefs.length
                : 0,
          }
        : {
            found: false,
          },

      starters,
      missingObservationRefs:
        missingObservationRefs.slice(0, 10),

      safeguards: {
        databaseMutationMethodsInvoked: false,
        persistenceMode: "READ_ONLY",
        predictionScoringInvoked: false,
        playerImpactScoringInvoked: false,
      },
    }, null, 2));

    if (!pass) process.exitCode = 1;
  }
} finally {
  await pool.end();
}
