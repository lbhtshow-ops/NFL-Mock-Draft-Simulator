// src/data/footballIntelligence/teamContext/teamContextIndex.js

import { defaultTeamContext } from "./defaultTeamContext.js";
import { ravensContext } from "./ravensContext.js";

export const teamContexts = {
  BAL: ravensContext,
};

export function getTeamContext(teamId) {
  return teamContexts[teamId] || defaultTeamContext;
}