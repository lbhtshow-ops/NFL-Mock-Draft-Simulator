// src/data/footballIntelligence/scouting/playerTraitProfiles.js

import { createTraitProfile } from "./createTraitProfile";
import { prospectIds } from "../registry/prospectIds";

export const playerTraitProfiles = {
  [prospectIds.ARCH_MANNING]: createTraitProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",

    traits: {
      Accuracy: 93,
      ArmStrength: 94,
      Processing: 92,
      PocketPresence: 91,
      Anticipation: 90,
      Mobility: 89,
      Leadership: 95,
      FootballIQ: 94,
      Mechanics: 91,
      Creativity: 90,
    },

    source: "LBHT Research",
    confidence: 0.87,
    lastUpdated: "2026-07-03",

    notes:
      "Prototype quarterback prospect with high-end arm talent, processing upside, leadership, and franchise-caliber tools.",
  }),

  [prospectIds.CALEB_DOWNS]: createTraitProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",

    traits: {
      Instincts: 98,
      FootballIQ: 96,
      Range: 96,
      Tackling: 91,
      BallSkills: 94,
      Versatility: 97,
      Processing: 97,
      Pursuit: 94,
      Motor: 93,
      Leadership: 91,
    },

    source: "LBHT Research",
    confidence: 0.9,
    lastUpdated: "2026-07-03",

    notes:
      "Elite modern safety with exceptional instincts, processing speed, versatility, and sideline-to-sideline range.",
  }),

  [prospectIds.PETER_WOODS]: createTraitProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",

    traits: {
      Power: 92,
      Explosiveness: 89,
      FootballIQ: 86,
      Motor: 94,
      HandUsage: 88,
      BlockShedding: 91,
      Leverage: 87,
      PassRush: 85,
      RunDefense: 93,
      Pursuit: 88,
    },

    source: "LBHT Research",
    confidence: 0.9,
    lastUpdated: "2026-07-03",

    notes:
      "Elite interior defensive lineman with rare power, disruptive run defense, and outstanding competitive toughness.",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createTraitProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",

    traits: {
      PassProtection: 90,
      Anchor: 92,
      Footwork: 88,
      Power: 94,
      Length: 91,
      RunBlocking: 95,
      HandPlacement: 87,
      Balance: 89,
      Recovery: 86,
      FootballIQ: 88,
    },

    source: "LBHT Research",
    confidence: 0.82,
    lastUpdated: "2026-07-03",

    notes:
      "Powerful tackle prospect with elite size, dominant run-blocking traits, and high-end starter upside.",
  }),

  [prospectIds.LANORRIS_SELLERS]: createTraitProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",

    traits: {
      Accuracy: 87,
      ArmStrength: 93,
      Processing: 86,
      PocketPresence: 88,
      Anticipation: 84,
      Mobility: 96,
      Playmaking: 95,
      FootballIQ: 88,
      Toughness: 94,
      Creativity: 94,
    },

    source: "LBHT Research",
    confidence: 0.82,
    lastUpdated: "2026-07-03",

    notes:
      "Dynamic dual-threat quarterback with rare physical tools, rushing ability, and high developmental upside.",
  }),

  [prospectIds.KADYN_PROCTOR]: createTraitProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",

    traits: {
      PassProtection: 87,
      Anchor: 95,
      Footwork: 84,
      Power: 96,
      Length: 93,
      RunBlocking: 94,
      HandPlacement: 85,
      Balance: 86,
      Recovery: 84,
      FootballIQ: 87,
    },

    source: "LBHT Research",
    confidence: 0.81,
    lastUpdated: "2026-07-03",

    notes:
      "Massive power-based tackle prospect with rare size, strong anchor ability, and long-term starting upside.",
  }),

    [prospectIds.TJ_PARKER]: createTraitProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "T.J. Parker",
    position: "EDGE",

    traits: {
      Burst: 93,
      Bend: 89,
      PassRush: 92,
      Power: 90,
      RunDefense: 88,
      HandUsage: 90,
      Motor: 94,
      Pursuit: 91,
      FootballIQ: 88,
      ClosingSpeed: 92,
    },

    source: "LBHT Research",
    confidence: 0.83,
    lastUpdated: "2026-07-03",

    notes:
      "Explosive edge defender with outstanding first-step quickness, relentless motor, and high-end pass-rushing upside.",
  }),

  [prospectIds.RUEBEN_BAIN]: createTraitProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",

    traits: {
      Burst: 89,
      Bend: 87,
      PassRush: 91,
      Power: 93,
      RunDefense: 91,
      HandUsage: 92,
      Motor: 93,
      Pursuit: 90,
      FootballIQ: 89,
      ClosingSpeed: 88,
    },

    source: "LBHT Research",
    confidence: 0.82,
    lastUpdated: "2026-07-03",

    notes:
      "Powerful edge defender with heavy hands, physical run defense, and consistent pass-rush production.",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createTraitProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",

    traits: {
      Vision: 91,
      Burst: 95,
      ContactBalance: 92,
      Elusiveness: 93,
      PassCatching: 88,
      LongSpeed: 94,
      ChangeOfDirection: 93,
      BallSecurity: 89,
      FootballIQ: 88,
      Competitiveness: 92,
    },

    source: "LBHT Research",
    confidence: 0.80,
    lastUpdated: "2026-07-03",

    notes:
      "Dynamic offensive weapon with explosive acceleration, home-run ability, and three-down running back potential.",
  }),

  [prospectIds.CALEB_LOMU]: createTraitProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",

    traits: {
      PassProtection: 90,
      Anchor: 88,
      Footwork: 91,
      Power: 87,
      Length: 90,
      RunBlocking: 88,
      HandPlacement: 89,
      Balance: 90,
      Recovery: 91,
      FootballIQ: 87,
    },

    source: "LBHT Research",
    confidence: 0.78,
    lastUpdated: "2026-07-03",

    notes:
      "Athletic offensive tackle with excellent movement skills, pass-protection upside, and long-term starter potential.",
  }),

};

export default playerTraitProfiles;