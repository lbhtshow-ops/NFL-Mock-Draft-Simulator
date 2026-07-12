// src/data/footballIntelligence/intelligence/playerIntelligenceProfiles.js

import { prospectIds } from "../registry";

/*
|--------------------------------------------------------------------------
| Player Intelligence Profiles
|--------------------------------------------------------------------------
|
| This layer represents LBHT's football conclusions.
|
| Research = facts and observations.
| Intelligence = evaluated conclusions.
|
| Engines should consume these profiles rather than hardcoding logic.
|
*/

export const playerIntelligenceProfiles = {
  [prospectIds.PETER_WOODS]: {
    prospectId: prospectIds.PETER_WOODS,

    overallGrade: 87,

    tier: "First Round",

    archetype: "Power DT",

    projection: "Round 1",

    confidence: 0.90,
  },
};

export function getPlayerIntelligenceProfile(prospectId) {
  if (!prospectId) return null;

  return playerIntelligenceProfiles[prospectId] || null;
}

export default playerIntelligenceProfiles;