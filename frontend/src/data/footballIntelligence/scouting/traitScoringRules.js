// src/data/footballIntelligence/scouting/traitScoringRules.js

/*
|--------------------------------------------------------------------------
| LBHT Trait Scoring Rules
|--------------------------------------------------------------------------
|
| This file defines HOW football traits should eventually be evaluated.
|
| It is intentionally separated from PlayerTraitEngine so that:
|
| • Football knowledge lives in the Football Intelligence Database.
| • Engines remain lightweight.
| • Scoring rules can evolve without changing engine logic.
|
| Every trait includes:
|   - Description
|   - Data sources
|   - Weighting
|   - Confidence rules
|
| Scores are NOT calculated here.
| This file simply documents the intelligence model.
|
*/

export const traitScoringRules = {
  Power: {
    description: "Ability to generate functional play strength against NFL competition.",

    sources: [
      "Film",
      "Consensus Scouting Reports",
      "Athletic Testing",
      "LBHT Research"
    ],

    weights: {
      film: 0.50,
      consensus: 0.25,
      athleticTesting: 0.15,
      lbhtResearch: 0.10
    },

    confidenceFactors: [
      "Number of scouting reports",
      "Film sample size",
      "Testing availability"
    ]
  },

  Explosiveness: {
    description: "Initial burst and acceleration after the snap.",

    sources: [
      "Film",
      "Athletic Testing",
      "Consensus Reports"
    ],

    weights: {
      film: 0.45,
      athleticTesting: 0.40,
      consensus: 0.15
    },

    confidenceFactors: [
      "Verified athletic testing",
      "Multiple scouting reports"
    ]
  },

  FootballIQ: {
    description: "Processing speed, recognition, instincts and football awareness.",

    sources: [
      "Film",
      "Consensus Reports",
      "LBHT Research"
    ],

    weights: {
      film: 0.60,
      consensus: 0.25,
      lbhtResearch: 0.15
    },

    confidenceFactors: [
      "Film availability",
      "Multiple evaluator agreement"
    ]
  },

  Motor: {
    description: "Consistent effort, competitiveness and pursuit.",

    sources: [
      "Film",
      "Consensus Reports",
      "LBHT Research"
    ],

    weights: {
      film: 0.70,
      consensus: 0.20,
      lbhtResearch: 0.10
    },

    confidenceFactors: [
      "Number of games reviewed",
      "Consensus agreement"
    ]
  }
};

export default traitScoringRules;