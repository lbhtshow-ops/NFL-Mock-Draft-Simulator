import { createProductionProfile } from "./createProductionProfile.js";
import { prospectIds } from "../registry/prospectIds.js";

export const productionProfiles = {
  [prospectIds.ARCH_MANNING]: createProductionProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",

    statistics: {
      season: {
        year: 2025,
        school: "Texas",
        games: 10,
        starts: 2,
      },

      offense: {
        passing: {
          completions: 61,
          attempts: 90,
          completionPercentage: 67.8,
          passingYards: 939,
          touchdowns: 9,
          interceptions: 2,
          yardsPerAttempt: 10.4,
          passerRating: null,
        },

        rushing: {
          attempts: 25,
          rushingYards: 108,
          rushingTouchdowns: 4,
        },

        receiving: {},
      },

      defense: {},

      advanced: {
        bigTimeThrows: null,
        turnoverWorthyPlays: null,
        pressureToSackRate: null,
        thirdDownEfficiency: null,
        redZoneEfficiency: null,
      },
    },

    productionScores: {
      consistency: 87,
      efficiency: 91,
      explosiveness: 90,
      situationalProduction: 88,
      overallProductionScore: 89,
    },

    strengths: [
      "Efficient passer",
      "Protects the football",
      "Creates explosive plays",
      "Dual-threat production",
    ],

    concerns: [
      "Limited starting sample size",
      "Needs additional full-season experience",
    ],

    notes:
      "Highly efficient early-career production with outstanding upside as his experience grows.",

    source: "LBHT Film Study",
    confidence: 0.87,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.PETER_WOODS]: createProductionProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",

    statistics: {
      season: {
        year: 2025,
        school: "Clemson",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {
        tackles: 31,
        tacklesForLoss: 8,
        sacks: 3,
        quarterbackPressures: 28,
        forcedFumbles: 1,
        fumbleRecoveries: 0,
        passBreakups: 0,
        interceptions: 0,
      },

      advanced: {
        pressureRate: null,
        passRushWinRate: null,
        runStopRate: null,
        missedTackleRate: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 89,
      efficiency: 88,
      explosiveness: 90,
      situationalProduction: 91,
      overallProductionScore: 89,
    },

    strengths: [
      "Consistently disruptive interior defender",
      "Excellent run-defense production",
      "Creates pressure beyond traditional sack totals",
    ],

    concerns: [
      "Pass-rush production can continue improving",
      "More finishing opportunities available",
    ],

    notes:
      "Highly productive interior defender whose impact extends well beyond traditional statistics.",

    source: "LBHT Film Study",
    confidence: 0.90,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createProductionProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",

    statistics: {
      season: {
        year: 2025,
        school: "Miami",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {},

      advanced: {
        pressuresAllowed: null,
        sacksAllowed: null,
        passBlockingEfficiency: null,
        runBlockingGrade: null,
        passBlockingGrade: null,
        snapCount: null,
        penalties: null,
      },
    },

    productionScores: {
      consistency: 91,
      efficiency: 90,
      explosiveness: 92,
      situationalProduction: 91,
      overallProductionScore: 91,
    },

    strengths: [
      "Consistent starting experience at offensive tackle",
      "High-impact run-blocking production",
      "Creates movement at the point of attack",
      "Power translates consistently in short-yardage situations",
      "Reliable snap-to-snap offensive line presence",
    ],

    concerns: [
      "Pass-protection consistency remains an area for continued development",
      "Advanced pass-blocking efficiency data requires continued evaluation",
    ],

    notes:
      "Highly productive offensive tackle whose size, power, and run-blocking impact consistently influence the structure of the offense. Projects as a high-level NFL starter with continued pass-protection development.",

    source: "LBHT Film Study",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.LANORRIS_SELLERS]: createProductionProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",

    statistics: {
      season: {
        year: 2025,
        school: "South Carolina",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {
          completions: 196,
          attempts: 299,
          completionPercentage: 65.6,
          passingYards: 2534,
          touchdowns: 18,
          interceptions: 7,
          yardsPerAttempt: 8.5,
          passerRating: null,
        },

        rushing: {
          attempts: 166,
          rushingYards: 674,
          rushingTouchdowns: 7,
        },

        receiving: {},
      },

      defense: {},

      advanced: {
        bigTimeThrows: null,
        turnoverWorthyPlays: null,
        pressureToSackRate: null,
        thirdDownEfficiency: null,
        redZoneEfficiency: null,
      },
    },

    productionScores: {
      consistency: 87,
      efficiency: 89,
      explosiveness: 94,
      situationalProduction: 91,
      overallProductionScore: 90,
    },

    strengths: [
      "High-impact dual-threat production",
      "Creates explosive plays as a passer and runner",
      "Strong rushing value in designed and off-script situations",
      "Efficient downfield passing production",
      "Consistent red-zone stress through quarterback mobility",
    ],

    concerns: [
      "Passing consistency must continue developing",
      "Production can become dependent on off-script creation",
      "Needs continued growth against complex coverage structures",
    ],

    notes:
      "Dynamic dual-threat production profile with high-end explosive-play ability as both a passer and runner. Sellers creates significant offensive value beyond traditional passing statistics because of his designed-run ability, physical rushing profile, and off-script playmaking.",

    source: "LBHT Film Study",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.KADYN_PROCTOR]: createProductionProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",

    statistics: {
      season: {
        year: 2025,
        school: "Alabama",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {},

      advanced: {
        pressuresAllowed: null,
        sacksAllowed: null,
        passBlockingEfficiency: null,
        runBlockingGrade: null,
        passBlockingGrade: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 88,
      efficiency: 89,
      explosiveness: 92,
      situationalProduction: 90,
      overallProductionScore: 90,
    },

    strengths: [
      "Consistent starting experience against SEC competition",
      "Creates significant movement in the run game",
      "High-impact power blocker at the point of attack",
      "Strong production profile in physical rushing concepts",
      "Rare size creates immediate matchup advantages",
    ],

    concerns: [
      "Pass-protection consistency must continue improving",
      "Production against elite speed rushers requires continued evaluation",
      "Technical efficiency can become more consistent across extended pass sets",
    ],

    notes:
      "Highly experienced and physically dominant offensive tackle whose impact is most evident in the run game. Proctor's size, power, and anchor ability create high-end NFL starting potential, while continued technical development in pass protection will determine his long-term ceiling.",

    source: "LBHT Film Study",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.TJ_PARKER]: createProductionProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "T.J. Parker",
    position: "EDGE",

    statistics: {
      season: {
        year: 2025,
        school: "Clemson",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {
        tackles: 49,
        tacklesForLoss: 13,
        sacks: 8,
        quarterbackPressures: 34,
        forcedFumbles: 2,
        fumbleRecoveries: 0,
        passBreakups: 1,
        interceptions: 0,
      },

      advanced: {
        pressureRate: null,
        passRushWinRate: null,
        runStopRate: null,
        missedTackleRate: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 90,
      efficiency: 91,
      explosiveness: 94,
      situationalProduction: 92,
      overallProductionScore: 92,
    },

    strengths: [
      "Consistent edge disruption",
      "High-impact pass-rush production",
      "Creates pressure beyond sack totals",
      "Strong backfield production",
      "Forces offensive tackles to account for first-step explosiveness",
    ],

    concerns: [
      "Can continue improving finishing consistency",
      "Advanced pass-rush efficiency data requires continued evaluation",
      "Run-game consistency against power concepts should continue developing",
    ],

    notes:
      "Productive and disruptive edge defender with strong pass-rush output, backfield impact, and pressure creation. Parker's production profile supports his projection as an early-impact NFL edge rusher with long-term starting upside.",

    source: "LBHT Film Study",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.CALEB_DOWNS]: createProductionProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",

    statistics: {
      season: {
        year: 2025,
        school: "Ohio State",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {
        tackles: 82,
        tacklesForLoss: 5,
        sacks: 1,
        quarterbackPressures: 6,
        forcedFumbles: 1,
        fumbleRecoveries: 0,
        passBreakups: 7,
        interceptions: 3,
      },

      advanced: {
        coverageGrade: null,
        runDefenseGrade: null,
        missedTackleRate: null,
        yardsAllowedPerTarget: null,
        passerRatingAllowed: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 94,
      efficiency: 93,
      explosiveness: 91,
      situationalProduction: 95,
      overallProductionScore: 94,
    },

    strengths: [
      "High-volume defensive production",
      "Consistent impact against the run and pass",
      "Creates splash plays in coverage",
      "Reliable open-field tackling production",
      "Produces like a defensive centerpiece",
    ],

    concerns: [
      "Needs continued evaluation as a full-time NFL deep-field eraser",
      "Box usage and coverage deployment should be tracked by scheme",
    ],

    notes:
      "Elite safety production profile with rare consistency, coverage impact, tackling reliability, and three-level defensive involvement. Downs produces like one of the safest defensive prospects in the class.",

    source: "LBHT Film Study",
    confidence: 0.88,
    lastUpdated: "2026-07-04",
  }),

    [prospectIds.RUEBEN_BAIN]: createProductionProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",

    statistics: {
      season: {
        year: 2025,
        school: "Miami",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {
        tackles: 45,
        tacklesForLoss: 12,
        sacks: 7,
        quarterbackPressures: 31,
        forcedFumbles: 2,
        fumbleRecoveries: 1,
        passBreakups: 1,
        interceptions: 0,
      },

      advanced: {
        pressureRate: null,
        passRushWinRate: null,
        runStopRate: null,
        missedTackleRate: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 90,
      efficiency: 90,
      explosiveness: 91,
      situationalProduction: 91,
      overallProductionScore: 91,
    },

    strengths: [
      "Consistent backfield production",
      "Strong pressure creation from multiple alignments",
      "High-motor disruption against the run and pass",
      "Finishes plays with physicality",
    ],

    concerns: [
      "Can continue improving pass-rush sequencing",
      "Advanced pressure efficiency data requires continued evaluation",
    ],

    notes:
      "Productive and disruptive front-seven defender with strong backfield production, physicality, and pressure creation. Bain's production profile supports an early-impact NFL defensive role with long-term starting upside.",

    source: "LBHT Film Study",
    confidence: 0.84,
    lastUpdated: "2026-07-04",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createProductionProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",

    statistics: {
      season: {
        year: 2025,
        school: "Notre Dame",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},

        rushing: {
          attempts: 163,
          rushingYards: 1125,
          rushingTouchdowns: 17,
          yardsPerCarry: 6.9,
        },

        receiving: {
          receptions: 28,
          receivingYards: 237,
          receivingTouchdowns: 2,
          yardsPerReception: 8.5,
        },
      },

      defense: {},

      advanced: {
        explosiveRunRate: null,
        yardsAfterContact: null,
        missedTacklesForced: null,
        passProtectionGrade: null,
        snapCount: null,
      },
    },

    productionScores: {
      consistency: 89,
      efficiency: 94,
      explosiveness: 95,
      situationalProduction: 91,
      overallProductionScore: 93,
    },

    strengths: [
      "Explosive rushing production",
      "Efficient yards-per-carry profile",
      "Home-run ability",
      "Adds receiving value",
      "Consistent scoring production",
    ],

    concerns: [
      "Pass-protection profile requires continued evaluation",
      "NFL workload projection should be monitored",
    ],

    notes:
      "Explosive offensive weapon with high-end rushing efficiency, scoring production, and passing-game value. Love's production profile supports a dynamic three-down NFL role if pass protection and workload durability continue developing.",

    source: "LBHT Film Study",
    confidence: 0.84,
    lastUpdated: "2026-07-04",
  }),

  [prospectIds.CALEB_LOMU]: createProductionProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",

    statistics: {
      season: {
        year: 2025,
        school: "Utah",
        games: 13,
        starts: 13,
      },

      offense: {
        passing: {},
        rushing: {},
        receiving: {},
      },

      defense: {},

      advanced: {
        pressuresAllowed: null,
        sacksAllowed: null,
        passBlockingEfficiency: null,
        runBlockingGrade: null,
        passBlockingGrade: null,
        snapCount: null,
        penalties: null,
      },
    },

    productionScores: {
      consistency: 88,
      efficiency: 89,
      explosiveness: 88,
      situationalProduction: 89,
      overallProductionScore: 89,
    },

    strengths: [
      "Reliable starting offensive tackle production",
      "Consistent snap-to-snap presence",
      "Strong run-game impact",
      "Good movement profile for zone and play-action concepts",
    ],

    concerns: [
      "Needs continued evaluation against elite NFL speed rushers",
      "Advanced pass-protection data requires additional tracking",
    ],

    notes:
      "Reliable offensive tackle production profile with starting experience, run-game value, and scheme versatility. Lomu projects as a quality NFL tackle prospect with continued technical development in pass protection.",

    source: "LBHT Film Study",
    confidence: 0.82,
    lastUpdated: "2026-07-04",
  }),

};

export function getProductionProfile(playerId) {
  return productionProfiles[playerId] || null;
}

export default productionProfiles;
