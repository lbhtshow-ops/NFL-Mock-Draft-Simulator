// src/data/footballIntelligence/teamContext/teamContextIndex.js

import { defaultTeamContext } from "./defaultTeamContext";
import { ravensContext } from "./ravensContext";

export const teamContexts = {
  BAL: ravensContext,
};

export function getTeamContext(teamId) {
  return teamContexts[teamId] || defaultTeamContext;
}