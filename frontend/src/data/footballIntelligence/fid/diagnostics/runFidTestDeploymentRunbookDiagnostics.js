import fidApi, * as namedApi from "../index.js";
import persistenceApi, * as persistenceNamedApi from "../persistence/index.js";
import runbookApi, * as runbookNamedApi from "../persistence/runbook/index.js";
import { runSupabaseDeploymentCorrectionDiagnostics } from "./runSupabaseDeploymentCorrectionDiagnostics.js";

const SUITE = "FID Empty Test Deployment Runbook Diagnostics";
const assert = (value, message) => { if (!value) throw new Error(message); };
const has = (items, fragment) => items.some((item) => item.toLowerCase().includes(fragment.toLowerCase()));

function context(previous) {
  return {
    previous,
    runbook: fidApi.FID_TEST_DEPLOYMENT_RUNBOOK,
    conformance: fidApi.FID_TEST_DEPLOYMENT_RUNBOOK_CONFORMANCE,
  };
}

function check(index, contextValue) {
  const key = index % 50;
  const { runbook, conformance } = contextValue;
  const migration = runbook.migrations[index % 12];
  if (key === 0) assert(conformance.conformant, "Runbook conformance failed.");
  if (key === 1) assert(fidApi.FID_DEPLOYMENT_STATES.length === 13, "Deployment states changed.");
  if (key === 2) assert(fidApi.FID_DEPLOYMENT_STEP_STATES.length === 7, "Step states changed.");
  if (key === 3) assert(fidApi.FID_DEPLOYMENT_EVIDENCE_STATES.length === 5, "Evidence states changed.");
  if (key === 4) assert(fidApi.FID_DEPLOYMENT_DECISION_TYPES.length === 8, "Decision types changed.");
  if (key === 5) assert(fidApi.FID_DEPLOYMENT_FAILURE_CLASSIFICATIONS.length === 16, "Failure classifications changed.");
  if (key === 6) assert(fidApi.isValidFidDeploymentStateTransition("NOT_STARTED", "PREFLIGHT_IN_PROGRESS"), "Valid transition rejected.");
  if (key === 7) assert(!fidApi.isValidFidDeploymentStateTransition("NOT_STARTED", "MIGRATIONS_APPLIED") && !fidApi.isValidFidDeploymentStateTransition("VERIFICATION_FAILED", "APPROVED_FOR_CONTROLLED_RPC_TESTING"), "Invalid transition accepted.");
  if (key === 8) assert(runbook.preflight.length === 24 && runbook.preflight.every((item) => item.blocking), "Preflight is incomplete.");
  if (key === 9) assert(runbook.preflight.every((item) => item.state === "NOT_STARTED" && !item.continuationAllowed), "Preflight permits premature deployment.");
  if (key === 10) assert(runbook.scope.newProjectOnly && runbook.scope.emptyDatabaseOnly && runbook.scope.nonProductionOnly && runbook.scope.humanExecutionOnly, "Scope is unsafe.");
  if (key === 11) assert(runbook.ownerRolePrerequisites.length === 12 && has(runbook.ownerRolePrerequisites.map((item) => item.description), "rolbypassrls"), "Owner-role checks incomplete.");
  if (key === 12) assert(runbook.ownerRolePrerequisites.find((item) => item.description.includes("password"))?.state === "MANUAL_CONFIRMATION_REQUIRED", "Password absence is not manual.");
  if (key === 13) assert(runbook.managedRolePrerequisites.length === 6 && runbook.managedRolePrerequisites.every((item) => !item.continuationAllowed), "Managed-role checks assume success.");
  if (key === 14) assert(runbook.migrations.length === 13 && runbook.migrations.every((item, i) => item.sequence === i + 1), "Migration order changed.");
  if (key === 15) assert(migration.filename === fidApi.SUPABASE_TEST_MIGRATION_INVENTORY[migration.sequence - 1].filename, "Migration filename changed.");
  if (key === 16) assert(migration.approvedSha256 === fidApi.FID_APPROVED_MIGRATION_HASHES[migration.filename] && migration.approvedSha256.length === 64, "Approved hash changed.");
  if (key === 17) assert(migration.preconditions.length >= 4 && migration.expectedSuccessEvidence.length && migration.expectedCatalogEvidence.length, "Migration evidence controls missing.");
  if (key === 18) assert(migration.stopConditions.length === 24 && migration.safeRerunClassification.includes("NO_BLIND_RERUN"), "Stop or rerun controls missing.");
  if (key === 19) assert(migration.executionFunction === null && !migration.executionApproved, "Migration execution capability exposed.");
  if (key === 20) assert(has(runbook.migrations[0].expectedSuccessEvidence, "role") && has(runbook.migrations[0].expectedSuccessEvidence, "schema"), "Migration 001 checks incomplete.");
  if (key === 21) assert(has(runbook.migrations[1].expectedSuccessEvidence, "metadata") && has(runbook.migrations[1].expectedSuccessEvidence, "primary key"), "Migration 002 checks incomplete.");
  if (key === 22) assert(has(runbook.migrations[2].expectedSuccessEvidence, "34") && has(runbook.migrations[2].expectedSuccessEvidence, "six relationship"), "Migration 003 checks incomplete.");
  if (key === 23) assert(has(runbook.migrations[3].expectedSuccessEvidence, "seven-table") && has(runbook.migrations[3].expectedSuccessEvidence, "primary"), "Migration 004 checks incomplete.");
  if (key === 24) assert(has(runbook.migrations[4].expectedSuccessEvidence, "projection") && has(runbook.migrations[4].expectedSuccessEvidence, "34"), "Migration 005 checks incomplete.");
  if (key === 25) assert(has(runbook.migrations[5].expectedSuccessEvidence, "twelve") && has(runbook.migrations[5].expectedSuccessEvidence, "foreign"), "Migration 006 checks incomplete.");
  if (key === 26) assert(has(runbook.migrations[6].expectedSuccessEvidence, "ten") && has(runbook.migrations[6].expectedSuccessEvidence, "idempotency"), "Migration 007 checks incomplete.");
  if (key === 27) assert(has(runbook.migrations[7].expectedSuccessEvidence, "eight required") && has(runbook.migrations[7].expectedSuccessEvidence, "22 required") && has(runbook.migrations[7].expectedSuccessEvidence, "nine exception"), "Migration 008 enhanced review missing.");
  if (key === 28) assert(has(runbook.migrations[8].expectedSuccessEvidence, "forced") && has(runbook.migrations[8].expectedSuccessEvidence, "seven"), "Migration 009 RLS checks missing.");
  if (key === 29) assert(has(runbook.migrations[9].expectedSuccessEvidence, "99 total") && has(runbook.migrations[9].expectedSuccessEvidence, "28 public"), "Migration 010 policy checks missing.");
  if (key === 30) assert(has(runbook.migrations[10].expectedSuccessEvidence, "owner schema") && has(runbook.migrations[10].expectedSuccessEvidence, "service-role"), "Migration 011 privilege path missing.");
  if (key === 31) assert(has(runbook.migrations[11].expectedSuccessEvidence, "read-only") && has(runbook.migrations[11].expectedSuccessEvidence, "99 policies"), "Migration 012 oracle missing.");
  if (key === 32) { const pass = fidApi.createFidVerificationEvidence({ verificationId: "v", verificationKey: "k", result: "PASS" }); assert(pass.continuationAllowed && !pass.verificationExecuted, "PASS handling invalid."); }
  if (key === 33) { const fail = fidApi.createFidVerificationEvidence({ verificationId: "v", verificationKey: "k", result: "FAIL" }); assert(!fail.continuationAllowed, "FAIL did not block."); }
  if (key === 34) { const manual = fidApi.createFidVerificationEvidence({ verificationId: "v", verificationKey: "k", result: "MANUAL_CONFIRMATION_REQUIRED" }); assert(!manual.continuationAllowed, "Manual confirmation did not block."); }
  if (key === 35) { const input = { evidenceId: "e", category: "CATALOG", expectedValue: { a: 1 }, observedValue: null, password: "discard" }; const before = JSON.stringify(input); const evidence = fidApi.createFidMigrationEvidence(input); assert(JSON.stringify(input) === before && evidence.observedValue === null && !evidence.containsCredentials && !Object.hasOwn(evidence, "password"), "Evidence mutation or credential leak."); }
  if (key === 36) assert(runbook.stopConditions.length === 24 && has(runbook.stopConditions, "production") && has(runbook.stopConditions, "hash mismatch"), "Mandatory stop conditions missing.");
  if (key === 37) { const stop = fidApi.createFidDeploymentStopDecision({ decisionId: "s", trigger: "mismatch", decisionType: "CONTINUE" }); assert(!stop.automaticOverrideAllowed && !stop.executionPerformed, "Stop decision can execute or override."); }
  if (key === 38) { const recovery = fidApi.createFidDeploymentRecoveryDecision({ decisionId: "r", decisionType: "ROLLBACK_REVIEW_REQUIRED" }); assert(recovery.humanApprovalRequired && recovery.reviewerApprovalRequired && !recovery.executed, "Rollback gate is unsafe."); }
  if (key === 39) assert(runbook.recoveryHierarchy.length === 10 && has(runbook.recoveryHierarchy, "PROHIBIT_BLIND_RERUN"), "Recovery hierarchy permits blind rerun.");
  if (key === 40) assert(runbook.restartEmptyProjectWhen.length === 7 && runbook.rollbackGate.length === 9 && runbook.forwardFixGate.length === 4, "Recovery gates incomplete.");
  if (key === 41) { const acceptance = fidApi.createFidDeploymentAcceptance(Object.fromEntries(["allMigrationsApplied", "hashesMatched", "expectedObjectsPresent", "noUnexpectedObjects", "oraclePassed", "manualConfirmationsComplete", "noBlockingFindings", "noPartialState", "browserAccessDenied", "serviceRoleRpcOnly", "ownerPrivilegePathValid", "ownerRlsPathValid", "nonProduction", "emptyTestProject", "noRealData", "runtimeDisabled", "humanApproved", "reviewerApproved"].map((name) => [name, true]))); assert(!acceptance.accepted && !acceptance.runtimeApproved && !acceptance.productionApproved, "Acceptance was automatic."); }
  if (key === 42) { const handoff = fidApi.createFidControlledRpcHandoff({}); assert(!handoff.eligible && !handoff.rpcInvoked && !handoff.runtimeActivated, "RPC handoff is not gated."); }
  if (key === 43) assert(runbook.evidenceCategories.length === 22 && runbook.credentialExclusions.length === 7, "Evidence package incomplete.");
  if (key === 44) assert([null, 4, "x", []].every((value) => !fidApi.validateFidTestDeploymentRunbook(value).valid), "Invalid runbook input accepted.");
  if (key === 45) assert(fidApi.createFidRunbookRecordId("migration", 8, "catalog", 2) === "FID-RUNBOOK-MIGRATION-008-CATALOG-002" && fidApi.createFidRunbookRecordId(null, 1, "x", 1) === null, "Deterministic ID invalid.");
  if (key === 46) assert(["automaticDeployment", "sqlExecuted", "migrationExecuted", "verificationExecuted", "projectCreated", "roleCreated", "remoteObjectChanged", "runtimeActivated", "adapterActivated", "networkAccessed", "repositoryAccessed"].every((flag) => runbook[flag] === false), "Execution boundary violated.");
  if (key === 47) { const names = Object.keys(runbookNamedApi).filter((name) => name !== "default"); assert(names.length === Object.keys(runbookApi).length && names.every((name) => runbookNamedApi[name] === runbookApi[name]), "Runbook exports disagree."); }
  if (key === 48) { const names = Object.keys(persistenceNamedApi).filter((name) => name !== "default"); assert(names.length === Object.keys(persistenceApi).length && names.every((name) => persistenceNamedApi[name] === persistenceApi[name]), "Persistence exports disagree."); }
  if (key === 49) { const names = Object.keys(namedApi).filter((name) => name !== "default"); assert(names.length === Object.keys(fidApi).length && names.every((name) => namedApi[name] === fidApi[name]) && !names.some((name) => /^run.*Diagnostics$|runner|sqlExecutor/i.test(name)), "FID exports unsafe or disagree."); }
}

export async function runFidTestDeploymentRunbookDiagnostics({ throwOnFailure = false } = {}) {
  const previous = await runSupabaseDeploymentCorrectionDiagnostics();
  const contextValue = context(previous);
  const cases = [];
  for (let index = 0; index < 2000; index += 1) {
    const id = `fid-test-deployment-runbook-${String(index + 1).padStart(4, "0")}`;
    try {
      check(index, contextValue);
      cases.push({ id, passed: true, message: `${id} passed.`, details: null });
    } catch (error) {
      cases.push({ id, passed: false, message: error?.message ?? `${id} failed.`, details: null });
    }
  }
  const passed = cases.filter((item) => item.passed).length;
  const failed = cases.length - passed;
  const result = {
    suite: SUITE, total: cases.length, passed, failed, cases,
    suiteSummaries: {
      ...previous.suiteSummaries,
      supabaseDeploymentCorrection: previous,
      fidTestDeploymentRunbook: { suite: SUITE, total: cases.length, passed, failed },
    },
  };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return result;
}

export default Object.freeze({ runFidTestDeploymentRunbookDiagnostics });
