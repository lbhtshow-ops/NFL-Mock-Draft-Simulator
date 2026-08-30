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
  resolveNFLPlayerImpactIntegratedInputs,
} from "../src/engines/playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js";

import {
  createPlayerAvailabilityEvidence,
  AVAILABILITY_FRESHNESS_STATES,
  PLAYER_AVAILABILITY_STATUSES,
} from "../src/engines/playerAvailability/contracts/PlayerAvailabilityEvidenceContract.js";

import {
  getCanonicalPlayerAvailabilityImpact,
} from "../src/engines/playerAvailability/CanonicalPlayerAvailabilityImpactService.js";

import {
  NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE,
} from "../src/engines/playerAvailability/methodology/NFLPlayerAvailabilityImpactMethodologyV1.js";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const season = Number(value("--season", "2026"));
const week = Number(value("--week", "1"));
const gameType = String(value("--game-type", "PRE")).toUpperCase();
const team = String(value("--team", "BAL")).toUpperCase();
const playerName = String(value("--player", "Lamar Jackson"));

const databaseUrl =
  process.env.RESEARCH_REPOSITORY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "RESEARCH_REPOSITORY_DATABASE_URL is required."
  );
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter =
  createPostgresResearchRepositoryAdapter({
    pool,
    options: {
      allowSoftDelete: false,
      allowArchive: false,
      allowHardDelete: false,
    },
  });

const success = (result) =>
  result?.status ===
  PERSISTENCE_OPERATION_STATUSES.SUCCESS;

