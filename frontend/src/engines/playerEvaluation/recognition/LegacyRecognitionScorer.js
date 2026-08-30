/*
 * LEGACY / TRANSITIONAL / COMPATIBILITY ONLY
 * NOT GOVERNED RECOGNITION INTELLIGENCE.
 *
 * Preserves the historical prestige-weighted values required by
 * PlayerRosterEvaluationEngine. Remove this module after that engine no
 * longer consumes legacy Recognition scoring.
 */
const CURRENT_SEASON = 2026;

export const LEGACY_RECOGNITION_AWARD_WEIGHTS = Object.freeze({
  mvp: 10, offensivePlayerOfYear: 8, defensivePlayerOfYear: 8,
  offensiveRookieOfYear: 5, defensiveRookieOfYear: 5,
  firstTeamAllPro: 7, secondTeamAllPro: 5, proBowl: 3, allDecadeTeam: 6,
});
const ELITE_TYPES = new Set(["mvp", "offensivePlayerOfYear", "defensivePlayerOfYear", "firstTeamAllPro", "allDecadeTeam"]);

function season(record) { const value = Number(record.season); return Number.isFinite(value) ? value : null; }
function recency(value, currentSeason) {
  if (!Number.isFinite(Number(value))) return 0.25;
  const years = currentSeason - Number(value);
  if (years <= 1) return 1;
  if (years <= 3) return 0.7;
  if (years <= 5) return 0.45;
  return 0.2;
}
function normalized(raw) { if (raw <= 0) return 0; if (raw >= 25) return 95; return Math.round(50 + (raw / 25) * 45); }
function raw(records, currentSeason, recentOnly = false) {
  return records.reduce((total, record) => {
    const year = season(record);
    if (!year || (recentOnly && currentSeason - year > 3)) return total;
    return total + (LEGACY_RECOGNITION_AWARD_WEIGHTS[record.type] || 0) * recency(year, currentSeason);
  }, 0);
}
function baseline({ careerRecognitionScore, recentRecognitionScore, eliteSeasonCount, lastEliteSeason, provenEliteCeiling, sustainedEliteRecognition, currentSeason }) {
  const years = Number.isFinite(Number(lastEliteSeason)) ? currentSeason - Number(lastEliteSeason) : null;
  if (!provenEliteCeiling && careerRecognitionScore < 70) return null;
  if (sustainedEliteRecognition && eliteSeasonCount >= 2 && years !== null && years <= 4) return 86;
  if (provenEliteCeiling && recentRecognitionScore >= 85 && years !== null && years <= 3) return 84;
  if (provenEliteCeiling && careerRecognitionScore >= 85 && years !== null && years <= 5) return 82;
  if (provenEliteCeiling && careerRecognitionScore >= 75) return 78;
  return null;
}

export function getLegacyRecognitionTier(rawScore = 0) {
  if (rawScore >= 20) return "Elite Recognition";
  if (rawScore >= 14) return "High Recognition";
  if (rawScore >= 8) return "Notable Recognition";
  if (rawScore >= 3) return "Limited Recognition";
  return "No Major Recognition";
}

export function calculateLegacyRecognitionScore(records = [], currentSeason = CURRENT_SEASON) {
  if (!records.length) return { rawScore: 0, score: 0, careerRecognitionScore: 0, recentRecognitionScore: 0, eliteSeasonCount: 0, lastEliteSeason: null, provenEliteCeiling: false, sustainedEliteRecognition: false, establishedCareerBaseline: null, tier: getLegacyRecognitionTier(0) };
  const rawScore = Math.min(25, Math.round(raw(records, currentSeason)));
  const recentRawScore = Math.min(25, Math.round(raw(records, currentSeason, true)));
  const eliteSeasons = [...new Set(records.filter((record) => ELITE_TYPES.has(record.type)).map(season).filter(Number.isFinite))];
  const lastEliteSeason = eliteSeasons.length ? Math.max(...eliteSeasons) : null;
  const careerRecognitionScore = normalized(rawScore);
  const recentRecognitionScore = normalized(recentRawScore);
  const provenEliteCeiling = eliteSeasons.length >= 1 || rawScore >= 20;
  const sustainedEliteRecognition = eliteSeasons.length >= 2 || rawScore >= 22;
  return {
    rawScore, score: careerRecognitionScore, careerRecognitionScore, recentRecognitionScore,
    eliteSeasonCount: eliteSeasons.length, lastEliteSeason, provenEliteCeiling, sustainedEliteRecognition,
    establishedCareerBaseline: baseline({ careerRecognitionScore, recentRecognitionScore, eliteSeasonCount: eliteSeasons.length, lastEliteSeason, provenEliteCeiling, sustainedEliteRecognition, currentSeason }),
    tier: getLegacyRecognitionTier(rawScore),
  };
}

export default { calculateLegacyRecognitionScore, getLegacyRecognitionTier };
