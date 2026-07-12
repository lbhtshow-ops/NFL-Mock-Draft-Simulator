import { createDecisionProfile } from "./createDecisionProfile";

export const defaultDecisionProfile = createDecisionProfile({
  profileId: "default",
  name: "Default Decision Profile",
  role: "organization",
  currentTeam: "",

  draftPhilosophy: {
    summary: "Balanced draft decision profile.",
    coreBeliefs: [
      "Balance player grade, team need, scheme fit, and draft value.",
    ],
    preferredPositions: [],
    avoidedProfiles: [],
    riskTolerance: "medium",
  },

  metadata: {
    sources: [],
    confidence: 0,
    lastUpdated: null,
    status: "default",
  },
});

export default defaultDecisionProfile;