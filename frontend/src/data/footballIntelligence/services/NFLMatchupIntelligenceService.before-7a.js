import {
  getNFLTeamIntelligenceResult,
} from "../../../engines/teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";

import {
  evaluateNFLMatchupIntelligence,
} from "../../../engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js";

import {
  getNFLAdvancedTeamMatchupEvidence,
} from "../nfl/matchup/NFLAdvancedMatchupEvidenceRegistry.js";

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

  const awayAdvanced =
    getNFLAdvancedTeamMatchupEvidence(
      awayTeam,
      {
        season,
        throughWeek: week,
      }
    );

  const homeAdvanced =
    getNFLAdvancedTeamMatchupEvidence(
      homeTeam,
      {
        season,
        throughWeek: week,
      }
    );

  const enrichedAway = {
    ...awayIntelligence,
    advancedMatchupEvidence:
      awayAdvanced,
  };

  const enrichedHome = {
    ...homeIntelligence,
    advancedMatchupEvidence:
      homeAdvanced,
  };

  return evaluateNFLMatchupIntelligence({
    gameId,
    season,
    week,
    awayTeam,
    homeTeam,
    awayIntelligence: enrichedAway,
    homeIntelligence: enrichedHome,
    context,
  });
}

export default {
  buildNFLMatchupIntelligenceProfile,
};
