import {
  createNFLPlayerAvailabilityEvidence,
} from "../NFLPlayerAvailabilityEvidenceContract.js";

import {
  NFL_AVAILABILITY_FRESHNESS_POLICY,
} from "../NFLAvailabilityAcquisitionRuntime.js";

import {
  NFL_AVAILABILITY_RESEARCH_FIELDS,
  NFL_AVAILABILITY_RESEARCH_RECORD_TYPE,
} from "./NFLAvailabilityResearchContracts.js";

function hoursBetween(newer, older) {
  const a = new Date(newer);
  const b = new Date(older);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.max(0, (a.getTime() - b.getTime()) / 3_600_000);
}

function latestTimestamp(observations = [], artifact = null) {
  const values = [
    ...observations.map((item) => item?.record?.effectiveAt || item?.temporal?.occurredAt),
    artifact?.provenance?.updatedAt,
  ]
    .filter((value) => value && !Number.isNaN(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a));

  return values[0] || null;
}

function freshnessFor({ latestAt, now }) {
  if (!latestAt) return "UNAVAILABLE";
  const ageHours = hoursBetween(now, latestAt);
  if (ageHours === null) return "UNAVAILABLE";
  if (ageHours <= NFL_AVAILABILITY_FRESHNESS_POLICY.freshHours) return "FRESH";
  if (ageHours <= NFL_AVAILABILITY_FRESHNESS_POLICY.agingHours) return "AGING";
  return "STALE";
}

function primarySubject(observation) {
  return observation?.subjects?.find((subject) => subject.role === "PRIMARY") || null;
}

function teamSubject(observation) {
  return observation?.subjects?.find((subject) => subject.role === "SECONDARY") || null;
}

export function projectNFLAvailabilityEvidenceFromResearchSnapshot({
  artifact,
  source,
  observations = [],
  season,
  week,
  team,
  gameType = "REG",
  now = new Date().toISOString(),
} = {}) {
  const relevant = observations.filter(
    (item) => item?.record?.recordType === NFL_AVAILABILITY_RESEARCH_RECORD_TYPE
  );
  const latestAt = latestTimestamp(relevant, artifact);
  const freshness = freshnessFor({ latestAt, now });

  if (!artifact || relevant.length === 0) {
    return {
      status: "UNAVAILABLE",
      freshness: "UNAVAILABLE",
      latestAt,
      records: [],
    };
  }

  if (freshness === "STALE") {
    return {
      status: "STALE",
      freshness,
      latestAt,
      records: [],
    };
  }

  const players = new Map();

  for (const observation of relevant) {
    const player = primarySubject(observation);
    if (!player?.subjectRef) continue;
    const existing = players.get(player.subjectRef) || {
      playerRef: player.subjectRef,
      playerName: player.label || null,
      team: teamSubject(observation)?.label || team,
      values: {},
      modifiedAt: null,
    };

    existing.values[observation.record.field] = observation.record.valueText ?? observation.record.value ?? null;
    const effectiveAt = observation.record.effectiveAt || observation.temporal?.occurredAt || null;
    if (effectiveAt && (!existing.modifiedAt || Date.parse(effectiveAt) > Date.parse(existing.modifiedAt))) {
      existing.modifiedAt = effectiveAt;
    }
    players.set(player.subjectRef, existing);
  }

  const sourceUrl =
    artifact?.metadata?.externalRefs?.find((value) => /^https?:\/\//i.test(value)) ||
    source?.access?.location ||
    null;

  const records = [...players.values()]
    .filter((player) =>
      player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.REPORT_STATUS] ||
      player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.PRACTICE_STATUS]
    )
    .map((player) =>
      createNFLPlayerAvailabilityEvidence({
        season,
        week,
        gameType,
        team: player.team || team,
        playerId: player.playerRef,
        playerName: player.playerName,
        position: player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.POSITION] || null,
        primaryInjury: player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.PRIMARY_INJURY] || null,
        secondaryInjury: player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.SECONDARY_INJURY] || null,
        reportStatus: player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.REPORT_STATUS] || null,
        practiceStatus: player.values[NFL_AVAILABILITY_RESEARCH_FIELDS.PRACTICE_STATUS] || null,
        modifiedAt: player.modifiedAt,
        source: "research-repository:nfl-availability",
        sourceUrl,
      })
    );

  return {
    status: records.length ? "READY" : "UNAVAILABLE",
    freshness,
    latestAt,
    records,
  };
}

export async function loadNFLAvailabilityEvidenceFromResearchRepository({
  repositoryService,
  season,
  week,
  team,
  gameType = "REG",
  now = new Date().toISOString(),
} = {}) {
  const snapshot = await repositoryService.readTeamWeek({ season, week, team });

  if (snapshot.status !== "SUCCESS") {
    return {
      status: snapshot.status,
      freshness: "UNAVAILABLE",
      latestAt: null,
      records: [],
    };
  }

  return projectNFLAvailabilityEvidenceFromResearchSnapshot({
    ...snapshot,
    season,
    week,
    team,
    gameType,
    now,
  });
}

export default {
  projectNFLAvailabilityEvidenceFromResearchSnapshot,
  loadNFLAvailabilityEvidenceFromResearchRepository,
};
