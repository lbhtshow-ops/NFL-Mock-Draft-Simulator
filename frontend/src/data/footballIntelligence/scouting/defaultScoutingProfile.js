import { createScoutingProfile } from "./createScoutingProfile";

export const defaultScoutingProfile = createScoutingProfile({
  executiveSummary: "No scouting report available yet.",

  notes: "No scouting report available yet.",

  confidence: 0,
});

export default defaultScoutingProfile;