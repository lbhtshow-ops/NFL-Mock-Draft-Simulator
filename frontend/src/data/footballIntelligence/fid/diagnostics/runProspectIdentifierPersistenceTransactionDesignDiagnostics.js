import * as api from "../prospectIntake/index.js";
import snapshots, { persistenceTransactionContext as context } from "../prospectIntake/fixtures/prospectIdentifierPersistenceTransactionSnapshots.js";

const assert = (value, message) => { if (!value) throw new Error(message); };
const design = api.CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DESIGN;
const assess = () => api.evaluateCanonicalProspectIdentifierPersistenceTransactionDesign(design, context);
const tests = [
  ["design-identity", () => assert(design.designId.endsWith("PERSISTENCE_TRANSACTION_DESIGN") && design.designVersion === "1.0.0", "identity")],
  ["owner", () => assert(design.owner === "FID_PROSPECT_IDENTITY_ISSUANCE_TRANSACTION_OWNER", "owner")],
  ["contract-versions", () => assert([design.requestContract, design.resultContract, design.failureContract].every((x) => x.endsWith("@1.0.0")), "versions")],
  ["sprint-15b-port", () => assert(design.bindings.transactionPort === "IssuerTransactionPort" && design.bindings.runtimeHandler.includes("NON_PRODUCTION_IMPLEMENTATION"), "port")],
  ["request-contract", () => assert(typeof api.createProspectIdentifierPersistenceTransactionRequest === "function", "request")],
  ["result-contract", () => assert(typeof api.createProspectIdentifierPersistenceTransactionResult === "function", "result")],
  ["failure-contract", () => assert(typeof api.createProspectIdentifierPersistenceTransactionFailure === "function", "failure")],
  ["context-contract", () => assert(context.contractVersion === "1.0.0", "context")],
  ["plan", () => assert(design.plan.planVersion === "1.0.0" && design.plan.stages.length === 17, "plan")],
  ["plan-inert", () => assert(design.plan.stages.every((x) => !x.executionPermission), "executable")],
  ["atomicity", () => assert(design.transactionBoundary.allOrNothing && design.transactionBoundary.atomicUnit.length === 4, "atomicity")],
  ["no-check-then-insert", () => assert(!design.transactionBoundary.preflightSelectOutsideTransaction && !design.transactionBoundary.applicationCheckThenInsert, "preflight")],
  ["candidate-classification", () => assert(design.candidateHandling.classification === "SENSITIVE_PRE_ISSUANCE_OPERATIONAL_DATA", "candidate")],
  ["case-sensitive", () => assert(design.constraints.includes("UNIQUE_NAMESPACE_CANDIDATE_CASE_SENSITIVE"), "case")],
  ["collision", () => assert(design.collisionSemantics.retryInitiatedByDatabase === false, "collision")],
  ["reservation", () => assert(design.schemaBoundary.requiredObjects.some((x) => x.name === "fid_identifier_reservations"), "reservation")],
  ["ledger", () => assert(design.schemaBoundary.requiredObjects.some((x) => x.name === "fid_identifier_issuance_ledger"), "ledger")],
  ["idempotency", () => assert(design.idempotencySemantics.resultStoredAtomically, "idempotency")],
  ["concurrency", () => assert(design.concurrencyModel.lockOrder.length === 3, "locks")],
  ["isolation", () => assert(design.concurrencyModel.isolationDecision.startsWith("READ_COMMITTED"), "isolation")],
  ["rollback", () => assert(design.rollbackBehavior.includes("ROLLS_BACK_ALL"), "rollback")],
  ["commit", () => assert(design.commitBehavior.includes("IDEMPOTENCY_STATE"), "commit")],
  ["uncertainty", () => assert(design.postCommitUncertainty.includes("RECOVERY_REQUIRED"), "uncertainty")],
  ["recovery", () => assert(!design.recoveryModel.blindRetry && !design.recoveryModel.separateRecoveryTableRequired, "recovery")],
  ["clock", () => assert(!design.clockBoundary.clientTimestampAccepted && !design.clockBoundary.timestampIdentifier, "clock")],
  ["security-role", () => assert(design.securityModel.executionRole === "service_role_via_edge_function_only", "role")],
  ["direct-client", () => assert(!design.securityModel.directAuthenticatedExecution && snapshots.directClientRpcRejected.status === "PERSISTENCE_TRANSACTION_BLOCKED", "client")],
  ["rls", () => assert(design.rlsInteraction.forcedRls && design.rlsInteraction.browserPolicies.startsWith("DENY"), "rls")],
  ["search-path", () => assert(design.securityModel.searchPath === "pg_catalog, fid", "search path")],
  ["security-definer", () => assert(design.securityModel.securityDefiner.startsWith("REQUIRED_BY_EXISTING_FID_RPC_PRECEDENT"), "security definer")],
  ["revoke-first", () => assert(design.grantModel.revokeFirst.includes("PUBLIC") && design.grantModel.grantExecuteTo.length === 1, "grants")],
  ["minimum-objects", () => assert(design.schemaBoundary.requiredObjects.length === 3 && !design.recoveryModel.separateRecoveryTableRequired, "objects")],
  ["constraints", () => assert(design.constraints.length === 10, "constraints")],
  ["indexes", () => assert(design.indexes.length === 6, "indexes")],
  ["migration-plan", () => assert(design.migrationPlan.length === 11, "migration")],
  ["testing", () => assert(design.testingArchitecture.length === 12, "tests")],
  ["integration", () => assert(design.integrationBoundary.excludes.includes("PRODUCTION") && design.integrationBoundary.excludes.includes("REAL_PROSPECTS"), "integration")],
  ["activation", () => assert(design.activationGates.length === 10 && design.activationGates.includes("PRODUCTION_PROHIBITED"), "gates")],
  ["capability", () => assert(design.capabilityStatus.transactionDesigned && !design.capabilityStatus.transactionImplemented && !design.capabilityStatus.deployed, "capability")],
  ["permissions", () => assert(Object.values(design.permissions).every((x) => !x) && Object.values(assess().executionPermissions).every((x) => !x), "permissions")],
  ["assessment", () => assert(assess().status === "PERSISTENCE_TRANSACTION_READY_FOR_NON_PRODUCTION_IMPLEMENTATION", "assessment")],
  ["next-action", () => assert(assess().requiredNextAction === "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION", "next")],
  ["batch", () => assert(snapshots.mixedBatch.status === "BATCH_PERSISTENCE_TRANSACTION_BLOCKED" && !snapshots.mixedBatch.inputOrderSelectsDesign, "batch")],
  ["determinism", () => assert(JSON.stringify(assess()) === JSON.stringify(assess()), "determinism")],
  ["snapshots", () => assert(Object.keys(snapshots).length === 19, "snapshots")],
  ["collision-snapshot", () => assert(snapshots.collisionDesign.outcome === "IDENTIFIER_COLLISION_DETECTED" && !snapshots.collisionDesign.databaseInitiatesRetry, "collision snapshot")],
  ["replay-snapshot", () => assert(!snapshots.matchingReplay.newWrites && !snapshots.conflictingIdempotency.newWrites, "replay")],
  ["rollback-snapshot", () => assert(!snapshots.reservationLedgerRollback.partialCommit, "rollback snapshot")],
  ["unknown-commit", () => assert(snapshots.unknownCommitRecovery.blindRetry === false, "unknown commit")],
  ["production-blocked", () => assert(snapshots.productionRejected.status === "PERSISTENCE_TRANSACTION_BLOCKED", "production")],
  ["cohort", () => assert(snapshots.cohort.length === 4 && snapshots.cohort.every((x) => Object.entries(x).filter(([key]) => key.endsWith("Count")).every(([, value]) => value === 0)), "cohort")],
  ["sanitized", () => assert(!/(?:person|player|prospect|prospect-profile):[A-Za-z0-9_-]{22}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.|BEGIN\s+TRANSACTION|CREATE\s+(?:TABLE|FUNCTION)/i.test(JSON.stringify(snapshots)), "snapshot sensitive value")],
  ["no-sql", () => assert(!("sql" in design) && !design.securityModel.dynamicSql, "sql")],
  ["no-side-effects", () => assert(snapshots.cohort.every((x) => x.persistenceCount === 0 && x.identityCreationCount === 0), "effects")],
];

let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`Prospect identifier persistence transaction design diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
