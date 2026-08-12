// src/data/footballIntelligence/registry/resolveProspect.js

import {
  getProspectById,
  getProspectByName,
  getProspectByRank,
} from "./prospects.js";

/**
 * Resolves any player-like object into a canonical prospect record.
 *
 * This allows engines to avoid guessing whether a player is identified by:
 * - canonical ID
 * - player ID
 * - prospect ID
 * - simulator rank
 * - simulator name
 * - roster player name
 * - identity playerName
 * - slug
 */
export function resolveProspect(player) {
  if (!player) return null;

  const requestedDraftClass = Number(
    player.draftClass ??
    player.year ??
    player.identity?.draftClass ??
    player.identity?.year ??
    player.profile?.draftClass ??
    player.profile?.year ??
    NaN
  );

  const classMatches = (prospect) => {
    if (!prospect) return false;
    if (!Number.isFinite(requestedDraftClass)) return true;
    if (!Number.isFinite(Number(prospect.draftClass))) return true;
    return Number(prospect.draftClass) === requestedDraftClass;
  };

  const candidateIds = [
    player.id,
    player.playerId,
    player.prospectId,
    player.canonicalId,
    player.identity?.id,
    player.identity?.playerId,
    player.identity?.prospectId,
    player.identity?.canonicalId,
  ].filter(Boolean);

  for (const id of candidateIds) {
    const match = getProspectById(id);
    if (classMatches(match)) return match;
  }

  const candidateRanks = [
    player.rank,
    player.simulatorRank,
    player.rankings?.overall,
    player.rankings?.consensus,
  ].filter((rank) => typeof rank === "number");

  for (const rank of candidateRanks) {
    const match = getProspectByRank(rank);
    if (classMatches(match)) return match;
  }

  const candidateNames = [
    player.name,
    player.playerName,
    player.simulatorName,
    player.identity?.name,
    player.identity?.playerName,
    player.profile?.playerName,
  ].filter(Boolean);

  for (const name of candidateNames) {
    const match = getProspectByName(name);
    if (classMatches(match)) return match;
  }

  return null;
}

export default resolveProspect;