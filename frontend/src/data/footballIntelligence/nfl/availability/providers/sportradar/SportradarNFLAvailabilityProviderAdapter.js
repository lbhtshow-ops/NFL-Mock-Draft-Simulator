import { createNFLPlayerAvailabilityEvidence } from "../../NFLPlayerAvailabilityEvidenceContract.js";

export const SPORTRADAR_NFL_AVAILABILITY_PROVIDER_ID = "sportradar-nfl-v7";
export const SPORTRADAR_NFL_V7_BASE_URL = "https://api.sportradar.com/nfl/official/trial/v7/en";

function text(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function teamCode(team) { return text(team?.alias || team?.abbr || team?.abbreviation || team?.market)?.toUpperCase() || null; }
function injuryName(injury) { return text(injury?.primary || injury?.name || injury?.description || injury?.comment); }
function practiceStatus(injury, player) {
  return text(
    injury?.practice?.status || injury?.practice_status || injury?.practiceStatus ||
    player?.practice?.status || player?.practice_status || player?.practiceStatus
  );
}
function reportStatus(injury, player) {
  return text(
    injury?.status || injury?.injury_status || injury?.game_status || injury?.gameStatus ||
    player?.status || player?.injury_status || player?.game_status || player?.gameStatus
  );
}
function sourceModifiedAt(injury, player, payload) {
  return text(
    injury?.status_date || injury?.statusDate || injury?.updated || injury?.updated_at ||
    player?.status_date || player?.statusDate || player?.updated || player?.updated_at ||
    payload?.generated_at || payload?.generatedAt
  );
}
function sourceTemporalField(injury, player, payload) {
  if (text(injury?.status_date)) return "injuries[].status_date";
  if (text(injury?.statusDate)) return "injuries[].statusDate";
  if (text(injury?.updated)) return "injuries[].updated";
  if (text(injury?.updated_at)) return "injuries[].updated_at";
  if (text(player?.status_date)) return "player.status_date";
  if (text(player?.statusDate)) return "player.statusDate";
  if (text(player?.updated)) return "player.updated";
  if (text(player?.updated_at)) return "player.updated_at";
  if (text(payload?.generated_at)) return "payload.generated_at";
  if (text(payload?.generatedAt)) return "payload.generatedAt";
  return null;
}

export function adaptSportradarWeeklyInjuriesPayload(payload, { season, week, gameType = "REG", sourceUrl = null, now = new Date().toISOString() } = {}) {
  const records = [];
  for (const team of payload?.teams || []) {
    const teamAbbreviation = teamCode(team);
    if (!teamAbbreviation) continue;
    for (const player of team?.players || []) {
      const injuries = Array.isArray(player?.injuries) ? player.injuries : [];
      const primary = injuries.find((x) => x?.primary === true) || injuries[0] || null;
      const providerModifiedAt = sourceModifiedAt(primary, player, payload);
      const temporalField = sourceTemporalField(primary, player, payload);
      try {
        const evidence = createNFLPlayerAvailabilityEvidence({
          season, week, gameType, team: teamAbbreviation,
          playerId: text(player?.id || player?.sr_id || player?.reference),
          playerName: text(player?.name || player?.full_name || player?.fullName),
          position: text(player?.position), primaryInjury: injuryName(primary),
          secondaryInjury: injuryName(injuries[1]), reportStatus: reportStatus(primary, player),
          practiceStatus: practiceStatus(primary, player), modifiedAt: providerModifiedAt,
          source: SPORTRADAR_NFL_AVAILABILITY_PROVIDER_ID, sourceUrl,
        });
        evidence.provenance.providerPlayerId = text(player?.id);
        evidence.provenance.providerTeamId = text(team?.id);
        evidence.provenance.estimatedReturnDate = text(player?.estimated_return_date || player?.estimatedReturnDate);
        evidence.provenance.sourceTemporalField = temporalField;
        evidence.provenance.sourceTemporalClassification = providerModifiedAt ? "PROVIDER_SOURCE_TIME" : "UNAVAILABLE";
        records.push(evidence);
      } catch { /* malformed provider rows fail closed */ }
    }
  }
  return records;
}

export function createSportradarNFLAvailabilityProviderAdapter({ apiKey = process.env.SPORTRADAR_NFL_API_KEY, accessLevel = process.env.SPORTRADAR_NFL_ACCESS_LEVEL || "trial", baseUrl = null, fetchImpl = globalThis.fetch } = {}) {
  return {
    id: SPORTRADAR_NFL_AVAILABILITY_PROVIDER_ID,
    async acquire({ season, week, gameType = "REG", now = new Date().toISOString() } = {}) {
      if (!apiKey) return { available: false, reason: "SPORTRADAR_API_KEY_MISSING" };
      if (!Number.isInteger(Number(season)) || !Number.isInteger(Number(week))) return { available: false, reason: "SEASON_WEEK_REQUIRED" };
      if (typeof fetchImpl !== "function") return { available: false, reason: "FETCH_UNAVAILABLE" };
      const root = baseUrl || `https://api.sportradar.com/nfl/official/${accessLevel}/v7/en`;
      const sourceUrl = `${root}/seasons/${Number(season)}/${String(gameType || "REG").toUpperCase()}/${Number(week)}/injuries.json`;
      const response = await fetchImpl(sourceUrl, { headers: { accept: "application/json", "x-api-key": apiKey } });
      if (!response.ok) throw new Error(`SPORTRADAR_HTTP_${response.status}`);
      const payload = await response.json();
      const records = adaptSportradarWeeklyInjuriesPayload(payload, { season: Number(season), week: Number(week), gameType, sourceUrl, now });
      const sourceObservedAt = text(payload?.generated_at || payload?.generatedAt) || records.map((r) => r.provenance.modifiedAt).filter(Boolean).sort().at(-1) || null;
      const acquiredAt = text(now);
      const observedAt = sourceObservedAt || acquiredAt;
      const provenance = {
        provider: SPORTRADAR_NFL_AVAILABILITY_PROVIDER_ID,
        accessLevel,
        sourceObservedAt,
        acquiredAt,
        observedAtClassification: sourceObservedAt ? "PROVIDER_SOURCE_TIME" : "ACQUISITION_TIME_FALLBACK",
      };
      if (!records.length) return { available: false, reason: "SPORTRADAR_NO_CANONICAL_RECORDS", observedAt, sourceUrl, provenance };
      return { available: true, observedAt, sourceUrl, records, provenance: { ...provenance, contract: "NFLPlayerAvailabilityEvidence", recordCount: records.length } };
    },
  };
}
