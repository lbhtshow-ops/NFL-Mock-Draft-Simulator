import review from "./CanonicalProspectIdentifier017c7StaticReviewDeclaration.js";

export const CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_AUTHORIZATION = Object.freeze({
  authorizationId: "CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_AUTHORIZATION",
  authorizationVersion: "1.0.0",
  status: "AUTHORIZED_FOR_ONE_MANUAL_READ_ONLY_EXECUTION",
  reviewReference: `${review.declarationId}@${review.declarationVersion}`,
  target: review.exactTarget,
  artifact: review.artifact,
  scope: Object.freeze({ executionCount: 1, interface: "SUPABASE_DASHBOARD_SQL_EDITOR", purpose: "READ_ONLY_OWNERSHIP_CAPABILITY_INSPECTION", completeSanitizedResultCaptureRequired: true, mandatoryStopAfterExecution: true }),
  prohibited: Object.freeze({ execute017c6: true, executeMigration014: true, modifyMigration014: true, createMigration015: true, retryMigration014: true, setRole: true, grantOrRevoke: true, membershipChange: true, roleCreationOrAlteration: true, rpcInvocation: true, uuidOrIdentifierGeneration: true, persistenceOperation: true, interactiveRepair: true }),
  consumed: false,
  requiredNextAction: "MANUALLY_EXECUTE_EXACT_017C7_ONCE_RETURN_ALL_SANITIZED_RESULTS_AND_STOP",
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C7_EXECUTION_AUTHORIZATION;
