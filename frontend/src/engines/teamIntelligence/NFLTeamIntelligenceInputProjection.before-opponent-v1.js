import { getNFLTeamRecord } from "../../data/footballIntelligence/nfl/teams/index.js";
import { buildNFLRosterIntelligence } from "../NFLRosterIntelligenceEngine.js";
import { getTeamContextSummary } from "../TeamContextEngine.js";

export const NFL_TEAM_INTELLIGENCE_INPUT_VERSION =
  "NFL-TEAM-INTELLIGENCE-INPUT-1.0.0";

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

function buildMissingEvidence({
  teamRecord,
  rosterCoverage,
  teamContext,
}) {
  const missing = [];

  if (!teamRecord) missing.push("team.record");
  if (!rosterCoverage.available) missing.push("team.roster");

  if (!teamContext || teamContext.teamId === "default") {
    missing.push("team.context");
  }

  [
    "performance.offense.epaPerPlay",
    "performance.defense.epaPerPlay",
    "performance.offense.successRate",
    "performance.defense.successRate",
    "performance.specialTeams",
    "performance.strengthOfSchedule",
    "performance.opponentAdjustedRating",
    "performance.recentForm",
    "availability.playerImpact",
    "availability.quarterbackState",
  ].forEach((field) => missing.push(field));

  return missing;
}

export function createNFLTeamIntelligenceInput(team) {
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

  return {
    contract: "NFLTeamIntelligenceInput",
    version: NFL_TEAM_INTELLIGENCE_INPUT_VERSION,
    available: Boolean(
      teamRecord ||
        rosterCoverage.available ||
        (teamContext && teamContext.teamId !== "default")
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

    performance: {
      offense: {
        epaPerPlay: null,
        successRate: null,
      },
      defense: {
        epaPerPlay: null,
        successRate: null,
      },
      specialTeams: null,
      strengthOfSchedule: null,
      opponentAdjustedRating: null,
      recentForm: null,
    },

    availability: {
      quarterbackState: null,
      playerImpact: [],
      injuryReportRefs: [],
    },

    missingEvidence: buildMissingEvidence({
      teamRecord,
      rosterCoverage,
      teamContext,
    }),

    sources,
  };
}

export default {
  NFL_TEAM_INTELLIGENCE_INPUT_VERSION,
  createNFLTeamIntelligenceInput,
};
