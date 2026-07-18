import {
  RESEARCH_ROLES,
  RESEARCH_SOURCE_ACCESS_TYPES,
  RESEARCH_SOURCE_CLASSES,
  RESEARCH_SOURCE_CONTRACT_NAME,
  RESEARCH_SOURCE_CONTRACT_VERSION,
  RESEARCH_SOURCE_SCHEMA_VERSION,
  RESEARCH_SOURCE_STATUSES,
  RESEARCH_VERIFICATION_REQUIREMENTS,
} from "../constants/researchSourceConstants.js";

function isObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function createValidationResult(checkedAt = null) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: normalizeOptionalString(checkedAt),
    contractVersion: RESEARCH_SOURCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SOURCE_SCHEMA_VERSION,
  };
}

function createValidationEntry(code, path, message) {
  return {
    code:
      typeof code === "string" && code.trim()
        ? code.trim()
        : "RESEARCH_SOURCE_VALIDATION",
    path: typeof path === "string" ? path : "",
    message: typeof message === "string" ? message : "",
  };
}

function addEntry(validation, field, code, path, message) {
  const entry = createValidationEntry(code, path, message);
  const identity = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;
  const exists = validation[field].some(
    (candidate) =>
      `${candidate.code}\u0000${candidate.path}\u0000${candidate.message}` ===
      identity
  );

  if (!exists) validation[field].push(entry);
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addEntry(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addEntry(validation, "warnings", code, path, message);
}

function mergeValidation(target, source) {
  (source?.errors || []).forEach((entry) =>
    addError(
      target,
      entry.code,
      entry.path,
      entry.message
    )
  );
  (source?.warnings || []).forEach((entry) =>
    addWarning(
      target,
      entry.code,
      entry.path,
      entry.message
    )
  );
  return target;
}

function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function normalizeString(
  value,
  path,
  validation,
  { required = false } = {}
) {
  if (value == null || value === "") {
    if (required) {
      addError(
        validation,
        "MISSING_REQUIRED_FIELD",
        path,
        `${path} is required.`
      );
    }
    return null;
  }

  if (typeof value !== "string" || !value.trim()) {
    addError(
      validation,
      "INVALID_STRING",
      path,
      `${path} must be a non-empty string or null.`
    );
    return null;
  }

  return value.trim();
}

function normalizeEnum(
  value,
  allowed,
  path,
  validation,
  { required = false } = {}
) {
  if (value == null || value === "") {
    if (required) {
      addError(
        validation,
        "MISSING_REQUIRED_FIELD",
        path,
        `${path} is required.`
      );
    }
    return null;
  }

  if (!Object.values(allowed).includes(value)) {
    addError(
      validation,
      "UNRECOGNIZED_ENUM_VALUE",
      path,
      `${path} is not a recognized value.`
    );
    return null;
  }

  return value;
}

function normalizeBoolean(value, path, validation) {
  if (value == null) return null;

  if (typeof value !== "boolean") {
    addError(
      validation,
      "INVALID_BOOLEAN",
      path,
      `${path} must be a boolean or null.`
    );
    return null;
  }

  return value;
}

function normalizeStringArray(
  value,
  path,
  validation,
  { allowed = null, invalidCode = "INVALID_ARRAY_ENTRY" } = {}
) {
  if (value == null) return [];

  if (!Array.isArray(value)) {
    addError(
      validation,
      "INVALID_ARRAY",
      path,
      `${path} must be an array.`
    );
    return [];
  }

  const normalized = [];
  const seen = new Set();

  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addError(
        validation,
        invalidCode,
        `${path}[${index}]`,
        `${path} contains an invalid value.`
      );
      return;
    }

    const item = entry.trim();

    if (allowed && !Object.values(allowed).includes(item)) {
      addError(
        validation,
        invalidCode,
        `${path}[${index}]`,
        `${item} is not recognized for ${path}.`
      );
      return;
    }

    if (seen.has(item)) {
      addWarning(
        validation,
        "DUPLICATE_NORMALIZED_VALUE",
        path,
        `Duplicate value removed from ${path}: ${item}.`
      );
      return;
    }

    seen.add(item);
    normalized.push(item);
  });

  return normalized;
}

function normalizeNestedObject(
  value,
  path,
  validation,
  normalizer
) {
  if (value == null) return normalizer({});

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_NESTED_STRUCTURE",
      path,
      `${path} must be an object or null.`
    );
    return normalizer({});
  }

  return normalizer(value);
}

