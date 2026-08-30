export const NFL_MATCHUP_INTELLIGENCE_CONTRACT =
  "NFLMatchupIntelligenceResult";

export const NFL_MATCHUP_INTELLIGENCE_VERSION =
  "NFL-MATCHUP-INTELLIGENCE-V1.0.0";

export const NFL_MATCHUP_INTELLIGENCE_STATES =
  Object.freeze({
    AVAILABLE: "AVAILABLE",
    PARTIAL: "PARTIAL",
    UNKNOWN: "UNKNOWN",
    UNAVAILABLE: "UNAVAILABLE",
  });

function finiteOrNull(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreOrNull(value) {
  const numeric = finiteOrNull(value);
  return numeric === null
    ? null
    : clamp(numeric, -100, 100);
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

export function createNFLMatchupIntelligenceResult({
  gameId = null,
  season = null,
  week = null,
  awayTeam = null,
  homeTeam = null,
  state = NFL_MATCHUP_INTELLIGENCE_STATES.UNKNOWN,
  matchupEdge = null,
  homeAdvantageIndex = null,
  dimensions = {},
  context = {},
  evidenceQuality = null,
  evidenceQualityKnown = false,
  keyAdvantages = [],
  counterweights = [],
  limitations = [],
  sourceTeamIntelligence = {},
  evaluatedAt = null,
} = {}) {
  return {
    contract: NFL_MATCHUP_INTELLIGENCE_CONTRACT,
    version: NFL_MATCHUP_INTELLIGENCE_VERSION,

    game: {
      gameId,
      season,
      week,
      awayTeam,
      homeTeam,
    },

    state,

    // Positive = home-team edge, negative = away-team edge.
    matchupEdge: scoreOrNull(matchupEdge),

    homeAdvantageIndex:
      finiteOrNull(homeAdvantageIndex),

    dimensions: {
      overallStrength:
        scoreOrNull(dimensions.overallStrength),
      passMatchup:
        scoreOrNull(dimensions.passMatchup),
      rushMatchup:
        scoreOrNull(dimensions.rushMatchup),
      recentForm:
        scoreOrNull(dimensions.recentForm),
      specialTeams:
        scoreOrNull(dimensions.specialTeams),
      quarterback:
        scoreOrNull(dimensions.quarterback),
      availability:
        scoreOrNull(dimensions.availability),
      protectionPressure:
        scoreOrNull(dimensions.protectionPressure),
    },

    context: {
      homeField:
        finiteOrNull(context.homeField),
      rest:
        finiteOrNull(context.rest),
      weather:
        context.weather || null,
      travel:
        context.travel || null,
    },

    evidenceQuality:
      evidenceQualityKnown
        ? clamp(
            finiteOrNull(evidenceQuality) ?? 0,
            0,
            1
          )
        : null,

    evidenceQualityKnown: Boolean(
      evidenceQualityKnown &&
      finiteOrNull(evidenceQuality) !== null
    ),

    keyAdvantages: array(keyAdvantages),
    counterweights: array(counterweights),
    limitations: array(limitations),

    sourceTeamIntelligence,

    evaluatedAt,

    calibratedWinProbability: false,
    expectedPointMargin: null,
  };
}

export function isNFLMatchupIntelligenceResult(value) {
  return Boolean(
    value &&
      value.contract ===
        NFL_MATCHUP_INTELLIGENCE_CONTRACT &&
      value.version ===
        NFL_MATCHUP_INTELLIGENCE_VERSION &&
      value.game &&
      typeof value.game.homeTeam === "string" &&
      typeof value.game.awayTeam === "string"
  );
}

export default {
  NFL_MATCHUP_INTELLIGENCE_CONTRACT,
  NFL_MATCHUP_INTELLIGENCE_VERSION,
  NFL_MATCHUP_INTELLIGENCE_STATES,
  createNFLMatchupIntelligenceResult,
  isNFLMatchupIntelligenceResult,
};
