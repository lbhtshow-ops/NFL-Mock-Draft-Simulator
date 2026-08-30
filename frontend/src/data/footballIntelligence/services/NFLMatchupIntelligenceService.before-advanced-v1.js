import {
  getNFLTeamIntelligenceResult,
} from "../../../engines/teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";

import {
  evaluateNFLMatchupIntelligence,
} from "../../../engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js";

export function buildNFLMatchupIntelligenceProfile({
  gameId = null,
  season,
  week,
  awayTeam,
  homeTeam,
  availabilityWeek = week,
  gameType = "REG",
  context = {},
} = {}) {
  const awayIntelligence =
    getNFLTeamIntelligenceResult(
      awayTeam,
      {
        targetSeason: season,
        availabilityWeek,
        gameType,
      }
    );

  const homeIntelligence =
    getNFLTeamIntelligenceResult(
      homeTeam,
      {
        targetSeason: season,
        availabilityWeek,
        gameType,
      }
    );

  return evaluateNFLMatchupIntelligence({
    gameId,
    season,
    week,
    awayTeam,
    homeTeam,
    awayIntelligence,
    homeIntelligence,
    context,
  });
}

export default {
  buildNFLMatchupIntelligenceProfile,
};