function normalizeAuthorityByDomain(
  value,
  validation
) {
  if (value == null) return {};

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_AUTHORITY_BY_DOMAIN",
      "authorityByDomain",
      "authorityByDomain must be an object or null."
    );
    return {};
  }

  const result = {};

  Object.entries(value).forEach(([domain, authority]) => {
    const normalizedDomain = normalizeOptionalString(domain);

    if (!normalizedDomain) {
      addError(
        validation,
        "INVALID_AUTHORITY_DOMAIN",
        "authorityByDomain",
        "Authority domain keys must be non-empty strings."
      );
      return;
    }

    if (
      authority !== null &&
      (typeof authority !== "string" || !authority.trim())
    ) {
      addError(
        validation,
        "INVALID_AUTHORITY_DECLARATION",
        `authorityByDomain.${normalizedDomain}`,
        "Domain authority must be declared text or null; numeric ratings are not supported."
      );
      result[normalizedDomain] = null;
      return;
    }

    result[normalizedDomain] =
      authority === null ? null : authority.trim();
  });

  return result;
}

function normalizeResearchSource(input, checkedAt = null) {
  const validation = createValidationResult(checkedAt);
  const source = isObject(input) ? input : {};

  if (!isObject(input)) {
    addError(
      validation,
      "INVALID_RESEARCH_SOURCE_INPUT",
      "",
      "Research source input must be an object."
    );
  }

  const normalized = {
    contract: RESEARCH_SOURCE_CONTRACT_NAME,
    contractVersion: RESEARCH_SOURCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SOURCE_SCHEMA_VERSION,
    sourceId: normalizeString(
      source.sourceId,
      "sourceId",
      validation,
      { required: true }
    ),
    name: normalizeString(
      source.name,
      "name",
      validation,
      { required: true }
    ),
    sourceClass: normalizeEnum(
      source.sourceClass,
      RESEARCH_SOURCE_CLASSES,
      "sourceClass",
      validation,
      { required: true }
    ),
    status: normalizeEnum(
      source.status,
      RESEARCH_SOURCE_STATUSES,
      "status",
      validation,
      { required: true }
    ),
    description: normalizeString(
      source.description,
      "description",
      validation
    ),
    domains: normalizeStringArray(
      source.domains,
      "domains",
      validation
    ),
    permittedRoles: normalizeStringArray(
      source.permittedRoles,
      "permittedRoles",
      validation,
      {
        allowed: RESEARCH_ROLES,
        invalidCode: "INVALID_RESEARCH_ROLE",
      }
    ),
    prohibitedRoles: normalizeStringArray(
      source.prohibitedRoles,
      "prohibitedRoles",
      validation,
      {
        allowed: RESEARCH_ROLES,
        invalidCode: "INVALID_RESEARCH_ROLE",
      }
    ),
    independenceGroup: normalizeString(
      source.independenceGroup,
      "independenceGroup",
      validation
    ),
    methodology: normalizeNestedObject(
      source.methodology,
      "methodology",
      validation,
      (value) => ({
        available: normalizeBoolean(
          value.available,
          "methodology.available",
          validation
        ),
        publicDescription: normalizeString(
          value.publicDescription,
          "methodology.publicDescription",
          validation
        ),
        methodologyRef: normalizeString(
          value.methodologyRef,
          "methodology.methodologyRef",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "methodology.notes",
          validation
        ),
      })
    ),
    access: normalizeNestedObject(
      source.access,
      "access",
      validation,
      (value) => ({
        type: normalizeEnum(
          value.type,
          RESEARCH_SOURCE_ACCESS_TYPES,
          "access.type",
          validation,
          { required: true }
        ),
        location: normalizeString(
          value.location,
          "access.location",
          validation
        ),
        requiresAuthentication: normalizeBoolean(
          value.requiresAuthentication,
          "access.requiresAuthentication",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "access.notes",
          validation
        ),
      })
    ),
    authorityByDomain: normalizeAuthorityByDomain(
      source.authorityByDomain,
      validation
    ),
    usageRestrictions: normalizeNestedObject(
      source.usageRestrictions,
      "usageRestrictions",
      validation,
      (value) => ({
        rawContentStorageAllowed: normalizeBoolean(
          value.rawContentStorageAllowed,
          "usageRestrictions.rawContentStorageAllowed",
          validation
        ),
        quotationAllowed: normalizeBoolean(
          value.quotationAllowed,
          "usageRestrictions.quotationAllowed",
          validation
        ),
        derivedFactsAllowed: normalizeBoolean(
          value.derivedFactsAllowed,
          "usageRestrictions.derivedFactsAllowed",
          validation
        ),
        redistributionAllowed: normalizeBoolean(
          value.redistributionAllowed,
          "usageRestrictions.redistributionAllowed",
          validation
        ),
        attributionRequired: normalizeBoolean(
          value.attributionRequired,
          "usageRestrictions.attributionRequired",
          validation
        ),
        licenseRef: normalizeString(
          value.licenseRef,
          "usageRestrictions.licenseRef",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "usageRestrictions.notes",
          validation
        ),
      })
    ),
    conflicts: normalizeNestedObject(
      source.conflicts,
      "conflicts",
      validation,
      (value) => ({
        disclosed: normalizeBoolean(
          value.disclosed,
          "conflicts.disclosed",
          validation
        ),
        subjects: normalizeStringArray(
          value.subjects,
          "conflicts.subjects",
          validation
        ),
        organizations: normalizeStringArray(
          value.organizations,
          "conflicts.organizations",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "conflicts.notes",
          validation
        ),
      })
    ),
    verificationRequirements: normalizeStringArray(
      source.verificationRequirements,
      "verificationRequirements",
      validation,
      {
        allowed: RESEARCH_VERIFICATION_REQUIREMENTS,
        invalidCode: "INVALID_VERIFICATION_REQUIREMENT",
      }
    ),
    provenance: normalizeNestedObject(
      source.provenance,
      "provenance",
      validation,
      (value) => ({
        createdBy: normalizeString(
          value.createdBy,
          "provenance.createdBy",
          validation
        ),
        createdAt: normalizeString(
          value.createdAt,
          "provenance.createdAt",
          validation
        ),
        updatedBy: normalizeString(
          value.updatedBy,
          "provenance.updatedBy",
          validation
        ),
        updatedAt: normalizeString(
          value.updatedAt,
          "provenance.updatedAt",
          validation
        ),
      })
    ),
    review: normalizeNestedObject(
      source.review,
      "review",
      validation,
      (value) => ({
        lastReviewedAt: normalizeString(
          value.lastReviewedAt,
          "review.lastReviewedAt",
          validation
        ),
        nextReviewAt: normalizeString(
          value.nextReviewAt,
          "review.nextReviewAt",
          validation
        ),
        reviewedBy: normalizeString(
          value.reviewedBy,
          "review.reviewedBy",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "review.notes",
          validation
        ),
      })
    ),
    metadata: normalizeNestedObject(
      source.metadata,
      "metadata",
      validation,
      (value) => ({
        tags: normalizeStringArray(
          value.tags,
          "metadata.tags",
          validation
        ),
        notes: normalizeString(
          value.notes,
          "metadata.notes",
          validation
        ),
      })
    ),
    validation: null,
  };

  normalized.permittedRoles.forEach((role) => {
    if (normalized.prohibitedRoles.includes(role)) {
      addError(
        validation,
        "CONFLICTING_RESEARCH_ROLE",
        "permittedRoles",
        `${role} cannot be both permitted and prohibited.`
      );
    }
  });

  if (
    normalized.status ===
      RESEARCH_SOURCE_STATUSES.APPROVED &&
    normalized.permittedRoles.length === 0
  ) {
    addError(
      validation,
      "APPROVED_SOURCE_REQUIRES_PERMITTED_ROLE",
      "permittedRoles",
      "An approved source requires at least one permitted role."
    );
  }

  if (
    normalized.status ===
      RESEARCH_SOURCE_STATUSES.APPROVED &&
    normalized.verificationRequirements.length === 0
  ) {
    addError(
      validation,
      "APPROVED_SOURCE_REQUIRES_VERIFICATION",
      "verificationRequirements",
      "An approved source requires at least one verification requirement."
    );
  }

  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createResearchSource(
  input = {},
  { checkedAt = null } = {}
) {
  return normalizeResearchSource(input, checkedAt);
}

export function createUnavailableResearchSource(
  input = {},
  { checkedAt = null } = {}
) {
  const result = normalizeResearchSource(input, checkedAt);
  const unavailableValidation = createValidationResult(checkedAt);
  addError(
    unavailableValidation,
    "RESEARCH_SOURCE_UNAVAILABLE",
    "",
    "No usable research source record is available."
  );
  result.validation = mergeValidation(
    result.validation,
    unavailableValidation
  );
  return result;
}

export function validateResearchSource(
  value,
  { checkedAt = value?.validation?.checkedAt ?? null } = {}
) {
  return normalizeResearchSource(value, checkedAt).validation;
}

export function isResearchSource(value) {
  return Boolean(
    isObject(value) &&
      value.contract === RESEARCH_SOURCE_CONTRACT_NAME &&
      value.contractVersion ===
        RESEARCH_SOURCE_CONTRACT_VERSION &&
      value.schemaVersion ===
        RESEARCH_SOURCE_SCHEMA_VERSION &&
      isObject(value.methodology) &&
      isObject(value.access) &&
      isObject(value.usageRestrictions) &&
      isObject(value.conflicts) &&
      isObject(value.provenance) &&
      isObject(value.review) &&
      isObject(value.metadata) &&
      isObject(value.validation)
  );
}

export function isApprovedResearchSource(value) {
  return Boolean(
    isResearchSource(value) &&
      value.status === RESEARCH_SOURCE_STATUSES.APPROVED &&
      validateResearchSource(value).valid
  );
}

export default Object.freeze({
  RESEARCH_SOURCE_CONTRACT_NAME,
  RESEARCH_SOURCE_CONTRACT_VERSION,
  RESEARCH_SOURCE_SCHEMA_VERSION,
  createResearchSource,
  createUnavailableResearchSource,
  validateResearchSource,
  isResearchSource,
  isApprovedResearchSource,
});
