import { normalizeGameRequest } from "./decisionMapper.mjs";
import { getNFLTeamDisplayName } from "./teamNormalizer.mjs";
import {
  SHADOW_REQUEST_CONTRACT,
  SHADOW_CONTRACT_VERSION,
  SHADOW_MODEL_ID,
  SHADOW_MODEL_VERSION,
  createShadowBundle,
  createShadowError,
} from "./shadowContracts.mjs";

const MAX_GAMES = 32;
const json = (statusCode, body, origin = "*") => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-LBHT-FIE-Shadow-Token",
    "Cache-Control": "no-store",
  },
  body,
});

function headerValue(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return String(headers.get(name) || "");
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || "") : "";
}

function mapDecision(game, shadow) {
  const decision = shadow?.decision;
  if (!decision || decision.status !== "SHADOW_ONLY") throw new Error("C3 shadow decision contract invalid.");
  if (decision.productionAuthority === true || decision.pickemPresentationAuthority === true) {
    throw new Error("C3 shadow decision attempted to claim production authority.");
  }
  if (decision?.model?.id !== SHADOW_MODEL_ID || decision?.model?.version !== SHADOW_MODEL_VERSION) {
    throw new Error("C3 shadow model identity drift detected.");
  }
  const favoriteCode = decision.favorite || null;
  return {
    gameId: game.gameId,
    season: game.season,
    week: game.week,
    awayTeam: getNFLTeamDisplayName(game.awayTeam) || game.awayTeam,
    homeTeam: getNFLTeamDisplayName(game.homeTeam) || game.homeTeam,
    awayTeamCode: game.awayTeam,
    homeTeamCode: game.homeTeam,
    favorite: favoriteCode ? getNFLTeamDisplayName(favoriteCode) || favoriteCode : null,
    favoriteCode,
    homeWinProbability: decision.homeWinProbability,
    awayWinProbability: decision.awayWinProbability,
    expectedHomeMargin: decision.expectedHomeMargin,
    confidence: decision.confidence,
    confidenceBand: decision.confidenceBand,
    evidenceQuality: null,
    matchupEdge: null,
    model: decision.model,
    generatedAt: decision.generatedAt,
    features: decision.features,
    featureProvenance: shadow.featureProvenance || null,
    governance: {
      productionAuthorityGranted: false,
      pickemPresentationAuthorityGranted: false,
      decisionCacheWriteAuthorized: false,
      shadowSnapshotPersistenceAuthorized: true,
      persistenceScope: "PICKEM_FIE_PREDICTION_SNAPSHOTS_ONLY",
    },
  };
}

export function createFieV2C3ShadowHandler({
  getShadowDecision,
  shadowToken,
  now = () => new Date().toISOString(),
  allowedOrigin = "*",
} = {}) {
  if (typeof getShadowDecision !== "function") throw new Error("getShadowDecision dependency is required");
  return async ({ method, path, body = null, headers = {} } = {}) => {
    const m = String(method || "GET").toUpperCase();
    if (m === "OPTIONS") return json(204, null, allowedOrigin);
    if (m !== "POST" || path !== "/internal/shadow/v2/c3/game-decisions") {
      return json(404, createShadowError("NOT_FOUND", "Shadow endpoint not found."), allowedOrigin);
    }
    if (!shadowToken) {
      return json(503, createShadowError("SHADOW_TOKEN_NOT_CONFIGURED", "Shadow endpoint is not configured."), allowedOrigin);
    }
    const suppliedToken = headerValue(headers, "x-lbht-fie-shadow-token");
    if (!suppliedToken || suppliedToken !== shadowToken) {
      return json(401, createShadowError("SHADOW_AUTH_REQUIRED", "Shadow endpoint authorization failed."), allowedOrigin);
    }
    if (body?.contract !== SHADOW_REQUEST_CONTRACT || body?.version !== SHADOW_CONTRACT_VERSION) {
      return json(400, createShadowError("INVALID_CONTRACT", "Unsupported shadow request contract."), allowedOrigin);
    }
    if (!Array.isArray(body.games) || !body.games.length) {
      return json(400, createShadowError("INVALID_GAMES", "games must be a non-empty array."), allowedOrigin);
    }
    if (body.games.length > MAX_GAMES) {
      return json(413, createShadowError("TOO_MANY_GAMES", `A maximum of ${MAX_GAMES} games is allowed.`), allowedOrigin);
    }

    const generatedAt = now();
    const decisions = [];
    for (const raw of body.games) {
      const normalized = normalizeGameRequest(raw);
      if (!normalized.valid) {
        return json(400, createShadowError("INVALID_GAME", "One or more shadow games failed validation.", {
          gameId: raw?.gameId ?? null,
          errors: normalized.errors,
        }), allowedOrigin);
      }
      const game = normalized.game;
      const shadow = await getShadowDecision({ game, generatedAt });
      decisions.push(mapDecision(game, shadow));
    }
    return json(200, createShadowBundle(decisions, generatedAt), allowedOrigin);
  };
}

export default { createFieV2C3ShadowHandler };
