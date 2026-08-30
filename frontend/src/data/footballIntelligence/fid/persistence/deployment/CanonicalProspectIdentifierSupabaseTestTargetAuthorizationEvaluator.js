const freezeResult = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeResult);
    Object.freeze(value);
  }
  return value;
};

const exact = (actual, expected) => typeof actual === "string" && actual === expected;

export function evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorization(authorization, observedTarget = {}) {
  if (!authorization || typeof authorization !== "object") {
    return freezeResult({
      status: "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED",
      decision: "BLOCK",
      blockers: [{ code: "EXACT_TARGET_AUTHORIZATION_MISSING" }],
      reviewReasons: [],
      requiredNextAction: "RESTORE_EXACT_TARGET_AUTHORIZATION",
      effects: { sqlExecuted: false, networkRequests: 0, databaseOperations: 0, persistenceOperations: 0 },
    });
  }

  const target = authorization.target ?? {};
  const governed = authorization.governedEnvironment ?? {};
  const branchRole = authorization.platformBranchRole ?? {};
  const migration = authorization.migration ?? {};
  const observedGoverned = observedTarget.governedEnvironment ?? {};
  const observedRole = observedTarget.platformBranchRole ?? {};
  const checks = {
    authorizationActive: authorization.status === "ACTIVE_UNCONSUMED" && authorization.consumed === false,
    exactMatchOnly: authorization.exactMatchOnly === true && authorization.transferable === false,
    organizationName: exact(observedTarget.organizationName, target.organizationName),
    projectName: exact(observedTarget.projectName, target.projectName),
    projectId: exact(observedTarget.projectId, target.projectId),
    region: exact(observedTarget.region, target.region),
    branchName: exact(observedTarget.branchName, target.branchName),
    platformLabel: exact(observedTarget.platformLabel, target.platformLabel),
    governedClassification: exact(observedGoverned.classification, governed.classification),
    dedicatedTest: observedGoverned.dedicatedTest === true && governed.dedicatedTest === true,
    nonProduction: observedGoverned.nonProduction === true && governed.nonProduction === true,
    productionProhibited: observedGoverned.productionProhibited === true && governed.productionProhibited === true,
    productionDataProhibited: observedGoverned.productionDataProhibited === true && governed.productionDataProhibited === true,
    canonicalIdentityCreationProhibited: observedGoverned.canonicalIdentityCreationProhibited === true && governed.canonicalIdentityCreationProhibited === true,
    canonicalRecordCreationProhibited: observedGoverned.canonicalRecordCreationProhibited === true && governed.canonicalRecordCreationProhibited === true,
    platformRoleClassification: exact(observedRole.classification, branchRole.classification),
    primaryBranch: observedRole.primaryBranch === true && branchRole.primaryBranch === true,
    previewBranchFalse: observedRole.previewBranch === false && branchRole.previewBranch === false,
    topologyExplicit: observedRole.platformLabelDefinesBranchTopology === true && branchRole.platformLabelDefinesBranchTopology === true,
    classificationIndependent: observedRole.platformLabelDoesNotOverrideGovernedProjectClassification === true && branchRole.platformLabelDoesNotOverrideGovernedProjectClassification === true,
    migrationId: exact(observedTarget.migrationId, migration.migrationId),
    correctedHash: exact(observedTarget.migrationSha256, migration.approvedMigrationSha256),
    originalHashRejected: observedTarget.migrationSha256 !== migration.prohibitedMigrationSha256,
    active: observedTarget.active === true,
    unpaused: observedTarget.paused === false,
    activityKnown: typeof observedTarget.active === "boolean" && typeof observedTarget.paused === "boolean",
    testOnlyPurposeConfirmed: observedTarget.testOnlyPurposeConfirmed === true,
    productionRuntimeInactive: observedTarget.productionRuntimeActivation === false,
    productionEdgeFunctionInactive: observedTarget.productionEdgeFunctionDeployment === false,
    productionDataAbsent: observedTarget.productionDataPresent === false,
    productionTrafficAbsent: observedTarget.productionTrafficPresent === false,
    canonicalIdentityCreationDisabled: observedTarget.canonicalIdentityCreation === false,
    canonicalRecordCreationDisabled: observedTarget.canonicalRecordCreation === false,
  };
  const reviewReasons = [];
  if (observedTarget.platformLabel == null || observedTarget.platformLabel === "") reviewReasons.push({ code: "PLATFORM_LABEL_OBSERVATION_REQUIRED" });
  const blockers = Object.entries(checks)
    .filter(([key, passed]) => !passed && !(key === "platformLabel" && reviewReasons.length > 0))
    .map(([key]) => ({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const status = blockers.length > 0
    ? "CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED"
    : reviewReasons.length > 0
      ? "CONTROLLED_DEPLOYMENT_STAGE_1_REVIEW_REQUIRED"
      : "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1";
  return freezeResult({
    authorizationId: authorization.authorizationId,
    authorizationVersion: authorization.authorizationVersion,
    status,
    decision: blockers.length > 0 ? "BLOCK" : reviewReasons.length > 0 ? "REVIEW_REQUIRED" : "PASS",
    checks,
    blockers,
    reviewReasons,
    stage2Authorized: false,
    requiredNextAction: status === "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1"
      ? "REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1_AGAINST_AUTHORIZED_EXACT_TARGET"
      : "RESOLVE_STAGE_1_TARGET_AUTHORIZATION_MISMATCH",
    effects: { sqlExecuted: false, networkRequests: 0, databaseOperations: 0, persistenceOperations: 0, uuidOperations: 0, candidateOperations: 0 },
  });
}

export function evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorizationBatch(authorizations = [], observedTargets = []) {
  const count = Math.max(authorizations.length, observedTargets.length);
  const results = Array.from({ length: count }, (_, index) => evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorization(authorizations[index], observedTargets[index]));
  return freezeResult({
    status: results.length > 0 && results.every((result) => result.status === "READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1")
      ? "BATCH_READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1"
      : "BATCH_CONTROLLED_DEPLOYMENT_STAGE_1_BLOCKED",
    results,
    deterministic: true,
    effects: { sqlExecuted: false, networkRequests: 0, databaseOperations: 0, persistenceOperations: 0 },
  });
}

export default Object.freeze({
  evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorization,
  evaluateCanonicalProspectIdentifierSupabaseTestTargetAuthorizationBatch,
});
