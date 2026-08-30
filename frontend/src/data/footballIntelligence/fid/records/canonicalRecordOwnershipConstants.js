export const CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION = "FID-CANONICAL-RECORD-OWNERSHIP-POLICY-1.0.0";
export const CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION = "1.0.0";

export const CANONICAL_RECORD_DOMAINS = Object.freeze({
  FOOTBALL_ENTITY: "footballEntity",
  DRAFT_SELECTION: "draftSelection",
});

export const CANONICAL_RECORD_STORAGE_ROOT = "src/data/footballIntelligence/fid/records";
export const CANONICAL_RECORD_DOMAIN_PATHS = Object.freeze({
  [CANONICAL_RECORD_DOMAINS.FOOTBALL_ENTITY]: `${CANONICAL_RECORD_STORAGE_ROOT}/footballEntity`,
  [CANONICAL_RECORD_DOMAINS.DRAFT_SELECTION]: `${CANONICAL_RECORD_STORAGE_ROOT}/draftSelection`,
});

export const CANONICAL_RECORD_REVISION_POLICY = Object.freeze({
  initialRevision: 1,
  filePattern: "revision-NNNN.js",
  directoryPattern: "records/<domain>/<record-slug>/",
  appendOnly: true,
  overwritePriorRevisionAllowed: false,
  persistenceIdRequired: false,
});

export const CANONICAL_RECORD_EXPORT_POLICY = Object.freeze({
  rootFidExportsInstances: false,
  domainContractBarrelsExportInstances: false,
  domainRecordBarrelsMayExplicitlyExportApprovedInstances: true,
  wildcardInstanceExportsAllowed: false,
  runtimeAutoRegistrationAllowed: false,
});

export const CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS = Object.freeze([
  "diagnostics", "fixtures", "examples", "researchRepository", "simulator", "components", "pages", "runtime", "generated", "persistence",
]);

export const CANONICAL_RECORD_PERSISTENCE_BOUNDARY = Object.freeze({
  sourceControlledOwns: Object.freeze(["canonical domain record ID", "contract payload", "domain revision", "evidence and provenance references", "verification", "lifecycle", "limitations"]),
  persistenceOwns: Object.freeze(["persistenceId", "database row identity", "materialization timestamp", "database requestId", "database operationId", "database batchId", "database predecessor persistence IDs", "database acceptance metadata"]),
  materializationPerformedByPolicy: false,
});

export default Object.freeze({
  CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION,
  CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION,
  CANONICAL_RECORD_DOMAINS,
  CANONICAL_RECORD_STORAGE_ROOT,
  CANONICAL_RECORD_DOMAIN_PATHS,
  CANONICAL_RECORD_REVISION_POLICY,
  CANONICAL_RECORD_EXPORT_POLICY,
  CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS,
  CANONICAL_RECORD_PERSISTENCE_BOUNDARY,
});
