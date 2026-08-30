#!/usr/bin/env node

const SPRINT = "2.19-RC5";

const POLICY = Object.freeze({
  contractVersion: "FIE-NFL-MATCHUP-DIRECTIONAL-ASSESSMENT-SCORING-POLICY-V1-1.0.0",
  status: "DESIGN_ONLY_SCORING_POLICY_NOT_RUNTIME_EXECUTION",
  owner: "CANONICAL_FIE",

  assessmentStates: [
    "HOME_EDGE",
    "AWAY_EDGE",
    "NEUTRAL",
    "INSUFFICIENT_EVIDENCE"
  ],

  dimensions: {
    TEAM_STRENGTH_CONTEXT: {
      maxAbsoluteContribution: 0.30,
      requiredForScoredAssessment: true,
      mayRecomputeTeamStrength: false
    },
    OFFENSE_VS_DEFENSE: {
      maxAbsoluteContribution: 0.20,
      requiredForScoredAssessment: false,
      mayRecomputePerformanceEvidence: false
    },
    DEFENSE_VS_OFFENSE: {
      maxAbsoluteContribution: 0.20,
      requiredForScoredAssessment: false,
      mayRecomputePerformanceEvidence: false
    },
    OPPONENT_ADJUSTED_PERFORMANCE: {
      maxAbsoluteContribution: 0.15,
      requiredForScoredAssessment: false,
      mayRecomputeOpponentAdjustment: false
    },
    QB_AND_DEPENDENCY_CONTEXT: {
      maxAbsoluteContribution: 0.10,
      requiredForScoredAssessment: false,
      mayRecomputeDependencyIntelligence: false
    },
    PLAYER_AVAILABILITY_IMPACT: {
      maxAbsoluteContribution: 0.05,
      requiredForScoredAssessment: false,
      mayRecomputeAvailabilityImpact: false
    }
  },

  aggregatePolicy: {
    normalizedScoreRange: [-1, 1],
    totalAbsoluteWeightBudget: 1.00,
    sumOfDimensionCapsMustNotExceedBudget: true,
    dimensionContributionMustBeBounded: true,
    missingOptionalDimensionContribution: 0,
    unavailableDimensionMayNotBeImputedFromOutcome: true,
    noOutcomeLeakage: true,
    noImplicitHomeFieldAdvantage: true,
    noProbabilityMutation: true,
    noWinnerMutation: true
  },

  evidenceGates: {
    minimumEvidenceCompletenessForScoredAssessment: 0.80,
    minimumConfidenceForScoredAssessment: 0.60,
    teamContextRequired: true,
    provenanceRequired: true,
    invalidIdentityBehavior: "INSUFFICIENT_EVIDENCE",
    invalidProvenanceBehavior: "NEUTRAL",
    belowCompletenessBehavior: "INSUFFICIENT_EVIDENCE",
    belowConfidenceBehavior: "NEUTRAL"
  },

  directionalThresholds: {
    homeEdgeMinimum: 0.15,
    awayEdgeMaximum: -0.15,
    neutralLowerExclusive: -0.15,
    neutralUpperExclusive: 0.15,
    exactBoundaryInclusiveForEdges: true
  },

  confidencePolicy: {
    confidenceScale: "ZERO_TO_ONE",
    finalConfidenceMustNotExceedRuntimeConfidence: true,
    finalConfidenceMustNotExceedEvidenceCompleteness: true,
    missingOptionalDimensionMayReduceConfidence: true,
    noConfidenceInflationFromRepeatedSignals: true
  },

  antiDoubleCounting: {
    teamStrengthAndOpponentAdjustmentMayNotBeAppliedTwice: true,
    availabilityImpactMayNotBeAppliedTwice: true,
    qbDependencyMayNotBeAppliedAgainIfAlreadyEmbeddedInTeamStrength: true,
    duplicateSignalMustBeSuppressedOrZeroWeighted: true,
    duplicateDetectionMustBeInspectable: true
  },

  outputContract: {
    requiredFields: [
      "matchupId",
      "assessment",
      "normalizedScore",
      "dimensionContributions",
      "confidence",
      "evidenceCompleteness",
      "provenance",
      "fallbackReasons",
      "duplicateSuppression"
    ],
    probabilityDelta: 0,
    probabilityDeltaApplied: false,
    winnerMutationApplied: false,
    decisionSupportProjectionMode: "ADDITIVE_ONLY"
  },

  governance: {
    policyDefinesScoringBehavior: true,
    scoringEngineImplementationMayAdvanceAfterPolicyValidation: true,
    policyDoesNotAuthorizeProductionDecisionMutation: true,
    policyDoesNotAuthorizePickemMutation: true,
    policyDoesNotAuthorizeDatabaseMutation: true,
    policyDoesNotResumeREF17C: true
  }
});

const capSum = Object.values(POLICY.dimensions)
  .reduce((sum, x) => sum + x.maxAbsoluteContribution, 0);

