import {
  classifyNFLAvailabilityChangeRefreshMateriality,
} from "./NFLAvailabilityChangeRefreshPolicy.js";

import {
  NFL_AFFECTED_GAME_RESOLUTION_STATUS,
  resolveNFLAffectedGame,
} from "./NFLAffectedGameResolver.js";

import {
  createNFLGameDecisionRefreshRequirement,
} from "./NFLGameDecisionRefreshRequirementContract.js";

const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const canonicalTeam = value => {
  const text = clean(value);
  if (!text || text !== text.toUpperCase()) return null;
  return /^[A-Z]{2,3}$/.test(text) ? text : null;
};

export const NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS = Object.freeze({
  REFRESH_REQUIREMENT_CREATED: "REFRESH_REQUIREMENT_CREATED",
  NO_REFRESH_REQUIRED: "NO_REFRESH_REQUIRED",
  BLOCKED_GAME_RESOLUTION: "BLOCKED_GAME_RESOLUTION",
  INVALID_INPUT: "INVALID_INPUT",
});

export const NFL_AVAILABILITY_REFRESH_ORCHESTRATION_CONTRACT =
  "NFLAvailabilityChangeRefreshOrchestrationResult";
export const NFL_AVAILABILITY_REFRESH_ORCHESTRATION_VERSION = "1.0.0";

function governance() {
  return Object.freeze({
    recomputeAuthorized: false,
    cacheMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    modelMutationAuthorized: false,
    scheduleMutationAuthorized: false,
    orchestrationOnly: true,
  });
}

function triggerFrom(change = {}, affectedTeam = null, context = {}) {
  return Object.freeze({
    domain: "PLAYER_AVAILABILITY",
    team: affectedTeam,
    playerId: clean(context.playerId ?? change.playerId),
    changeType: clean(change.changeType),
    changedFields: Array.isArray(change.changedFields)
      ? [...new Set(change.changedFields.map(clean).filter(Boolean))]
      : [],
    previousSnapshotId: clean(change.previousSnapshotId),
    currentSnapshotId: clean(change.currentSnapshotId),
    evidenceEffectiveAt: clean(
      context.evidenceEffectiveAt ?? change.evidenceEffectiveAt
    ),
  });
}

export function orchestrateNFLAvailabilityChangeRefresh({
  change = {},
  context = {},
  affectedTeam = null,
  scheduleRecords = [],
  asOf = null,
} = {}) {
  const team = canonicalTeam(affectedTeam ?? context.team ?? change.team);
  const materiality = classifyNFLAvailabilityChangeRefreshMateriality(
    change,
    context
  );
  const trigger = triggerFrom(change, team, context);
  const base = {
    contract: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_CONTRACT,
    version: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_VERSION,
    affectedTeam: team,
    materiality,
    trigger,
    governance: governance(),
  };

  if (!team) {
    return Object.freeze({
      ...base,
      status: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.INVALID_INPUT,
      reason: "CANONICAL_AFFECTED_TEAM_REQUIRED",
      gameResolution: null,
      refreshRequirement: null,
    });
  }

  if (materiality.refreshRequired !== true) {
    const refreshRequirement = createNFLGameDecisionRefreshRequirement({
      game: {},
      trigger,
      materiality,
      refreshRequired: false,
      reasonCode: materiality.reasonCode,
      detectedAt: clean(change.detectedAt ?? asOf),
    });

    return Object.freeze({
      ...base,
      status: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.NO_REFRESH_REQUIRED,
      reason: materiality.reasonCode,
      gameResolution: null,
      refreshRequirement,
    });
  }

  const gameResolution = resolveNFLAffectedGame({
    affectedTeam: team,
    scheduleRecords,
    asOf,
  });

  if (gameResolution.status !== NFL_AFFECTED_GAME_RESOLUTION_STATUS.RESOLVED) {
    return Object.freeze({
      ...base,
      status: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.BLOCKED_GAME_RESOLUTION,
      reason: gameResolution.reason,
      gameResolution,
      refreshRequirement: null,
    });
  }

  const refreshRequirement = createNFLGameDecisionRefreshRequirement({
    game: gameResolution.game,
    trigger,
    materiality,
    refreshRequired: true,
    reasonCode: materiality.reasonCode,
    detectedAt: clean(change.detectedAt ?? asOf),
  });

  if (!refreshRequirement.validation.valid) {
    return Object.freeze({
      ...base,
      status: NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.INVALID_INPUT,
      reason: "REFRESH_REQUIREMENT_VALIDATION_FAILED",
      gameResolution,
      refreshRequirement,
    });
  }

  return Object.freeze({
    ...base,
    status:
      NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.REFRESH_REQUIREMENT_CREATED,
    reason: materiality.reasonCode,
    gameResolution,
    refreshRequirement,
  });
}

export default {
  NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS,
  NFL_AVAILABILITY_REFRESH_ORCHESTRATION_CONTRACT,
  NFL_AVAILABILITY_REFRESH_ORCHESTRATION_VERSION,
  orchestrateNFLAvailabilityChangeRefresh,
};
