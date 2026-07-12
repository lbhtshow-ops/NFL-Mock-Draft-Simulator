export function createNFLTeamRecord({
  teamId,
  abbreviation,
  name,
  city,
  conference,
  division,

  ownership = {},
  frontOffice = {},
  coachingStaff = {},

  offensiveIdentity = {},
  defensiveIdentity = {},
  rosterBuilding = {},
  draftPhilosophy = {},

  metadata = {},
} = {}) {
  return {
    teamId,
    abbreviation,
    name,
    city,
    conference,
    division,

    ownership,
    frontOffice,
    coachingStaff,

    offensiveIdentity,
    defensiveIdentity,
    rosterBuilding,
    draftPhilosophy,

    metadata: {
      source: metadata.source || "LBHT Research",
      confidence: metadata.confidence || 0,
      lastUpdated: metadata.lastUpdated || null,
      notes: metadata.notes || "",
    },
  };
}

export default createNFLTeamRecord;