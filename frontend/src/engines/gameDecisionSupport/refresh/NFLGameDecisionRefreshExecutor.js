const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

export const NFL_GAME_DECISION_REFRESH_EXECUTION_CONTRACT =
  "NFLGameDecisionRefreshExecutionResult";
export const NFL_GAME_DECISION_REFRESH_EXECUTION_VERSION = "1.0.0";

export const NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS = Object.freeze({
  EXECUTED: "EXECUTED",
  NOT_REQUIRED: "NOT_REQUIRED",
  INVALID_REQUIREMENT: "INVALID_REQUIREMENT",
  EXECUTION_UNAVAILABLE: "EXECUTION_UNAVAILABLE",
  AVAILABILITY_REFRESH_FAILED: "AVAILABILITY_REFRESH_FAILED",
  CANONICAL_RECOMPUTE_FAILED: "CANONICAL_RECOMPUTE_FAILED",
});

function governance({ executed = false } = {}) {
  return Object.freeze({
    executionBoundary: "LE_3_GOVERNED_REFRESH_EXECUTOR",
    recomputeExecuted: executed === true,
    targetedAvailabilityCacheInvalidationOnly: true,
    modelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    scheduleMutationAuthorized: false,
    pickemReasoningAuthorized: false,
  });
}

function validRequirement(requirement) {
  if (!requirement || typeof requirement !== "object") return false;
  if (requirement.contract !== "NFLGameDecisionRefreshRequirement") return false;
  if (requirement.version !== "1.0.0") return false;
  if (requirement.validation?.valid !== true) return false;
  return true;
}

function baseResult(requirement, status, reason, extra = {}) {
  return Object.freeze({
    contract: NFL_GAME_DECISION_REFRESH_EXECUTION_CONTRACT,
    version: NFL_GAME_DECISION_REFRESH_EXECUTION_VERSION,
    status,
    reason,
    requirement: requirement ?? null,
    ...extra,
  });
}

export async function executeNFLGameDecisionRefresh({
  requirement = null,
  availabilityRuntime = null,
  buildMatchup = null,
  getDecision = null,
  now = () => new Date().toISOString(),
} = {}) {
  if (!validRequirement(requirement)) {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.INVALID_REQUIREMENT,
      "VALID_REFRESH_REQUIREMENT_REQUIRED",
      { governance: governance() }
    );
  }

  if (requirement.refresh?.required !== true) {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.NOT_REQUIRED,
      requirement.refresh?.reasonCode ?? "REFRESH_NOT_REQUIRED",
      { governance: governance() }
    );
  }

  const game = requirement.game ?? {};
  const team = clean(requirement.trigger?.team)?.toUpperCase() ?? null;
  const gameType = clean(game.gameType)?.toUpperCase() ?? "REG";

  if (
    !team ||
    (team !== game.awayTeam && team !== game.homeTeam)
  ) {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.INVALID_REQUIREMENT,
      "TRIGGER_TEAM_NOT_IN_GAME",
      { governance: governance() }
    );
  }

  if (
    !availabilityRuntime ||
    typeof availabilityRuntime.invalidateTeamAvailability !== "function" ||
    typeof availabilityRuntime.loadForMatchup !== "function" ||
    typeof buildMatchup !== "function" ||
    typeof getDecision !== "function"
  ) {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.EXECUTION_UNAVAILABLE,
      "CANONICAL_REFRESH_DEPENDENCIES_REQUIRED",
      { governance: governance() }
    );
  }

  const invalidation = availabilityRuntime.invalidateTeamAvailability({
    season: game.season,
    week: game.week,
    gameType,
    team,
  });

  const availability = await availabilityRuntime.loadForMatchup({
    season: game.season,
    week: game.week,
    gameType,
    teams: [game.awayTeam, game.homeTeam],
  });

  if (availability?.status !== "READY") {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.AVAILABILITY_REFRESH_FAILED,
      `AVAILABILITY_${clean(availability?.status) ?? "UNAVAILABLE"}`,
      {
        invalidation,
        availability,
        governance: governance(),
      }
    );
  }

  try {
    const matchup = await buildMatchup({
      gameId: game.gameId,
      season: game.season,
      week: game.week,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      availabilityWeek: game.week,
      gameType,
      context: { homeField: true },
    });

    const generatedAt = now();
    const decision = await getDecision({
      game: {
        gameId: game.gameId,
        season: game.season,
        week: game.week,
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
      },
      matchupIntelligence: matchup,
      generatedAt,
    });

    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.EXECUTED,
      requirement.refresh?.reasonCode ?? "REFRESH_EXECUTED",
      {
        invalidation,
        availability,
        generatedAt,
        matchup,
        decision,
        provenance: Object.freeze({
          triggerDomain: requirement.trigger?.domain ?? null,
          triggerTeam: team,
          playerId: requirement.trigger?.playerId ?? null,
          changeType: requirement.trigger?.changeType ?? null,
          changedFields: Object.freeze([
            ...(requirement.trigger?.changedFields ?? []),
          ]),
          evidenceEffectiveAt: requirement.trigger?.evidenceEffectiveAt ?? null,
          detectedAt: requirement.refresh?.detectedAt ?? null,
          reasonCode: requirement.refresh?.reasonCode ?? null,
        }),
        governance: governance({ executed: true }),
      }
    );
  } catch (error) {
    return baseResult(
      requirement,
      NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.CANONICAL_RECOMPUTE_FAILED,
      "CANONICAL_RECOMPUTE_FAILED",
      {
        invalidation,
        availability,
        error: Object.freeze({
          name: error?.name ?? "Error",
          message: error?.message ?? String(error),
        }),
        governance: governance(),
      }
    );
  }
}

export default {
  NFL_GAME_DECISION_REFRESH_EXECUTION_CONTRACT,
  NFL_GAME_DECISION_REFRESH_EXECUTION_VERSION,
  NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS,
  executeNFLGameDecisionRefresh,
};
