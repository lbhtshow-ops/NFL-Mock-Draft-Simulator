const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const finiteInteger = value => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

export const NFL_GAME_DECISION_REFRESH_REQUIREMENT_CONTRACT =
  "NFLGameDecisionRefreshRequirement";

export const NFL_GAME_DECISION_REFRESH_REQUIREMENT_VERSION = "1.0.0";

export const NFL_GAME_DECISION_REFRESH_REASON_CODES = Object.freeze({
  MATERIAL_PLAYER_AVAILABILITY_CHANGE: "MATERIAL_PLAYER_AVAILABILITY_CHANGE",
  STARTING_QB_AVAILABILITY_CHANGE: "STARTING_QB_AVAILABILITY_CHANGE",
  STARTER_AVAILABILITY_CHANGE: "STARTER_AVAILABILITY_CHANGE",
  DEPTH_CHART_CHANGE: "DEPTH_CHART_CHANGE",
  ROSTER_TRANSACTION_CHANGE: "ROSTER_TRANSACTION_CHANGE",
  PLAYER_AVAILABILITY_CHANGE_REVIEW_REQUIRED:
    "PLAYER_AVAILABILITY_CHANGE_REVIEW_REQUIRED",
  NON_MATERIAL_PLAYER_AVAILABILITY_CHANGE:
    "NON_MATERIAL_PLAYER_AVAILABILITY_CHANGE",
  UNCHANGED_EVIDENCE: "UNCHANGED_EVIDENCE",
});

export function createNFLGameDecisionRefreshRequirement({
  game = {},
  trigger = {},
  materiality = {},
  refreshRequired = false,
  reasonCode = null,
  detectedAt = null,
} = {}) {
  const normalizedGame = Object.freeze({
    gameId: finiteInteger(game.gameId),
    season: finiteInteger(game.season),
    week: finiteInteger(game.week),
    awayTeam: clean(game.awayTeam)?.toUpperCase() ?? null,
    homeTeam: clean(game.homeTeam)?.toUpperCase() ?? null,
    kickoff: clean(game.kickoff),
  });

  const normalizedTrigger = Object.freeze({
    domain: clean(trigger.domain) ?? "PLAYER_AVAILABILITY",
    team: clean(trigger.team)?.toUpperCase() ?? null,
    playerId: clean(trigger.playerId),
    changeType: clean(trigger.changeType),
    changedFields: Object.freeze(
      Array.isArray(trigger.changedFields)
        ? [...new Set(trigger.changedFields.map(clean).filter(Boolean))]
        : []
    ),
    previousSnapshotId: clean(trigger.previousSnapshotId),
    currentSnapshotId: clean(trigger.currentSnapshotId),
    evidenceEffectiveAt: clean(trigger.evidenceEffectiveAt),
  });

  const normalizedMateriality = Object.freeze({
    level: clean(materiality.level) ?? "UNKNOWN",
    rationale: clean(materiality.rationale),
    position: clean(materiality.position)?.toUpperCase() ?? null,
    starter: materiality.starter === true,
    previousStatus: clean(materiality.previousStatus)?.toUpperCase() ?? null,
    currentStatus: clean(materiality.currentStatus)?.toUpperCase() ?? null,
  });

  const errors = [];
  if (refreshRequired === true) {
    if (normalizedGame.gameId === null) errors.push("GAME_ID_REQUIRED");
    if (normalizedGame.season === null) errors.push("SEASON_REQUIRED");
    if (normalizedGame.week === null) errors.push("WEEK_REQUIRED");
    if (!normalizedGame.awayTeam) errors.push("AWAY_TEAM_REQUIRED");
    if (!normalizedGame.homeTeam) errors.push("HOME_TEAM_REQUIRED");
    if (!normalizedTrigger.team) errors.push("TRIGGER_TEAM_REQUIRED");
    if (!clean(reasonCode)) errors.push("REASON_CODE_REQUIRED");
  }

  if (
    normalizedTrigger.team &&
    normalizedGame.awayTeam &&
    normalizedGame.homeTeam &&
    normalizedTrigger.team !== normalizedGame.awayTeam &&
    normalizedTrigger.team !== normalizedGame.homeTeam
  ) {
    errors.push("TRIGGER_TEAM_NOT_IN_GAME");
  }

  return Object.freeze({
    contract: NFL_GAME_DECISION_REFRESH_REQUIREMENT_CONTRACT,
    version: NFL_GAME_DECISION_REFRESH_REQUIREMENT_VERSION,
    game: normalizedGame,
    trigger: normalizedTrigger,
    materiality: normalizedMateriality,
    refresh: Object.freeze({
      required: refreshRequired === true,
      reasonCode: clean(reasonCode),
      detectedAt: clean(detectedAt),
    }),
    governance: Object.freeze({
      recomputeAuthorized: false,
      cacheMutationAuthorized: false,
      probabilityMutationAuthorized: false,
      modelMutationAuthorized: false,
      orchestrationOnly: true,
    }),
    validation: Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors),
    }),
  });
}

export default {
  NFL_GAME_DECISION_REFRESH_REQUIREMENT_CONTRACT,
  NFL_GAME_DECISION_REFRESH_REQUIREMENT_VERSION,
  NFL_GAME_DECISION_REFRESH_REASON_CODES,
  createNFLGameDecisionRefreshRequirement,
};
