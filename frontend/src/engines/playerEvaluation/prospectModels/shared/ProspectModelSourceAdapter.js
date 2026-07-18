import {
  DATA_STATES,
  EVIDENCE_LEVELS,
  isIntelligenceResult,
} from "../../../contracts/IntelligenceResultContract.js";
import {
  PROSPECT_CONTRIBUTOR_ROLES,
} from "../ProspectPositionModelContract.js";

export const PROSPECT_SOURCE_USABILITY_REASONS = {
  USABLE_SCORE: "USABLE_SCORE",
  USEFUL_CONTEXT_ONLY: "USEFUL_CONTEXT_ONLY",
  UNAVAILABLE_SOURCE: "UNAVAILABLE_SOURCE",
  NULL_SCORE: "NULL_SCORE",
  INVALID_SOURCE_RESULT: "INVALID_SOURCE_RESULT",
  SOURCE_VALIDATION_ERROR: "SOURCE_VALIDATION_ERROR",
  NONSCORING_DATA_STATE: "NONSCORING_DATA_STATE",
  DOMAIN_MISMATCH: "DOMAIN_MISMATCH",
};

function isObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function createValidation() {
  return { valid: true, errors: [], warnings: [] };
}

function createEntry(code, path, message) {
  return {
    code:
      typeof code === "string" && code.trim()
        ? code.trim()
        : "SOURCE_ADAPTER_VALIDATION",
    path: typeof path === "string" ? path : "",
    message: typeof message === "string" ? message : "",
  };
}

function addEntry(validation, field, code, path, message) {
  const entry = createEntry(code, path, message);
  const key = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;
  const exists = validation[field].some(
    (candidate) =>
      `${candidate.code}\u0000${candidate.path}\u0000${candidate.message}` ===
      key
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

function normalizeArray(
  value,
  validation,
  path
) {
  if (value == null) return [];

  if (!Array.isArray(value)) {
    addWarning(
      validation,
      "INVALID_SOURCE_ARRAY",
      path,
      `${path} must be an array.`
    );
    return [];
  }

  return value.filter((entry) => {
    const valid =
      entry != null &&
      typeof entry !== "function" &&
      typeof entry !== "symbol" &&
      !(typeof entry === "string" && !entry.trim());

    if (!valid) {
      addWarning(
        validation,
        "INVALID_SOURCE_ARRAY_ENTRY",
        path,
        `${path} contains an unsafe or empty entry.`
      );
    }

    return valid;
  });
}

function normalizeStringArray(
  value,
  validation,
  path
) {
  if (value == null) return [];

  if (!Array.isArray(value)) {
    addWarning(
      validation,
      "INVALID_SOURCE_ARRAY",
      path,
      `${path} must be an array.`
    );
    return [];
  }

  const normalized = [];
  const seen = new Set();

  value.forEach((entry) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addWarning(
        validation,
        "INVALID_SOURCE_ARRAY_ENTRY",
        path,
        `${path} contains a non-string or empty entry.`
      );
      return;
    }

    const string = entry.trim();

    if (seen.has(string)) {
      addWarning(
        validation,
        "DUPLICATE_SOURCE_ARRAY_ENTRY",
        path,
        `Duplicate entry removed: ${string}.`
      );
      return;
    }

    seen.add(string);
    normalized.push(string);
  });

  return normalized;
}

function normalizeScore(value, validation) {
  if (value == null) return null;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    addError(
      validation,
      "INVALID_SOURCE_SCORE",
      "score",
      "Source score must be a finite number from 0 to 100 or null."
    );
    return null;
  }

  return value;
}

function normalizeConfidence(value, validation) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    addError(
      validation,
      "INVALID_SOURCE_CONFIDENCE",
      "confidence",
      "Source confidence must be a finite number from 0 to 1."
    );
    return 0;
  }

  return value;
}

function normalizeDataState(
  value,
  available,
  validation
) {
  const fallback = available
    ? DATA_STATES.AVAILABLE
    : DATA_STATES.UNAVAILABLE;

  if (value == null) return fallback;

  if (!Object.values(DATA_STATES).includes(value)) {
    addError(
      validation,
      "INVALID_SOURCE_DATA_STATE",
      "dataState",
      "Source data state is not a public DATA_STATES value."
    );
    return fallback;
  }

  return value;
}

function normalizeEvidenceLevel(value, validation) {
  if (value == null) return EVIDENCE_LEVELS.NONE;

  if (!Object.values(EVIDENCE_LEVELS).includes(value)) {
    addError(
      validation,
      "INVALID_SOURCE_EVIDENCE_LEVEL",
      "evidenceLevel",
      "Source evidence level is not a public EVIDENCE_LEVELS value."
    );
    return EVIDENCE_LEVELS.NONE;
  }

  return value;
}

