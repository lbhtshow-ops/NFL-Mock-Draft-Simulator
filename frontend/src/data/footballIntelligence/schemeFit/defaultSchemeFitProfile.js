import { createSchemeFitProfile } from "./createSchemeFitProfile";

export const defaultSchemeFitProfile = createSchemeFitProfile({
  playerId: null,
  playerName: "Unknown Prospect",
  position: "",

  notes: "No scheme fit profile available yet.",
  source: "Unknown",
  confidence: 0,
  lastUpdated: null,
});

export default defaultSchemeFitProfile;