const checks = {
  fourAssessmentStates:
    POLICY.assessmentStates.length === 4 &&
    POLICY.assessmentStates.includes("HOME_EDGE") &&
    POLICY.assessmentStates.includes("AWAY_EDGE") &&
    POLICY.assessmentStates.includes("NEUTRAL") &&
    POLICY.assessmentStates.includes("INSUFFICIENT_EVIDENCE"),

  dimensionCapBudgetEqualsOne: Math.abs(capSum - 1) < 1e-12,
  teamStrengthRequired: POLICY.dimensions.TEAM_STRENGTH_CONTEXT.requiredForScoredAssessment === true,
  noTeamStrengthRecompute: POLICY.dimensions.TEAM_STRENGTH_CONTEXT.mayRecomputeTeamStrength === false,
  noOpponentRecompute: POLICY.dimensions.OPPONENT_ADJUSTED_PERFORMANCE.mayRecomputeOpponentAdjustment === false,
  noDependencyRecompute: POLICY.dimensions.QB_AND_DEPENDENCY_CONTEXT.mayRecomputeDependencyIntelligence === false,
  noAvailabilityRecompute: POLICY.dimensions.PLAYER_AVAILABILITY_IMPACT.mayRecomputeAvailabilityImpact === false,

  normalizedRangeLocked:
    POLICY.aggregatePolicy.normalizedScoreRange[0] === -1 &&
    POLICY.aggregatePolicy.normalizedScoreRange[1] === 1,

  noOutcomeLeakage: POLICY.aggregatePolicy.noOutcomeLeakage === true,
  noImplicitHomeFieldAdvantage: POLICY.aggregatePolicy.noImplicitHomeFieldAdvantage === true,
  probabilityLocked: POLICY.aggregatePolicy.noProbabilityMutation === true,
  winnerLocked: POLICY.aggregatePolicy.noWinnerMutation === true,

  completenessGate: POLICY.evidenceGates.minimumEvidenceCompletenessForScoredAssessment === 0.80,
  confidenceGate: POLICY.evidenceGates.minimumConfidenceForScoredAssessment === 0.60,
  provenanceRequired: POLICY.evidenceGates.provenanceRequired === true,

  homeThreshold: POLICY.directionalThresholds.homeEdgeMinimum === 0.15,
  awayThreshold: POLICY.directionalThresholds.awayEdgeMaximum === -0.15,

  confidenceNoInflation: POLICY.confidencePolicy.noConfidenceInflationFromRepeatedSignals === true,

  teamOpponentDoubleCountBlocked:
    POLICY.antiDoubleCounting.teamStrengthAndOpponentAdjustmentMayNotBeAppliedTwice === true,
  availabilityDoubleCountBlocked:
    POLICY.antiDoubleCounting.availabilityImpactMayNotBeAppliedTwice === true,
  qbDoubleCountBlocked:
    POLICY.antiDoubleCounting.qbDependencyMayNotBeAppliedAgainIfAlreadyEmbeddedInTeamStrength === true,

  duplicateSuppressionRequired:
    POLICY.antiDoubleCounting.duplicateSignalMustBeSuppressedOrZeroWeighted === true,
  duplicateInspectable:
    POLICY.antiDoubleCounting.duplicateDetectionMustBeInspectable === true,

  additiveOnly:
    POLICY.outputContract.decisionSupportProjectionMode === "ADDITIVE_ONLY",
  outputProbabilityZero:
    POLICY.outputContract.probabilityDelta === 0 &&
    POLICY.outputContract.probabilityDeltaApplied === false,
  outputWinnerNotMutated:
    POLICY.outputContract.winnerMutationApplied === false,

  scoringImplementationMayAdvance:
    POLICY.governance.scoringEngineImplementationMayAdvanceAfterPolicyValidation === true,

  decisionMutationStillLocked:
    POLICY.governance.policyDoesNotAuthorizeProductionDecisionMutation === true,
  pickemStillLocked:
    POLICY.governance.policyDoesNotAuthorizePickemMutation === true,
  databaseStillLocked:
    POLICY.governance.policyDoesNotAuthorizeDatabaseMutation === true,
  refStillLocked:
    POLICY.governance.policyDoesNotResumeREF17C === true
};

const valid = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-MATCHUP-DIRECTIONAL-ASSESSMENT-SCORING-POLICY-REPORT-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_POLICY_DEFINITION",
  decision: valid
    ? "GOVERNED_MATCHUP_DIRECTIONAL_ASSESSMENT_SCORING_POLICY_V1_DEFINED"
    : "GOVERNED_MATCHUP_DIRECTIONAL_ASSESSMENT_SCORING_POLICY_V1_REJECTED",
  policy: POLICY,
  derived: {
    dimensionCapSum: capSum
  },
  checks,
  authorizationBoundary: {
    scoringPolicyDefined: valid,
    scoringEngineImplementationMayAdvance: valid,
    scoringEngineExecutionAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false,
    refSprint17CResumptionAuthorized: false
  },
  nextStep: valid
    ? "IMPLEMENT_CANONICAL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_WITH_SYNTHETIC_FIXTURES_AND_NO_DECISION_MODEL_MUTATION"
    : "RECONCILE_MATCHUP_SCORING_POLICY_BEFORE_IMPLEMENTATION",
  safeguards: {
    runtimeScoringExecuted: false,
    probabilityMutated: false,
    winnerMutated: false,
    decisionModelMutated: false,
    pickemRepositoryMutated: false,
    databaseMutated: false,
    refSprint17CResumed: false
  }
}, null, 2));

if (!valid) process.exitCode = 1;
