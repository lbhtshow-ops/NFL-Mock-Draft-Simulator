import { createTeamIdentityRecord } from "./createTeamIdentityRecord";

export const defaultTeamIdentityRecord = createTeamIdentityRecord({
  teamId: "",
  teamName: "Unknown Team",
  abbreviation: "",

  metadata: {
    sources: [],
    confidence: 0,
    lastUpdated: null,
    status: "missing",
  },
});

export default defaultTeamIdentityRecord;