import { getPlayerRecognitionProfile } from "../../data/footballIntelligence/nfl/recognition/playerRecognitionProfiles.js";
import { DATA_STATES, isIntelligenceResult } from "../contracts/IntelligenceResultContract.js";
import { resolvePlayerContext } from "../context/PlayerContextResolver.js";
import { RECOGNITION_COMPLETENESS, createRecognitionInput } from "./recognition/RecognitionInputProjection.js";
import { getPlayerRecognitionIntelligenceResult } from "./recognition/CanonicalPlayerRecognitionEngine.js";
import { calculateLegacyRecognitionScore, getLegacyRecognitionTier } from "./recognition/LegacyRecognitionScorer.js";

// Transitional public helpers retained for legacy callers only.
export function calculateRecognitionScore({ awards = [], currentSeason = 2026 } = {}) {
  const legacy = calculateLegacyRecognitionScore(awards, currentSeason);
  return { ...legacy, confidence: awards.length ? 0.8 : 0, summary: awards.length ? "Recognition profile includes career, recent, and established-baseline award intelligence." : "No major recognition profile available." };
}
export function getRecognitionTier(rawScore = 0) { return getLegacyRecognitionTier(rawScore); }

export function getPlayerRecognitionSummary(player = {}) {
  const context = resolvePlayerContext(player);
  const profile = getPlayerRecognitionProfile(context.playerId);
  if (!profile) {
    getPlayerRecognitionIntelligenceResult(createRecognitionInput({ playerContext: context, evidenceState: DATA_STATES.UNKNOWN, records: [], completeness: { status: RECOGNITION_COMPLETENESS.UNKNOWN } }));
    return { available: false, playerId: context.playerId, score: 0, rawScore: 0, careerRecognitionScore: 0, recentRecognitionScore: 0, eliteSeasonCount: 0, lastEliteSeason: null, provenEliteCeiling: false, sustainedEliteRecognition: false, establishedCareerBaseline: null, tier: "No Major Recognition", awards: [], confidence: 0, summary: "No major recognition profile available." };
  }
  const projection = createRecognitionInput({
    playerContext: context, evidenceState: DATA_STATES.AVAILABLE,
    records: profile.awards || [],
    completeness: { status: RECOGNITION_COMPLETENESS.PARTIAL, scope: "Legacy static recognition registry", limitations: ["Legacy registry coverage, sources, verification, and provenance are unresolved."] },
  });
  const canonical = getPlayerRecognitionIntelligenceResult(projection);
  const legacy = calculateLegacyRecognitionScore(canonical.value.recognitions);
  return { available: true, playerId: context.playerId, playerName: profile.playerName || null, ...legacy, awards: canonical.value.recognitions, confidence: 0.8, summary: "Recognition profile includes career, recent, and established-baseline award intelligence." };
}

export { isIntelligenceResult };
export { getPlayerRecognitionIntelligenceResult };
export default { getPlayerRecognitionIntelligenceResult, calculateRecognitionScore, getRecognitionTier, getPlayerRecognitionSummary };
