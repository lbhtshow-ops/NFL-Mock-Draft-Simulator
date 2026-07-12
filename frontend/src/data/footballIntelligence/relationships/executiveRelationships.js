// src/data/footballIntelligence/relationships/executiveRelationships.js

export const executiveRelationships = [
  {
    id: "ericDeCosta_ozzieNewsome_mentor",
    fromEntityId: "ericDeCosta",
    fromEntityType: "executive",

    toEntityId: "ozzieNewsome",
    toEntityType: "executive",

    relationshipType: "mentored_by",
    organization: "BAL",

    yearsTogether: "1996-2018",

    influenceStrength: 9,

    notes:
      "Eric DeCosta spent his entire Ravens personnel career under Ozzie Newsome before succeeding him as general manager.",

    sourceTracking: {
      sources: [
        "Baltimore Ravens official front office bio",
        "Baltimore Ravens official Eric DeCosta GM announcement",
      ],
      confidence: 8,
      lastReviewed: "2026-06-19",
    },
  },
];