import { deepFreeze } from "../../prospectIntake/ProspectIdentityDryRunRequest.js";

const requiredEvidence = ["migrationHashVerified", "migrationOrderingVerified", "authorizedObjectScopeVerified", "postgresqlSyntaxStaticallyReviewed", "uuidReadOnlyPreflightComplete", "referenceLifecycleVerified", "foreignKeyGraphInsertable", "idempotencyComparisonComplete", "replayBeforeUuidVerified", "collisionPersistenceVerified", "lockOrderVerified", "atomicityVerified", "rollbackVerified", "resultMappingVerified", "forcedRlsPolicyPathStaticallyResolved", "rolePreflightComplete", "browserRolesDenied", "adapterMappingVerified", "runbookComplete", "acceptancePackageComplete", "recoveryPlanComplete", "inconsistentStoredStateDetectionVerified"];

export function evaluateProspectIdentifierPersistenceTransactionDeploymentReview(review, context = {}) {
  if (!review || context.notApplicable) return deepFreeze({ status: "PERSISTENCE_TRANSACTION_DEPLOYMENT_NOT_APPLICABLE", blockers: [], sqlExecuted: false });
  const checks = Object.fromEntries(requiredEvidence.map((key) => [key, review.evidence?.[key] === true]));
  checks.hashMatches = context.migrationSha256 === review.expectedSha256;
  checks.singleMigration014 = context.migration014Count === 1;
  checks.unexecuted = review.migrationExecuted === false && context.executionClaim !== true;
  checks.noProduction = context.productionProject !== true;
  checks.projectIdentityGate = context.projectIdentityGateDeclared === true;
  checks.noRawErrorLeak = context.rawErrorLeak !== true;
  checks.noCandidateNormalization = context.candidateNormalization !== true;
  checks.noBrowserAccess = context.browserAccess !== true;
  checks.noReplayUuidGeneration = context.replayUuidGeneration !== true;
  checks.noPartialRollback = context.partialRollback !== true;
  checks.noAutomaticRetry = context.automaticRetry !== true;
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([code]) => deepFreeze({ code: `${code.toUpperCase()}_FAILED` }));
  const declaredBlockers = (review.findings ?? []).filter((finding) => finding.classification === "BLOCKER").map((finding) => deepFreeze({ code: finding.findingId }));
  const allBlockers = deepFreeze([...blockers, ...declaredBlockers]);
  return deepFreeze({ reviewId: review.reviewId, reviewVersion: review.reviewVersion, status: allBlockers.length ? "PERSISTENCE_TRANSACTION_DEPLOYMENT_BLOCKED" : "PERSISTENCE_TRANSACTION_READY_FOR_CONTROLLED_DEPLOYMENT", checks, blockers: allBlockers, sqlExecuted: false, databaseOperations: 0, networkRequests: 0, persistenceOperations: 0, requiredNextAction: allBlockers.length ? review.requiredNextAction : "CONTROLLED_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT" });
}

export function evaluateProspectIdentifierPersistenceTransactionDeploymentReviewBatch(reviews = [], contexts = []) {
  const results = reviews.map((review, index) => evaluateProspectIdentifierPersistenceTransactionDeploymentReview(review, contexts[index] ?? {}));
  return deepFreeze({ status: results.every((result) => result.status === "PERSISTENCE_TRANSACTION_READY_FOR_CONTROLLED_DEPLOYMENT") ? "BATCH_PERSISTENCE_TRANSACTION_READY_FOR_CONTROLLED_DEPLOYMENT" : "BATCH_PERSISTENCE_TRANSACTION_DEPLOYMENT_BLOCKED", results, inputOrderSelectsReview: false, sqlExecuted: false, databaseOperations: 0, networkRequests: 0 });
}

export default Object.freeze({ evaluateProspectIdentifierPersistenceTransactionDeploymentReview, evaluateProspectIdentifierPersistenceTransactionDeploymentReviewBatch });
