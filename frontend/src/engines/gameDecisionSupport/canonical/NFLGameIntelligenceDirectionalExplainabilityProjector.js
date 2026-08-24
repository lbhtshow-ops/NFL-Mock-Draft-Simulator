export const NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_CONTRACT =
  "NFLGameIntelligenceDirectionalExplainability";

export const NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_VERSION =
  "FIE-NFL-GAME-INTELLIGENCE-DIRECTIONAL-EXPLAINABILITY-1.0.0";

const DIMENSIONS = Object.freeze([
  ["overallStrength", "overall team strength"],
  ["passMatchup", "passing matchup"],
  ["rushMatchup", "rushing matchup"],
  ["recentForm", "recent form"],
  ["specialTeams", "special teams"],
  ["quarterback", "quarterback availability"],
  ["availability", "overall player availability"],
  ["protectionPressure", "pass protection vs pressure"],
  ["explosivePlay", "explosive-play matchup"],
  ["redZone", "red-zone matchup"],
  ["weatherStyle", "weather/style interaction"],
]);

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function teamName(code, {
  homeTeamCode,
  awayTeamCode,
  homeTeam,
  awayTeam,
}) {
  if (code === homeTeamCode) return homeTeam || homeTeamCode || null;
  if (code === awayTeamCode) return awayTeam || awayTeamCode || null;
  return code || null;
}

function summaryFor({ favoredTeam, label }) {
  if (!favoredTeam || !label) return null;
  return `${favoredTeam} holds the canonical ${label} advantage.`;
}

export function projectNFLGameIntelligenceDirectionalExplainability({
  matchup = null,
  favoriteCode = null,
  homeTeamCode = null,
  awayTeamCode = null,
  homeTeam = null,
  awayTeam = null,
  minimumMagnitude = 4,
  maxItemsPerCollection = 4,
} = {}) {
  const dimensions =
    matchup?.dimensions &&
    typeof matchup.dimensions === "object"
      ? matchup.dimensions
      : {};

  const favorite =
    favoriteCode === homeTeamCode || favoriteCode === awayTeamCode
      ? favoriteCode
      : null;

  const factors = DIMENSIONS
    .map(([dimension, label]) => {
      const value = dimensions?.[dimension];

      if (!finite(value) || Math.abs(value) < minimumMagnitude) {
        return null;
      }

      const favoredTeamCode =
        value > 0 ? homeTeamCode : awayTeamCode;

      if (!favoredTeamCode) return null;

      const favoredTeam = teamName(favoredTeamCode, {
        homeTeamCode,
        awayTeamCode,
        homeTeam,
        awayTeam,
      });

      return {
        dimension,
        favoredTeam,
        favoredTeamCode,
        magnitude: Number(Math.abs(value).toFixed(2)),
        label,
        summary: summaryFor({
          favoredTeam,
          label,
        }),
        evidenceQuality:
          finite(matchup?.evidenceQuality)
            ? matchup.evidenceQuality
            : null,
        evidence: null,
        provenance: {
          sourceContract: matchup?.contract || null,
          sourceVersion: matchup?.version || null,
          sourceField: `dimensions.${dimension}`,
          directionSemantics:
            "POSITIVE_HOME_NEGATIVE_AWAY",
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.magnitude - a.magnitude);

  const keyAdvantages = favorite
    ? factors
        .filter((factor) => factor.favoredTeamCode === favorite)
        .slice(0, maxItemsPerCollection)
    : [];

  const counterweights = favorite
    ? factors
        .filter((factor) => factor.favoredTeamCode !== favorite)
        .slice(0, maxItemsPerCollection)
    : [];

  const limitations = [
    favorite
      ? null
      : "Canonical favorite is unavailable; directional explanation cannot be partitioned.",
    matchup?.evidenceQuality === null ||
    matchup?.evidenceQuality === undefined
      ? "Matchup evidence quality is unavailable."
      : null,
    "Detailed per-dimension evidence provenance is not yet mapped in V1; evidence remains null rather than inferred.",
  ].filter(Boolean);

  return {
    contract:
      NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_CONTRACT,
    version:
      NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_VERSION,
    favorite: teamName(favorite, {
      homeTeamCode,
      awayTeamCode,
      homeTeam,
      awayTeam,
    }),
    favoriteCode: favorite,
    keyAdvantages,
    counterweights,
    limitations,
    safeguards: {
      readOnlyExplainability: true,
      matchupDimensionsRecomputed: false,
      favoriteRecomputed: false,
      matchupScoringMutated: false,
      decisionScoringMutated: false,
      directionInferredFromCanonicalSignedDimension: true,
      pickemReasoningRequired: false,
    },
  };
}

export default {
  NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_CONTRACT,
  NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_VERSION,
  projectNFLGameIntelligenceDirectionalExplainability,
};
