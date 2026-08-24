import {
  createNFLTeamAvailabilityEvidence,
} from "./NFLTeamAvailabilityEvidenceContract.js";

export const NFL_TEAM_AVAILABILITY_PROVIDER_CONTRACT =
  "NFLTeamAvailabilityEvidenceProvider";
export const NFL_TEAM_AVAILABILITY_PROVIDER_VERSION =
  "FIE-NFL-TEAM-AVAILABILITY-PROVIDER-1.0.0";

export function createNFLTeamAvailabilityEvidenceProvider({
  providerId = "UNSPECIFIED",
  resolve = null,
} = {}) {
  if (typeof resolve !== "function") {
    throw new TypeError("NFL team availability provider requires resolve(team, options).")
  }
  return Object.freeze({
    contract: NFL_TEAM_AVAILABILITY_PROVIDER_CONTRACT,
    version: NFL_TEAM_AVAILABILITY_PROVIDER_VERSION,
    providerId,
    resolve,
  });
}

export const emptyNFLTeamAvailabilityEvidenceProvider =
  createNFLTeamAvailabilityEvidenceProvider({
    providerId: "EMPTY_NFL_TEAM_AVAILABILITY_PROVIDER",
    resolve(teamAbbreviation) {
      return createNFLTeamAvailabilityEvidence({ teamAbbreviation });
    },
  });

export default {
  NFL_TEAM_AVAILABILITY_PROVIDER_CONTRACT,
  NFL_TEAM_AVAILABILITY_PROVIDER_VERSION,
  createNFLTeamAvailabilityEvidenceProvider,
  emptyNFLTeamAvailabilityEvidenceProvider,
};
