import {
  diffNFLPlayerAvailabilityEvidence,
} from "../../playerAvailability/repository/NFLPlayerAvailabilityEvidenceDiffer.js";
import {
  orchestrateNFLAvailabilityChangeRefresh,
  NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS,
} from "./NFLAvailabilityChangeRefreshOrchestrator.js";
import {
  executeNFLGameDecisionRefresh,
} from "./NFLGameDecisionRefreshExecutor.js";

export const NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_CONTRACT =
  "NFLLiveEvidenceRefreshCoordinatorResult";
export const NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_VERSION = "1.0.0";

export const NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_STATUS = Object.freeze({
  COMPLETE: "COMPLETE",
  NO_CHANGES: "NO_CHANGES",
  INVALID_INPUT: "INVALID_INPUT",
});

const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const canonicalTeam = value => {
  const team = clean(value);
  return team && team === team.toUpperCase() && /^[A-Z]{2,3}$/.test(team)
    ? team
    : null;
};

function governance() {
  return Object.freeze({
    coordinatorOnly: true,
    persistenceMutationAuthorized: false,
    modelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    scheduleMutationAuthorized: false,
    pickemReasoningAuthorized: false,
    canonicalExecutionDelegatedToLE3Executor: true,
  });
}

export async function coordinateNFLLiveEvidenceRefresh({
  affectedTeam = null,
  previousPlayers = [],
  currentPlayers = [],
  scheduleRecords = [],
  asOf = null,
  provenance = {},
  availabilityRuntime = null,
  buildMatchup = null,
  getDecision = null,
  now = () => new Date().toISOString(),
} = {}) {
  const team = canonicalTeam(affectedTeam);
  if (!team) {
    return Object.freeze({
      contract: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_CONTRACT,
      version: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_VERSION,
      status: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_STATUS.INVALID_INPUT,
      reason: "CANONICAL_AFFECTED_TEAM_REQUIRED",
      affectedTeam: null,
      diff: null,
      results: Object.freeze([]),
      summary: Object.freeze({ changes: 0, refreshRequirements: 0, executed: 0 }),
      governance: governance(),
    });
  }

  const detectedAt = clean(asOf) ?? now();
  const diff = diffNFLPlayerAvailabilityEvidence({
    previousPlayers,
    currentPlayers,
    detectedAt,
    provenance,
    includeUnchanged: false,
  });

  if (diff.changes.length === 0) {
    return Object.freeze({
      contract: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_CONTRACT,
      version: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_VERSION,
      status: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_STATUS.NO_CHANGES,
      reason: "NO_PLAYER_LEVEL_EVIDENCE_CHANGE",
      affectedTeam: team,
      diff,
      results: Object.freeze([]),
      summary: Object.freeze({ changes: 0, refreshRequirements: 0, executed: 0 }),
      governance: governance(),
    });
  }

  const results = [];
  for (const entry of diff.changes) {
    const orchestration = orchestrateNFLAvailabilityChangeRefresh({
      change: entry.change,
      context: {
        ...entry.context,
        team,
      },
      affectedTeam: team,
      scheduleRecords,
      asOf: detectedAt,
    });

    let execution = null;
    if (
      orchestration.status ===
        NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.REFRESH_REQUIREMENT_CREATED &&
      orchestration.refreshRequirement
    ) {
      execution = await executeNFLGameDecisionRefresh({
        requirement: orchestration.refreshRequirement,
        availabilityRuntime,
        buildMatchup,
        getDecision,
        now,
      });
    }

    results.push(
      Object.freeze({
        playerId: entry.change.playerId,
        change: entry.change,
        context: entry.context,
        orchestration,
        execution,
      }),
    );
  }

  const refreshRequirements = results.filter(
    result => result.orchestration?.refreshRequirement?.refresh?.required === true,
  ).length;
  const executed = results.filter(result => result.execution?.status === "EXECUTED").length;

  return Object.freeze({
    contract: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_CONTRACT,
    version: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_VERSION,
    status: NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_STATUS.COMPLETE,
    reason: "PLAYER_LEVEL_EVIDENCE_CHANGES_PROCESSED",
    affectedTeam: team,
    diff,
    results: Object.freeze(results),
    summary: Object.freeze({
      changes: diff.changes.length,
      refreshRequirements,
      executed,
      notExecuted: diff.changes.length - executed,
    }),
    governance: governance(),
  });
}

export default {
  NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_CONTRACT,
  NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_VERSION,
  NFL_LIVE_EVIDENCE_REFRESH_COORDINATOR_STATUS,
  coordinateNFLLiveEvidenceRefresh,
};
