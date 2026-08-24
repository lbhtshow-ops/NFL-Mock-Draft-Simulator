import { evaluateNFLRosterPlayer } from "../../PlayerRosterEvaluationEngine.js";
import { hardenNFLPlayerEvaluation } from "./NFLPlayerEvaluationGovernance.js";

export const NFL_HISTORICAL_EVALUATION_ADAPTER_VERSION =
  "FIE-NFL-CANONICAL-HISTORICAL-EVALUATION-ADAPTER-1.0.0";

/**
 * Present-state canonical NFL-player evaluation boundary.
 * Existing behavior is intentionally preserved.
 */
export function evaluateCanonicalNFLPlayer(player = {}) {
  const legacyEvaluation = evaluateNFLRosterPlayer(player);

  return hardenNFLPlayerEvaluation({
    player,
    evaluation: legacyEvaluation,
  });
}

/**
 * Historical canonical NFL-player evaluation boundary.
 *
 * The current PlayerRosterEvaluationEngine reads present-state/global indexes,
 * so this path MUST NOT fall back to evaluateNFLRosterPlayer(). A historical
 * provider must explicitly declare temporal support and must evaluate only the
 * supplied pre-as-of evidence bundle.
 */
export function evaluateCanonicalHistoricalNFLPlayer({
  player = {},
  asOf = null,
  evidenceBundle = null,
  historicalEvaluationProvider = null,
} = {}) {
  if (!asOf) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "HISTORICAL_AS_OF_REQUIRED",
      asOf: null,
      evaluation: null,
    });
  }

  if (!evidenceBundle) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "HISTORICAL_EVIDENCE_BUNDLE_REQUIRED",
      asOf,
      evaluation: null,
    });
  }

  if (
    typeof historicalEvaluationProvider !== "function" ||
    historicalEvaluationProvider.supportsHistoricalEvidence !== true
  ) {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason: "CANONICAL_HISTORICAL_EVALUATION_PROVIDER_REQUIRED",
      asOf,
      evaluation: null,
    });
  }

  const historicalEvaluation = historicalEvaluationProvider({
    player,
    asOf,
    evidenceBundle,
  });

  if (!historicalEvaluation || historicalEvaluation.status === "UNAVAILABLE") {
    return Object.freeze({
      status: "UNAVAILABLE",
      reason:
        historicalEvaluation?.reason ||
        "CANONICAL_HISTORICAL_EVALUATION_NOT_AVAILABLE",
      asOf,
      evaluation: null,
    });
  }

  return Object.freeze({
    status: "AVAILABLE",
    asOf,
    adapterVersion: NFL_HISTORICAL_EVALUATION_ADAPTER_VERSION,
    evaluation: hardenNFLPlayerEvaluation({
      player,
      evaluation: historicalEvaluation,
    }),
  });
}

export default {
  evaluateCanonicalNFLPlayer,
  evaluateCanonicalHistoricalNFLPlayer,
};
