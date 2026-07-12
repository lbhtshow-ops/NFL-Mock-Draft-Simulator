import { createAthleticProfile } from "./createAthleticProfile";
import { prospectIds } from "../registry/prospectIds";

export const athleticProfiles = {
  [prospectIds.ARCH_MANNING]: createAthleticProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",

    measurements: {
      height: `6'4"`,
      weight: 225,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 88,
      explosiveness: 87,
      agility: 89,
      strength: 84,
      sizeAdjustedAthleticism: 91,
      overallAthleticScore: 90,
    },

    strengths: [
      "Excellent movement for NFL quarterback size",
      "Smooth throwing mechanics on the move",
      "Good lower-body explosiveness",
      "Natural pocket mobility",
    ],

    limitations: [
      "Not an elite straight-line runner",
      "Can continue adding functional strength",
    ],

    notes:
      "Prototype quarterback athlete with above-average mobility, coordinated movement skills, and excellent size-adjusted athleticism.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.87,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.PETER_WOODS]: createAthleticProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",

    measurements: {
      height: `6'3"`,
      weight: 315,
      armLength: `33 5/8"`,
      handSize: `10"`,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 82,
      explosiveness: 89,
      agility: 84,
      strength: 94,
      sizeAdjustedAthleticism: 91,
      overallAthleticScore: 90,
    },

    strengths: [
      "Excellent lower-body power",
      "Outstanding play strength",
      "Explosive first step",
    ],

    limitations: [
      "Long-speed not elite",
      "Average change of direction",
    ],

    notes:
      "Power-based interior athlete with excellent explosiveness for his size and above-average overall movement skills.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.88,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.CALEB_DOWNS]: createAthleticProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",

    measurements: {
      height: `6'0"`,
      weight: 205,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 94,
      explosiveness: 92,
      agility: 95,
      strength: 83,
      sizeAdjustedAthleticism: 94,
      overallAthleticScore: 94,
    },

    strengths: [
      "Elite range",
      "Fluid hips",
      "Outstanding closing burst",
      "Exceptional body control",
    ],

    limitations: [
      "Can continue adding play strength",
    ],

    notes:
      "Elite movement athlete with outstanding range and change-of-direction ability.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.92,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createAthleticProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",

    measurements: {
      height: `6'6"`,
      weight: 330,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 81,
      explosiveness: 88,
      agility: 84,
      strength: 95,
      sizeAdjustedAthleticism: 92,
      overallAthleticScore: 91,
    },

    strengths: [
      "Outstanding lower-body power",
      "Strong balance",
      "Excellent feet for size",
    ],

    limitations: [
      "Average long speed",
    ],

    notes:
      "Powerful offensive tackle with excellent size-adjusted athletic ability.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.90,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.LANORRIS_SELLERS]: createAthleticProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",

    measurements: {
      height: `6'3"`,
      weight: 242,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 91,
      explosiveness: 93,
      agility: 89,
      strength: 92,
      sizeAdjustedAthleticism: 94,
      overallAthleticScore: 93,
    },

    strengths: [
      "Power runner",
      "Excellent contact balance",
      "Explosive lower body",
    ],

    limitations: [
      "Footwork consistency",
    ],

    notes:
      "Dynamic dual-threat quarterback with outstanding athletic upside.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.90,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.KADYN_PROCTOR]: createAthleticProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",

    measurements: {
      height: `6'7"`,
      weight: 360,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 78,
      explosiveness: 89,
      agility: 82,
      strength: 97,
      sizeAdjustedAthleticism: 92,
      overallAthleticScore: 91,
    },

    strengths: [
      "Rare size",
      "Elite power",
      "Heavy hands",
      "Excellent anchor",
    ],

    limitations: [
      "Weight management",
    ],

    notes:
      "Massive offensive tackle with rare strength and impressive movement for his frame.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.89,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.TJ_PARKER]: createAthleticProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "TJ Parker",
    position: "EDGE",

    measurements: {
      height: `6'3"`,
      weight: 265,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 88,
      explosiveness: 92,
      agility: 87,
      strength: 91,
      sizeAdjustedAthleticism: 91,
      overallAthleticScore: 91,
    },

    strengths: [
      "Excellent first-step explosion",
      "Strong closing burst",
      "NFL-caliber power",
    ],

    limitations: [
      "Can improve flexibility",
    ],

    notes:
      "Powerful edge defender with explosive traits and excellent strength profile.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.89,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.RUEBEN_BAIN]: createAthleticProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",

    measurements: {
      height: `6'3"`,
      weight: 275,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 87,
      explosiveness: 91,
      agility: 86,
      strength: 93,
      sizeAdjustedAthleticism: 90,
      overallAthleticScore: 90,
    },

    strengths: [
      "Powerful frame",
      "Explosive hands",
      "Excellent leverage",
    ],

    limitations: [
      "Average bend",
    ],

    notes:
      "Strong, physical edge defender with impressive power and explosiveness.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.88,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createAthleticProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",

    measurements: {
      height: `6'0"`,
      weight: 212,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 95,
      explosiveness: 94,
      agility: 94,
      strength: 84,
      sizeAdjustedAthleticism: 95,
      overallAthleticScore: 95,
    },

    strengths: [
      "Elite acceleration",
      "Outstanding long speed",
      "Excellent balance",
    ],

    limitations: [
      "Functional strength",
    ],

    notes:
      "Explosive home-run running back with elite movement skills and top-tier athletic upside.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.93,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.CALEB_LOMU]: createAthleticProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",

    measurements: {
      height: `6'6"`,
      weight: 315,
      armLength: null,
      handSize: null,
      wingspan: null,
    },

    testing: {
      fortyYardDash: null,
      tenYardSplit: null,
      verticalJump: null,
      broadJump: null,
      threeCone: null,
      shortShuttle: null,
      benchPress: null,
    },

    scores: {
      speed: 82,
      explosiveness: 88,
      agility: 86,
      strength: 92,
      sizeAdjustedAthleticism: 91,
      overallAthleticScore: 90,
    },

    strengths: [
      "Excellent feet",
      "Smooth lateral movement",
      "Very balanced athlete",
    ],

    limitations: [
      "Can continue developing play strength",
    ],

    notes:
      "Well-rounded offensive tackle with smooth movement skills and above-average athletic traits.",

    source: "LBHT Athletic Evaluation",
    confidence: 0.89,
    lastUpdated: "2026-07-03",
  }),
};

export default athleticProfiles;