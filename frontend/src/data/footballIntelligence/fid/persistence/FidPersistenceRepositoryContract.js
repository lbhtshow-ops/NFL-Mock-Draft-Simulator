import {
  FID_PERSISTENCE_ERROR_CODES,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES,
} from "./FidPersistenceArchitectureSpecification.js";

export const FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME = "FidPersistenceRepositoryContract";
export const FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION = "FID-PERSISTENCE-REPOSITORY-1.0.0";
export const FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION = "FID-PERSISTENCE-REPOSITORY-SCHEMA-1.0.0";
export const FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES = Object.freeze({
  IN_MEMORY: "IN_MEMORY",
  FUTURE_DATABASE_ADAPTER: "FUTURE_DATABASE_ADAPTER",
});
export const FID_PERSISTENCE_REQUIRED_OPERATIONS = Object.freeze([
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.CREATE_VERSION,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.GET_BY_PERSISTENCE_ID,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.GET_LATEST_BY_RECORD_ID,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.LIST_VERSIONS,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.QUERY_RECORDS,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.RECORD_EXISTS,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.PERSISTENCE_ID_EXISTS,
  FID_PERSISTENCE_REPOSITORY_CAPABILITIES.HEALTH_CHECK,
]);
export const FID_PERSISTENCE_REVISION_POLICY = Object.freeze({
  name: "STRICT_SEQUENTIAL_APPEND",
  firstRevision: 1,
  positiveIntegersOnly: true,
  gapsAllowed: false,
  callerSupplied: true,
  generatedByRepository: false,
});
export const FID_PERSISTENCE_DATE_BOUNDARY_POLICY = Object.freeze({
  effectiveBoundsInclusive: true,
  persistedBoundsInclusive: true,
  currentClockInferenceAllowed: false,
});
export const FID_PERSISTENCE_REFERENCE_QUERY_LOCATIONS = Object.freeze([
  "sourceRecordRefs",
  "promotionRefs",
  "replacedByRef",
  "supersedesRef",
  "payload.references.researchSourceRefs",
  "payload.references.evidenceArtifactRefs",
  "payload.sourceRefs",
  "payload.evidenceRefs",
]);

const CONTRACT_KEYS = new Set([
  "adapterType",
  "requiredOperations",
  "optionalAdapterOperations",
  "revisionPolicy",
  "dateBoundaryPolicy",
  "referenceQueryLocations",
  "resultContract",
  "errorContract",
  "errorCodes",
  "concurrencyBoundary",
  "metadata",
]);

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function validationShape() {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: null,
    contractVersion: FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
    schemaVersion: FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
  };
}

function addError(validation, code, path, message) {
  if (!validation.errors.some((entry) => entry.code === code && entry.path === path)) {
    validation.errors.push({ code, path, message });
  }
  validation.valid = false;
}

