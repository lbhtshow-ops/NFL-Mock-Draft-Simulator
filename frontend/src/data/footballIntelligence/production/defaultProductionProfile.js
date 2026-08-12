import { createProductionProfile } from "./createProductionProfile.js";

export const defaultProductionProfile = createProductionProfile({
  playerId: null,

  notes: "Production profile not available.",

  confidence: 0,
});

export default defaultProductionProfile;
