import { createScoutingProfile } from "./createScoutingProfile";
import { prospectIds } from "../registry/prospectIds";

export const scoutingProfiles = {
  [prospectIds.ARCH_MANNING]: createScoutingProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",

    executiveSummary:
      "Arch Manning projects as a high-end NFL quarterback prospect with excellent leadership, advanced football intelligence, above-average athletic ability, and franchise quarterback upside.",

    synopsis: {
      position: "QB",
      school: "Texas",
      height: `6'4"`,
      weight: 225,
      classYear: "Sophomore",
      age: 20,
    },

    projection: {
      overallGrade: 96,
      roundGrade: "Top 5",
      consensusRank: 1,
      positionRank: 1,
      projection: "Top 5",
      ceiling: "Franchise Quarterback",
      floor: "NFL Starter",
      risk: "Low",
    },

    strengths: [
      "Elite football intelligence",
      "Excellent leadership",
      "NFL arm talent",
      "Poised decision maker",
    ],

    developmentAreas: [
      "Continue adding starting experience",
      "Improve anticipation versus disguised NFL coverages",
    ],

    nflProjection: {
      yearOneRole: "Developmental Starter",
      longTermProjection: "Franchise Quarterback",
    },

    notes:
      "Complete quarterback prospect with elite long-term upside and one of the highest ceilings in the class.",

    source: "LBHT Scouting",
    confidence: 0.90,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.PETER_WOODS]: createScoutingProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",

    executiveSummary:
      "Peter Woods projects as an impact interior defensive lineman with elite power, excellent run defense, and Pro Bowl potential.",

    synopsis: {
      position: "DL",
      school: "Clemson",
      height: `6'3"`,
      weight: 315,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 95,
      roundGrade: "Top 5",
      consensusRank: 3,
      positionRank: 1,
      projection: "Top 5",
      ceiling: "All-Pro Defensive Tackle",
      floor: "NFL Starter",
      risk: "Low",
    },

    strengths: [
      "Elite play strength",
      "Outstanding run defender",
      "High football character",
      "Excellent competitive toughness",
    ],

    developmentAreas: [
      "Expand pass-rush repertoire",
      "Improve finishing consistency",
    ],

    nflProjection: {
      yearOneRole: "Immediate Starter",
      longTermProjection: "Pro Bowl Defensive Lineman",
    },

    notes:
      "Powerful interior defender capable of becoming the centerpiece of an NFL defensive front.",

    source: "LBHT Scouting",
    confidence: 0.91,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createScoutingProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",

    executiveSummary:
      "Francis Mauigoa projects as a high-level NFL offensive tackle with elite size, outstanding play strength, and immediate impact potential in the run game. His combination of power, movement ability, and anchor strength gives him long-term Pro Bowl upside as a starting tackle.",

    synopsis: {
      position: "OT",
      school: "Miami",
      height: `6'6"`,
      weight: 330,
      classYear: "Junior",
      age: 22,
    },

    projection: {
      overallGrade: 94,
      roundGrade: "Top 10",
      consensusRank: 4,
      positionRank: 1,
      projection: "Top 10",
      ceiling: "Pro Bowl Offensive Tackle",
      floor: "Quality NFL Starter",
      risk: "Low-Moderate",
    },

    strengths: [
      "Elite size and play strength",
      "Powerful point-of-attack run blocker",
      "Excellent anchor against power rushers",
      "High-level movement ability for his size",
      "Scheme-versatile offensive tackle profile",
    ],

    developmentAreas: [
      "Continue improving pass-protection consistency against elite speed",
      "Become more consistent with hand placement in isolated pass sets",
      "Refine recovery technique when initially beaten around the edge",
    ],

    nflProjection: {
      yearOneRole: "Immediate Starting Tackle",
      longTermProjection: "Pro Bowl Offensive Tackle",
    },

    notes:
      "Power-based offensive tackle prospect with the size, strength, and movement skills to become a long-term NFL starter. Mauigoa should provide immediate value in the run game while continued technical development in pass protection determines whether he reaches his Pro Bowl ceiling.",

    source: "LBHT Scouting",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.LANORRIS_SELLERS]: createScoutingProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",

    executiveSummary:
      "LaNorris Sellers projects as a high-upside dual-threat quarterback with rare size, athleticism, arm talent, and explosive playmaking ability. His physical tools create franchise-quarterback upside, while continued development in processing, anticipation, and rhythm passing will determine his long-term NFL ceiling.",

    synopsis: {
      position: "QB",
      school: "South Carolina",
      height: `6'3"`,
      weight: 240,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 92,
      roundGrade: "Top 10",
      consensusRank: 5,
      positionRank: 2,
      projection: "Top 10",
      ceiling: "Franchise Dual-Threat Quarterback",
      floor: "Developmental NFL Starter",
      risk: "Moderate",
    },

    strengths: [
      "Rare size and athleticism",
      "Dynamic dual-threat playmaking ability",
      "High-level arm strength",
      "Explosive designed-run value",
      "Creative off-script ability",
      "Physical profile creates significant schematic stress",
    ],

    developmentAreas: [
      "Improve processing consistency against complex coverage rotations",
      "Continue developing anticipation as a rhythm passer",
      "Become more consistent with timing-based passing concepts",
      "Avoid unnecessary dependence on off-script creation",
    ],

    nflProjection: {
      yearOneRole: "Developmental Starter",
      longTermProjection: "Franchise Dual-Threat Quarterback",
    },

    notes:
      "Rare physical talent with the size, mobility, arm strength, and playmaking ability to become the centerpiece of a modern NFL offense. Sellers offers one of the highest developmental ceilings in the class, but his long-term outcome will depend on continued growth as a processor and structured passer.",

    source: "LBHT Scouting",
    confidence: 0.84,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.KADYN_PROCTOR]: createScoutingProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",

    executiveSummary:
      "Kadyn Proctor projects as a massive, power-based offensive tackle with rare size, elite anchor strength, and high-end run-blocking upside. His physical profile gives him long-term starting potential, while continued development in footwork and pass-protection recovery will determine whether he reaches a Pro Bowl ceiling.",

    synopsis: {
      position: "OT",
      school: "Alabama",
      height: `6'7"`,
      weight: 360,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 92,
      roundGrade: "Top 15",
      consensusRank: 6,
      positionRank: 2,
      projection: "Top 15",
      ceiling: "Pro Bowl Offensive Tackle",
      floor: "Quality NFL Starter",
      risk: "Moderate",
    },

    strengths: [
      "Rare size and mass",
      "Elite anchor against power rushers",
      "Powerful run-blocking profile",
      "Creates displacement at the point of attack",
      "Long-term starting tackle upside",
    ],

    developmentAreas: [
      "Improve foot quickness against elite speed rushers",
      "Become more consistent with pass-protection recovery",
      "Continue refining hand timing and placement",
      "Improve movement efficiency in space",
    ],

    nflProjection: {
      yearOneRole: "Competing Starting Tackle",
      longTermProjection: "High-Level Starting Offensive Tackle",
    },

    notes:
      "Powerful offensive tackle prospect with rare size and physicality. Proctor can immediately add value in the run game and has the tools to become a high-level NFL starter if his pass-protection technique continues to improve.",

    source: "LBHT Scouting",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.TJ_PARKER]: createScoutingProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "T.J. Parker",
    position: "EDGE",

    executiveSummary:
      "T.J. Parker projects as an explosive NFL edge defender with high-level first-step quickness, pass-rush upside, and disruptive front-seven ability. His motor, burst, and power profile give him immediate pass-rush value with long-term three-down starter potential.",

    synopsis: {
      position: "EDGE",
      school: "Clemson",
      height: `6'3"`,
      weight: 265,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 92,
      roundGrade: "Top 15",
      consensusRank: 7,
      positionRank: 1,
      projection: "Top 15",
      ceiling: "Pro Bowl Edge Rusher",
      floor: "Quality Starting EDGE",
      risk: "Low-Moderate",
    },

    strengths: [
      "Explosive first-step quickness",
      "High-level pass-rush upside",
      "Strong motor and pursuit effort",
      "Can rush from multiple alignments",
      "Power profile gives him run-game value",
    ],

    developmentAreas: [
      "Continue developing counter-rush plan",
      "Improve edge-setting consistency against NFL power",
      "Refine rush sequencing across longer pass-rush reps",
      "Continue adding three-down reliability",
    ],

    nflProjection: {
      yearOneRole: "Rotational Pass Rusher With Starting Upside",
      longTermProjection: "Pro Bowl Edge Rusher",
    },

    notes:
      "Explosive edge prospect with the burst, motor, and disruptive traits to become a high-impact NFL pass rusher. Parker should offer early pressure-package value while developing into a complete three-down edge defender.",

    source: "LBHT Scouting",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

    [prospectIds.CALEB_DOWNS]: createScoutingProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",

    executiveSummary:
      "Caleb Downs projects as an elite NFL safety prospect with exceptional football intelligence, instincts, coverage versatility, tackling reliability, and immediate impact potential. His ability to diagnose plays, operate from multiple alignments, and consistently influence the game gives him All-Pro upside as the centerpiece of an NFL secondary.",

    synopsis: {
      position: "S",
      school: "Ohio State",
      height: `6'0"`,
      weight: 205,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 96,
      roundGrade: "Top 5",
      consensusRank: 2,
      positionRank: 1,
      projection: "Top 5",
      ceiling: "All-Pro Safety",
      floor: "High-Level NFL Starter",
      risk: "Low",
    },

    strengths: [
      "Elite football intelligence and play recognition",
      "Outstanding instincts and anticipation",
      "High-level coverage versatility",
      "Reliable open-field tackler",
      "Excellent positional flexibility",
      "Immediate three-down defensive impact",
    ],

    developmentAreas: [
      "Continue refining deep-field range against elite NFL speed",
      "Maintain disciplined leverage when deployed aggressively near the box",
      "Continue developing disguise and communication responsibilities in complex NFL coverage structures",
    ],

    nflProjection: {
      yearOneRole: "Immediate Starting Safety",
      longTermProjection: "All-Pro Defensive Back",
    },

    notes:
      "Elite safety prospect with the intelligence, instincts, versatility, and technical reliability to immediately influence an NFL defense. Downs projects as a defensive centerpiece capable of playing deep safety, rotating into the box, matching coverage responsibilities, and helping organize the secondary.",

    source: "LBHT Scouting",
    confidence: 0.91,
    lastUpdated: "2026-07-04",
  }),

    [prospectIds.RUEBEN_BAIN]: createScoutingProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",

    executiveSummary:
      "Rueben Bain Jr. projects as a powerful, disruptive NFL front-seven defender with high-level play strength, excellent competitive toughness, and the versatility to create pressure from multiple alignments. His combination of power, instincts, and backfield disruption gives him immediate starting potential with long-term Pro Bowl upside.",

    synopsis: {
      position: "EDGE",
      school: "Miami",
      height: `6'3"`,
      weight: 275,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 93,
      roundGrade: "Top 15",
      consensusRank: 8,
      positionRank: 2,
      projection: "Top 15",
      ceiling: "Pro Bowl Defensive Front Player",
      floor: "Quality NFL Starter",
      risk: "Low-Moderate",
    },

    strengths: [
      "High-level play strength",
      "Excellent competitive toughness",
      "Disruptive backfield presence",
      "Strong run-defense profile",
      "Can create pressure from multiple alignments",
      "Relentless motor and pursuit effort",
    ],

    developmentAreas: [
      "Continue expanding pass-rush counter repertoire",
      "Improve rush sequencing across extended pass-rush reps",
      "Continue refining edge consistency against NFL tackles",
      "Develop additional finishing consistency as a pass rusher",
    ],

    nflProjection: {
      yearOneRole: "Immediate Defensive Rotation With Starting Upside",
      longTermProjection: "Pro Bowl Defensive Front Player",
    },

    notes:
      "Physical and disruptive defensive prospect with the strength, motor, and positional flexibility to impact an NFL front immediately. Bain can create pressure from multiple alignments and projects as a high-level starter in a multiple-front defense.",

    source: "LBHT Scouting",
    confidence: 0.85,
    lastUpdated: "2026-07-04",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createScoutingProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",

    executiveSummary:
      "Jeremiyah Love projects as an explosive NFL offensive weapon with elite acceleration, high-end open-field ability, and legitimate three-down upside. His combination of rushing explosiveness, receiving value, and home-run ability gives him Pro Bowl potential in a modern NFL offense.",

    synopsis: {
      position: "RB",
      school: "Notre Dame",
      height: `6'0"`,
      weight: 210,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 92,
      roundGrade: "Top 20",
      consensusRank: 9,
      positionRank: 1,
      projection: "Top 20",
      ceiling: "Pro Bowl Offensive Weapon",
      floor: "Quality Starting Running Back",
      risk: "Low-Moderate",
    },

    strengths: [
      "Elite acceleration and burst",
      "High-end explosive-play ability",
      "Excellent open-field movement",
      "Strong receiving value",
      "Natural big-play creator",
      "Three-down offensive upside",
    ],

    developmentAreas: [
      "Continue developing pass-protection consistency",
      "Improve processing against complex NFL pressure looks",
      "Prove durability under an expanded NFL workload",
      "Continue refining inside-run patience",
    ],

    nflProjection: {
      yearOneRole: "Immediate Offensive Weapon",
      longTermProjection: "Pro Bowl Running Back",
    },

    notes:
      "Dynamic running back prospect with elite explosive ability and legitimate passing-game value. Love projects as a versatile offensive weapon capable of creating explosive plays from the backfield and as a receiver.",

    source: "LBHT Scouting",
    confidence: 0.84,
    lastUpdated: "2026-07-04",
  }),

  [prospectIds.CALEB_LOMU]: createScoutingProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",

    executiveSummary:
      "Caleb Lomu projects as a technically developing NFL offensive tackle with high-level movement ability, strong length, and starting-caliber pass-protection upside. His athletic profile and scheme versatility give him long-term starting potential with continued technical development.",

    synopsis: {
      position: "OT",
      school: "Utah",
      height: `6'6"`,
      weight: 315,
      classYear: "Junior",
      age: 21,
    },

    projection: {
      overallGrade: 90,
      roundGrade: "Top 25",
      consensusRank: 10,
      positionRank: 3,
      projection: "Top 25",
      ceiling: "High-Level Starting Offensive Tackle",
      floor: "Developmental NFL Starter",
      risk: "Moderate",
    },

    strengths: [
      "High-level movement ability",
      "Good offensive tackle length",
      "Athletic pass-protection profile",
      "Scheme-versatile blocking ability",
      "Strong developmental upside",
      "Comfortable operating in space",
    ],

    developmentAreas: [
      "Continue improving anchor strength against NFL power rushers",
      "Refine hand placement and timing",
      "Improve recovery consistency when initially beaten",
      "Continue adding functional play strength",
    ],

    nflProjection: {
      yearOneRole: "Developmental Tackle Competing For Starting Reps",
      longTermProjection: "High-Level Starting Offensive Tackle",
    },

    notes:
      "Athletic offensive tackle prospect with the movement skills, length, and developmental upside to become a long-term NFL starter. Lomu's ceiling will depend on continued improvements in functional strength, hand usage, and pass-protection consistency.",

    source: "LBHT Scouting",
    confidence: 0.82,
    lastUpdated: "2026-07-04",
  }),

};

export default scoutingProfiles;