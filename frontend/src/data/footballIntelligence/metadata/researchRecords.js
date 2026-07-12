// src/data/footballIntelligence/metadata/researchRecords.js

/*
|--------------------------------------------------------------------------
| Research Records
|--------------------------------------------------------------------------
|
| Research Records explain WHY LBHT believes a football intelligence record.
|
| They do not store the scouting report itself.
| They store source, confidence, verification, and update metadata.
|
*/

import { prospectIds } from "../registry";

export const researchRecords = {
  [prospectIds.PETER_WOODS]: {
    prospectId: prospectIds.PETER_WOODS,

    status: "verified",

    verifiedBy: "LBHT Research",

    confidence: 0.9,

    lastUpdated: "2026-06-20",

    sources: [
      "LBHT Film Study",
      "Consensus Scouting Reports",
      "Public Draft Analysis",
    ],

    notes:
      "Initial research record used to validate the Football Intelligence Database architecture.",
  },
};

export function getResearchRecord(prospectId) {
  if (!prospectId) return null;

  return researchRecords[prospectId] || null;
}

export default researchRecords;