function normalizeVersions(value, validation) {
  if (value == null) {
    return { framework: null, model: null, data: null };
  }

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_SOURCE_VERSIONS",
      "versions",
      "Source versions must be an object."
    );
    return { framework: null, model: null, data: null };
  }

  const normalizeVersion = (
    version,
    path,
    allowNumber = false
  ) => {
    if (version == null) return null;

    if (
      typeof version !== "string" &&
      !(allowNumber &&
        typeof version === "number" &&
        Number.isFinite(version))
    ) {
      addError(
        validation,
        "INVALID_SOURCE_VERSION",
        path,
        "Source version must be a string or null."
      );
      return null;
    }

    return version;
  };

  return {
    framework: normalizeVersion(
      value.framework,
      "versions.framework"
    ),
    model: normalizeVersion(
      value.model,
      "versions.model"
    ),
    data: normalizeVersion(
      value.data,
      "versions.data",
      true
    ),
  };
}

function projectSourceValidation(value, validation) {
  if (value == null) return false;

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_SOURCE_VALIDATION",
      "validation",
      "Source validation metadata must be an object."
    );
    return true;
  }

  const errors = Array.isArray(value.errors)
    ? value.errors
    : [];
  const warnings = Array.isArray(value.warnings)
    ? value.warnings
    : [];

  if (
    value.errors != null &&
    !Array.isArray(value.errors)
  ) {
    addError(
      validation,
      "INVALID_SOURCE_VALIDATION",
      "validation.errors",
      "Source validation errors must be an array."
    );
  }

  if (
    value.warnings != null &&
    !Array.isArray(value.warnings)
  ) {
    addWarning(
      validation,
      "INVALID_SOURCE_VALIDATION",
      "validation.warnings",
      "Source validation warnings must be an array."
    );
  }

  errors.forEach((entry, index) => {
    addError(
      validation,
      "SOURCE_VALIDATION_ERROR",
      `validation.errors[${index}]`,
      typeof entry?.message === "string"
        ? entry.message
        : "Source declared a validation error."
    );
  });

  if (value.valid === false && errors.length === 0) {
    addError(
      validation,
      "SOURCE_VALIDATION_ERROR",
      "validation.valid",
      "Source declared invalid validation metadata."
    );
  }
  warnings.forEach((entry, index) => {
    addWarning(
      validation,
      "SOURCE_VALIDATION_WARNING",
      `validation.warnings[${index}]`,
      typeof entry?.message === "string"
        ? entry.message
        : "Source declared a validation warning."
    );
  });

  return errors.length > 0 || value.valid === false;
}

function hasUsefulContext({
  score,
  value,
  evidence,
  missingEvidence,
  sources,
  result,
  dataState,
}) {
  return Boolean(
    score != null ||
      value != null ||
      evidence.length ||
      missingEvidence.length ||
      sources.length ||
      (typeof result?.summary === "string" &&
        result.summary.trim()) ||
      [
        DATA_STATES.UNAVAILABLE,
        DATA_STATES.UNKNOWN,
        DATA_STATES.INSUFFICIENT_SAMPLE,
        DATA_STATES.NOT_APPLICABLE,
      ].includes(dataState)
  );
}

