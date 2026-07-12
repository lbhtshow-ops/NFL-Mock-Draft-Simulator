import { createTeamIdentityRecord } from "./createTeamIdentityRecord";

export const teamIdentityRecords = {};

export function getTeamIdentityRecord(teamId) {
  return teamIdentityRecords[teamId] || null;
}

export default teamIdentityRecords;