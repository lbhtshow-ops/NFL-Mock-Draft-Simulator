import { createNFLAvailabilitySignal, NFL_AVAILABILITY_AUTHORITY, NFL_AVAILABILITY_SIGNAL_CLASSES } from "../../signals/NFLAvailabilitySignalContract.js";
export const SPORTRADAR_NFL_DEPTH_CHART_PROVIDER_ID = "sportradar-nfl-v7-depth-charts";
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
function collectPlayers(node, teamAlias, teamId, output = []) {
  if (!node || typeof node !== "object") return output;
  if (Array.isArray(node)) { for (const item of node) collectPlayers(item, teamAlias, teamId, output); return output; }
  const alias = clean(node?.alias || node?.team?.alias || teamAlias)?.toUpperCase() || teamAlias;
  const id = node?.team?.id || node?.id && node?.alias ? node.id : teamId;
  if (Array.isArray(node?.players)) {
    for (const player of node.players) output.push({ team: alias, teamId: id, player, depthPosition: node?.position || node?.name || player?.position, depthRank: player?.depth || player?.rank || player?.depth_rank });
  }
  for (const [key, value] of Object.entries(node)) if (!["players", "team"].includes(key) && value && typeof value === "object") collectPlayers(value, alias, id, output);
  return output;
}
export function adaptSportradarWeeklyDepthChartsPayload(payload, { season, week, gameType = "REG", sourceUrl = null, now = new Date().toISOString() } = {}) {
  const rows = collectPlayers(payload?.teams || payload, null, null, []);
  return rows.flatMap(({ team, teamId, player, depthPosition, depthRank }) => {
    if (!team) return [];
    try { return [createNFLAvailabilitySignal({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART, authority: NFL_AVAILABILITY_AUTHORITY.ROLE, season, week, gameType, team, playerId: player?.id, playerName: player?.name, position: player?.position || depthPosition, observedAt: payload?.generated_at || now, source: SPORTRADAR_NFL_DEPTH_CHART_PROVIDER_ID, sourceUrl, depthPosition, depthRank, starter: Number(depthRank) === 1, providerPlayerId: player?.id, providerTeamId: teamId })]; } catch { return []; }
  });
}
