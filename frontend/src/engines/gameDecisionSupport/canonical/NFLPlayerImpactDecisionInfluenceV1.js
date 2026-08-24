export const NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_CONTRACT =
  "NFLPlayerImpactDecisionInfluenceV1";

export const NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_VERSION =
  "FIE-NFL-PLAYER-IMPACT-DECISION-INFLUENCE-1.0.0";

export const NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY =
  Object.freeze({
    state: "ACTIVE",
    productionAuthorityGranted: true,
    authorityGrantedBy: "EXPLICIT_PI5_PROMOTION",
    sourceSprint: "PI.4",
    variant: "VERY_HIGH_ONLY",
    scale: 0.20,
    candidateHash:
      "cae105f496626d4064bf76220406b5b62eb1442f9dcf39a3f0bfe319890810e4",
    validationRows: 720,
    validationSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
    finalFit: Object.freeze({
      rawVeryHighEffect: -7.139221586649016,
      scale: 0.20,
      teamPointMarginDelta: -1.4278443173298032,
      methodology:
        "FIXED_ALL_VALIDATED_SEASONS_FIT_AFTER_PREDECLARED_CROSS_VALIDATED_SELECTION",
    }),
    productionTeamStrengthMutationAuthorized: false,
    standaloneQuarterbackPenaltyAuthorized: false,
    standaloneAvailabilityPenaltyAuthorized: false,
  });

const QUALIFIED_STATUSES = new Set(["OUT", "DOUBTFUL"]);

function teamEvidence(matchup, side) {
  return matchup?.sourceTeamIntelligence?.[side]?.availabilityEvidence || null;
}

function qualifying(team) {
  return (Array.isArray(team?.players) ? team.players : []).filter((player) => {
    const status = String(player?.availability?.status || "").toUpperCase();
    const delta = Number(player?.decisionInfluenceEvidence?.caliberDelta);
    return QUALIFIED_STATUSES.has(status) && Number.isFinite(delta) && delta >= 15;
  });
}

function teamInfluence(team) {
  const players = qualifying(team);
  if (!players.length) {
    return Object.freeze({
      applied: false,
      pointMarginDelta: 0,
      qualifyingPlayerCount: 0,
      qualifyingPlayers: Object.freeze([]),
      reason: "NO_QUALIFIED_VERY_HIGH_PLAYER_IMPACT",
    });
  }
  return Object.freeze({
    applied: true,
    pointMarginDelta:
      NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.finalFit.teamPointMarginDelta,
    qualifyingPlayerCount: players.length,
    qualifyingPlayers: Object.freeze(players.map((player) =>
      Object.freeze({
        playerId: player?.playerId || null,
        displayName: player?.displayName || null,
        position: player?.position || null,
        status: player?.availability?.status || null,
        caliberDelta: Number(player?.decisionInfluenceEvidence?.caliberDelta),
      })
    )),
    reason: "VERY_HIGH_ONLY_FIXED_CANDIDATE",
  });
}

export function resolveNFLPlayerImpactDecisionInfluenceV1({
  matchupIntelligence = null,
} = {}) {
  const home = teamInfluence(teamEvidence(matchupIntelligence, "home"));
  const away = teamInfluence(teamEvidence(matchupIntelligence, "away"));
  return Object.freeze({
    contract: NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_CONTRACT,
    version: NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_VERSION,
    state: "ACTIVE",
    productionAuthorityGranted: true,
    candidate: Object.freeze({
      variant: NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.variant,
      scale: NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.scale,
      candidateHash: NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.candidateHash,
    }),
    applied: home.applied || away.applied,
    homeMarginDelta: home.pointMarginDelta - away.pointMarginDelta,
    home,
    away,
    safeguards: Object.freeze({
      teamStrengthMutated: false,
      matchupDimensionsMutated: false,
      standaloneQuarterbackPenaltyApplied: false,
      standaloneAvailabilityPenaltyApplied: false,
    }),
  });
}

export function applyNFLPlayerImpactDecisionInfluenceV1({
  matchupIntelligence = null,
  modelParameters = {},
} = {}) {
  const influence =
    resolveNFLPlayerImpactDecisionInfluenceV1({ matchupIntelligence });

  const matchupEdge = Number(matchupIntelligence?.matchupEdge);
  const evidenceQuality = Number(matchupIntelligence?.evidenceQuality);
  const edgeScale = Number(modelParameters?.edgeScale);

  if (!influence.applied) {
    return Object.freeze({
      matchupIntelligence,
      influence,
      effectiveMatchupEdge: Number.isFinite(matchupEdge) ? matchupEdge : null,
      matchupEdgeDelta: 0,
    });
  }

  if (
    !Number.isFinite(matchupEdge) ||
    !Number.isFinite(evidenceQuality) ||
    evidenceQuality <= 0 ||
    !Number.isFinite(edgeScale) ||
    edgeScale === 0
  ) {
    throw new Error(
      "PLAYER_IMPACT_DECISION_INFLUENCE_REQUIRES_CANONICAL_MATCHUP_AND_MODEL_SCALE"
    );
  }

  const matchupEdgeDelta =
    influence.homeMarginDelta / (evidenceQuality * edgeScale);
  const effectiveMatchupEdge = matchupEdge + matchupEdgeDelta;

  return Object.freeze({
    matchupIntelligence: Object.freeze({
      ...matchupIntelligence,
      matchupEdge: effectiveMatchupEdge,
    }),
    influence,
    effectiveMatchupEdge,
    matchupEdgeDelta,
  });
}

export default {
  NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_CONTRACT,
  NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_VERSION,
  NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY,
  resolveNFLPlayerImpactDecisionInfluenceV1,
  applyNFLPlayerImpactDecisionInfluenceV1,
};
