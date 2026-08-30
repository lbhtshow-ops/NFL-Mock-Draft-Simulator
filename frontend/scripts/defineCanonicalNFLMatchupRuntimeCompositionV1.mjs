#!/usr/bin/env node

const SPRINT = "2.19-RC3";

const composition = Object.freeze({
  contractVersion: "FIE-NFL-MATCHUP-RUNTIME-COMPOSITION-V1-0.1.0",
  status: "COMPOSITION_DESIGN_FIXTURE_GATE_ONLY",
  owner: "CANONICAL_FIE",
  inputBoundary: "CANONICAL_MATCHUP_INTELLIGENCE_V1_CONTRACT",
  stages: [
    {
      order: 1,
      id: "TEAM_CONTEXT",
      consumes: ["homeTeam", "awayTeam", "season", "week"],
      delegatesTo: "NFLTeamPriorAndStrengthEngine",
      recomputesCanonicalLogic: false
    },
    {
      order: 2,
      id: "PERFORMANCE_EVIDENCE",
      consumes: ["homeTeam", "awayTeam", "season", "week"],
      delegatesTo: "NFLTeamPerformanceEvidenceRegistry",
      recomputesCanonicalLogic: false
    },
    {
      order: 3,
      id: "OPPONENT_ADJUSTMENT",
      consumes: ["performanceEvidence"],
      delegatesTo: "NFLOpponentAdjustmentEngine",
      recomputesCanonicalLogic: false
    },
    {
      order: 4,
      id: "DEPENDENCY_CONTEXT",
      consumes: ["homeTeam", "awayTeam", "season", "week"],
      delegatesTo: "NFLPlayerTeamDependencyIntelligence",
      recomputesCanonicalLogic: false
    },
    {
      order: 5,
      id: "AVAILABILITY_IMPACT",
      consumes: ["homeTeam", "awayTeam", "season", "week"],
      delegatesTo: "CanonicalPlayerAvailabilityImpactService",
      recomputesCanonicalLogic: false
    },
    {
      order: 6,
      id: "MATCHUP_COMPOSITION",
      consumes: [
        "teamContext",
        "performanceEvidence",
        "opponentAdjustment",
        "dependencyContext",
        "availabilityImpact"
      ],
      delegatesTo: "CANONICAL_MATCHUP_INTELLIGENCE_RUNTIME",
      recomputesCanonicalLogic: false
    }
  ],
  outputRules: {
    stableGameScopedMatchupId: true,
    homeAwayOrientationPreserved: true,
    directionalAssessmentAllowed: true,
    probabilityMutationAllowed: false,
    decisionWinnerMutationAllowed: false,
    confidenceFirstClass: true,
    provenanceFirstClass: true,
    evidenceCompletenessFirstClass: true,
    decisionSupportProjectionAdditiveOnly: true
  },
  failurePolicy: {
    missingTeamContext: "FAIL_CLOSED_INSUFFICIENT_EVIDENCE",
    missingPerformanceEvidence: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION",
    missingOpponentAdjustment: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION",
    missingDependencyContext: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION",
    missingAvailabilityImpact: "PRESERVE_BASELINE_AND_MARK_UNAVAILABLE",
    invalidProvenance: "FAIL_NEUTRAL",
    runtimeException: "FAIL_CLOSED_NO_DECISION_MUTATION"
  },
  fixtureGates: {
    deterministicForSameCanonicalInputs: true,
    homeAwaySymmetryInspectable: true,
    missingEvidenceNeutralityRequired: true,
    provenanceRequired: true,
    confidenceBounded: true,
    evidenceCompletenessBounded: true,
    noInputMutation: true,
    noDoubleAvailabilityApplication: true,
    noDoubleOpponentAdjustment: true,
    noDecisionProbabilityMutation: true,
    noApplicationOwnedReasoning: true
  }
});

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-MATCHUP-RUNTIME-COMPOSITION-DEFINITION-1.0.0",
  sprint: SPRINT,
  mode: "NON_MUTATING_COMPOSITION_DEFINITION",
  decision: "CANONICAL_MATCHUP_RUNTIME_COMPOSITION_AND_FIXTURE_GATES_DEFINED",
  composition,
  authorizationBoundary: {
    runtimeCompositionDefined: true,
    fixtureValidationMayAdvance: true,
    runtimeImplementationAuthorized: false,
    matchupScoringAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },
  nextStep: "VALIDATE_CANONICAL_MATCHUP_RUNTIME_COMPOSITION_FIXTURES_BEFORE_RUNTIME_IMPLEMENTATION",
  safeguards: {
    repositoryFilesMutated: false,
    canonicalEnginesInvoked: false,
    matchupScoringExecuted: false,
    decisionModelMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false
  }
}, null, 2));
