import { createDecisionProfile } from "./createDecisionProfile";

export const decisionProfiles = {};

export function getDecisionProfile(profileId) {
  return decisionProfiles[profileId] || null;
}

export default decisionProfiles;