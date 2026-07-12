import { getPlayerRecognitionProfile } from "../../data/footballIntelligence/nfl/recognition/playerRecognitionProfiles";
import { getCanonicalPlayerId } from "../shared/getCanonicalPlayerId";

const CURRENT_SEASON = 2026;

const awardWeights = {
  mvp: 10,
  offensivePlayerOfYear: 8,
  defensivePlayerOfYear: 8,
  offensiveRookieOfYear: 5,
  defensiveRookieOfYear: 5,
  firstTeamAllPro: 7,
  secondTeamAllPro: 5,
  proBowl: 3,
  allDecadeTeam: 6,
};

const eliteAwardTypes = new Set([
  "mvp",
  "offensivePlayerOfYear",
  "defensivePlayerOfYear",
  "firstTeamAllPro",
  "allDecadeTeam",
]);

function getPlayerId(player = {}) {
  return (
    player?.playerId ||
    player?.identity?.playerId ||
    player?.id ||
    null
  );
}

function getAwardSeason(award = {}) {
  const season = Number(award.season);
  return Number.isFinite(season) ? season : null;
}

function getRecencyMultiplier(season, currentSeason = CURRENT_SEASON) {
  const numericSeason = Number(season);

  if (!Number.isFinite(numericSeason)) return 0.25;

  const yearsAgo = currentSeason - numericSeason;

  if (yearsAgo <= 1) return 1;
  if (yearsAgo <= 3) return 0.7;
  if (yearsAgo <= 5) return 0.45;

  return 0.2;
}

function normalizeRecognitionScore(rawScore = 0) {
  if (rawScore <= 0) return 0;
  if (rawScore >= 25) return 95;

  return Math.round(50 + (rawScore / 25) * 45);
}

function calculateRawRecognitionScore({
  awards = [],
  currentSeason = CURRENT_SEASON,
  recentOnly = false,
} = {}) {
  return awards.reduce((total, award) => {
    const season = getAwardSeason(award);

    if (!season) return total;

    if (recentOnly && currentSeason - season > 3) {
      return total;
    }

    const baseWeight = awardWeights[award.type] || 0;
    const recencyMultiplier = getRecencyMultiplier(
      season,
      currentSeason
    );

    return total + baseWeight * recencyMultiplier;
  }, 0);
}

function getEliteSeasonCount(awards = []) {
  const eliteSeasons = new Set();

  awards.forEach((award) => {
    const season = getAwardSeason(award);

    if (eliteAwardTypes.has(award.type) && season) {
      eliteSeasons.add(season);
    }
  });

  return eliteSeasons.size;
}

function getLastEliteSeason(awards = []) {
  const eliteSeasons = awards
    .filter((award) => eliteAwardTypes.has(award.type))
    .map(getAwardSeason)
    .filter((season) => Number.isFinite(season));

  if (!eliteSeasons.length) return null;

  return Math.max(...eliteSeasons);
}

function getEstablishedCareerBaseline({
  careerRecognitionScore = 0,
  recentRecognitionScore = 0,
  eliteSeasonCount = 0,
  lastEliteSeason = null,
  provenEliteCeiling = false,
  sustainedEliteRecognition = false,
  currentSeason = CURRENT_SEASON,
} = {}) {
  const numericLastEliteSeason = Number(lastEliteSeason);

  const yearsSinceEliteSeason = Number.isFinite(numericLastEliteSeason)
    ? currentSeason - numericLastEliteSeason
    : null;

  if (!provenEliteCeiling && careerRecognitionScore < 70) {
    return null;
  }

  if (
    sustainedEliteRecognition &&
    eliteSeasonCount >= 2 &&
    yearsSinceEliteSeason !== null &&
    yearsSinceEliteSeason <= 4
  ) {
    return 86;
  }

  if (
    provenEliteCeiling &&
    recentRecognitionScore >= 85 &&
    yearsSinceEliteSeason !== null &&
    yearsSinceEliteSeason <= 3
  ) {
    return 84;
  }

  if (
    provenEliteCeiling &&
    careerRecognitionScore >= 85 &&
    yearsSinceEliteSeason !== null &&
    yearsSinceEliteSeason <= 5
  ) {
    return 82;
  }

  if (provenEliteCeiling && careerRecognitionScore >= 75) {
    return 78;
  }

  return null;
}

