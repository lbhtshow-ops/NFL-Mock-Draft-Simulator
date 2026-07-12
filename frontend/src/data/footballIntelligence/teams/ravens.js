// src/data/footballIntelligence/teams/ravens.js

export const ravensTeamProfile = {
  id: "BAL",
  teamAbbr: "BAL",
  teamName: "Baltimore Ravens",
  conference: "AFC",
  division: "North",

  currentLeadership: {
  owner: "Steve Bisciotti",
  president: "Sashi Brown",
  generalManagerId: "ericDeCosta",
  headCoachId: "jesseMinter",
  offensiveCoordinatorId: "declanDoyle",
  defensiveCoordinatorId: "anthonyWeaver",
},

  identityInputs: {
  organizationId: "baltimoreRavens",
  executiveIds: ["ericDeCosta"],
  coachIds: ["jesseMinter", "declanDoyle", "anthonyWeaver"],
},

  currentContext: {
    competitiveWindow: "contender",
    qbSituation: "franchise_qb",
    rosterUrgency: 7,
    draftCapitalFlexibility: 5,
  },

  notes:
    "Starter team profile for the Football Intelligence Database V1. Coordinator data and detailed identity fields will be added after source verification.",
};