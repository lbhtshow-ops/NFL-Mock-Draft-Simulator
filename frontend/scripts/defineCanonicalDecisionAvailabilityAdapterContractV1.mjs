#!/usr/bin/env node

const CONTRACT = Object.freeze({
  contractVersion: "FIE-NFL-DECISION-AVAILABILITY-ADAPTER-CONTRACT-1.0.0",
  sprint: "2.18.24-RC4.1",
  mode: "DESIGN_ONLY_NON_MUTATING",

  ownership: {
    availabilityReasoningOwner: "CANONICAL_FIE",
    decisionReasoningOwner: "CANONICAL_FIE",
    pickemRole: "READ_ONLY_CONSUMER_OF_STABLE_DECISION_OUTPUT",
    pickemMayReimplementAvailabilityResolver: false
  },

  input: {
    baselineDecisionRequired: true,
    boundedAvailabilityResultOptional: true,
    acceptedResolverContract:
      "FIE-NFL-BOUNDED-AVAILABILITY-POLICY-RESOLVER-1.0.0",
    availabilityResultMustBeGoverned: true
  },

  baselinePreservation: {
    missingAvailabilityBehavior: "RETURN_BASELINE_DECISION_UNCHANGED",
    neutralAvailabilityBehavior: "RETURN_BASELINE_DECISION_UNCHANGED",
    resolverFailureBehavior: "RETURN_BASELINE_DECISION_UNCHANGED_WITH_DIAGNOSTIC",
    baselinePredictionMayBeDestroyedByAvailabilityFailure: false
  },

  antiDoubleCounting: {
    availabilityDeltaMayEnterExactlyOneGovernedDecisionChannel: true,
    mayAlsoMutateTeamStrengthInSameRequest: false,
    mayAlsoMutateRosterSignalInSameRequest: false,
    mayAlsoMutateDependencySignalInSameRequest: false,
    duplicateApplicationProhibited: true,
    requiredDiagnosticField: "availabilityApplicationChannel"
  },

  provenance: {
    inspectable: true,
    requiredFieldsForNonNeutralAvailability: [
      "policyId",
      "policyVersion",
      "availabilityStatus",
      "availabilityConfidence",
      "evidenceCompleteness",
      "sourceClassification",
      "provider",
      "observedAtOrPublishedAt",
      "basePlayerImpactSource",
      "selectedMultiplier",
      "availabilityImpactDelta"
    ]
  },

  outputExtension: {
    baselineFieldsMustRemainBackwardCompatible: true,
    availabilityNamespace: "availabilityIntelligence",
    fields: [
      "status",
      "applied",
      "applicationChannel",
      "playerAdjustments",
      "aggregateAvailabilityDelta",
      "provenance",
      "fallbackReasons",
      "policyVersion"
    ],
    pickemRequiredToConsumeAvailabilityNamespace: false,
    pickemMayContinueReadingExistingDecisionFields: true
  },

  handoffStability: {
    stableConsumerBoundary:
      "CANONICAL_FIE_DECISION_API_OUTPUT",
    internalFIEImplementationMayChangeWithoutPickemRewrite: true,
    pickemConsumerMustNotDependOnInternalResolverFiles: true
  },

  authorizationBoundary: {
    adapterContractDefined: true,
    nonMutatingAdapterFixtureImplementationMayAdvance: true,
    productionAdapterExecutionAuthorized: false,
    teamStrengthMutationAuthorized: false,
    matchupMutationAuthorized: false,
    decisionModelScoringMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false
  }
});

const checks = {
  fieOwnsReasoning:
    CONTRACT.ownership.availabilityReasoningOwner === "CANONICAL_FIE",
  pickemConsumerOnly:
    CONTRACT.ownership.pickemRole === "READ_ONLY_CONSUMER_OF_STABLE_DECISION_OUTPUT",
  noPickemReimplementation:
    CONTRACT.ownership.pickemMayReimplementAvailabilityResolver === false,
  baselineRequired: CONTRACT.input.baselineDecisionRequired === true,
  availabilityOptional: CONTRACT.input.boundedAvailabilityResultOptional === true,
  missingPreservesBaseline:
    CONTRACT.baselinePreservation.missingAvailabilityBehavior ===
    "RETURN_BASELINE_DECISION_UNCHANGED",
  neutralPreservesBaseline:
    CONTRACT.baselinePreservation.neutralAvailabilityBehavior ===
    "RETURN_BASELINE_DECISION_UNCHANGED",
  failurePreservesBaseline:
    CONTRACT.baselinePreservation.resolverFailureBehavior ===
    "RETURN_BASELINE_DECISION_UNCHANGED_WITH_DIAGNOSTIC",
  exactlyOneChannel:
    CONTRACT.antiDoubleCounting.availabilityDeltaMayEnterExactlyOneGovernedDecisionChannel === true,
  noTeamStrengthDoubleCount:
    CONTRACT.antiDoubleCounting.mayAlsoMutateTeamStrengthInSameRequest === false,
  noRosterDoubleCount:
    CONTRACT.antiDoubleCounting.mayAlsoMutateRosterSignalInSameRequest === false,
  noDependencyDoubleCount:
    CONTRACT.antiDoubleCounting.mayAlsoMutateDependencySignalInSameRequest === false,
  provenanceInspectable: CONTRACT.provenance.inspectable === true,
  backwardsCompatible:
    CONTRACT.outputExtension.baselineFieldsMustRemainBackwardCompatible === true,
  pickemDoesNotNeedNamespace:
    CONTRACT.outputExtension.pickemRequiredToConsumeAvailabilityNamespace === false,
  existingDecisionFieldsRemainConsumable:
    CONTRACT.outputExtension.pickemMayContinueReadingExistingDecisionFields === true,
  internalFilesHiddenFromPickem:
    CONTRACT.handoffStability.pickemConsumerMustNotDependOnInternalResolverFiles === true,
  executionStillLocked:
    CONTRACT.authorizationBoundary.productionAdapterExecutionAuthorized === false,
  pickemMutationStillLocked:
    CONTRACT.authorizationBoundary.pickemRepositoryMutationAuthorized === false
};

const valid = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  ...CONTRACT,
  decision: valid
    ? "CANONICAL_DECISION_AVAILABILITY_ADAPTER_CONTRACT_V1_DEFINED"
    : "CANONICAL_DECISION_AVAILABILITY_ADAPTER_CONTRACT_V1_REJECTED",
  checks,
  nextStep: valid
    ? "IMPLEMENT_NON_MUTATING_ADAPTER_FIXTURES_AGAINST_CANONICAL_DECISION_OUTPUT_AND_PREPARE_PICKEM_HANDOFF_CONTRACT"
    : "RECONCILE_ADAPTER_CONTRACT_BEFORE_IMPLEMENTATION"
}, null, 2));

if (!valid) process.exitCode = 1;
