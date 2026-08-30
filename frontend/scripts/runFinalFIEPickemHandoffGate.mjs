#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SPRINT = "2.18.24-RC4.3";

const REQUIRED_FILES = [
  "scripts/defineBoundedPlayerAvailabilityImpactPolicyV1.mjs",
  "scripts/resolveBoundedAvailabilityImpactV1.mjs",
  "scripts/validateBoundedAvailabilityPolicyResolverV1.mjs",
  "scripts/defineCanonicalDecisionAvailabilityAdapterContractV1.mjs",
  "scripts/applyAvailabilityToCanonicalDecisionV1.mjs",
  "scripts/validateCanonicalDecisionAvailabilityAdapterFixturesV1.mjs",
  "scripts/definePickemDecisionConsumerHandoffContractV1.mjs"
];

const VALIDATION_COMMANDS = [
  {
    id: "RC2_POLICY_DIAGNOSTICS",
    file: "scripts/diagnoseBoundedPlayerAvailabilityImpactPolicyV1.mjs"
  },
  {
    id: "RC3_RESOLVER_DIAGNOSTICS",
    file: "scripts/diagnoseBoundedAvailabilityPolicyResolverV1.mjs"
  },
  {
    id: "RC3_RESOLVER_FIXTURES",
    file: "scripts/validateBoundedAvailabilityPolicyResolverV1.mjs"
  },
  {
    id: "RC4_1_ADAPTER_CONTRACT_DIAGNOSTICS",
    file: "scripts/diagnoseCanonicalDecisionAvailabilityAdapterContractV1.mjs"
  },
  {
    id: "RC4_2_ADAPTER_DIAGNOSTICS",
    file: "scripts/diagnoseCanonicalDecisionAvailabilityAdapterFixturesV1.mjs"
  },
  {
    id: "RC4_2_ADAPTER_FIXTURES",
    file: "scripts/validateCanonicalDecisionAvailabilityAdapterFixturesV1.mjs"
  },
  {
    id: "RC4_2_PICKEM_HANDOFF_CONTRACT",
    file: "scripts/definePickemDecisionConsumerHandoffContractV1.mjs"
  }
];

function runNode(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    return {
      file: rel,
      exists: false,
      exitCode: null,
      passed: false,
      stdout: "",
      stderr: "FILE_NOT_FOUND"
    };
  }

  const result = spawnSync(process.execPath, [full], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  const failedMarker = /"failed"\s*:\s*[1-9]\d*/.test(stdout);
  const rejectedMarker = /_REJECTED|HANDOFF_BLOCKED|BLOCKED_PENDING/i.test(stdout);

  return {
    file: rel,
    exists: true,
    exitCode: result.status,
    passed:
      result.status === 0 &&
      !failedMarker &&
      !rejectedMarker,
    stdoutSummary: stdout.slice(0, 4000),
    stderrSummary: stderr.slice(0, 2000)
  };
}

const filePresence = REQUIRED_FILES.map(rel => ({
  file: rel,
  present: fs.existsSync(path.join(ROOT, rel))
}));

const commandResults = VALIDATION_COMMANDS.map(c => ({
  id: c.id,
  ...runNode(c.file)
}));

const handoffContractFile =
  path.join(ROOT, "scripts/definePickemDecisionConsumerHandoffContractV1.mjs");

const handoffSource = fs.existsSync(handoffContractFile)
  ? fs.readFileSync(handoffContractFile, "utf8")
  : "";

