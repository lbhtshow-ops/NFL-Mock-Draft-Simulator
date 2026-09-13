import { acquireNFLVerseCurrentRosterDepthSignals } from "./publicTeamScopedAvailabilityAcquisition.mjs";
import { resolveNFLMultiSignalAvailability } from "../../src/data/footballIntelligence/nfl/availability/signals/NFLMultiSignalAvailabilityResolver.js";

const CACHE = new Map();
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
const upper = (v) => clean(v)?.toUpperCase() || null;
const intOrNull = (v) => v === null || v === undefined || v === "" ? null : (Number.isInteger(Number(v)) ? Number(v) : null);

function normalizeResolvedPlayer(player = {}) {
  return Object.freeze({
    playerId: clean(player?.player?.playerId),
    displayName: clean(player?.player?.playerName),
    position: upper(player?.player?.position),
    officialDesignation: upper(player?.officialDesignation),
    practiceStatus: upper(player?.practiceStatus),
    injury: clean(player?.injury),
    rosterStatus: upper(player?.rosterStatus),
    availabilityStatus: upper(player?.availabilityStatus || player?.canonicalAvailabilityStatus),
    inferredAvailabilityOnly: Boolean(player?.inferredAvailabilityOnly),
    role: player?.role ? Object.freeze({
      depthPosition: upper(player.role.depthPosition),
      depthRank: intOrNull(player.role.depthRank),
      starter: player.role.starter === true,
      formation: clean(player.role.formation),
    }) : null,
  });
}

function buildDepthChart(players = []) {
  const positions = {};
  for (const player of players) {
    const position = upper(player?.role?.depthPosition || player?.position);
    const rank = intOrNull(player?.role?.depthRank);
    if (!position || rank === null) continue;
    (positions[position] ||= []).push(Object.freeze({
      playerId: player.playerId,
      displayName: player.displayName,
      position: player.position,
      depthPosition: position,
      depthRank: rank,
      starter: player?.role?.starter === true || rank === 1,
      officialDesignation: player.officialDesignation,
      practiceStatus: player.practiceStatus,
      injury: player.injury,
      rosterStatus: player.rosterStatus,
      availabilityStatus: player.availabilityStatus,
      inferredAvailabilityOnly: player.inferredAvailabilityOnly,
    }));
  }
  for (const [position, list] of Object.entries(positions)) {
    positions[position] = Object.freeze([...list].sort((a,b) =>
      (a.depthRank ?? 999) - (b.depthRank ?? 999) ||
      String(a.displayName || "").localeCompare(String(b.displayName || ""))
    ));
  }
  return Object.freeze({ available: Object.keys(positions).length > 0, positions: Object.freeze(positions) });
}

function buildAvailability(players = []) {
  const affectedPlayers = players.filter((p) =>
    Boolean(
      p.officialDesignation || p.practiceStatus || p.injury ||
      (p.rosterStatus && !["ACT","ACTIVE"].includes(p.rosterStatus)) ||
      (p.availabilityStatus && !["AVAILABLE","ACTIVE"].includes(p.availabilityStatus))
    )
  ).map((p) => Object.freeze({
    playerId: p.playerId,
    displayName: p.displayName,
    position: p.position,
    officialDesignation: p.officialDesignation,
    practiceStatus: p.practiceStatus,
    injury: p.injury,
    rosterStatus: p.rosterStatus,
    availabilityStatus: p.availabilityStatus,
    inferredAvailabilityOnly: p.inferredAvailabilityOnly,
  }));
  return Object.freeze({
    available: affectedPlayers.length > 0,
    affectedPlayerCount: affectedPlayers.length,
    affectedPlayers: Object.freeze(affectedPlayers),
    legend: Object.freeze({
      Q: "Questionable", D: "Doubtful", OUT: "Out",
      IR: "Injured Reserve", PUP: "Physically Unable to Perform", SUS: "Suspended",
    }),
  });
}

