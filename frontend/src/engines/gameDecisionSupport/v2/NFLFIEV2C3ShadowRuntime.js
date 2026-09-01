import generatedModel from "../../../data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLFIEV2C3ShadowModel.js";

export const NFL_FIE_V2_C3_SHADOW_CONTRACT = "NFLFIEV2C3ShadowDecision";
export const NFL_FIE_V2_C3_SHADOW_VERSION = "NFL-FIE-V2-C3-SHADOW-DECISION-1.0.0";

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const logistic = (value) => 1 / (1 + Math.exp(-value));

function confidenceBand(value) {
  if (!finite(value)) return "UNKNOWN";
  if (value >= 0.8) return "HIGH";
  if (value >= 0.65) return "MODERATE";
  return "LOW";
}

function standardized(value, normalization) {
  if (!finite(value) || !finite(normalization?.mean) || !finite(normalization?.sd) || normalization.sd <= 0) {
    return null;
  }
  return (value - normalization.mean) / normalization.sd;
}

function linearPredict(features, fit) {
  if (!fit || !finite(fit.intercept)) return null;
  let value = fit.intercept;
  for (const [key, coefficient] of Object.entries(fit.coefficients || {})) {
    const z = standardized(features?.[key], fit.normalization?.[key]);
    if (!finite(z) || !finite(coefficient)) return null;
    value += coefficient * z;
  }
  return value;
}

export function getNFLFIEV2C3ShadowModelConfig() {
  if (!generatedModel) throw new Error("Frozen C3 shadow model artifact is unavailable.");
  if (generatedModel.status !== "SHADOW_ONLY") throw new Error("C3 shadow model status must remain SHADOW_ONLY.");
  if (generatedModel.productionAuthorityGranted === true) throw new Error("C3 shadow model must not have production authority.");
  if (generatedModel.pickemPresentationAuthorityGranted === true) throw new Error("C3 shadow model must not have Pick'em presentation authority.");
  return generatedModel;
}

export function createNFLFIEV2C3ShadowFeatureInput({
  teamEpaComposite,
  teamSuccessRate,
  teamExplosiveness,
  teamOpponentAdjusted,
} = {}) {
  const values = { teamEpaComposite, teamSuccessRate, teamExplosiveness, teamOpponentAdjusted };
  const missing = Object.entries(values).filter(([, value]) => !finite(Number(value))).map(([key]) => key);
  if (missing.length) {
    throw new Error(`INSUFFICIENT_C3_SHADOW_FEATURES:${missing.join(",")}`);
  }
  return Object.freeze(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)])));
}

export function projectNFLFIEV2C3ShadowFeatures(featureInput = {}) {
  const config = getNFLFIEV2C3ShadowModelConfig();
  const input = createNFLFIEV2C3ShadowFeatureInput(featureInput);
  const opponentPredicted = linearPredict({
    teamEpaComposite: input.teamEpaComposite,
    teamSuccessRate: input.teamSuccessRate,
    teamExplosiveness: input.teamExplosiveness,
  }, config.opponentResidualizer);

  if (!finite(opponentPredicted)) {
    throw new Error("C3 shadow opponent-context residual could not be projected.");
  }

  return Object.freeze({
    teamEpaComposite: input.teamEpaComposite,
    teamSuccessRate: input.teamSuccessRate,
    teamExplosiveness: input.teamExplosiveness,
    teamOpponentAdjusted: input.teamOpponentAdjusted,
    opponentContextPredicted: opponentPredicted,
    opponentContextResidual: input.teamOpponentAdjusted - opponentPredicted,
  });
}

export function evaluateNFLFIEV2C3ShadowDecision({ game = {}, featureInput = {}, generatedAt = null } = {}) {
  const config = getNFLFIEV2C3ShadowModelConfig();
  const features = projectNFLFIEV2C3ShadowFeatures(featureInput);
  const expectedHomeMargin = linearPredict(features, config.marginModel);
  if (!finite(expectedHomeMargin)) throw new Error("C3 shadow expected margin could not be evaluated.");

  const probabilityScale = Number(config.probabilityScale);
  if (!finite(probabilityScale) || probabilityScale <= 0) throw new Error("C3 shadow probability scale is invalid.");

  const homeWinProbability = clamp(logistic(expectedHomeMargin / probabilityScale), 1e-6, 1 - 1e-6);
  const awayWinProbability = 1 - homeWinProbability;
  const favoriteCode = homeWinProbability >= 0.5 ? game.homeTeam || null : game.awayTeam || null;
  const confidence = Math.abs(homeWinProbability - 0.5) * 2;

  return Object.freeze({
    contract: NFL_FIE_V2_C3_SHADOW_CONTRACT,
    version: NFL_FIE_V2_C3_SHADOW_VERSION,
    status: "SHADOW_ONLY",
    productionAuthority: false,
    pickemPresentationAuthority: false,
    game: Object.freeze({
      gameId: game.gameId ?? null,
      season: Number.isFinite(Number(game.season)) ? Number(game.season) : null,
      week: Number.isFinite(Number(game.week)) ? Number(game.week) : null,
      awayTeam: game.awayTeam || null,
      homeTeam: game.homeTeam || null,
    }),
    favorite: favoriteCode,
    homeWinProbability,
    awayWinProbability,
    expectedHomeMargin,
    confidence,
    confidenceBand: confidenceBand(confidence),
    model: Object.freeze({
      id: config.modelId,
      version: config.modelVersion,
      status: config.status,
      trainingCutoffSeason: config.trainingCutoffSeason,
      trainingRows: config.trainingRows,
      frozenCandidate: config.frozenCandidate,
    }),
    features,
    governance: Object.freeze({
      productionAuthorityGranted: false,
      pickemPresentationAuthorityGranted: false,
      decisionApiMutationAuthorized: false,
      persistenceAuthorized: false,
      candidateTuningAuthorized: false,
    }),
    generatedAt: generatedAt || null,
  });
}

export default {
  NFL_FIE_V2_C3_SHADOW_CONTRACT,
  NFL_FIE_V2_C3_SHADOW_VERSION,
  getNFLFIEV2C3ShadowModelConfig,
  createNFLFIEV2C3ShadowFeatureInput,
  projectNFLFIEV2C3ShadowFeatures,
  evaluateNFLFIEV2C3ShadowDecision,
};
