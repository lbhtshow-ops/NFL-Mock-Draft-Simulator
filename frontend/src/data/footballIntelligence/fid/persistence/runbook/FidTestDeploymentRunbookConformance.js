import {
  FID_APPROVED_MIGRATION_HASHES,
  FID_DEPLOYMENT_DECISION_TYPES,
  FID_DEPLOYMENT_EVIDENCE_STATES,
  FID_DEPLOYMENT_FAILURE_CLASSIFICATIONS,
  FID_DEPLOYMENT_STATES,
  FID_DEPLOYMENT_STEP_STATES,
} from "./fidTestDeploymentRunbookConstants.js";
import { FID_TEST_DEPLOYMENT_RUNBOOK } from "./FidTestDeploymentRunbookBuilder.js";

const REQUIRED_SCOPE = Object.freeze([
  "newProjectOnly", "emptyDatabaseOnly", "dedicatedTestOnly", "nonProductionOnly",
  "humanExecutionOnly", "oneMigrationAtATime", "stopOnFirstFailure", "noRuntimeActivation",
  "noRealData", "noApplicationIntegration",
]);
const EXECUTION_FLAGS = Object.freeze([
  "automaticDeployment", "sqlExecuted", "migrationExecuted", "verificationExecuted",
  "projectCreated", "roleCreated", "remoteObjectChanged", "runtimeActivated",
  "adapterActivated", "networkAccessed", "repositoryAccessed",
]);

export function validateFidTestDeploymentRunbook(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze({ valid: false, errors: Object.freeze(["Runbook must be an object."]) });
  }
  if (!REQUIRED_SCOPE.every((key) => value.scope?.[key] === true)) errors.push("Scope is incomplete.");
  if (value.preflight?.length !== 24) errors.push("Exactly 24 preflight checks are required.");
  if (value.ownerRolePrerequisites?.length !== 12) errors.push("Owner-role prerequisites are incomplete.");
  if (value.managedRolePrerequisites?.length !== 6) errors.push("Managed-role checks are incomplete.");
  if (value.migrations?.length !== 13) errors.push("Exactly thirteen migrations are required.");
  value.migrations?.forEach((migration, index) => {
    const sequence = index + 1;
    if (migration.sequence !== sequence) errors.push(`Migration ${sequence} is out of order.`);
    if (migration.approvedSha256 !== FID_APPROVED_MIGRATION_HASHES[migration.filename]) {
      errors.push(`Migration ${sequence} has an unapproved hash.`);
    }
    if (!migration.preconditions?.length || !migration.expectedSuccessEvidence?.length ||
        !migration.stopConditions?.length || !migration.recoveryClassification) {
      errors.push(`Migration ${sequence} lacks governed controls.`);
    }
    if (migration.executionFunction !== null || migration.executionApproved !== false) {
      errors.push(`Migration ${sequence} exposes execution.`);
    }
  });
  if (!value.migrations?.[7]?.expectedSuccessEvidence?.some((item) => item.includes("22 required"))) {
    errors.push("Migration 008 enhanced review is incomplete.");
  }
  if (!value.migrations?.[9]?.expectedSuccessEvidence?.some((item) => item.includes("99 total"))) {
    errors.push("Migration 010 policy total is missing.");
  }
  if (!value.migrations?.[10]?.expectedSuccessEvidence?.some((item) => item.includes("Owner schema"))) {
    errors.push("Migration 011 owner privilege path is missing.");
  }
  if (!value.migrations?.[11]?.expectedSuccessEvidence?.some((item) => item.includes("Read-only"))) {
    errors.push("Migration 012 acceptance oracle is missing.");
  }
  if (EXECUTION_FLAGS.some((flag) => value[flag] !== false)) errors.push("Execution boundary is not closed.");
  if (value.credentialExclusions?.length !== 7) errors.push("Credential exclusions are incomplete.");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export const FID_TEST_DEPLOYMENT_RUNBOOK_CONFORMANCE = Object.freeze({
  contract: "FidTestDeploymentRunbookConformance",
  conformant: validateFidTestDeploymentRunbook(FID_TEST_DEPLOYMENT_RUNBOOK).valid,
  deploymentStateCount: FID_DEPLOYMENT_STATES.length,
  stepStateCount: FID_DEPLOYMENT_STEP_STATES.length,
  evidenceStateCount: FID_DEPLOYMENT_EVIDENCE_STATES.length,
  decisionTypeCount: FID_DEPLOYMENT_DECISION_TYPES.length,
  failureClassificationCount: FID_DEPLOYMENT_FAILURE_CLASSIFICATIONS.length,
  preflightCount: FID_TEST_DEPLOYMENT_RUNBOOK.preflight.length,
  migrationCount: FID_TEST_DEPLOYMENT_RUNBOOK.migrations.length,
  executionCapability: false,
  databaseConnectionCapability: false,
  credentialCapability: false,
  clientCapability: false,
  runtimeCapability: false,
  adapterCapability: false,
  networkCapability: false,
  repositoryCapability: false,
  realDataCapability: false,
  controlledRpcHandoffGated: true,
});

export default Object.freeze({
  validateFidTestDeploymentRunbook,
  FID_TEST_DEPLOYMENT_RUNBOOK_CONFORMANCE,
});
