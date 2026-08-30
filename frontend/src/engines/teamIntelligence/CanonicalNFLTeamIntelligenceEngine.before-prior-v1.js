import {
  createNFLTeamIntelligenceInput,
} from "./NFLTeamIntelligenceInputProjection.js";

import {
  createNFLTeamIntelligenceResult,
  NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
  NFL_TEAM_INTELLIGENCE_STATES,
} from "./NFLTeamIntelligenceResultContract.js";

function rosterEvidence(input) {
  const coverage = input?.roster?.coverage;

  if (!coverage?.available) return null;

  return {
    type: "NFL_ROSTER_COVERAGE",
    playerCount: coverage.playerCount,
    coveredPositionCount: coverage.coveredPositionCount,
    expectedPositionCount: coverage.expectedPositionCount,
    coveragePercent: coverage.coveragePercent,
  };
}

function teamContextEvidence(input) {
  if (!input?.teamContext) return null;

  return {
    type: "TEAM_CONTEXT",
    competitiveWindow: input.teamContext.competitiveWindow || null,
    teamDirection: input.teamContext.teamDirection || null,
    rosterStrengths: input.teamContext.rosterStrengths || [],
    rosterWeaknesses: input.teamContext.rosterWeaknesses || [],
    urgentNeeds: input.teamContext.urgentNeeds || [],
  };
}

function performanceEvidence(input) {
  const performance = input?.performance;
  if (!performance?.available) return null;

  return {
    type: "NFL_TEAM_PERFORMANCE",
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
    typeof input?.performance?.offense?.epaPerPlay === "number",
    typeof input?.performance?.defense?.epaPerPlay === "number",
    typeof input?.performance?.offense?.successRate === "number",
    typeof input?.performance?.defense?.successRate === "number",
    typeof input?.performance?.opponentAdjustedRating === "number",
    Boolean(input?.availability?.quarterbackState),
    Array.isArray(input?.availability?.playerImpact) &&
      input.availability.playerImpact.length > 0,
  ];

  return checks.filter(Boolean).length / checks.length;
}

export function getNFLTeamIntelligenceResult(team, options = {}) {
  const input = createNFLTeamIntelligenceInput(team, options);

  const evidence = [
    rosterEvidence(input),
    teamContextEvidence(input),
    performanceEvidence(input),
  ].filter(Boolean);

  const completeness = calculateEvidenceCompleteness(input);
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

  if (input?.performance?.available) {
    contextualFactors.push(
      "Governed NFL team-performance evidence is connected and available to downstream scoring models."
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
    teamAbbreviation: input.teamAbbreviation || "UNKNOWN",
    state,

    // Sprint 2 establishes governed performance evidence, not the
    // predictive scoring model. Raw evidence must not be silently
    // converted into canonical team-strength scores.
    overallStrength: null,

    components: {
      offense: null,
      defense: null,
      specialTeams: null,
      roster: null,
      quarterback: null,
      availability: null,
      recentForm: null,
      opponentAdjusted: null,
    },

    confidence: null,
    confidenceKnown: false,
    evidenceCompleteness: completeness,

    summary:
      state === NFL_TEAM_INTELLIGENCE_STATES.UNAVAILABLE
        ? "NFL Team Intelligence cannot resolve a team identifier."
        : input?.performance?.available
          ? `NFL Team Intelligence performance evidence is available for ${input.teamAbbreviation}; canonical team-strength scoring remains intentionally unmodeled until a governed scoring model is authorized.`
          : `NFL Team Intelligence foundation is available for ${input.teamAbbreviation}, but governed team-performance evidence has not been supplied to the service boundary.`,

    explanation: {
      positiveFactors: [],
      limitingFactors: [
        "No approved canonical NFL team-strength scoring model is active.",
        "No canonical quarterback/player availability impact provider is active.",
      ],
      contextualFactors,
    },

    evidence,
    missingEvidence: input.missingEvidence,
    sources: input.sources,

    evaluatedAt: null,
    modelVersion: NFL_TEAM_INTELLIGENCE_MODEL_VERSION,
    inputVersion: input.version,
  });
}

export default {
  getNFLTeamIntelligenceResult,
};
