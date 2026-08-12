import { createSchemeFitProfile } from "./createSchemeFitProfile.js";
import { prospectIds } from "../registry/prospectIds.js";

export const schemeFitProfiles = {
  [prospectIds.ARCH_MANNING]: createSchemeFitProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",

    offensiveSchemes: [
      "Pro Style",
      "West Coast",
      "Spread",
      "Play Action",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Franchise Quarterback",
      "Timing-Based Passer",
      "Play-Action Distributor",
      "Pocket Movement Quarterback",
    ],

    versatility: {
      score: 92,
      notes:
        "Fits multiple NFL passing systems because of processing, accuracy, size, and functional mobility.",
    },

    strengths: [
      "Can operate under center or shotgun",
      "Strong fit in timing-based passing concepts",
      "Enough mobility for movement passing game",
      "Advanced processing supports full-field reads",
    ],

    concerns: [
      "Needs more full-season starter experience",
    ],

    notes:
      "Best projected in a balanced NFL offense that blends pro-style structure, play action, and spread passing concepts.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.88,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.PETER_WOODS]: createSchemeFitProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",

    offensiveSchemes: [],

    defensiveSchemes: [
      "Multiple Front",
      "Even Front",
      "One-Gap",
      "Hybrid Front",
    ],

    roleFits: [
      "Interior Defensive Lineman",
      "3-Technique",
      "Early-Down Run Defender",
      "Interior Pocket Disruptor",
    ],

    versatility: {
      score: 90,
      notes:
        "Can fit multiple defensive fronts as an interior disruptor with run-defense value and pass-rush upside.",
    },

    strengths: [
      "Strong fit in multiple-front defenses",
      "Can play interior alignment roles",
      "Power profile translates to early-down NFL usage",
      "Explosiveness gives interior pressure upside",
    ],

    concerns: [
      "Pass-rush role may need refinement in obvious passing situations",
    ],

    notes:
      "Best projected as a high-impact interior defensive lineman in a multiple-front defense that values power, gap control, and pocket disruption.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.89,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createSchemeFitProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",

    offensiveSchemes: [
      "Power Run",
      "Gap Scheme",
      "Inside Zone",
      "Balanced NFL Offense",
      "Play Action",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Starting Right Tackle",
      "Power Run Blocker",
      "Downhill Run Game Tackle",
      "Long-Term Offensive Line Anchor",
    ],

    versatility: {
      score: 92,
      notes:
        "Power, size, movement ability, and anchor strength give him starting tackle value across multiple NFL run concepts.",
    },

    strengths: [
      "Excellent fit in downhill and power-based rushing attacks",
      "Size and strength translate well to gap concepts",
      "Movement ability supports inside-zone responsibilities",
      "Strong anchor profile against NFL power rushers",
      "Can function in balanced offenses that mix run concepts",
    ],

    concerns: [
      "Pass-protection consistency must continue developing against elite speed rushers",
      "Hand placement can become more consistent in isolated pass sets",
    ],

    notes:
      "Best projected as a starting NFL tackle in a balanced or power-oriented offense that emphasizes physical run blocking, play action, and controlled pass-protection assignments.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.LANORRIS_SELLERS]: createSchemeFitProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",

    offensiveSchemes: [
      "Spread",
      "RPO",
      "Vertical Passing",
      "Play Action",
      "Quarterback Run Game",
      "Multiple Offense",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Dual-Threat Starting Quarterback",
      "Designed Run Quarterback",
      "Vertical Play-Action Passer",
      "Off-Script Playmaker",
      "Franchise Quarterback Developmental Upside",
    ],

    versatility: {
      score: 94,
      notes:
        "Rare size, athletic ability, arm talent, and rushing value allow him to threaten defenses through designed quarterback runs, movement passing concepts, and vertical throws.",
    },

    strengths: [
      "Excellent fit in spread and RPO-based offenses",
      "Designed quarterback run ability creates an additional offensive gap",
      "Arm strength supports vertical passing concepts",
      "Mobility expands movement and play-action passing packages",
      "Can create explosive plays when structure breaks down",
      "Physical profile supports a multiple offensive system",
    ],

    concerns: [
      "Timing-based passing consistency must continue developing",
      "Processing against complex coverage rotations requires continued refinement",
      "NFL offense should avoid becoming overly dependent on off-script creation",
    ],

    notes:
      "Best projected in a modern multiple offense that combines spread formations, RPO concepts, designed quarterback runs, vertical play action, and movement passing opportunities. His physical tools create significant schematic stress, while continued development as a rhythm and anticipation passer will determine his long-term ceiling.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.KADYN_PROCTOR]: createSchemeFitProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",

    offensiveSchemes: [
      "Power Run",
      "Gap Scheme",
      "Inside Zone",
      "Play Action",
      "Balanced NFL Offense",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Starting Left Tackle",
      "Power Run Blocker",
      "Downhill Run Game Tackle",
      "Pass Protection Anchor",
      "Long-Term Offensive Line Starter",
    ],

    versatility: {
      score: 90,
      notes:
        "Rare size, power, length, and anchor strength give him starting tackle value in physical NFL offenses that emphasize downhill rushing concepts and controlled pass-protection assignments.",
    },

    strengths: [
      "Excellent fit in power and gap-based rushing attacks",
      "Massive frame creates displacement at the point of attack",
      "Elite anchor profile against NFL power rushers",
      "Length provides significant pass-protection advantages",
      "Strong fit in play-action offenses built around a physical run game",
      "Can become a foundational offensive line piece",
    ],

    concerns: [
      "Footwork must continue improving against elite speed rushers",
      "Recovery ability can become more consistent in isolated pass sets",
      "Movement-heavy systems may require continued technical development",
    ],

    notes:
      "Best projected as a starting NFL tackle in a physical offense that emphasizes power concepts, gap runs, inside zone, and play action. Proctor's rare size and strength create immediate run-game value, while continued development in footwork and pass-protection recovery will determine his long-term ceiling as a blind-side protector.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.TJ_PARKER]: createSchemeFitProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "T.J. Parker",
    position: "EDGE",

    offensiveSchemes: [],

    defensiveSchemes: [
      "Multiple Front",
      "Even Front",
      "Wide-9",
      "One-Gap",
      "Hybrid Front",
    ],

    roleFits: [
      "Starting EDGE Defender",
      "Stand-Up Outside Rusher",
      "Hand-in-Dirt Defensive End",
      "Passing-Down Edge Rusher",
      "Front-Seven Disruptor",
    ],

    versatility: {
      score: 93,
      notes:
        "Explosive first-step quickness, power, motor, and pursuit ability allow him to fit multiple NFL edge roles as either a stand-up rusher or hand-in-dirt defensive end.",
    },

    strengths: [
      "Excellent fit in attacking one-gap fronts",
      "Explosive get-off translates to wide alignment pass-rush roles",
      "Can pressure from both stand-up and hand-down alignments",
      "High motor supports pursuit and second-effort pressures",
      "Power profile gives him value against physical run games",
    ],

    concerns: [
      "Counter-rush plan must continue developing",
      "Edge-setting consistency can continue improving against NFL power",
      "May need refinement before becoming a complete three-down defender",
    ],

    notes:
      "Best projected as a starting NFL edge defender in an attacking front that allows him to win with burst, power, pursuit, and alignment flexibility. Parker's first-step explosiveness and motor give him immediate pass-rush value with long-term three-down upside.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.CALEB_DOWNS]: createSchemeFitProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",

    offensiveSchemes: [],

    defensiveSchemes: [
      "Multiple Front",
      "Split Safety",
      "Single High",
      "Match Coverage",
      "Pattern Match",
      "Nickel Defense",
    ],

    roleFits: [
      "Starting Free Safety",
      "Deep Safety",
      "Split-Safety Defender",
      "Match Coverage Safety",
      "Nickel Defensive Chess Piece",
      "Three-Down Defensive Playmaker",
    ],

    versatility: {
      score: 96,
      notes:
        "Elite range, processing, coverage instincts, and positional versatility allow him to function as a deep safety, split-field defender, box support player, and matchup piece across multiple NFL defensive structures.",
    },

    strengths: [
      "Elite fit in multiple defensive structures",
      "Range supports single-high and split-safety responsibilities",
      "Advanced processing translates to pattern-match coverage",
      "Can rotate between deep and underneath assignments",
      "Coverage instincts support matchup responsibilities",
      "Versatility gives defensive coordinators significant alignment flexibility",
    ],

    concerns: [
      "NFL usage should maximize his range rather than consistently isolating him as a traditional box defender",
      "Can continue adding functional strength for frequent downhill run-support assignments",
    ],

    notes:
      "Best projected as a versatile three-down safety in a multiple NFL defense that uses post-snap rotations, split-safety structures, pattern-match coverage, and flexible secondary alignments. Downs' range, processing, and coverage instincts allow a defensive coordinator to move him throughout the secondary without significantly limiting the coverage menu.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.92,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.RUEBEN_BAIN]: createSchemeFitProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",

    offensiveSchemes: [],

    defensiveSchemes: [
      "Multiple Front",
      "Even Front",
      "One-Gap",
      "Hybrid Front",
      "Power-Based Front",
    ],

    roleFits: [
      "Starting EDGE Defender",
      "Power Edge Rusher",
      "Hand-in-Dirt Defensive End",
      "Strong-Side Edge Defender",
      "Three-Down Front-Seven Defender",
    ],

    versatility: {
      score: 91,
      notes:
        "Power, leverage, hand usage, and run-defense ability give him strong three-down value in multiple-front defenses that ask edge defenders to play with physicality and gap discipline.",
    },

    strengths: [
      "Excellent fit in physical multiple-front defenses",
      "Power profile translates well to hand-in-dirt edge roles",
      "Strong run-defense ability supports early-down usage",
      "Heavy hands and leverage create pass-rush value",
      "Can function as a three-down edge defender in balanced fronts",
    ],

    concerns: [
      "Bend and cornering ability may not fit every wide-alignment pass-rush role",
      "Can continue expanding pass-rush variety against NFL tackles",
      "Best usage should emphasize power, leverage, and physical disruption",
    ],

    notes:
      "Best projected as a physical three-down edge defender in a multiple-front defense that values power, run defense, heavy hands, and gap discipline. Bain's profile fits especially well in fronts that allow him to win with strength and leverage rather than relying exclusively on high-end bend.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.82,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createSchemeFitProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",

    offensiveSchemes: [
      "Outside Zone",
      "Inside Zone",
      "Spread",
      "Shotgun Run Game",
      "Screen Game",
      "Multiple Offense",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Explosive Feature Back",
      "Outside Zone Runner",
      "Space Player",
      "Home-Run Threat",
      "Three-Down Running Back Developmental Upside",
    ],

    versatility: {
      score: 94,
      notes:
        "Explosive acceleration, long speed, contact balance, and receiving upside give him strong scheme versatility in modern NFL offenses that create space and stress pursuit angles.",
    },

    strengths: [
      "Excellent fit in outside-zone and space-based rushing attacks",
      "Burst and long speed create explosive-play value",
      "Can stress defenses from shotgun and spread looks",
      "Receiving ability supports screen and third-down packages",
      "Contact balance gives him more than pure speed-back value",
    ],

    concerns: [
      "Pass-protection role must continue developing for full three-down usage",
      "Power-heavy downhill systems may not maximize his explosive profile",
      "NFL role should emphasize space, angles, and explosive touches",
    ],

    notes:
      "Best projected in a modern spread or zone-based offense that uses space, shotgun run concepts, screen game touches, and outside-zone opportunities to maximize his burst and explosive-play ability. Love's athletic profile gives him feature-back upside if his pass protection and third-down reliability continue developing.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.82,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.CALEB_LOMU]: createSchemeFitProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",

    offensiveSchemes: [
      "Zone Run",
      "Outside Zone",
      "Inside Zone",
      "Pass-First Offense",
      "Balanced NFL Offense",
      "Movement-Based Passing Game",
    ],

    defensiveSchemes: [],

    roleFits: [
      "Developmental Left Tackle",
      "Pass Protection Tackle",
      "Zone Scheme Tackle",
      "Swing Tackle With Starter Upside",
      "Long-Term Offensive Line Starter",
    ],

    versatility: {
      score: 90,
      notes:
        "Smooth feet, lateral movement ability, balance, and pass-protection tools give him strong fit value in zone-based and pass-oriented NFL offenses.",
    },

    strengths: [
      "Excellent fit in zone-based rushing structures",
      "Smooth lateral movement supports outside-zone responsibilities",
      "Pass-protection movement skills translate well to NFL tackle play",
      "Balance and recovery ability support long-term starter projection",
      "Can fit offenses that value athletic tackles in space",
    ],

    concerns: [
      "Functional strength must continue developing against NFL power rushers",
      "May need time before handling heavy power-based run assignments",
      "Anchor consistency will determine early NFL readiness",
    ],

    notes:
      "Best projected as a developmental offensive tackle in a zone-based or balanced NFL offense that values movement skills, pass protection, balance, and recovery ability. Lomu's long-term upside is strongest in systems that allow athletic tackles to win with feet, angles, and space movement while his play strength continues developing.",

    source: "LBHT Scheme Fit Evaluation",
    confidence: 0.80,
    lastUpdated: "2026-07-03",
  }),

};

export default schemeFitProfiles;
