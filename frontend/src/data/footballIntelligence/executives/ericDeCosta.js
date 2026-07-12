// src/data/footballIntelligence/executives/ericDeCosta.js

export const ericDeCosta = {
  id: "ericDeCosta",
  name: "Eric DeCosta",
  currentTeam: "BAL",
  currentRole: "Executive Vice President & General Manager",

  employmentHistory: [
    {
      team: "BAL",
      role: "Scouting Intern",
      years: "1996",
    },
    {
      team: "BAL",
      role: "Area Scout",
      years: "1997-2002",
    },
    {
      team: "BAL",
      role: "Director of College Scouting",
      years: "2003-2008",
    },
    {
      team: "BAL",
      role: "Director of Player Personnel",
      years: "2009-2011",
    },
    {
      team: "BAL",
      role: "Assistant General Manager",
      years: "2012-2018",
    },
    {
      team: "BAL",
      role: "Executive Vice President & General Manager",
      years: "2019-present",
    },
  ],

  mentorInfluence: {
    primaryMentorId: "ozzieNewsome",
    influenceStrength: 9,
    notes:
      "DeCosta succeeded Ozzie Newsome and spent his entire Ravens personnel career inside the organization before becoming GM.",
  },

  tendencies: {
    draftAndDevelop: {
      value: 9,
      confidence: 8,
      evidence: [
        "Ravens official bio notes DeCosta has been with the franchise since its inaugural 1996 season.",
        "Ravens official announcement lists his progression from scouting intern to area scout, director of college scouting, director of player personnel, assistant GM, then GM.",
      ],
    },

    organizationalContinuity: {
      value: 10,
      confidence: 9,
      evidence: [
        "DeCosta remained with Baltimore despite outside GM interest before taking over in 2019.",
        "The Ravens promoted him internally after Ozzie Newsome stepped down as GM.",
      ],
    },

    scoutingBackground: {
      value: 10,
      confidence: 9,
      evidence: [
        "DeCosta held multiple scouting/personnel roles before becoming GM.",
        "His roles included area scout, director of college scouting, director of player personnel, and assistant GM.",
      ],
    },
  },

  transactionHistory: {
    draftPicks: [],
    trades: [],
    freeAgentSignings: [],
    extensions: [],
  },

  sourceTracking: {
    sources: [
      "Baltimore Ravens official front office bio",
      "Baltimore Ravens official 2019 GM announcement",
    ],
    confidence: 8,
    lastReviewed: "2026-06-19",
  },
};