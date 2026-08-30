import {
  buildNFLRosterIntelligence,
} from "../NFLRosterIntelligenceEngine.js";

import {
  getNFLTeamAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityRegistry.js";

import {
  buildNFLTeamAvailabilityImpactFromInputs,
} from "./NFLTeamAvailabilityImpactEngine.js";

export function resolveNFLTeamAvailabilityImpact(
  team,
  {
    season = new Date().getFullYear(),
    week = null,
    gameType = "REG",
  } = {}
) {
  const rosterIntelligence =
    buildNFLRosterIntelligence(team);

  const evidence =
    getNFLTeamAvailabilityEvidence(
      team,
      {
        season,
        week,
        gameType,
      }
    );

  return buildNFLTeamAvailabilityImpactFromInputs({
    team,
    roster:
      rosterIntelligence?.roster || [],
    evidence,
  });
}

export default {
  resolveNFLTeamAvailabilityImpact,
};
