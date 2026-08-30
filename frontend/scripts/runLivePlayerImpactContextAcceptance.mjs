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
} from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";

import {
  projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLCanonicalAvailabilityResearchProjection.js";

import {
  resolveNFLPlayerAvailabilityImpactContext,
} from "../src/engines/playerAvailability/context/NFLPlayerAvailabilityImpactContextResolver.js";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const season = Number(value("--season", "2026"));
const week = Number(value("--week", "1"));
const gameType = String(value("--game-type", "PRE")).trim().toUpperCase();
const team = String(value("--team", "BAL")).trim().toUpperCase();
const playerName = String(value("--player", "Lamar Jackson")).trim();

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
    source: "LIVE_PLAYER_IMPACT_CONTEXT_ACCEPTANCE",
  },
});

const read = async (recordType, recordId, requestId) =>
  adapter.read(readRequest(recordType, recordId, requestId));

try {
  const evidenceId =
    getNFLMultiSignalAvailabilityEvidenceId(
      season,
      gameType,
      week,
      team
    );

  const artifactResult = await read(
    PERSISTENCE_RECORD_TYPES.EVIDENCE_ARTIFACT,
    evidenceId,
    `live-impact-context-artifact:${evidenceId}`
  );

  if (!success(artifactResult) || !artifactResult.record) {
    throw new Error(`Active artifact not found: ${evidenceId}`);
  }

  const artifact = artifactResult.record;
  const refs = Array.isArray(artifact.recordedObservationRefs)
    ? artifact.recordedObservationRefs
    : [];

  const observations = [];
  for (const ref of refs) {
    const result = await read(
      PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
      ref,
      `live-impact-context-observation:${ref}`
    );
    if (success(result) && result.record) {
      observations.push(result.record);
    }
  }

  const projected =
    projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot({
      artifact,
      observations,
      season,
      week,
      gameType,
      team,
    });

  const roster =
    Array.isArray(projected?.resolution?.players)
      ? projected.resolution.players
      : [];

  const player = roster.find((candidate) =>
    String(candidate?.player?.playerName || "")
      .toLowerCase() === playerName.toLowerCase()
  ) || null;

  const context =
    resolveNFLPlayerAvailabilityImpactContext({
      canonicalAvailabilityPlayer: player,
      canonicalAvailabilityRoster: roster,
    });

  console.log(JSON.stringify({
    acceptance: "LIVE_PLAYER_IMPACT_CONTEXT_RESOLUTION",
    mode: "READ_ONLY",
    status: player ? "PASS" : "FAIL",
    scope: {
      season,
      gameType,
      week,
      team,
      playerName,
    },
    repository: {
      evidenceId,
      observationRefCount: refs.length,
      observationsResolved: observations.length,
    },
    canonicalAvailability: player
      ? {
          playerId: player?.player?.playerId ?? null,
          playerName: player?.player?.playerName ?? null,
          status:
            player?.canonicalAvailabilityStatus ?? null,
          starter: player?.role?.starter ?? null,
          depthPosition:
            player?.role?.depthPosition ?? null,
          depthRank: player?.role?.depthRank ?? null,
          evidenceRefCount:
            Array.isArray(player?.evidenceRefs)
              ? player.evidenceRefs.length
              : 0,
        }
      : null,
    impactContextResolution: context,
    interpretation: {
      numericImpactAuthorized:
        context?.readiness === "READY",
      note:
        context?.readiness === "READY"
          ? "All canonical impact-context dimensions are available."
          : "Context remains PARTIAL. Missing dimensions must be supplied by authorized caliber, usage, and team-dependency sources before numeric impact is evaluated.",
    },
    safeguards: {
      databaseMutationMethodsInvoked: false,
      snapShareInferredFromStarterStatus: false,
      teamDependencyFabricated: false,
      replacementQualityFabricatedWithoutCaliber: false,
      impactScoringInvoked: false,
      predictionScoringInvoked: false,
    },
  }, null, 2));

  if (!player) process.exitCode = 1;
} finally {
  await pool.end();
}