const boundaryChecks = {
  producerIsCanonicalFIE:
    /producer:\s*"CANONICAL_FIE"/.test(handoffSource),

  consumerIsPickem:
    /consumer:\s*"LBHT_PICKEM"/.test(handoffSource),

  stableTransportBoundary:
    /transportBoundary:\s*"CANONICAL_FIE_DECISION_API_OUTPUT"/.test(handoffSource),

  existingDecisionFieldsRemainSupported:
    /existingDecisionFieldsRemainSupported:\s*true/.test(handoffSource),

  availabilityNamespaceAdditive:
    /availabilityIntelligenceNamespaceIsAdditive:\s*true/.test(handoffSource),

  availabilityNamespaceOptionalInitially:
    /availabilityNamespaceRequiredForInitialPickemConsumption:\s*false/.test(handoffSource),

  noInternalResolverImports:
    /internalResolverImportsProhibited:\s*true/.test(handoffSource),

  noRecomputation:
    /mayRecomputeAvailabilityAdjustment:\s*false/.test(handoffSource),

  noReapplication:
    /mayApplyAvailabilityDeltaAgain:\s*false/.test(handoffSource),

  noCanonicalReasoningMutation:
    /mayMutateCanonicalFIEReasoning:\s*false/.test(handoffSource),

  missingAvailabilityPreservesBaseline:
    /missingAvailabilityPreservesBaselineDecision:\s*true/.test(handoffSource),

  neutralAvailabilityPreservesBaseline:
    /neutralAvailabilityPreservesBaselineDecision:\s*true/.test(handoffSource),

  resolverFailurePreservesBaseline:
    /resolverFailurePreservesBaselineDecision:\s*true/.test(handoffSource),

  singleNamespaceExposure:
    /nonNeutralAvailabilityExposedInSingleNamespace:\s*true/.test(handoffSource),

  doubleCountingProhibited:
    /doubleCountingProhibited:\s*true/.test(handoffSource),

  provenanceInspectable:
    /provenanceInspectable:\s*true/.test(handoffSource)
};

const readiness = {
  allRequiredFilesPresent: filePresence.every(x => x.present),
  allValidationCommandsPassed: commandResults.every(x => x.passed),
  allBoundaryChecksPassed: Object.values(boundaryChecks).every(Boolean),
  pickemRepositoryMutationPerformed: false,
  productionDecisionScoringMutationPerformed: false,
  databaseMutationPerformed: false
};

const handoffReady =
  readiness.allRequiredFilesPresent &&
  readiness.allValidationCommandsPassed &&
  readiness.allBoundaryChecksPassed;

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-PICKEM-FINAL-HANDOFF-GATE-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_RELEASE_READINESS_GATE",
  decision: handoffReady
    ? "FIE_PICKEM_HANDOFF_READY"
    : "FIE_PICKEM_HANDOFF_BLOCKED",

  filePresence,
  validationResults: commandResults,
  boundaryChecks,
  readiness,

  handoffPackage: handoffReady ? {
    producer: "CANONICAL_FIE",
    consumer: "LBHT_PICKEM",
    transportBoundary: "CANONICAL_FIE_DECISION_API_OUTPUT",
    requiredConsumerBehavior: [
      "CONTINUE_CONSUMING_EXISTING_DECISION_FIELDS",
      "TREAT_AVAILABILITY_INTELLIGENCE_AS_OPTIONAL_ADDITIVE_NAMESPACE",
      "DO_NOT_IMPORT_INTERNAL_FIE_AVAILABILITY_RESOLVER",
      "DO_NOT_RECOMPUTE_AVAILABILITY_ADJUSTMENTS",
      "DO_NOT_REAPPLY_AVAILABILITY_DELTA",
      "PRESERVE_FIE_AS_SINGLE_OWNER_OF_FOOTBALL_REASONING"
    ],
    implementationMayAdvanceInPickemRepository: true
  } : null,

  authorizationBoundary: {
    finalHandoffGateComplete: true,
    pickemConsumerImplementationMayAdvance: handoffReady,
    fieInternalAvailabilityReasoningMayRemainCanonical: true,
    pickemMayDuplicateFIEReasoning: false,
    productionDecisionScoringMutationAuthorizedByThisGate: false,
    databaseMutationAuthorizedByThisGate: false
  },

  nextStep: handoffReady
    ? "BEGIN_PICKEM_CONSUMER_IMPLEMENTATION_AGAINST_CANONICAL_FIE_DECISION_API_OUTPUT"
    : "REMEDIATE_FAILED_HANDOFF_GATE_COMPONENTS_BEFORE_PICKEM_IMPLEMENTATION",

  safeguards: {
    repositoryFilesMutated: false,
    pickemRepositoryMutated: false,
    productionDecisionScoringMutated: false,
    teamStrengthMutated: false,
    matchupModelMutated: false,
    databaseMutated: false
  }
}, null, 2));

if (!handoffReady) process.exitCode = 1;