function normalizeContract(input = {}) {
  const validation = validationShape();
  const value = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_REPOSITORY_CONTRACT", "", "Repository contract input must be an object.");
  const unknownKeys = Object.keys(value).filter((key) => !CONTRACT_KEYS.has(key) && !["contract", "contractVersion", "schemaVersion", "validation"].includes(key));
  if (unknownKeys.length) addError(validation, "UNSUPPORTED_REPOSITORY_CONTRACT_FIELD", unknownKeys[0], `Unsupported repository contract field: ${unknownKeys[0]}.`);
  const adapterType = value.adapterType ?? FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES.IN_MEMORY;
  if (!Object.values(FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES).includes(adapterType)) addError(validation, "UNKNOWN_ADAPTER_TYPE", "adapterType", "adapterType is not recognized.");
  const requiredOperations = value.requiredOperations == null ? [...FID_PERSISTENCE_REQUIRED_OPERATIONS] : clone(value.requiredOperations);
  if (!Array.isArray(requiredOperations) || requiredOperations.some((entry) => typeof entry !== "string" || !entry.trim())) addError(validation, "INVALID_REQUIRED_OPERATIONS", "requiredOperations", "requiredOperations must contain operation identifiers.");
  const operationValues = Array.isArray(requiredOperations) ? requiredOperations : [];
  if (new Set(operationValues).size !== operationValues.length) addError(validation, "DUPLICATE_REQUIRED_OPERATION", "requiredOperations", "Required operation identifiers must be unique.");
  FID_PERSISTENCE_REQUIRED_OPERATIONS.forEach((operation) => {
    if (!operationValues.includes(operation)) addError(validation, "MISSING_REQUIRED_OPERATION", "requiredOperations", `Required repository operation missing: ${operation}.`);
  });
  if (operationValues.includes("clear")) addError(validation, "ADAPTER_UTILITY_IN_GENERAL_CONTRACT", "requiredOperations", "clear is adapter-specific and cannot be required by the general repository contract.");
  const metadata = isObject(value.metadata) ? clone(value.metadata) : {};
  if (value.metadata != null && !isObject(value.metadata)) addError(validation, "INVALID_METADATA", "metadata", "metadata must be an object or null.");
  validation.valid = validation.errors.length === 0;
  return {
    contract: FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME,
    contractVersion: FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
    schemaVersion: FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
    adapterType: Object.values(FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES).includes(adapterType) ? adapterType : null,
    requiredOperations: operationValues,
    optionalAdapterOperations: ["clear"],
    revisionPolicy: { ...FID_PERSISTENCE_REVISION_POLICY },
    dateBoundaryPolicy: { ...FID_PERSISTENCE_DATE_BOUNDARY_POLICY },
    referenceQueryLocations: [...FID_PERSISTENCE_REFERENCE_QUERY_LOCATIONS],
    resultContract: "createFidRepositoryResult",
    errorContract: "createFidPersistenceError",
    errorCodes: [...Object.values(FID_PERSISTENCE_ERROR_CODES)],
    concurrencyBoundary: {
      inMemorySingleProcessOnly: true,
      crossProcessGuarantees: false,
      futureAdaptersRequireTransactionalUniqueness: true,
    },
    metadata,
    validation,
  };
}

export function createFidPersistenceRepositoryContract(input = {}) {
  return normalizeContract(input);
}

export function validateFidPersistenceRepositoryContract(value) {
  return normalizeContract(value).validation;
}

export function isFidPersistenceRepositoryContract(value) {
  return Boolean(isObject(value)
    && value.contract === FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME
    && value.contractVersion === FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION
    && value.schemaVersion === FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION
    && validateFidPersistenceRepositoryContract(value).valid);
}

export function validateFidPersistenceRepository(repository) {
  const validation = validationShape();
  if (!isObject(repository)) {
    addError(validation, "INVALID_REPOSITORY", "", "Repository must be an object.");
    return validation;
  }
  FID_PERSISTENCE_REQUIRED_OPERATIONS.forEach((operation) => {
    if (typeof repository[operation] !== "function") addError(validation, "MISSING_REPOSITORY_OPERATION", operation, `Repository operation missing: ${operation}.`);
  });
  if (Object.hasOwn(repository, "records") || Object.hasOwn(repository, "versions") || Object.hasOwn(repository, "indexes")) addError(validation, "INTERNAL_STORAGE_EXPOSED", "", "Repository exposes internal storage.");
  validation.valid = validation.errors.length === 0;
  return validation;
}

export function isFidPersistenceRepository(repository) {
  return validateFidPersistenceRepository(repository).valid;
}

export default Object.freeze({
  FID_PERSISTENCE_REPOSITORY_CONTRACT_NAME,
  FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
  FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
  FID_PERSISTENCE_REPOSITORY_ADAPTER_TYPES,
  FID_PERSISTENCE_REQUIRED_OPERATIONS,
  FID_PERSISTENCE_REVISION_POLICY,
  FID_PERSISTENCE_DATE_BOUNDARY_POLICY,
  FID_PERSISTENCE_REFERENCE_QUERY_LOCATIONS,
  createFidPersistenceRepositoryContract,
  validateFidPersistenceRepositoryContract,
  isFidPersistenceRepositoryContract,
  validateFidPersistenceRepository,
  isFidPersistenceRepository,
});
