import { resolvePlayerContext } from "../../context/PlayerContextResolver.js";
import { getProductionIntelligenceResult } from "../../ProductionEngine.js";
import { getAthleticIntelligenceResult } from "../../AthleticIntelligenceEngine.js";
import { getFootballIQIntelligenceResult } from "../../FootballIQEngine.js";
import { getSchemeFitIntelligenceResult } from "../../SchemeFitEngine.js";
import { getPlayerTraitIntelligenceResult } from "../../PlayerTraitEngine.js";
import { getCanonicalPlayerId } from "../../shared/getCanonicalPlayerId.js";
import {
  evaluateProspectByPosition,
  normalizeProspectPosition,
} from "../prospectModels/registry/ProspectModelRegistry.js";

export const CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION =
  "FIE-CANONICAL-PROSPECT-EVALUATION-SERVICE-1.0.0";

function resolvePosition(player = {}, context = {}) {
  return (
    context?.position ||
    player?.displayPosition ||
    player?.position ||
    player?.identity?.position ||
    null
  );
}

function normalizeEvaluationPlayerId(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function buildIntelligence(player, playerContext) {
  const options = { playerContext };
  return {
    production: getProductionIntelligenceResult(player, options),
    athleticism: getAthleticIntelligenceResult(player, options),
    footballIQ: getFootballIQIntelligenceResult(player, options),
    schemeFit: getSchemeFitIntelligenceResult(player, options),
    playerTraits: getPlayerTraitIntelligenceResult(player, options),
  };
}

function resolveReadiness(modelResult) {
  if (!modelResult?.available || typeof modelResult?.overallGrade !== "number") {
    return "UNAVAILABLE";
  }
  return Array.isArray(modelResult?.missingEvidence) && modelResult.missingEvidence.length
    ? "PARTIAL"
    : "AVAILABLE";
}

/**
 * Canonical prospect runtime boundary.
 *
 * Owns orchestration only: context resolution, domain-intelligence gathering,
 * registry dispatch, and preservation of calibration evidence. It never
 * re-grades a prospect and never substitutes stored scouting grades when a
 * position model is unavailable.
 */
export function evaluateCanonicalProspect({
  player = null,
  playerContext = null,
  scoutingProfile = null,
  includeDiagnostics = false,
} = {}) {
  if (!player || typeof player !== "object") {
    return {
      available: false,
      playerId: null,
      position: null,
      readiness: "UNAVAILABLE",
      modelResult: null,
      intelligence: null,
      calibrationEvidence: scoutingProfile || null,
      error: "INVALID_PLAYER_INPUT",
      versions: { service: CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION },
    };
  }

  const playerId = normalizeEvaluationPlayerId(getCanonicalPlayerId(player));
  const context = playerContext || resolvePlayerContext(player);
  const normalization = normalizeProspectPosition(resolvePosition(player, context));
  const position = normalization.canonicalPosition;

  if (!playerId || !position) {
    return {
      available: false,
      playerId: playerId || null,
      position: position || null,
      readiness: "UNAVAILABLE",
      modelResult: null,
      intelligence: null,
      calibrationEvidence: scoutingProfile || null,
      error: !playerId ? "MISSING_PLAYER_ID" : normalization.reason,
      versions: { service: CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION },
    };
  }

  const intelligence = buildIntelligence(player, context);
  const modelResult = evaluateProspectByPosition({
    position,
    player,
    playerId,
    context,
    intelligence,
    // Scouting is preserved as contextual/calibration evidence. Position
    // models remain responsible for whether/how non-scoring context is used.
    scouting: scoutingProfile || null,
    options: { includeDiagnostics },
    registryOptions: { includeDiagnostics },
  });

  return {
    available: Boolean(
      modelResult?.available &&
        typeof modelResult?.overallGrade === "number" &&
        Number.isFinite(modelResult.overallGrade)
    ),
    playerId,
    position,
    readiness: resolveReadiness(modelResult),
    modelResult,
    intelligence,
    calibrationEvidence: scoutingProfile || null,
    error: modelResult?.available ? null :
      modelResult?.validation?.errors?.[0]?.code || "PROSPECT_MODEL_UNAVAILABLE",
    versions: {
      service: CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION,
      model: modelResult?.versions?.model || null,
      weights: modelResult?.versions?.weights || null,
      data: modelResult?.versions?.data ?? null,
    },
  };
}

export default { evaluateCanonicalProspect };
