const immutable = (value) => Object.freeze(value);

export function evaluateCanonicalProspectIdentifierMigration014ExecutionReadiness(record, evidence = {}) {
  const blocks = record?.blocks ?? {};
  const expectedRoles = ["anon", "authenticated", "fid_function_owner", "service_role"];
  const checks = immutable({
    recordPresent: record?.recordId === "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_017C3_RESULT_RECORD",
    stage1Passed: record?.stage1Status === "CONTROLLED_DEPLOYMENT_STAGE_1_PASSED",
    exactTargetAuthorized: evidence.exactTargetAuthorized === true && record?.target?.projectId === "ahmorpzcaapvoymiqlkv",
    activeTestOnlyNoProduction: record?.target?.projectState === "ACTIVE_UNPAUSED" && record?.target?.purpose === "TEST_ONLY" && record?.target?.productionTraffic === "NONE" && record?.target?.productionData === "NONE",
    platformAndGovernedClassification: record?.target?.platformBranchRole === "PRODUCTION_PRIMARY_BRANCH" && record?.target?.governedEnvironment === "DEDICATED_NON_PRODUCTION_TEST",
    preflightHashExact: evidence.preflight017c3Sha256 === record?.execution?.artifactSha256,
    preflightSucceededReadOnly: record?.execution?.completeRunSucceeded === true && record?.execution?.allTenBlocksCaptured === true && record?.execution?.sqlErrors === 0 && record?.execution?.readOnly === true && record?.execution?.databaseMutations === 0,
    postgresqlCompatible: blocks.session?.serverVersion === "17.6",
    uuidCapabilityExact: blocks.uuidCapability?.schema === "pg_catalog" && blocks.uuidCapability?.name === "gen_random_uuid" && blocks.uuidCapability?.identityArguments === "" && blocks.uuidCapability?.resultType === "uuid" && blocks.uuidCapability?.volatility === "v" && blocks.uuidCapability?.securityDefiner === false && blocks.uuidCapability?.invoked === false && blocks.uuidCapability?.generatedCount === 0,
    exactRolesPresent: Array.isArray(blocks.roles) && blocks.roles.length === 4 && expectedRoles.every((role) => blocks.roles.some((observed) => observed.name === role)),
    functionOwnerSafe: blocks.roles?.some((role) => role.name === "fid_function_owner" && !role.login && !role.superuser && !role.createRole && !role.createDb && !role.replication && !role.bypassRls && !role.inherit),
    serviceRoleCompatible: blocks.roles?.some((role) => role.name === "service_role" && !role.login && !role.superuser && role.bypassRls),
    schemaPrivilegesExact: blocks.schema?.name === "fid" && blocks.schema?.owner === "postgres" && blocks.schema?.currentUserUsage === true && blocks.schema?.currentUserCreate === true && blocks.schema?.functionOwnerUsage === true && blocks.schema?.serviceRoleUsage === true,
    noMigration014Objects: blocks.migration014ObjectConflicts?.rowCount === 0 && blocks.migration014ObjectConflicts?.tablesAbsent === 3 && blocks.migration014ObjectConflicts?.rpcAbsent === true,
    plannerEstimatesInterpreted: blocks.fidInventory?.tables?.length === 7 && blocks.fidInventory?.plannerEstimates?.every((value) => value === -1) && blocks.fidInventory?.interpretation === "UNANALYZED_PLANNER_ESTIMATES_NOT_ROW_COUNTS",
    metadataExact: blocks.migrationMetadata?.totalRows === 1 && blocks.migrationMetadata?.exactGovernedRows === 1 && blocks.migrationMetadata?.identifierOccurrences === 13 && blocks.migrationMetadata?.classification === "EXACT_MIGRATIONS_001_THROUGH_013_APPLIED_AND_VERIFIED",
    identifiersExact: blocks.migrationIdentifiers?.length === 13 && blocks.migrationIdentifiers.every((item, index) => item.ordinalPosition === index + 1 && item.occurrenceCount === 1 && item.classification === "EXACT"),
    ownershipTransferConfirmed: blocks.ownershipTransfer?.executingRole === "postgres" && blocks.ownershipTransfer?.targetOwnerRole === "fid_function_owner" && blocks.ownershipTransfer?.executingRoleIsTargetMember === true && blocks.ownershipTransfer?.executingRoleSchemaCreate === true && blocks.ownershipTransfer?.targetOwnerSchemaUsage === true && blocks.ownershipTransfer?.classification === "OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_MEMBERSHIP",
    indexesAvailable: blocks.indexConflicts?.length === 6 && blocks.indexConflicts.every((item) => item.conflictingRelationCount === 0 && item.conflictingRelationKinds === null && item.classification === "AVAILABLE"),
    migrationInventoryExact: evidence.migrationInventory === "001_THROUGH_014_EXACT" && evidence.migration015Absent === true,
    correctedHashExact: evidence.migration014Sha256 === "18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD",
    originalHashRejected: evidence.migration014Sha256 !== "3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13" && evidence.originalHashDeployable !== true,
    controlledRunbookComplete: evidence.executeOnce === true && evidence.stopOnError === true && evidence.adHocRepairProhibited === true && evidence.uncertainResponseRequiresReconciliation === true,
    postExecutionStopEstablished: evidence.postExecutionAcceptanceSeparatelyAuthorized === false && evidence.stopAfterExecution === true,
    noReviewEffects: evidence.databaseAccessDuringReview !== true && evidence.sqlExecutedDuringReview !== true && evidence.networkAccessDuringReview !== true,
  });
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => immutable({ code: `${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_FAILED` }));
  const ready = blockers.length === 0;
  return immutable({
    status: ready ? "READY_FOR_CONTROLLED_CORRECTED_MIGRATION_014_EXECUTION" : "CONTROLLED_CORRECTED_MIGRATION_014_EXECUTION_BLOCKED",
    checks,
    blockers: immutable(blockers),
    migration014ExecutionAuthorized: ready,
    executionCountAuthorized: ready ? 1 : 0,
    issuanceRpcAuthorized: false,
    prospectOperationsAuthorized: false,
    postDeploymentAcceptanceAuthorized: false,
    databaseOperationsDuringReview: 0,
    networkRequestsDuringReview: 0,
  });
}

export default Object.freeze({ evaluateCanonicalProspectIdentifierMigration014ExecutionReadiness });