export function readProspectIntelligenceSource(
  result,
  { expectedDomain = null } = {}
) {
  const validation = createValidation();
  const sourceResult =
    result !== null && typeof result === "object"
      ? result
      : null;
  const validShape = isIntelligenceResult(result);

  if (!validShape) {
    addError(
      validation,
      "INVALID_SOURCE_RESULT",
      "",
      "Source must satisfy the standardized IntelligenceResult shape."
    );

    return {
      sourceResult,
      validShape: false,
      domain: null,
      available: false,
      dataState: DATA_STATES.UNAVAILABLE,
      score: null,
      value: null,
      confidence: 0,
      evidenceLevel: EVIDENCE_LEVELS.NONE,
      evidence: [],
      missingEvidence: [],
      sources: [],
      versions: {
        framework: null,
        model: null,
        data: null,
      },
      usability: {
        usableForScore: false,
        usableForContext: false,
        reason:
          PROSPECT_SOURCE_USABILITY_REASONS
            .INVALID_SOURCE_RESULT,
      },
      validation,
    };
  }

  const domain = result.domain;
  const available = result.available;
  const score = normalizeScore(result.score, validation);
  const confidence = normalizeConfidence(
    result.confidence,
    validation
  );
  const evidenceLevel = normalizeEvidenceLevel(
    result.evidenceLevel,
    validation
  );
  const dataState = normalizeDataState(
    result.dataState,
    available,
    validation
  );
  const evidence = normalizeArray(
    result.evidence,
    validation,
    "evidence"
  );
  const missingEvidence = normalizeStringArray(
    result.missingEvidence,
    validation,
    "missingEvidence"
  );
  const sources = normalizeArray(
    result.sources,
    validation,
    "sources"
  );
  const versions = normalizeVersions(
    result.versions,
    validation
  );

  let invalidExpectedDomain = false;
  let domainMismatch = false;

  if (
    expectedDomain != null &&
    (typeof expectedDomain !== "string" ||
      !expectedDomain.trim())
  ) {
    invalidExpectedDomain = true;
    addError(
      validation,
      "INVALID_EXPECTED_DOMAIN",
      "expectedDomain",
      "Expected domain must be a non-empty string or null."
    );
  } else if (
    typeof expectedDomain === "string" &&
    expectedDomain.trim() !== domain
  ) {
    domainMismatch = true;
    addError(
      validation,
      "DOMAIN_MISMATCH",
      "domain",
      `Expected domain ${expectedDomain.trim()} but received ${domain}.`
    );
  }

  const sourceValidationError =
    projectSourceValidation(
      result.validation,
      validation
    );
  const usefulContext = hasUsefulContext({
    score,
    value: result.value ?? null,
    evidence,
    missingEvidence,
    sources,
    result,
    dataState,
  });
  const scoringState =
    dataState === DATA_STATES.AVAILABLE;
  const adapterHasBlockingError =
    validation.errors.length > 0;

  let reason;

  // Deterministic precedence: shape, domain, source validation,
  // availability, data state, adapter safety, score, context, null.
  if (domainMismatch) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS.DOMAIN_MISMATCH;
  } else if (sourceValidationError) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS
        .SOURCE_VALIDATION_ERROR;
  } else if (!available) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS
        .UNAVAILABLE_SOURCE;
  } else if (!scoringState) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS
        .NONSCORING_DATA_STATE;
  } else if (
    invalidExpectedDomain ||
    adapterHasBlockingError
  ) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS
        .INVALID_SOURCE_RESULT;
  } else if (score != null) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS.USABLE_SCORE;
  } else if (usefulContext) {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS
        .USEFUL_CONTEXT_ONLY;
  } else {
    reason =
      PROSPECT_SOURCE_USABILITY_REASONS.NULL_SCORE;
  }

  const usableForScore = Boolean(
    validShape &&
      !domainMismatch &&
      !invalidExpectedDomain &&
      available &&
      scoringState &&
      score != null &&
      !sourceValidationError &&
      !adapterHasBlockingError
  );

  return {
    sourceResult,
    validShape,
    domain,
    available,
    dataState,
    score,
    value: result.value ?? null,
    confidence,
    evidenceLevel,
    evidence,
    missingEvidence,
    sources,
    versions,
    usability: {
      usableForScore,
      usableForContext: usefulContext,
      reason,
    },
    validation,
  };
}

function normalizeString(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function normalizeContributorArray(value) {
  if (!Array.isArray(value)) return [];

  const result = [];
  const seen = new Set();

  value.forEach((entry) => {
    if (typeof entry !== "string" || !entry.trim()) return;
    const normalized = entry.trim();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function createProspectContributor({
  contributorId = null,
  domain = null,
  role,
  source,
  evidenceRefs = [],
  contributedToScore = false,
  contributedToOverallGrade = false,
  componentKeys = [],
  exclusionReason = null,
  notes = [],
} = {}) {
  const safeSource = isObject(source) ? source : {};
  const available = Boolean(safeSource.available);
  const dataState = Object.values(DATA_STATES).includes(
    safeSource.dataState
  )
    ? safeSource.dataState
    : available
    ? DATA_STATES.AVAILABLE
    : DATA_STATES.UNAVAILABLE;
  const confidence =
    typeof safeSource.confidence === "number" &&
    Number.isFinite(safeSource.confidence) &&
    safeSource.confidence >= 0 &&
    safeSource.confidence <= 1
      ? safeSource.confidence
      : 0;
  const evidenceLevel = Object.values(
    EVIDENCE_LEVELS
  ).includes(safeSource.evidenceLevel)
    ? safeSource.evidenceLevel
    : EVIDENCE_LEVELS.NONE;
  const versions = isObject(safeSource.versions)
    ? safeSource.versions
    : {};
  const explicitDomain =
    domain == null ? null : normalizeString(domain);

  return {
    contributorId: normalizeString(contributorId),
    domain:
      domain == null
        ? normalizeString(safeSource.domain)
        : explicitDomain,
    role: Object.values(
      PROSPECT_CONTRIBUTOR_ROLES
    ).includes(role)
      ? role
      : PROSPECT_CONTRIBUTOR_ROLES.CONTEXT_ONLY,
    available,
    dataState,
    confidence,
    evidenceLevel,
    versions: {
      framework: normalizeString(versions.framework),
      model: normalizeString(versions.model),
      data:
        typeof versions.data === "number" &&
        Number.isFinite(versions.data)
          ? versions.data
          : normalizeString(versions.data),
    },
    evidenceRefs: normalizeContributorArray(evidenceRefs),
    contributedToScore:
      contributedToScore === true,
    contributedToOverallGrade:
      contributedToOverallGrade === true,
    componentKeys: normalizeContributorArray(componentKeys),
    exclusionReason: normalizeString(exclusionReason),
    notes: Array.isArray(notes) ? [...notes] : [],
  };
}

export default {
  PROSPECT_SOURCE_USABILITY_REASONS,
  readProspectIntelligenceSource,
  createProspectContributor,
};