async function loadResolvedTeamAvailability({
  team,
  season = 2026,
  week = Number(process.env.FIE_PUBLIC_NFL_WEEK || 1),
  gameType = process.env.FIE_PUBLIC_NFL_GAME_TYPE || "REG",
  ttlMs = Number(process.env.FIE_PUBLIC_TEAM_CACHE_TTL_MS || DEFAULT_TTL_MS),
} = {}) {
  const normalizedTeam = upper(team);
  const normalizedGameType = upper(gameType) || "REG";
  const normalizedWeek = Number(week);
  if (!normalizedTeam) throw new Error("team is required.");
  if (!Number.isInteger(normalizedWeek)) throw new Error("integer week is required.");

  const key = `${season}|${normalizedWeek}|${normalizedGameType}|${normalizedTeam}`;
  const cached = CACHE.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const acquired = await acquireNFLVerseCurrentRosterDepthSignals({
    season: Number(season), week: normalizedWeek, gameType: normalizedGameType, team: normalizedTeam,
  });
  const resolution = resolveNFLMultiSignalAvailability(acquired.signals || []);
  const players = Object.freeze((Array.isArray(resolution?.players) ? resolution.players : [])
    .map(normalizeResolvedPlayer).filter((p) => p.displayName));

  const value = Object.freeze({
    team: normalizedTeam, season: Number(season), week: normalizedWeek, gameType: normalizedGameType,
    depthChart: buildDepthChart(players),
    availability: buildAvailability(players),
    provenance: Object.freeze({
      provider: "nflverse",
      depthSource: acquired?.depth?.sourceUrl || null,
      rosterSource: acquired?.roster?.sourceUrl || null,
      depthSnapshotAt: acquired?.depth?.latestTimestamp || null,
      cachedForMs: ttlMs,
    }),
  });
  CACHE.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

function mergeRosterStatus(baseRoster = {}, availability = {}) {
  const affected = Array.isArray(availability?.affectedPlayers) ? availability.affectedPlayers : [];
  const byId = new Map(), byName = new Map();
  for (const p of affected) {
    if (p.playerId) byId.set(String(p.playerId), p);
    if (p.displayName) byName.set(String(p.displayName).toLowerCase(), p);
  }
  const basePlayers = Array.isArray(baseRoster?.players) ? baseRoster.players : [];
  const players = basePlayers.map((p) => {
    const match = (p.playerId && byId.get(String(p.playerId))) ||
      (p.displayName && byName.get(String(p.displayName).toLowerCase())) || null;
    if (!match) return p;
    return Object.freeze({ ...p, availability: Object.freeze({
      officialDesignation: match.officialDesignation,
      practiceStatus: match.practiceStatus,
      injury: match.injury,
      rosterStatus: match.rosterStatus,
      availabilityStatus: match.availabilityStatus,
      inferredAvailabilityOnly: match.inferredAvailabilityOnly,
    })});
  });
  return Object.freeze({ ...baseRoster, players: Object.freeze(players) });
}

export async function enrichPublicTeamDepthAvailability(bundle, { team = bundle?.team, season = bundle?.season || 2026 } = {}) {
  if (!bundle || !team) return bundle;
  try {
    const live = await loadResolvedTeamAvailability({ team, season });
    return Object.freeze({
      ...bundle,
      roster: mergeRosterStatus(bundle.roster, live.availability),
      depthChart: live.depthChart.available ? live.depthChart : bundle.depthChart,
      availability: live.availability,
      provenance: Object.freeze({
        ...(bundle.provenance || {}),
        liveDepthProvider: live.provenance.provider,
        liveDepthSource: live.provenance.depthSource,
        liveRosterSource: live.provenance.rosterSource,
        liveDepthSnapshotAt: live.provenance.depthSnapshotAt,
      }),
    });
  } catch {
    return Object.freeze({
      ...bundle,
      availability: Object.freeze({
        available: false, affectedPlayerCount: 0, affectedPlayers: Object.freeze([]),
        legend: Object.freeze({
          Q: "Questionable", D: "Doubtful", OUT: "Out",
          IR: "Injured Reserve", PUP: "Physically Unable to Perform", SUS: "Suspended",
        }),
        error: "LIVE_AVAILABILITY_UNAVAILABLE",
      }),
    });
  }
}

export default { enrichPublicTeamDepthAvailability };
