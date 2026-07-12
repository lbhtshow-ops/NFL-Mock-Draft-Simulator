import { createAthleticProfile } from "./createAthleticProfile";

export const defaultAthleticProfile = createAthleticProfile({
  playerId: null,
  playerName: "Unknown Prospect",
  position: "",

  notes: "No athletic profile available yet.",
  source: "Unknown",
  confidence: 0,
  lastUpdated: null,
});

export default defaultAthleticProfile;