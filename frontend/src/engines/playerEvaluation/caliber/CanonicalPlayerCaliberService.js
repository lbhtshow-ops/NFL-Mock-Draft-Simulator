import {
  PLAYER_CALIBER_SUBJECT_KINDS,
  createCanonicalPlayerCaliberResult,
} from "./CanonicalPlayerCaliberContract.js";
import {
  adaptNFLPlayerEvaluationToCanonicalCaliber,
  adaptProspectEvaluationToCanonicalCaliber,
} from "./adapters/index.js";

/**
 * Shared higher-level FIE boundary for canonical player caliber.
 *
 * This service does not research, grade, or infer player caliber. It only
 * projects outputs from authorized evaluators into one stable contract.
 * Availability & Impact and other higher-level engines should consume this
 * boundary instead of legacy evaluator fields directly.
 */
export function resolveCanonicalPlayerCaliber({
  subjectKind,
  player = {},
  nflEvaluation = null,
  prospectModelResult = null,
} = {}) {
  if (subjectKind === PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER) {
    return adaptNFLPlayerEvaluationToCanonicalCaliber({
      player,
      evaluation: nflEvaluation,
    });
  }

  if (subjectKind === PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT) {
    return adaptProspectEvaluationToCanonicalCaliber({
      player,
      modelResult: prospectModelResult,
    });
  }

  return createCanonicalPlayerCaliberResult({
    subjectKind: null,
    playerId: player?.canonicalPlayerId || player?.id || null,
    displayName: player?.displayName || player?.name || null,
    position: player?.identity?.position || player?.position || null,
    available: false,
    missingEvidence: ["supportedSubjectKind"],
    explanation: {
      caliberRationale: [
        "Canonical caliber requires an explicitly supported evaluator subject kind.",
      ],
    },
    sourceEvaluation: {
      engine: "CanonicalPlayerCaliberService",
      sourceField: null,
    },
  });
}

export default {
  resolveCanonicalPlayerCaliber,
};
