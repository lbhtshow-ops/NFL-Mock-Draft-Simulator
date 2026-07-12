// src/engines/PlayerArchetypeEngine.js

const archetypesByPosition = {
  QB: [
    "Pocket Passer",
    "Dual Threat",
    "Field General",
    "Gunslinger",
    "Developmental QB",
  ],

  RB: [
    "Power Back",
    "Elusive Back",
    "Receiving Back",
    "Three-Down Back",
  ],

  WR: [
    "Vertical Threat",
    "Route Technician",
    "Possession Receiver",
    "Slot Specialist",
  ],

  TE: [
    "Receiving Tight End",
    "Blocking Tight End",
    "Move Tight End",
    "Balanced Tight End",
  ],

  OT: [
    "Franchise Left Tackle",
    "Athletic Pass Protector",
    "Power Run Blocker",
    "Developmental Starter",
  ],

  IOL: [
    "Power Interior Blocker",
    "Zone Scheme Blocker",
    "Pass Protection Specialist",
    "Versatile Interior Lineman",
  ],

  EDGE: [
    "Speed Rusher",
    "Power Rusher",
    "Balanced Edge",
    "Run Defender",
  ],

  DL: [
    "Interior Pass Rusher",
    "Run Stuffer",
    "Two-Gap Defender",
    "Disruptive Lineman",
  ],

  LB: [
    "Coverage Linebacker",
    "Run Stopper",
    "Blitzer",
    "Three-Down Linebacker",
  ],

  CB: [
    "Man Coverage Corner",
    "Zone Coverage Corner",
    "Ball Hawk",
    "Nickel Corner",
  ],

  S: [
    "Deep Safety",
    "Box Safety",
    "Hybrid Safety",
    "Ball Hawk Safety",
  ],
};

export function assignPlayerArchetype(player) {
  if (!player) return "Unknown";

  const position = player.position;
  const rank = Number(player.rank);

  const options = archetypesByPosition[position];

  if (!options || options.length === 0) {
    return "General Prospect";
  }

  // Top prospects get the most premium / complete archetype
  if (rank <= 10) {
    return options[0];
  }

  // First-round caliber players usually get a strong archetype
  if (rank <= 32) {
    return options[1] || options[0];
  }

  // Day 2 players get a more role-specific archetype
  if (rank <= 100) {
    return options[2] || options[0];
  }

  // Later players are more developmental / specialized
  return options[3] || options[0];
}

export function getArchetypesForPosition(position) {
  return archetypesByPosition[position] || [];
}