// src/data/footballIntelligence/scouting/createTraitProfile.js

export function createTraitProfile({
  playerId = null,
  playerName = "",
  position = "",
  traits = {},
  source = [],
  confidence = 0,
  lastUpdated = "2026-06-19",
  notes = "",
} = {}) {
  return {
    playerId,
    playerName,
    position,
    traits,
    source,
    confidence,
    lastUpdated,
    notes,
  };
}