import {
  createNFLAvailabilitySignal,
  isNFLAvailabilitySignal,
} from "../signals/NFLAvailabilitySignalContract.js";
import {
  resolveNFLMultiSignalAvailability,
} from "../signals/NFLMultiSignalAvailabilityResolver.js";
import {
  NFL_MULTI_SIGNAL_AVAILABILITY_RECORD_TYPE,
} from "./NFLMultiSignalAvailabilityResearchCapture.js";

function primarySubject(observation) {
  return observation?.subjects?.find((subject) => subject.role === "PRIMARY") || null;
}
function teamSubject(observation) {
  return observation?.subjects?.find((subject) => subject.role === "SECONDARY") || null;
}
function parseSnapshot(observation) {
  if (observation?.record?.recordType !== NFL_MULTI_SIGNAL_AVAILABILITY_RECORD_TYPE) return null;
  const raw = observation?.record?.valueText;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function toSignal(observation) {
  const snapshot = parseSnapshot(observation);
  if (!snapshot) return null;
  const player = primarySubject(observation);
  const team = teamSubject(observation);
  try {
    const signal = createNFLAvailabilitySignal({
      signalClass: snapshot.signalClass,
      authority: snapshot.authority,
      season: snapshot.season,
      week: snapshot.week,
      gameType: snapshot.gameType,
      team: snapshot.team || team?.label,
      playerId: snapshot.player?.playerId,
      playerName: snapshot.player?.playerName || player?.label,
      position: snapshot.player?.position,
      observedAt:
        snapshot.effectiveAt ||
        observation?.record?.effectiveAt ||
        observation?.temporal?.occurredAt ||
        observation?.provenance?.recordedAt,
      effectiveAt: snapshot.effectiveAt || observation?.record?.effectiveAt || null,
      source: snapshot.provenance?.source || "research-repository:nfl-multisignal-availability",
      sourceUrl: snapshot.provenance?.sourceUrl || null,
      status: snapshot.availability?.status,
      practiceStatus: snapshot.availability?.practiceStatus,
      injury: snapshot.availability?.injury,
      rosterStatus: snapshot.availability?.rosterStatus,
      transactionType: snapshot.transaction?.type,
      statusBefore: snapshot.transaction?.statusBefore,
      statusAfter: snapshot.transaction?.statusAfter,
      depthPosition: snapshot.role?.depthPosition,
      depthRank: snapshot.role?.depthRank,
      starter: snapshot.role?.starter,
      estimatedReturnDate: snapshot.availability?.estimatedReturnDate,
      providerPlayerId: snapshot.player?.providerPlayerId,
      providerTeamId: snapshot.player?.providerTeamId,
      metadata: {
        ...(snapshot.metadata || {}),
        observationId: observation?.observationId || observation?.observation_id || null,
        researchSourceRefs: observation?.sourceRefs || [],
      },
    });
    return isNFLAvailabilitySignal(signal) ? signal : null;
  } catch {
    return null;
  }
}

export function projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot({
  artifact,
  observations = [],
  season,
  week,
  gameType = "REG",
  team,
} = {}) {
  if (!artifact) {
    return { status: "UNAVAILABLE", reason: "ARTIFACT_REQUIRED", signals: [], resolution: null };
  }
  const refs = new Set(Array.isArray(artifact.recordedObservationRefs) ? artifact.recordedObservationRefs : []);
  const relevant = observations.filter((observation) => {
    const id = observation?.observationId || observation?.observation_id;
    return refs.size === 0 || refs.has(id);
  });
  const signals = relevant.map(toSignal).filter(Boolean).filter((signal) =>
    Number(signal.season) === Number(season) &&
    Number(signal.week) === Number(week) &&
    String(signal.gameType).toUpperCase() === String(gameType).toUpperCase() &&
    String(signal.team).toUpperCase() === String(team).toUpperCase()
  );
  const resolution = resolveNFLMultiSignalAvailability(signals);
  return {
    status: signals.length ? "READY" : "UNAVAILABLE",
    season: Number(season),
    week: Number(week),
    gameType: String(gameType).toUpperCase(),
    team: String(team).toUpperCase(),
    signalCount: signals.length,
    signals,
    resolution,
  };
}

export async function loadNFLCanonicalAvailabilityFromResearchRepository({
  repositoryService,
  season,
  week,
  gameType = "REG",
  team,
} = {}) {
  const snapshot = await repositoryService.readTeamWeek({ season, week, gameType, team });
  if (snapshot?.status !== "SUCCESS") {
    return { status: snapshot?.status || "UNAVAILABLE", signals: [], resolution: null };
  }
  return projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot({
    ...snapshot, season, week, gameType, team,
  });
}

export default {
  projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot,
  loadNFLCanonicalAvailabilityFromResearchRepository,
};
