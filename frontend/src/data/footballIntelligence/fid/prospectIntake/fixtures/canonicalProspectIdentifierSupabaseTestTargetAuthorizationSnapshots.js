import authorization from "../../persistence/deployment/CanonicalProspectIdentifierSupabaseTestTargetAuthorization.js";

const baseline = Object.freeze({
  ...authorization.target,
  governedEnvironment: authorization.governedEnvironment,
  platformBranchRole: authorization.platformBranchRole,
  migrationId: authorization.migration.migrationId,
  migrationSha256: authorization.migration.approvedMigrationSha256,
  active: true,
  paused: false,
  testOnlyPurposeConfirmed: true,
  productionRuntimeActivation: false,
  productionEdgeFunctionDeployment: false,
  productionDataPresent: false,
  productionTrafficPresent: false,
  canonicalIdentityCreation: false,
  canonicalRecordCreation: false,
});

const scenario = (id, patch, expectedStatus) => Object.freeze({ id, observedTarget: Object.freeze({ ...baseline, ...patch }), expectedStatus });

export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_TARGET_AUTHORIZATION_SCENARIOS = Object.freeze([
  scenario("exact-authorized-target-and-label", {}, "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1"),
  scenario("wrong-organization", { organizationName: "Another Organization" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("wrong-project-name", { projectName: "Another Test Project" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("wrong-project-id", { projectId: "sanitized-wrong-project-id" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("wrong-region", { region: "us-west-1" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("wrong-branch", { branchName: "preview" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("platform-label-absent", { platformLabel: null }, "CONTROLLED_DEPLOYMENT_STAGE_1_REVIEW_REQUIRED"),
  scenario("platform-label-differs", { platformLabel: "PREVIEW" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("governed-environment-missing", { governedEnvironment: null }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("governed-environment-production", { governedEnvironment: { ...authorization.governedEnvironment, classification: "PRODUCTION", nonProduction: false } }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("project-paused", { paused: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("project-activity-unknown", { active: null, paused: null }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("corrected-hash-matches", {}, "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1"),
  scenario("original-hash-supplied", { migrationSha256: authorization.migration.prohibitedMigrationSha256 }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("different-migration", { migrationId: "013" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("authorization-reused-another-project", { projectName: "Production", projectId: "sanitized-production-project" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("production-edge-function", { productionEdgeFunctionDeployment: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("production-data-permitted", { productionDataPresent: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("canonical-identity-permitted", { canonicalIdentityCreation: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("exact-primary-branch-exact-test-project", {}, "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1"),
  scenario("display-name-match-project-id-differs", { projectId: "sanitized-different-id" }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("production-runtime-activation", { productionRuntimeActivation: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
  scenario("canonical-record-creation", { canonicalRecordCreation: true }, "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"),
]);

export const CANONICAL_PROSPECT_IDENTIFIER_FOUR_PROSPECT_COHORT_DECLARATION = Object.freeze([
  "cohort-prospect-01",
  "cohort-prospect-02",
  "cohort-prospect-03",
  "cohort-prospect-04",
].map((prospectRef) => Object.freeze({
  prospectRef,
  declaredOnly: true,
  uuidCount: 0,
  candidateCount: 0,
  collisionCheckCount: 0,
  persistenceCount: 0,
  identityCreationCount: 0,
  recordCreationCount: 0,
  deploymentCount: 0,
})));

export default Object.freeze({
  baseline,
  scenarios: CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_TEST_TARGET_AUTHORIZATION_SCENARIOS,
  cohort: CANONICAL_PROSPECT_IDENTIFIER_FOUR_PROSPECT_COHORT_DECLARATION,
});
