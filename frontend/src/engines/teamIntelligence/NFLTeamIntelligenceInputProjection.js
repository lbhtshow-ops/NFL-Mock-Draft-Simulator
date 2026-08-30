import { getNFLTeamRecord } from "../../data/footballIntelligence/nfl/teams/index.js";
import { buildNFLRosterIntelligence } from "../NFLRosterIntelligenceEngine.js";
import { getTeamContextSummary } from "../TeamContextEngine.js";
import {
  emptyNFLTeamPerformanceEvidenceProvider,
} from "./performance/index.js";
import {
  emptyNFLTeamAvailabilityEvidenceProvider,
} from "./availability/index.js";
import {
  createNFLTeamRosterState,
  createNFLTeamProfile,
} from "./roster/index.js";

export const NFL_TEAM_INTELLIGENCE_INPUT_VERSION =
  "NFL-TEAM-INTELLIGENCE-INPUT-1.3.0";

function normalizeAbbreviation(team) {
  if (typeof team === "string" && team.trim()) {
    return team.trim().toUpperCase();
  }

  if (team && typeof team === "object") {
    const value =
      team.abbreviation ||
      team.teamAbbreviation ||
      team.team ||
      team.code ||
      team.id;

    if (typeof value === "string" && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return null;
}

function getKnownRosterCoverage(rosterIntelligence) {
  const coverage = rosterIntelligence?.coverage || null;

  return {
    available: Boolean(coverage?.hasRosterData),
    playerCount:
      typeof coverage?.playerCount === "number"
        ? coverage.playerCount
        : 0,
    coveredPositionCount:
      typeof coverage?.coveredPositionCount === "number"
        ? coverage.coveredPositionCount
        : 0,
    expectedPositionCount:
      typeof coverage?.expectedPositionCount === "number"
        ? coverage.expectedPositionCount
        : 0,
    coveragePercent:
      typeof coverage?.coveragePercent === "number"
        ? coverage.coveragePercent
        : null,
  };
}

function performanceValue(performance, path) {
  return path.reduce((value, key) => value?.[key], performance);
}

function buildMissingEvidence({
  teamRecord,
  rosterCoverage,
  teamContext,
  performance,
  availability,
}) {
  const missing = [];

  if (!teamRecord) missing.push("team.record");
  if (!rosterCoverage.available) missing.push("team.roster");

  if (!teamContext || teamContext.teamId === "default") {
    missing.push("team.context");
  }

  const performanceChecks = [
    ["performance.offense.epaPerPlay", ["offense", "epaPerPlay"]],
    ["performance.defense.epaPerPlay", ["defense", "epaPerPlay"]],
    ["performance.offense.successRate", ["offense", "successRate"]],
    ["performance.defense.successRate", ["defense", "successRate"]],
    ["performance.specialTeams", ["specialTeams", "epaPerPlay"]],
    ["performance.strengthOfSchedule", ["strengthOfSchedule"]],
    ["performance.opponentAdjustedRating", ["opponentAdjustedRating"]],
    ["performance.recentForm", ["recentForm", "epaPerPlay"]],
  ];

  performanceChecks.forEach(([field, path]) => {
    if (typeof performanceValue(performance, path) !== "number") {
      missing.push(field);
    }
  });

  if (!Array.isArray(availability?.players) || availability.players.length === 0) {
    missing.push("availability.playerImpact");
  }
  if (!availability?.quarterbackState) {
    missing.push("availability.quarterbackState");
  }

  return missing;
}

function performanceSource(performance) {
  if (!performance?.available) return null;

  return {
    domain: "NFL_TEAM_PERFORMANCE",
    source: performance.provenance?.provider || "UNKNOWN",
    dataset: performance.provenance?.dataset || null,
    datasetVersion: performance.provenance?.datasetVersion || null,
    observedThrough: performance.freshness?.observedThrough || null,
    retrievedAt: performance.freshness?.retrievedAt || null,
    sourceRefs: performance.provenance?.sourceRefs || [],
  };
}

function availabilitySource(availability) {
  if (!availability?.available) return null;
  return {
    domain: "NFL_PLAYER_AVAILABILITY",
    source: availability.provenance?.provider || "CANONICAL_FIE_PLAYER_AVAILABILITY",
    snapshotId: availability.provenance?.snapshotId || null,
    revision: availability.provenance?.revision ?? null,
    asOf: availability.freshness?.asOf || availability.provenance?.asOf || null,
    retrievedAt: availability.freshness?.retrievedAt || null,
    sourceRefs: availability.sourceRefs || [],
  };
}

export function createNFLTeamIntelligenceInput(
  team,
  {
    season = null,
    throughWeek = null,
    performanceProvider = emptyNFLTeamPerformanceEvidenceProvider,
    availabilityProvider = emptyNFLTeamAvailabilityEvidenceProvider,
  } = {}
) {
  const teamAbbreviation = normalizeAbbreviation(team);

  if (!teamAbbreviation) {
    return {
      contract: "NFLTeamIntelligenceInput",
      version: NFL_TEAM_INTELLIGENCE_INPUT_VERSION,
      available: false,
      teamAbbreviation: null,
      identity: null,
      roster: null,
      teamContext: null,
      performance: null,
      availability: null,
      missingEvidence: ["team.abbreviation"],
      sources: [],
    };
  }

  const teamRecord = getNFLTeamRecord(teamAbbreviation);
  const rosterIntelligence =
    buildNFLRosterIntelligence(teamAbbreviation);
  const teamContext =
    getTeamContextSummary(teamAbbreviation);
  const rosterCoverage =
    getKnownRosterCoverage(rosterIntelligence);

  const performance =
    performanceProvider?.resolve?.(teamAbbreviation, {
      season,
      throughWeek,
    }) || null;

  const availability =
    availabilityProvider?.resolve?.(teamAbbreviation, {
      season,
      throughWeek,
      roster: rosterIntelligence?.roster || [],
    }) || null;

  const sources = [];

  if (teamRecord?.metadata?.source) {
    sources.push({
      domain: "TEAM_RECORD",
      source: teamRecord.metadata.source,
      lastUpdated: teamRecord.metadata.lastUpdated || null,
    });
  }

  if (rosterCoverage.available) {
    sources.push({
      domain: "NFL_ROSTER",
      source:
        rosterIntelligence?.metadata?.source ||
        "LBHT NFL Roster Intelligence",
      lastUpdated: null,
    });
  }

  if (teamContext && teamContext.teamId !== "default") {
    sources.push({
      domain: "TEAM_CONTEXT",
      source: "LBHT Team Context",
      lastUpdated: teamContext.lastUpdated || null,
    });
  }

  const resolvedPerformanceSource = performanceSource(performance);
  if (resolvedPerformanceSource) {
    sources.push(resolvedPerformanceSource);
  }

  const resolvedAvailabilitySource = availabilitySource(availability);
  if (resolvedAvailabilitySource) {
    sources.push(resolvedAvailabilitySource);
  }

  const projectedPerformance = performance
    ? {
        contract: performance.contract,
        contractVersion: performance.contractVersion,
        season: performance.season,
        throughWeek: performance.throughWeek,
        sample: performance.sample,
        offense: performance.offense,
        defense: performance.defense,
        specialTeams: performance.specialTeams,
        strengthOfSchedule: performance.strengthOfSchedule,
        opponentAdjustedRating: performance.opponentAdjustedRating,
        recentForm: performance.recentForm,
        confidence: performance.confidence,
        confidenceKnown: performance.confidenceKnown,
        evidenceLevel: performance.evidenceLevel,
        freshness: performance.freshness,
        provenance: performance.provenance,
        metricCount: performance.metricCount,
        available: performance.available,
      }
    : {
        offense: {
          epaPerPlay: null,
          successRate: null,
          pointsPerDrive: null,
        },
        defense: {
          epaPerPlay: null,
          successRate: null,
          pointsPerDrive: null,
        },
        specialTeams: { epaPerPlay: null },
        strengthOfSchedule: null,
        opponentAdjustedRating: null,
        recentForm: null,
        confidence: null,
        confidenceKnown: false,
        evidenceLevel: null,
        freshness: null,
        provenance: null,
        metricCount: 0,
        available: false,
      };

  const projectedAvailability = availability?.available
    ? {
        contract: availability.contract,
        contractVersion: availability.contractVersion,
        available: true,
        playerCount: availability.playerCount,
        players: availability.players,
        playerImpact: availability.players,
        quarterbackState: availability.quarterbackState,
        statusCounts: availability.statusCounts,
        modeledImpactCount: availability.modeledImpactCount,
        unmodeledImpactCount: availability.unmodeledImpactCount,
        freshness: availability.freshness,
        provenance: availability.provenance,
        sourceRefs: availability.sourceRefs,
        injuryReportRefs: availability.sourceRefs,
      }
    : {
        available: false,
        playerCount: 0,
        players: [],
        playerImpact: [],
        quarterbackState: null,
        statusCounts: {},
        modeledImpactCount: 0,
        unmodeledImpactCount: 0,
        freshness: null,
        provenance: null,
        sourceRefs: [],
        injuryReportRefs: [],
      };

  const rosterState = createNFLTeamRosterState({
    teamAbbreviation,
    roster: rosterIntelligence?.roster || [],
    availabilityEvidence: projectedAvailability,
    source: rosterIntelligence?.metadata || null,
  });

  const teamProfile = createNFLTeamProfile({
    teamAbbreviation,
    rosterState,
    performance: projectedPerformance,
    teamContext:
      teamContext && teamContext.teamId !== "default" ? teamContext : null,
    availability: projectedAvailability,
  });

  return {
    contract: "NFLTeamIntelligenceInput",
    version: NFL_TEAM_INTELLIGENCE_INPUT_VERSION,
    available: Boolean(
      teamRecord ||
        rosterCoverage.available ||
        (teamContext && teamContext.teamId !== "default") ||
        projectedPerformance.available ||
        Boolean(availability?.available)
    ),

    teamAbbreviation,

    identity: teamRecord
      ? {
          teamId: teamRecord.teamId || null,
          abbreviation:
            teamRecord.abbreviation || teamAbbreviation,
          name: teamRecord.name || null,
          city: teamRecord.city || null,
          conference: teamRecord.conference || null,
          division: teamRecord.division || null,
        }
      : {
          teamId: null,
          abbreviation: teamAbbreviation,
          name: null,
          city: null,
          conference: null,
          division: null,
        },

    roster: {
      coverage: rosterCoverage,
      positionGroups:
        rosterIntelligence?.positionGroups || {},
      rawPlayerCount:
        Array.isArray(rosterIntelligence?.roster)
          ? rosterIntelligence.roster.length
          : 0,
    },

    teamContext:
      teamContext && teamContext.teamId !== "default"
        ? teamContext
        : null,

    performance: projectedPerformance,

    availability: projectedAvailability,

    rosterState,
    teamProfile,

    missingEvidence: buildMissingEvidence({
      teamRecord,
      rosterCoverage,
      teamContext,
      performance: projectedPerformance,
      availability,
    }),

    sources,
  };
}

export default {
  NFL_TEAM_INTELLIGENCE_INPUT_VERSION,
  createNFLTeamIntelligenceInput,
};