export function calculateRecognitionScore({
  awards = [],
  currentSeason = CURRENT_SEASON,
} = {}) {
  if (!awards.length) {
    return {
      rawScore: 0,
      score: 0,
      careerRecognitionScore: 0,
      recentRecognitionScore: 0,
      eliteSeasonCount: 0,
      lastEliteSeason: null,
      provenEliteCeiling: false,
      sustainedEliteRecognition: false,
      establishedCareerBaseline: null,
      confidence: 0,
      summary: "No major recognition profile available.",
    };
  }

  const rawCareerScore = calculateRawRecognitionScore({
    awards,
    currentSeason,
  });

  const rawRecentScore = calculateRawRecognitionScore({
    awards,
    currentSeason,
    recentOnly: true,
  });

  const cappedRawCareerScore = Math.min(25, Math.round(rawCareerScore));
  const cappedRawRecentScore = Math.min(25, Math.round(rawRecentScore));

  const careerRecognitionScore =
    normalizeRecognitionScore(cappedRawCareerScore);

  const recentRecognitionScore =
    normalizeRecognitionScore(cappedRawRecentScore);

  const eliteSeasonCount = getEliteSeasonCount(awards);
  const lastEliteSeason = getLastEliteSeason(awards);

  const provenEliteCeiling =
    eliteSeasonCount >= 1 || cappedRawCareerScore >= 20;

  const sustainedEliteRecognition =
    eliteSeasonCount >= 2 || cappedRawCareerScore >= 22;

  const establishedCareerBaseline = getEstablishedCareerBaseline({
    careerRecognitionScore,
    recentRecognitionScore,
    eliteSeasonCount,
    lastEliteSeason,
    provenEliteCeiling,
    sustainedEliteRecognition,
    currentSeason,
  });

  return {
    rawScore: cappedRawCareerScore,
    score: careerRecognitionScore,
    careerRecognitionScore,
    recentRecognitionScore,
    eliteSeasonCount,
    lastEliteSeason,
    provenEliteCeiling,
    sustainedEliteRecognition,
    establishedCareerBaseline,
    confidence: 0.8,
    summary:
      "Recognition profile includes career, recent, and established-baseline award intelligence.",
  };
}

export function getRecognitionTier(rawScore = 0) {
  if (rawScore >= 20) return "Elite Recognition";
  if (rawScore >= 14) return "High Recognition";
  if (rawScore >= 8) return "Notable Recognition";
  if (rawScore >= 3) return "Limited Recognition";

  return "No Major Recognition";
}

export function getPlayerRecognitionSummary(player = {}) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getPlayerRecognitionProfile(playerId);

  if (!profile) {
    return {
      available: false,
      playerId,
      score: 0,
      rawScore: 0,
      careerRecognitionScore: 0,
      recentRecognitionScore: 0,
      eliteSeasonCount: 0,
      lastEliteSeason: null,
      provenEliteCeiling: false,
      sustainedEliteRecognition: false,
      establishedCareerBaseline: null,
      tier: "No Major Recognition",
      awards: [],
      confidence: 0,
      summary: "No major recognition profile available.",
    };
  }

  const recognition = calculateRecognitionScore({
    awards: profile.awards || [],
  });

  return {
    available: true,
    playerId,
    playerName: profile.playerName || null,

    score: recognition.score,
    rawScore: recognition.rawScore,
    careerRecognitionScore: recognition.careerRecognitionScore,
    recentRecognitionScore: recognition.recentRecognitionScore,

    eliteSeasonCount: recognition.eliteSeasonCount,
    lastEliteSeason: recognition.lastEliteSeason,
    provenEliteCeiling: recognition.provenEliteCeiling,
    sustainedEliteRecognition: recognition.sustainedEliteRecognition,
    establishedCareerBaseline: recognition.establishedCareerBaseline,

    tier: getRecognitionTier(recognition.rawScore),
    awards: profile.awards || [],
    confidence: recognition.confidence,
    summary: recognition.summary,
  };
}

export default {
  calculateRecognitionScore,
  getRecognitionTier,
  getPlayerRecognitionSummary,
};