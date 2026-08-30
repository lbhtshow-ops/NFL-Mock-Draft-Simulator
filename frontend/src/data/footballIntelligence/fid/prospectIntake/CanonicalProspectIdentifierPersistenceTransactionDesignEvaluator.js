import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";
import { PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PERMISSIONS } from "./prospectIdentifierPersistenceTransactionConstants.js";

const inspect = (value, errors, path = "") => {
  if (typeof value === "function") {
    errors.push({ code: "EXECUTABLE_PROHIBITED", path });
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (
      /sqlImplementation|databaseClient|supabaseClient|secretValue|tokenValue|rawEntropy|encodedEntropy|candidateExample|candidateValue/i.test(key) &&
      child != null && child !== false
    ) {
      errors.push({ code: "PROHIBITED_DESIGN_VALUE", path: nextPath });
    }
    inspect(child, errors, nextPath);
  }
};

export function evaluateCanonicalProspectIdentifierPersistenceTransactionDesign(design, context = {}) {
  const blockers = [];
  inspect(design, blockers);
  inspect(context, blockers);
  if (context.directClientRpc) {
    blockers.push({ code: "DIRECT_CLIENT_RPC_PROHIBITED", path: "directClientRpc" });
  }

  const checks = {
    identity:
      design?.designId === "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DESIGN" &&
      design?.designVersion === "1.0.0",
    contextValid: context?.validation?.valid !== false,
    bindings:
      design?.bindings?.authorization?.includes("SPRINT_5") &&
      design?.bindings?.issuer?.endsWith("@1.0.0") &&
      design?.bindings?.generationResult?.endsWith("@1.1.0") &&
      design?.bindings?.runtimeHandler?.includes("NON_PRODUCTION_IMPLEMENTATION"),
    schemaCompatibility: context.requiredTables?.every((table) =>
      design?.schemaBoundary?.requiredObjects?.some((object) => object.name === table),
    ),
    candidateCompatibility:
      design?.candidateHandling?.caseSensitiveStorageRequired &&
      design?.candidateHandling?.structuralValidationRequired,
    idempotency: context.databaseIdempotency && design?.idempotencySemantics?.resultStoredAtomically,
    collision:
      context.authoritativeUniqueness &&
      design?.transactionBoundary?.atomicUnit?.includes("AUTHORITATIVE_COLLISION_DETERMINATION"),
    reservationLedger: context.atomicReservationLedger && design?.transactionBoundary?.allOrNothing,
    atomicity:
      design?.transactionBoundary?.atomicUnit?.length === 4 &&
      !design?.transactionBoundary?.applicationCheckThenInsert,
    concurrency:
      design?.concurrencyModel?.lockOrder?.length === 3 &&
      design?.constraints?.includes("UNIQUE_NAMESPACE_CANDIDATE_CASE_SENSITIVE"),
    rollback: design?.rollbackBehavior?.includes("ROLLS_BACK_ALL"),
    recovery: context.recoveryByGovernedReference && !design?.recoveryModel?.blindRetry,
    rls: design?.rlsInteraction?.forcedRls && !design?.securityModel?.directAuthenticatedExecution,
    role:
      design?.securityModel?.executionRole === "service_role_via_edge_function_only" &&
      design?.securityModel?.searchPath === "pg_catalog, fid",
    directClientDenied: !context.directClientRpc && !design?.securityModel?.directAuthenticatedExecution,
    migrationReady: design?.migrationPlan?.length === 11,
    testingReady: design?.testingArchitecture?.length === 12,
    productionProhibited: !context.productionEnabled && !design?.capabilityStatus?.productionApproved,
    notImplemented:
      !design?.capabilityStatus?.transactionImplemented &&
      !design?.capabilityStatus?.rpcImplemented &&
      !design?.capabilityStatus?.migrationPackageCreated,
    permissions: Object.values(design?.permissions ?? {}).every((value) => !value),
  };

  Object.entries(checks)
    .filter(([, pass]) => !pass)
    .forEach(([key]) => blockers.push({ code: `${key.toUpperCase()}_FAILED` }));

  const status = blockers.length
    ? "PERSISTENCE_TRANSACTION_BLOCKED"
    : "PERSISTENCE_TRANSACTION_READY_FOR_NON_PRODUCTION_IMPLEMENTATION";
  return deepFreeze({
    contract: "PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_ASSESSMENT",
    contractVersion: "1.0.0",
    assessmentId: context.contextId ?? null,
    status,
    checks,
    eligibleForNonProductionPersistenceTransactionImplementation: !blockers.length,
    remainingBlockers: blockers,
    requiredNextAction: !blockers.length
      ? "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION"
      : "RESOLVE_PERSISTENCE_TRANSACTION_BLOCKERS",
    executionPermissions: PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PERMISSIONS,
  });
}

export function evaluateCanonicalProspectIdentifierPersistenceTransactionDesignBatch(designs = [], contexts = []) {
  const length = Math.max(designs.length, contexts.length);
  const assessments = Array.from({ length }, (_, index) =>
    evaluateCanonicalProspectIdentifierPersistenceTransactionDesign(designs[index], contexts[index]),
  );
  return deepFreeze({
    status: assessments.some((assessment) => assessment.status === "PERSISTENCE_TRANSACTION_BLOCKED")
      ? "BATCH_PERSISTENCE_TRANSACTION_BLOCKED"
      : "BATCH_PERSISTENCE_TRANSACTION_READY",
    assessments,
    inputOrderSelectsDesign: false,
    databaseLookups: 0,
    networkRequests: 0,
    persistenceOperations: 0,
  });
}

export default Object.freeze({
  evaluateCanonicalProspectIdentifierPersistenceTransactionDesign,
  evaluateCanonicalProspectIdentifierPersistenceTransactionDesignBatch,
});