const read = (recordType, recordId, requestId) =>
  adapter.read({
    requestId,
    operation: PERSISTENCE_OPERATION_TYPES.READ,
    recordType,
    recordId,
    query: {
      includeArchived: false,
      includeDeleted: false,
    },
    consistency:
      PERSISTENCE_CONSISTENCY_MODES.STANDARD,
    context: {
      source:
        "LIVE_TEAM_DEPENDENCY_IMPACT_ACCEPTANCE",
    },
  });

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
    `dependency-impact-artifact:${evidenceId}`
  );

  if (!success(artifactResult) || !artifactResult.record) {
    throw new Error(
      `Active artifact not found: ${evidenceId}`
    );
  }

  const artifact = artifactResult.record;
  const refs =
    Array.isArray(artifact.recordedObservationRefs)
      ? artifact.recordedObservationRefs
      : [];

  const observations = [];

  for (const ref of refs) {
    const result = await read(
      PERSISTENCE_RECORD_TYPES.RECORDED_OBSERVATION,
      ref,
      `dependency-impact-observation:${ref}`
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
    projected?.resolution?.players || [];

  const player =
    roster.find((candidate) =>
      String(
        candidate?.player?.playerName || ""
      ).toLowerCase() === playerName.toLowerCase()
    ) || null;

  if (!player) {
    throw new Error(
      `Player not found: ${playerName}`
    );
  }

  const integrated =
    resolveNFLPlayerImpactIntegratedInputs({
      canonicalAvailabilityPlayer: player,
      canonicalAvailabilityRoster: roster,
      season,
      week,
      team,
    });

  const currentEvidence =
    createPlayerAvailabilityEvidence({
      playerId:
        player?.player?.playerId || null,
      status:
        player?.canonicalAvailabilityStatus ||
        PLAYER_AVAILABILITY_STATUSES.UNKNOWN,
      reason:
        "LIVE_CANONICAL_AVAILABILITY",
      confidence:
        player?.availabilityConfidence || 0,
      evidenceLevel: "STRONG",
      dataState: "AVAILABLE",
      freshness:
        AVAILABILITY_FRESHNESS_STATES.FRESH,
      evidenceRefs:
        player?.evidenceRefs || [],
    });

  const counterfactualOutEvidence =
    createPlayerAvailabilityEvidence({
      playerId:
        player?.player?.playerId || null,
      status:
        PLAYER_AVAILABILITY_STATUSES.OUT,
      reason:
        "COUNTERFACTUAL_SHADOW_OUT_SCENARIO",
      confidence:
        player?.availabilityConfidence || 0,
      evidenceLevel: "STRONG",
      dataState: "AVAILABLE",
      freshness:
        AVAILABILITY_FRESHNESS_STATES.FRESH,
      evidenceRefs:
        player?.evidenceRefs || [],
    });

  const evaluationInput = {
    player: {
      id:
        player?.player?.playerId || null,
      name:
        player?.player?.playerName || null,
      position:
        player?.player?.position ||
        player?.role?.depthPosition ||
        null,
    },
    canonicalCaliber:
      integrated.canonicalCaliber,
    impactContext:
      integrated.contextResolution?.context,
    impactMethodologyProfile:
      NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE,
  };

  const currentImpact =
    integrated.readiness === "READY"
      ? getCanonicalPlayerAvailabilityImpact({
          ...evaluationInput,
          availabilityEvidence: currentEvidence,
        })
      : null;

  const counterfactualOutImpact =
    integrated.readiness === "READY"
      ? getCanonicalPlayerAvailabilityImpact({
          ...evaluationInput,
          availabilityEvidence:
            counterfactualOutEvidence,
        })
      : null;

  console.log(JSON.stringify({
    acceptance:
      "LIVE_NFL_TEAM_DEPENDENCY_AND_PROVISIONAL_IMPACT",
    mode: "READ_ONLY_SHADOW",
    status:
      integrated.readiness === "READY"
        ? "PASS"
        : "FAIL",

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
      observationsResolved:
        observations.length,
    },

    canonicalAvailability: {
      status:
        player.canonicalAvailabilityStatus,
      starter:
        player?.role?.starter ?? null,
      depthPosition:
        player?.role?.depthPosition ?? null,
      depthRank:
        player?.role?.depthRank ?? null,
    },

    integratedContext: {
      readiness:
        integrated.readiness,
      missingDimensions:
        integrated.missingDimensions,
      caliberGrade:
        integrated.canonicalCaliber?.caliberGrade ??
        null,
      replacement:
        integrated.replacement,
      replacementCaliberGrade:
        integrated.replacementCaliber?.caliberGrade ??
        null,
      offenseSnapShare:
        integrated.usageEvidence?.usage?.offenseSnapPct ??
        null,
      teamDependency:
        integrated.teamDependencyEvidence,
      context:
        integrated.contextResolution?.context ??
        null,
    },

    shadowImpact: {
      currentAvailability: {
        scenario:
          player.canonicalAvailabilityStatus,
        modelState:
          currentImpact?.impact?.modelState ??
          null,
        overallImpact:
          currentImpact?.impact?.overallImpact ??
          null,
      },
      counterfactualOut: {
        scenario: "OUT",
        scenarioType:
          "COUNTERFACTUAL_SHADOW_ONLY",
        modelState:
          counterfactualOutImpact?.impact?.modelState ??
          null,
        overallImpact:
          counterfactualOutImpact?.impact?.overallImpact ??
          null,
        confidence:
          counterfactualOutImpact?.impact?.confidence ??
          null,
      },
    },

    interpretation: {
      productionAuthorized: false,
      pickemAdjustmentAuthorized: false,
      teamStrengthMutationAuthorized: false,
      note:
        "The dependency result and impact score are PROVISIONAL shadow intelligence. The OUT scenario is counterfactual, not Lamar Jackson's current status and not a win-probability adjustment.",
    },

    safeguards: {
      databaseMutationMethodsInvoked: false,
      currentAvailabilityChanged: false,
      counterfactualPersisted: false,
      teamStrengthMutated: false,
      pickemDecisionModelMutated: false,
      historicalReplacementMappingFabricated: false,
      predictionScoringInvoked: false,
    },
  }, null, 2));

  if (integrated.readiness !== "READY") {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
