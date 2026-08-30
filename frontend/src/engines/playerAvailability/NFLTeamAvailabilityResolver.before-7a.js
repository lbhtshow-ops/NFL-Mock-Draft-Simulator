import {
  buildNFLRosterIntelligence,
} from "../NFLRosterIntelligenceEngine.js";

import {
  getNFLTeamAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityRegistry.js";

import {
  buildNFLTeamAvailabilityImpactFromInputs,
} from "./NFLTeamAvailabilityImpactEngine.js";

import {
  getNFLTeamPlayerRoleEvidence,
} from "../../data/footballIntelligence/nfl/roles/NFLPlayerRoleRegistry.js";

import {
  enrichNFLRosterWithRoleEvidence,
} from "./NFLPlayerRoleEnrichmentEngine.js";

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

  const roleEvidence =
    getNFLTeamPlayerRoleEvidence(
      team,
      {
        season,
        week,
      }
    );

  const enrichedRoster =
    enrichNFLRosterWithRoleEvidence({
      roster:
        rosterIntelligence?.roster || [],
      roleEvidence,
    });

  return buildNFLTeamAvailabilityImpactFromInputs({
    team,
    roster: enrichedRoster,
    evidence,
  });
}

export default {
  resolveNFLTeamAvailabilityImpact,
};
