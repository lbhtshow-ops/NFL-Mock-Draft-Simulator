import { createFootballIQProfile } from "./createFootballIQProfile.js";

export const defaultFootballIQProfile = createFootballIQProfile({
  playerId: null,
  playerName: "Unknown Prospect",
  position: "",

  notes: "No Football IQ profile available yet.",
  source: "Unknown",
  confidence: 0,
  lastUpdated: null,
});

export default defaultFootballIQProfile;
