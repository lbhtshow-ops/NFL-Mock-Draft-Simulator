const exactEvidence = Object.freeze({
  resultSetPresent: true,
  allResultSetsComplete: true,
  requiredColumnsComplete: true,
  projectIdentitySeparatelyConfirmed: true,
  target: Object.freeze({ projectId: "ahmorpzcaapvoymiqlkv", database: "Primary Database", branch: "main", sqlRole: "postgres" }),
  currentUser: "postgres",
  sessionUser: "postgres",
  schema: "fid",
  governedRolesExact: true,
  membership: Object.freeze({ member: true, admin: true, inherit: false, set: false }),
  ownerRole: Object.freeze({ login: false, superuser: false, createdb: false, createrole: false, replication: false, bypassrls: false, inherit: false }),
  schemaPrivileges: Object.freeze({ ownerUsage: true, ownerCreate: false, postgresGrantAuthority: true, effectiveCreateWithoutGrantAuthority: false, ownerCreateOnOtherGovernedSchemas: false }),
  aclMatrix: Object.freeze({
    corrected261UnitsExact: true,
    sevenBaselineTablesExact: true,
    ownerPrivilegesExact: true,
    serviceRoleBoundaryExact: true,
    browserAndPublicDenialsExact: true,
    functionBoundaryExact: true,
    noUnexpectedTable: true,
    noUnexpectedFunction: true,
    noSequenceInFid: true,
    noUnexpectedOwnership: true,
    noUnexpectedGrantOption: true,
    directAndEffectiveRelationshipsExact: true,
  }),
  migrationState: Object.freeze({
    migration014ObjectsAbsent: true,
    migration014MetadataAbsent: true,
    fullyRolledBack: true,
    migrations001Through013Governed: true,
  }),
});

export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C23_RESULT_SCENARIOS = Object.freeze({
  exact: exactEvidence,
  incomplete: Object.freeze({ ...exactEvidence, allResultSetsComplete: false }),
  executionFailed: Object.freeze({ ...exactEvidence, sqlError: "sanitized_sql_error" }),
  reviewRequired: Object.freeze({ ...exactEvidence, projectIdentitySeparatelyConfirmed: false }),
  blocked: Object.freeze({
    ...exactEvidence,
    membership: Object.freeze({ ...exactEvidence.membership, set: true }),
  }),
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_017C23_RESULT_SCENARIOS;
