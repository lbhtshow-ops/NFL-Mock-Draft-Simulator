import { createNFLAvailabilitySignal, NFL_AVAILABILITY_AUTHORITY, NFL_AVAILABILITY_SIGNAL_CLASSES } from "../../signals/NFLAvailabilitySignalContract.js";
export const SPORTRADAR_NFL_ROSTER_PROVIDER_ID = "sportradar-nfl-v7-roster";
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
export function adaptSportradarTeamRosterPayload(payload, { season, week, gameType = "REG", sourceUrl = null, now = new Date().toISOString() } = {}) {
  const team = payload?.team || payload || {};
  const alias = clean(team?.alias || payload?.alias)?.toUpperCase();
  const players = Array.isArray(payload?.players) ? payload.players : Array.isArray(team?.players) ? team.players : [];
  if (!alias) return [];
  return players.flatMap((player) => {
    try { return [createNFLAvailabilitySignal({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS, authority: NFL_AVAILABILITY_AUTHORITY.ROSTER, season, week, gameType, team: alias, playerId: player?.id, playerName: player?.name, position: player?.position, observedAt: player?.updated || payload?.generated_at || now, source: SPORTRADAR_NFL_ROSTER_PROVIDER_ID, sourceUrl, rosterStatus: player?.status, providerPlayerId: player?.id, providerTeamId: team?.id || payload?.id })]; } catch { return []; }
  });
}
