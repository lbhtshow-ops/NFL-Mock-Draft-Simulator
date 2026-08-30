import {
  createNFLTeamIntelligenceInput,
} from "./NFLTeamIntelligenceInputProjection.js";

import {
  createNFLTeamIntelligenceResult,
  NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
  NFL_TEAM_INTELLIGENCE_STATES,
} from "./NFLTeamIntelligenceResultContract.js";
import { buildNFLTeamStrength } from "./NFLTeamPriorAndStrengthEngine.js";

function rosterEvidence(input) {
  const coverage = input?.roster?.coverage;

  if (!coverage?.available) {
    return null;
  }

  return {
    type: "NFL_ROSTER_COVERAGE",
    playerCount: coverage.playerCount,
    coveredPositionCount:
      coverage.coveredPositionCount,
    expectedPositionCount:
      coverage.expectedPositionCount,
    coveragePercent: coverage.coveragePercent,
  };
}

function teamContextEvidence(input) {
  if (!input?.teamContext) {
    return null;
  }

  return {
    type: "TEAM_CONTEXT",
    competitiveWindow:
      input.teamContext.competitiveWindow || null,
    teamDirection:
      input.teamContext.teamDirection || null,
    rosterStrengths:
      input.teamContext.rosterStrengths || [],
    rosterWeaknesses:
      input.teamContext.rosterWeaknesses || [],
    urgentNeeds:
      input.teamContext.urgentNeeds || [],
  };
}

function determineState(input) {
  if (!input?.teamAbbreviation) {
    return NFL_TEAM_INTELLIGENCE_STATES.UNAVAILABLE;
  }

  if (!input.available) {
    return NFL_TEAM_INTELLIGENCE_STATES.UNKNOWN;
  }

  return input.missingEvidence.length > 0
    ? NFL_TEAM_INTELLIGENCE_STATES.PARTIAL
    : NFL_TEAM_INTELLIGENCE_STATES.AVAILABLE;
}

function calculateEvidenceCompleteness(input) {
  const checks = [
    Boolean(input?.identity?.name),
    Boolean(input?.roster?.coverage?.available),
    Boolean(input?.teamContext),

    typeof input?.performance?.offense
      ?.epaPerPlay === "number",

    typeof input?.performance?.defense
      ?.epaPerPlay === "number",

    typeof input?.performance?.offense
      ?.successRate === "number",

    typeof input?.performance?.defense
      ?.successRate === "number",

    typeof input?.performance
      ?.opponentAdjustedRating === "number",

    Boolean(input?.availability?.quarterbackState),

    Array.isArray(input?.availability?.playerImpact) &&
      input.availability.playerImpact.length > 0,
  ];

  return checks.filter(Boolean).length / checks.length;
}

export function getNFLTeamIntelligenceResult(team, { targetSeason = new Date().getFullYear(), phaseScope = "ALL" } = {}) {
  const input = createNFLTeamIntelligenceInput(team);
  const teamStrength = buildNFLTeamStrength({ team: input.teamAbbreviation, targetSeason, phaseScope });

  const evidence = [
    rosterEvidence(input),
    teamContextEvidence(input),
  ].filter(Boolean);

  const completeness =
    calculateEvidenceCompleteness(input);

  const state = determineState(input);

  const contextualFactors = [];

  if (input?.roster?.coverage?.available) {
    contextualFactors.push(
      `NFL roster coverage is available for ${input.teamAbbreviation}.`
    );
  }

  if (input?.teamContext) {
    contextualFactors.push(
      "Draft-oriented team context is available as contextual evidence but is not promoted to a canonical team-strength score."
    );
  }

  if (
    input?.missingEvidence?.includes(
      "availability.quarterbackState"
    )
  ) {
    contextualFactors.push(
      "Canonical quarterback availability/impact intelligence has not yet been established."
    );
  }

  return createNFLTeamIntelligenceResult({
    teamAbbreviation:
      input.teamAbbreviation || "UNKNOWN",
    state,

    overallStrength: teamStrength.overallStrength,

    components: {
      offense:
        input?.performance?.offense?.index ?? null,
      defense:
        input?.performance?.defense?.index ?? null,
      specialTeams: teamStrength.current?.specialTeamsIndex ?? teamStrength.prior?.specialTeamsIndex ?? null,
      roster: null,
      quarterback: null,
      availability: null,
      recentForm:
        input?.performance?.recentFormIndex ?? null,
      opponentAdjusted:
        input?.performance?.opponentAdjustedIndex ?? null,
    },

    confidence: teamStrength.confidence,
    confidenceKnown: teamStrength.confidenceKnown,
    evidenceCompleteness: completeness,

    summary:
      state === NFL_TEAM_INTELLIGENCE_STATES.UNAVAILABLE
        ? "NFL Team Intelligence cannot resolve a team identifier."
        : teamStrength.overallStrength === null
          ? `NFL Team Intelligence is available for ${input.teamAbbreviation}, but no governed current/prior team-strength evidence is available for the requested season.`
          : `NFL Team Intelligence strength for ${input.teamAbbreviation} is ${teamStrength.overallStrength.toFixed(1)} using ${teamStrength.mode.toLowerCase().replaceAll("_", " ")} performance evidence. Player and quarterback availability are not yet applied.`,

    explanation: {
      positiveFactors: [],
      limitingFactors: [
        "No canonical quarterback/player availability impact provider is active.",
        "Team strength is not a calibrated game win probability.",
        teamStrength.sampleMaturity?.priorRequired ? "Current-season sample still requires prior blending." : "Current-season sample is considered mature for prior-blend purposes.",
      ],
      contextualFactors,
    },

    evidence: [...evidence, { type: "NFL_TEAM_STRENGTH", value: teamStrength }],
    missingEvidence: input.missingEvidence.filter((field) => !["performance.specialTeams","performance.strengthOfSchedule","performance.opponentAdjustedRating"].includes(field)),
    sources: input.sources,

    evaluatedAt: null,
    modelVersion:
      NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
    inputVersion: input.version,
  });
}

export default {
  getNFLTeamIntelligenceResult,
};
