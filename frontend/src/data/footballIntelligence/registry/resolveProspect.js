// src/data/footballIntelligence/registry/resolveProspect.js

import {
  getProspectById,
  getProspectByName,
  getProspectByRank,
} from "./prospects";

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
    if (match) return match;
  }

  const candidateRanks = [
    player.rank,
    player.simulatorRank,
    player.rankings?.overall,
    player.rankings?.consensus,
  ].filter((rank) => typeof rank === "number");

  for (const rank of candidateRanks) {
    const match = getProspectByRank(rank);
    if (match) return match;
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
    if (match) return match;
  }

  return null;
}

export default resolveProspect;