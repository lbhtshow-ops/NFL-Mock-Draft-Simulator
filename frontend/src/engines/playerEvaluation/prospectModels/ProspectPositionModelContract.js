import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract";

export const PROSPECT_POSITION_MODEL_CONTRACT_VERSION =
  "PROSPECT-POSITION-MODEL-CONTRACT-1.0.0";

export const PROSPECT_AGGREGATION_METHODS = {
  NONE: "NONE",
  WEIGHTED_COMPONENTS: "WEIGHTED_COMPONENTS",
  MANUAL_GRADE: "MANUAL_GRADE",
};

export const PROSPECT_CONTRIBUTOR_ROLES = {
  DIRECT: "DIRECT",
  SUPPORTING: "SUPPORTING",
  CONTEXT_ONLY: "CONTEXT_ONLY",
  EXCLUDED: "EXCLUDED",
};

const COMPONENT_CONTRACT = "ProspectComponentResult";
const MODEL_CONTRACT = "ProspectPositionModelResult";
const WEIGHT_TOLERANCE = 0.0001;

function createValidation() {
  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

function createValidationEntry(
  code,
  path,
  message
) {
  return {
    code:
      typeof code === "string" && code.trim()
        ? code.trim()
        : "VALIDATION_ERROR",
    path:
      typeof path === "string" ? path : "",
    message:
      typeof message === "string" ? message : "",
  };
}

function normalizeValidationEntry(value = {}) {
  return createValidationEntry(
    value?.code,
    value?.path,
    value?.message
  );
}

function addError(
  validation,
  code,
  path,
  message
) {
  validation.errors.push(
    createValidationEntry(code, path, message)
  );
  validation.valid = false;
}

function addWarning(
  validation,
  code,
  path,
  message
) {
  validation.warnings.push(
    createValidationEntry(code, path, message)
  );
}

function mergeValidation(...results) {
  const merged = createValidation();
  const errorKeys = new Set();
  const warningKeys = new Set();

  results.filter(Boolean).forEach((result) => {
    const errors = Array.isArray(result?.errors)
      ? result.errors
      : [];
    const warnings = Array.isArray(result?.warnings)
      ? result.warnings
      : [];

    errors.map(normalizeValidationEntry).forEach((entry) => {
      const key = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;

      if (!errorKeys.has(key)) {
        errorKeys.add(key);
        merged.errors.push(entry);
      }
    });
    warnings.map(normalizeValidationEntry).forEach((entry) => {
      const key = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;

      if (!warningKeys.has(key)) {
        warningKeys.add(key);
        merged.warnings.push(entry);
      }
    });
  });

  merged.valid = merged.errors.length === 0;

  return merged;
}

function isObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStringArray(
  value,
  validation = null,
  path = ""
) {
  if (!Array.isArray(value)) return [];

  const result = [];
  const seen = new Set();

  value.forEach((item) => {
    if (
      typeof item !== "string" ||
      !item.trim()
    ) {
      return;
    }

    const normalized = item.trim();

    if (seen.has(normalized)) {
      if (validation) {
        addWarning(
          validation,
          "DUPLICATE_STRING_ENTRY",
          path,
          `Duplicate entry removed: ${normalized}.`
        );
      }
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

function normalizeGrade(
  value,
  validation,
  path
) {
  if (value == null) return null;

  if (!isFiniteNumber(value)) {
    addError(
      validation,
      "INVALID_GRADE",
      path,
      "Grade must be a finite number from 0 to 100."
    );
    return null;
  }

  if (value < 0 || value > 100) {
    addError(
      validation,
      "GRADE_OUT_OF_RANGE",
      path,
      "Grade must be between 0 and 100."
    );
    return null;
  }

  return Math.round(value);
}

function normalizeConfidence(
  value,
  validation,
  path
) {
  if (value == null) return 0;

  if (!isFiniteNumber(value)) {
    addError(
      validation,
      "INVALID_CONFIDENCE",
      path,
      "Confidence must be a finite number from 0 to 1."
    );
    return 0;
  }

  if (value < 0 || value > 1) {
    addError(
      validation,
      "CONFIDENCE_OUT_OF_RANGE",
      path,
      "Confidence must be between 0 and 1."
    );
    return Math.max(0, Math.min(1, value));
  }

  return value;
}

function deriveEvidenceLevel(confidence = 0) {
  if (confidence >= 0.9) {
    return EVIDENCE_LEVELS.VERY_STRONG;
  }

  if (confidence >= 0.75) {
    return EVIDENCE_LEVELS.STRONG;
  }

  if (confidence >= 0.5) {
    return EVIDENCE_LEVELS.MODERATE;
  }

  if (confidence > 0) {
    return EVIDENCE_LEVELS.LIMITED;
  }

  return EVIDENCE_LEVELS.NONE;
}

function normalizeEvidenceLevel(
  value,
  confidence,
  validation,
  path
) {
  if (value == null) {
    return deriveEvidenceLevel(confidence);
  }

  if (!Object.values(EVIDENCE_LEVELS).includes(value)) {
    addError(
      validation,
      "INVALID_EVIDENCE_LEVEL",
      path,
      "Evidence level must be a public EVIDENCE_LEVELS value."
    );
    return deriveEvidenceLevel(confidence);
  }

  return value;
}

function deriveDataState(available) {
  return available
    ? DATA_STATES.AVAILABLE
    : DATA_STATES.UNAVAILABLE;
}

function normalizeDataState(
  value,
  available,
  validation,
  path
) {
  if (value == null) {
    return deriveDataState(available);
  }

  if (!Object.values(DATA_STATES).includes(value)) {
    addError(
      validation,
      "INVALID_DATA_STATE",
      path,
      "Data state must be a public DATA_STATES value."
    );
    return deriveDataState(available);
  }

  return value;
}

function normalizeVersions(value = {}) {
  const versions = isObject(value) ? value : {};

  return {
    framework:
      typeof versions.framework === "string"
        ? versions.framework
        : null,
    model:
      typeof versions.model === "string"
        ? versions.model
        : null,
    data:
      typeof versions.data === "string" ||
      typeof versions.data === "number"
        ? versions.data
        : null,
  };
}

function normalizeContributor(
  value = {},
  validation,
  path
) {
  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_CONTRIBUTOR",
      path,
      "Contributor must be an object."
    );
  }

  const contributor = isObject(value) ? value : {};
  const available = Boolean(contributor.available);
  const confidence = normalizeConfidence(
    contributor.confidence,
    validation,
    `${path}.confidence`
  );

  let role = contributor.role;

  if (
    !Object.values(PROSPECT_CONTRIBUTOR_ROLES)
      .includes(role)
  ) {
    if (role != null) {
      addError(
        validation,
        "INVALID_CONTRIBUTOR_ROLE",
        `${path}.role`,
        "Contributor role is not supported."
      );
    }
    role = PROSPECT_CONTRIBUTOR_ROLES.CONTEXT_ONLY;
  }

  return {
    contributorId:
      typeof contributor.contributorId === "string"
        ? contributor.contributorId
        : null,
    domain:
      typeof contributor.domain === "string"
        ? contributor.domain
        : null,
    role,

    available,
    dataState: normalizeDataState(
      contributor.dataState,
      available,
      validation,
      `${path}.dataState`
    ),
    confidence,
    evidenceLevel: normalizeEvidenceLevel(
      contributor.evidenceLevel,
      confidence,
      validation,
      `${path}.evidenceLevel`
    ),

    versions: normalizeVersions(
      contributor.versions
    ),

    evidenceRefs: normalizeStringArray(
      contributor.evidenceRefs,
      validation,
      `${path}.evidenceRefs`
    ),

    contributedToScore: Boolean(
      contributor.contributedToScore
    ),
    contributedToOverallGrade: Boolean(
      contributor.contributedToOverallGrade
    ),

    componentKeys: normalizeStringArray(
      contributor.componentKeys,
      validation,
      `${path}.componentKeys`
    ),

    exclusionReason:
      typeof contributor.exclusionReason === "string"
        ? contributor.exclusionReason
        : null,
    notes: normalizeArray(contributor.notes),
  };
}

function normalizeProvenance(
  value = {},
  validation,
  path
) {
  const provenance = isObject(value) ? value : {};
  const contributors = Array.isArray(
    provenance.contributors
  )
    ? provenance.contributors
    : [];

  return {
    contributors: contributors.map(
      (contributor, index) =>
        normalizeContributor(
          contributor,
          validation,
          `${path}.contributors[${index}]`
        )
    ),
  };
}

function normalizeConclusions(value = {}) {
  const conclusions = isObject(value) ? value : {};

  return {
    archetype: conclusions.archetype ?? null,
    readiness: conclusions.readiness ?? null,
    ceiling: conclusions.ceiling ?? null,
    floor: conclusions.floor ?? null,
    riskProfile: conclusions.riskProfile ?? null,
    translationRisk:
      conclusions.translationRisk ?? null,
    roleProjection:
      conclusions.roleProjection ?? null,
    developmentPriorities: normalizeArray(
      conclusions.developmentPriorities
    ),
  };
}

function normalizeComponentExplanation(value = {}) {
  const explanation = isObject(value) ? value : {};

  return {
    scoreRationale: normalizeArray(
      explanation.scoreRationale
    ),
    supportingEvidence: normalizeArray(
      explanation.supportingEvidence
    ),
    conflictingEvidence: normalizeArray(
      explanation.conflictingEvidence
    ),
    missingEvidence: normalizeArray(
      explanation.missingEvidence
    ),
    confidenceRationale: normalizeArray(
      explanation.confidenceRationale
    ),
    developmentImplications: normalizeArray(
      explanation.developmentImplications
    ),
  };
}

function normalizeExplanation(value = {}) {
  const explanation = isObject(value) ? value : {};
  const componentExplanations = isObject(
    explanation.componentExplanations
  )
    ? explanation.componentExplanations
    : {};

  return {
    strengths: normalizeArray(explanation.strengths),
    concerns: normalizeArray(explanation.concerns),
    contextualFactors: normalizeArray(
      explanation.contextualFactors
    ),
    componentExplanations: Object.entries(
      componentExplanations
    ).reduce((result, [key, entry]) => {
      result[key] = normalizeComponentExplanation(entry);
      return result;
    }, {}),
  };
}

function normalizeWeightMap(
  value,
  validation,
  path
) {
  if (!isObject(value)) return {};

  return Object.entries(value).reduce(
    (result, [key, weight]) => {
      if (!isFiniteNumber(weight) || weight < 0) {
        addError(
          validation,
          "INVALID_WEIGHT",
          `${path}.${key}`,
          "Weight must be a finite nonnegative number."
        );
        return result;
      }

      result[key] = weight;
      return result;
    },
    {}
  );
}

function normalizeOptionalCap(
  value,
  maximum,
  validation,
  path
) {
  if (value == null) return null;

  if (
    !isFiniteNumber(value) ||
    value < 0 ||
    value > maximum
  ) {
    addError(
      validation,
      "INVALID_CAP",
      path,
      `Cap must be between 0 and ${maximum}.`
    );
    return null;
  }

  return value;
}

function normalizeExcludedComponents(
  value,
  validation,
  path
) {
  if (!Array.isArray(value)) return [];

  const result = [];
  const seen = new Set();

  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(
        validation,
        "INVALID_EXCLUDED_COMPONENT",
        `${path}[${index}]`,
        "Excluded component must be an object."
      );
      return;
    }

    const key =
      typeof entry.key === "string"
        ? entry.key.trim()
        : "";
    const reason =
      typeof entry.reason === "string"
        ? entry.reason.trim()
        : "";

    if (!key || !reason) {
      addError(
        validation,
        "INVALID_EXCLUDED_COMPONENT",
        `${path}[${index}]`,
        "Excluded component requires key and reason."
      );
      return;
    }

    if (seen.has(key)) {
      addWarning(
        validation,
        "DUPLICATE_COMPONENT_REFERENCE",
        path,
        `Duplicate excluded component removed: ${key}.`
      );
      return;
    }

    seen.add(key);
    result.push({ key, reason });
  });

  return result;
}

function normalizeAggregation(
  value = {},
  validation
) {
  const aggregation = isObject(value) ? value : {};
  let method = aggregation.method;

  if (method == null) {
    method = PROSPECT_AGGREGATION_METHODS.NONE;
  } else if (
    !Object.values(PROSPECT_AGGREGATION_METHODS)
      .includes(method)
  ) {
    addError(
      validation,
      "INVALID_AGGREGATION_METHOD",
      "aggregation.method",
      "Aggregation method is not supported."
    );
    method = PROSPECT_AGGREGATION_METHODS.NONE;
  }

  const requestedWeightTotal =
    aggregation.requestedWeightTotal == null
      ? 0
      : isFiniteNumber(
          aggregation.requestedWeightTotal
        )
      ? aggregation.requestedWeightTotal
      : 0;

  const appliedWeightTotal =
    aggregation.appliedWeightTotal == null
      ? 0
      : isFiniteNumber(
          aggregation.appliedWeightTotal
        )
      ? aggregation.appliedWeightTotal
      : 0;

  if (
    aggregation.requestedWeightTotal != null &&
    !isFiniteNumber(aggregation.requestedWeightTotal)
  ) {
    addError(
      validation,
      "INVALID_WEIGHT_TOTAL",
      "aggregation.requestedWeightTotal",
      "Requested weight total must be finite."
    );
  }

  if (
    aggregation.appliedWeightTotal != null &&
    !isFiniteNumber(aggregation.appliedWeightTotal)
  ) {
    addError(
      validation,
      "INVALID_WEIGHT_TOTAL",
      "aggregation.appliedWeightTotal",
      "Applied weight total must be finite."
    );
  }

  return {
    method,
    includedComponents: normalizeStringArray(
      aggregation.includedComponents,
      validation,
      "aggregation.includedComponents"
    ),
    excludedComponents: normalizeExcludedComponents(
      aggregation.excludedComponents,
      validation,
      "aggregation.excludedComponents"
    ),
    requestedWeights: normalizeWeightMap(
      aggregation.requestedWeights,
      validation,
      "aggregation.requestedWeights"
    ),
    appliedWeights: normalizeWeightMap(
      aggregation.appliedWeights,
      validation,
      "aggregation.appliedWeights"
    ),
    requestedWeightTotal,
    appliedWeightTotal,
    normalizationApplied: Boolean(
      aggregation.normalizationApplied
    ),
    criticalMissingComponents: normalizeStringArray(
      aggregation.criticalMissingComponents,
      validation,
      "aggregation.criticalMissingComponents"
    ),
    confidenceCap: normalizeOptionalCap(
      aggregation.confidenceCap,
      1,
      validation,
      "aggregation.confidenceCap"
    ),
    gradeCap: normalizeOptionalCap(
      aggregation.gradeCap,
      100,
      validation,
      "aggregation.gradeCap"
    ),
    notes: normalizeArray(aggregation.notes),
  };
}

function normalizeModelVersions(value = {}) {
  const versions = isObject(value) ? value : {};

  return {
    contract:
      PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
    model:
      typeof versions.model === "string" &&
      versions.model.trim()
        ? versions.model.trim()
        : null,
    weights:
      typeof versions.weights === "string" &&
      versions.weights.trim()
        ? versions.weights.trim()
        : null,
    data:
      typeof versions.data === "string" ||
      typeof versions.data === "number"
        ? versions.data
        : null,
  };
}

function normalizeDiagnostics(
  value,
  validation,
  path
) {
  if (value == null) return null;

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_DIAGNOSTICS",
      path,
      "Diagnostics must be an object or null."
    );
    return null;
  }

  return value;
}

function hasDuplicates(value) {
  if (!Array.isArray(value)) return false;

  const strings = value.filter(
    (item) => typeof item === "string"
  );

  return new Set(strings).size !== strings.length;
}

function validateAvailability(
  value,
  validation,
  path = ""
) {
  if (typeof value?.available !== "boolean") {
    addError(
      validation,
      "INVALID_AVAILABILITY",
      `${path}available`,
      "Available must be boolean."
    );
    return;
  }

  if (
    value.available &&
    [
      DATA_STATES.UNAVAILABLE,
      DATA_STATES.UNKNOWN,
      DATA_STATES.NOT_APPLICABLE,
    ].includes(value.dataState)
  ) {
    addError(
      validation,
      "AVAILABILITY_STATE_CONFLICT",
      `${path}dataState`,
      "Available result cannot use an unavailable data state."
    );
  }

  if (
    !value.available &&
    value.dataState === DATA_STATES.AVAILABLE
  ) {
    addError(
      validation,
      "AVAILABILITY_STATE_CONFLICT",
      `${path}dataState`,
      "Unavailable result cannot use AVAILABLE data state."
    );
  }
}

function validateContributor(
  contributor,
  validation,
  path
) {
  if (!isObject(contributor)) {
    addError(
      validation,
      "INVALID_CONTRIBUTOR",
      path,
      "Contributor must be an object."
    );
    return;
  }

  if (
    !Object.values(PROSPECT_CONTRIBUTOR_ROLES)
      .includes(contributor.role)
  ) {
    addError(
      validation,
      "INVALID_CONTRIBUTOR_ROLE",
      `${path}.role`,
      "Contributor role is not supported."
    );
  }

  if (
    !isFiniteNumber(contributor.confidence) ||
    contributor.confidence < 0 ||
    contributor.confidence > 1
  ) {
    addError(
      validation,
      "INVALID_CONFIDENCE",
      `${path}.confidence`,
      "Contributor confidence must be from 0 to 1."
    );
  }

  if (
    !Object.values(DATA_STATES).includes(
      contributor.dataState
    )
  ) {
    addError(
      validation,
      "INVALID_DATA_STATE",
      `${path}.dataState`,
      "Contributor data state is invalid."
    );
  }

  if (
    !Object.values(EVIDENCE_LEVELS).includes(
      contributor.evidenceLevel
    )
  ) {
    addError(
      validation,
      "INVALID_EVIDENCE_LEVEL",
      `${path}.evidenceLevel`,
      "Contributor evidence level is invalid."
    );
  }

  if (
    contributor.role ===
      PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED &&
    !contributor.exclusionReason
  ) {
    addWarning(
      validation,
      "MISSING_EXCLUSION_REASON",
      `${path}.exclusionReason`,
      "Excluded contributor should include a reason."
    );
  }
}

export function isProspectComponentResult(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.contract === COMPONENT_CONTRACT &&
      Object.prototype.hasOwnProperty.call(
        value,
        "key"
      ) &&
      typeof value.available === "boolean" &&
      Object.prototype.hasOwnProperty.call(
        value,
        "dataState"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "score"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "confidence"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "evidenceLevel"
      )
  );
}

export function isProspectPositionModelResult(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.contract === MODEL_CONTRACT &&
      Object.prototype.hasOwnProperty.call(
        value,
        "model"
      ) &&
      typeof value.available === "boolean" &&
      Object.prototype.hasOwnProperty.call(
        value,
        "dataState"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "overallGrade"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "confidence"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "evidenceLevel"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "components"
      ) &&
      Object.prototype.hasOwnProperty.call(
        value,
        "versions"
      )
  );
}

export function validateProspectComponentResult(
  value
) {
  const validation = createValidation();

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_COMPONENT_RESULT",
      "",
      "Component result must be an object."
    );
    return validation;
  }

  if (value.contract !== COMPONENT_CONTRACT) {
    addError(
      validation,
      "INVALID_CONTRACT_IDENTIFIER",
      "contract",
      `Contract must equal ${COMPONENT_CONTRACT}.`
    );
  }

  if (
    typeof value.key !== "string" ||
    !value.key.trim()
  ) {
    addError(
      validation,
      "INVALID_COMPONENT_KEY",
      "key",
      "Component key must be a non-empty string."
    );
  }

  if (
    value.score != null &&
    (!isFiniteNumber(value.score) ||
      value.score < 0 ||
      value.score > 100)
  ) {
    addError(
      validation,
      "INVALID_COMPONENT_SCORE",
      "score",
      "Component score must be null or from 0 to 100."
    );
  }

  if (
    !isFiniteNumber(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1
  ) {
    addError(
      validation,
      "INVALID_CONFIDENCE",
      "confidence",
      "Confidence must be from 0 to 1."
    );
  }

  if (
    !Object.values(EVIDENCE_LEVELS).includes(
      value.evidenceLevel
    )
  ) {
    addError(
      validation,
      "INVALID_EVIDENCE_LEVEL",
      "evidenceLevel",
      "Evidence level is invalid."
    );
  }

  if (
    !Object.values(DATA_STATES).includes(
      value.dataState
    )
  ) {
    addError(
      validation,
      "INVALID_DATA_STATE",
      "dataState",
      "Data state is invalid."
    );
  }

  validateAvailability(value, validation);

  if (
    value.weight != null &&
    (!isFiniteNumber(value.weight) ||
      value.weight < 0)
  ) {
    addError(
      validation,
      "INVALID_WEIGHT",
      "weight",
      "Component weight must be null or nonnegative."
    );
  }

  const contributors =
    value?.provenance?.contributors;

  if (!Array.isArray(contributors)) {
    addError(
      validation,
      "INVALID_PROVENANCE",
      "provenance.contributors",
      "Contributors must be an array."
    );
  } else {
    contributors.forEach((contributor, index) =>
      validateContributor(
        contributor,
        validation,
        `provenance.contributors[${index}]`
      )
    );
  }

  if (hasDuplicates(value.missingEvidence)) {
    addWarning(
      validation,
      "DUPLICATE_MISSING_EVIDENCE",
      "missingEvidence",
      "Missing evidence contains duplicate paths."
    );
  }

  if (
    value.diagnostics != null &&
    !isObject(value.diagnostics)
  ) {
    addError(
      validation,
      "INVALID_DIAGNOSTICS",
      "diagnostics",
      "Diagnostics must be an object or null."
    );
  }

  return validation;
}

export function validateProspectAggregation(
  value,
  components = {}
) {
  const validation = createValidation();
  const componentMap = isObject(components)
    ? components
    : {};
  const componentKeys = new Set(
    Object.keys(componentMap)
  );

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_AGGREGATION",
      "aggregation",
      "Aggregation must be an object."
    );
    return validation;
  }

  if (
    !Object.values(PROSPECT_AGGREGATION_METHODS)
      .includes(value.method)
  ) {
    addError(
      validation,
      "INVALID_AGGREGATION_METHOD",
      "aggregation.method",
      "Aggregation method is invalid."
    );
  }

  const included = Array.isArray(
    value.includedComponents
  )
    ? value.includedComponents
    : [];
  const excluded = Array.isArray(
    value.excludedComponents
  )
    ? value.excludedComponents
    : [];

  if (hasDuplicates(included)) {
    addError(
      validation,
      "DUPLICATE_COMPONENT_REFERENCE",
      "aggregation.includedComponents",
      "Included components contain duplicates."
    );
  }

  included.forEach((key) => {
    if (!componentKeys.has(key)) {
      addError(
        validation,
        "UNKNOWN_COMPONENT_REFERENCE",
        "aggregation.includedComponents",
        `Included component does not exist: ${key}.`
      );
    }
  });

  const excludedKeys = [];

  excluded.forEach((entry, index) => {
    if (
      !isObject(entry) ||
      typeof entry.key !== "string" ||
      !entry.key ||
      typeof entry.reason !== "string" ||
      !entry.reason
    ) {
      addError(
        validation,
        "INVALID_EXCLUDED_COMPONENT",
        `aggregation.excludedComponents[${index}]`,
        "Excluded component requires key and reason."
      );
      return;
    }

    excludedKeys.push(entry.key);

    if (!componentKeys.has(entry.key)) {
      addError(
        validation,
        "UNKNOWN_COMPONENT_REFERENCE",
        `aggregation.excludedComponents[${index}].key`,
        `Excluded component does not exist: ${entry.key}.`
      );
    }
  });

  if (hasDuplicates(excludedKeys)) {
    addError(
      validation,
      "DUPLICATE_COMPONENT_REFERENCE",
      "aggregation.excludedComponents",
      "Excluded components contain duplicates."
    );
  }

  included
    .filter((key) => excludedKeys.includes(key))
    .forEach((key) =>
      addError(
        validation,
        "IMPOSSIBLE_AGGREGATION",
        "aggregation",
        `Component is both included and excluded: ${key}.`
      )
    );

  const validateWeights = (weights, path) => {
    if (!isObject(weights)) {
      addError(
        validation,
        "INVALID_WEIGHT_MAP",
        path,
        "Weights must be an object."
      );
      return;
    }

    Object.entries(weights).forEach(
      ([key, weight]) => {
        if (!componentKeys.has(key)) {
          addError(
            validation,
            "UNKNOWN_COMPONENT_WEIGHT",
            `${path}.${key}`,
            `Weight references unknown component: ${key}.`
          );
        }

        if (!isFiniteNumber(weight) || weight < 0) {
          addError(
            validation,
            "INVALID_WEIGHT",
            `${path}.${key}`,
            "Weight must be finite and nonnegative."
          );
        }
      }
    );
  };

  validateWeights(
    value.requestedWeights,
    "aggregation.requestedWeights"
  );
  validateWeights(
    value.appliedWeights,
    "aggregation.appliedWeights"
  );

  const requestedSum = Object.values(
    isObject(value.requestedWeights)
      ? value.requestedWeights
      : {}
  ).reduce(
    (sum, weight) =>
      isFiniteNumber(weight) ? sum + weight : sum,
    0
  );

  const appliedSum = Object.values(
    isObject(value.appliedWeights)
      ? value.appliedWeights
      : {}
  ).reduce(
    (sum, weight) =>
      isFiniteNumber(weight) ? sum + weight : sum,
    0
  );

  if (
    !isFiniteNumber(value.requestedWeightTotal) ||
    Math.abs(
      requestedSum - value.requestedWeightTotal
    ) > WEIGHT_TOLERANCE
  ) {
    addError(
      validation,
      "WEIGHT_TOTAL_MISMATCH",
      "aggregation.requestedWeightTotal",
      "Requested weight total does not match requested weights."
    );
  }

  if (
    !isFiniteNumber(value.appliedWeightTotal) ||
    Math.abs(
      appliedSum - value.appliedWeightTotal
    ) > WEIGHT_TOLERANCE
  ) {
    addError(
      validation,
      "WEIGHT_TOTAL_MISMATCH",
      "aggregation.appliedWeightTotal",
      "Applied weight total does not match applied weights."
    );
  }

  if (
    typeof value.normalizationApplied !== "boolean"
  ) {
    addError(
      validation,
      "INVALID_NORMALIZATION_FLAG",
      "aggregation.normalizationApplied",
      "Normalization flag must be boolean."
    );
  }

  const requestedWeightKeys = Object.keys(
    isObject(value.requestedWeights)
      ? value.requestedWeights
      : {}
  );
  const appliedWeightKeys = Object.keys(
    isObject(value.appliedWeights)
      ? value.appliedWeights
      : {}
  );

  if (
    value.method ===
      PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS &&
    requestedWeightKeys.length > 0 &&
    appliedWeightKeys.length > 0 &&
    value.normalizationApplied === false
  ) {
    const weightKeys = new Set([
      ...requestedWeightKeys,
      ...appliedWeightKeys,
    ]);
    const weightsDiffer = [...weightKeys].some(
      (key) =>
        Math.abs(
          (value.requestedWeights[key] ?? 0) -
            (value.appliedWeights[key] ?? 0)
        ) > WEIGHT_TOLERANCE
    );

    if (weightsDiffer) {
      addWarning(
        validation,
        "NORMALIZATION_FLAG_INCONSISTENT",
        "aggregation.normalizationApplied",
        "Normalization flag is false although requested and applied weights differ."
      );
    }
  }

  normalizeArray(value.criticalMissingComponents)
    .forEach((key) => {
      if (!componentKeys.has(key)) {
        addError(
          validation,
          "UNKNOWN_CRITICAL_COMPONENT",
          "aggregation.criticalMissingComponents",
          `Critical component does not exist: ${key}.`
        );
      }
    });

  if (
    value.confidenceCap != null &&
    (!isFiniteNumber(value.confidenceCap) ||
      value.confidenceCap < 0 ||
      value.confidenceCap > 1)
  ) {
    addError(
      validation,
      "INVALID_CONFIDENCE_CAP",
      "aggregation.confidenceCap",
      "Confidence cap must be null or from 0 to 1."
    );
  }

  if (
    value.gradeCap != null &&
    (!isFiniteNumber(value.gradeCap) ||
      value.gradeCap < 0 ||
      value.gradeCap > 100)
  ) {
    addError(
      validation,
      "INVALID_GRADE_CAP",
      "aggregation.gradeCap",
      "Grade cap must be null or from 0 to 100."
    );
  }

  return validation;
}

export function validateProspectPositionModelResult(
  value
) {
  const validation = createValidation();

  if (!isObject(value)) {
    addError(
      validation,
      "INVALID_MODEL_RESULT",
      "",
      "Model result must be an object."
    );
    return validation;
  }

  if (value.contract !== MODEL_CONTRACT) {
    addError(
      validation,
      "INVALID_CONTRACT_IDENTIFIER",
      "contract",
      `Contract must equal ${MODEL_CONTRACT}.`
    );
  }

  if (
    typeof value.model !== "string" ||
    !value.model.trim()
  ) {
    addError(
      validation,
      "INVALID_MODEL_IDENTITY",
      "model",
      "Model must be a non-empty string."
    );
  }

  if (value.available && !value.playerId) {
    addError(
      validation,
      "MISSING_PLAYER_ID",
      "playerId",
      "Available model result requires player ID."
    );
  }

  if (value.available && !value.position) {
    addError(
      validation,
      "MISSING_POSITION",
      "position",
      "Available model result requires position."
    );
  }

  if (
    value.overallGrade != null &&
    (!isFiniteNumber(value.overallGrade) ||
      value.overallGrade < 0 ||
      value.overallGrade > 100)
  ) {
    addError(
      validation,
      "INVALID_OVERALL_GRADE",
      "overallGrade",
      "Overall grade must be null or from 0 to 100."
    );
  }

  if (!value.available && value.overallGrade != null) {
    addError(
      validation,
      "UNAVAILABLE_RESULT_HAS_GRADE",
      "overallGrade",
      "Unavailable model result must have a null overall grade."
    );
  }

  if (
    !isFiniteNumber(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1
  ) {
    addError(
      validation,
      "INVALID_CONFIDENCE",
      "confidence",
      "Confidence must be from 0 to 1."
    );
  }

  if (
    !Object.values(EVIDENCE_LEVELS).includes(
      value.evidenceLevel
    )
  ) {
    addError(
      validation,
      "INVALID_EVIDENCE_LEVEL",
      "evidenceLevel",
      "Evidence level is invalid."
    );
  }

  if (
    !Object.values(DATA_STATES).includes(
      value.dataState
    )
  ) {
    addError(
      validation,
      "INVALID_DATA_STATE",
      "dataState",
      "Data state is invalid."
    );
  }

  validateAvailability(value, validation);

  const components = isObject(value.components)
    ? value.components
    : {};

  if (!isObject(value.components)) {
    addError(
      validation,
      "INVALID_COMPONENT_MAP",
      "components",
      "Components must be an object."
    );
  }

  Object.entries(components).forEach(
    ([key, component]) => {
      const componentValidation =
        validateProspectComponentResult(component);

      const embeddedValidation = isObject(
        component?.validation
      )
        ? component.validation
        : createValidation();

      const combinedComponentValidation = mergeValidation(
        embeddedValidation,
        componentValidation
      );
      const includedComponents = Array.isArray(
        value?.aggregation?.includedComponents
      )
        ? value.aggregation.includedComponents
        : [];
      const appliedWeight = value?.aggregation
        ?.appliedWeights?.[key];
      const contributors = Array.isArray(
        component?.provenance?.contributors
      )
        ? component.provenance.contributors
        : [];
      const materiallyContributing = Boolean(
        component?.required ||
          component?.critical ||
          includedComponents.includes(key) ||
          (isFiniteNumber(appliedWeight) &&
            appliedWeight > 0) ||
          contributors.some(
            (contributor) =>
              contributor?.contributedToScore === true ||
              contributor?.contributedToOverallGrade === true
          )
      );
      const componentPath = (entry) =>
        entry.path
          ? `components.${key}.${entry.path}`
          : `components.${key}`;

      combinedComponentValidation.errors.forEach((entry) =>
        materiallyContributing
          ? addError(
              validation,
              entry.code,
              componentPath(entry),
              entry.message
            )
          : addWarning(
              validation,
              entry.code,
              componentPath(entry),
              entry.message
            )
      );
      combinedComponentValidation.warnings.forEach((entry) =>
        addWarning(
          validation,
          entry.code,
          componentPath(entry),
          entry.message
        )
      );

      if (component?.key !== key) {
        addError(
          validation,
          "COMPONENT_KEY_MISMATCH",
          `components.${key}.key`,
          "Component key must match its map key."
        );
      }
    }
  );

  const aggregationValidation =
    validateProspectAggregation(
      value.aggregation,
      components
    );

  aggregationValidation.errors.forEach((entry) =>
    addError(
      validation,
      entry.code,
      entry.path,
      entry.message
    )
  );
  aggregationValidation.warnings.forEach((entry) =>
    addWarning(
      validation,
      entry.code,
      entry.path,
      entry.message
    )
  );

  if (
    value.overallGrade != null &&
    value.aggregation?.method ===
      PROSPECT_AGGREGATION_METHODS.NONE
  ) {
    addError(
      validation,
      "IMPOSSIBLE_AGGREGATION",
      "aggregation.method",
      "Numeric overall grade requires an aggregation method."
    );
  }

  if (
    value.overallGrade != null &&
    value.aggregation?.method ===
      PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS &&
    (
      value.aggregation.includedComponents.length === 0 ||
      Math.abs(
        value.aggregation.appliedWeightTotal - 1
      ) > WEIGHT_TOLERANCE
    )
  ) {
    addError(
      validation,
      "IMPOSSIBLE_AGGREGATION",
      "aggregation",
      "Weighted overall grade requires included components and applied weight total of 1."
    );
  }

  if (!isObject(value.conclusions)) {
    addError(
      validation,
      "INVALID_CONCLUSIONS",
      "conclusions",
      "Conclusions must be an object."
    );
  }

  if (hasDuplicates(value.missingEvidence)) {
    addWarning(
      validation,
      "DUPLICATE_MISSING_EVIDENCE",
      "missingEvidence",
      "Missing evidence contains duplicate paths."
    );
  }

  const contributors =
    value?.provenance?.contributors;

  if (!Array.isArray(contributors)) {
    addError(
      validation,
      "INVALID_PROVENANCE",
      "provenance.contributors",
      "Contributors must be an array."
    );
  } else {
    contributors.forEach((contributor, index) =>
      validateContributor(
        contributor,
        validation,
        `provenance.contributors[${index}]`
      )
    );
  }

  if (
    value?.versions?.contract !==
    PROSPECT_POSITION_MODEL_CONTRACT_VERSION
  ) {
    addError(
      validation,
      "INVALID_CONTRACT_VERSION",
      "versions.contract",
      "Contract version is invalid."
    );
  }

  if (value.available && !value?.versions?.model) {
    addError(
      validation,
      "MISSING_MODEL_VERSION",
      "versions.model",
      "Available evaluated result requires model version."
    );
  }

  if (
    value.aggregation?.method ===
      PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS &&
    !value?.versions?.weights
  ) {
    addError(
      validation,
      "MISSING_WEIGHT_VERSION",
      "versions.weights",
      "Weighted aggregation requires weight version."
    );
  }

  if (
    value.diagnostics != null &&
    !isObject(value.diagnostics)
  ) {
    addError(
      validation,
      "INVALID_DIAGNOSTICS",
      "diagnostics",
      "Diagnostics must be an object or null."
    );
  }

  return validation;
}

export function createProspectComponentResult({
  key = "unknownComponent",
  score = null,
  confidence = 0,
  evidenceLevel = null,
  available = false,
  dataState = null,
  weight = null,
  required = false,
  critical = false,
  provenance = { contributors: [] },
  evidence = [],
  notes = [],
  missingEvidence = [],
  diagnostics = null,
} = {}) {
  const normalizationValidation = createValidation();
  const normalizedAvailable = Boolean(available);

  if (typeof key !== "string" || !key.trim()) {
    addError(
      normalizationValidation,
      "INVALID_COMPONENT_KEY",
      "key",
      "Component key must be a non-empty string."
    );
  }

  const normalizedConfidence = normalizeConfidence(
    confidence,
    normalizationValidation,
    "confidence"
  );

  let normalizedWeight = weight;

  if (weight != null) {
    if (!isFiniteNumber(weight) || weight < 0) {
      addError(
        normalizationValidation,
        "INVALID_WEIGHT",
        "weight",
        "Weight must be a finite nonnegative number."
      );
      normalizedWeight = null;
    }
  }

  const result = {
    contract: COMPONENT_CONTRACT,
    key:
      typeof key === "string" && key.trim()
        ? key.trim()
        : "unknownComponent",
    score: normalizeGrade(
      score,
      normalizationValidation,
      "score"
    ),
    confidence: normalizedConfidence,
    evidenceLevel: normalizeEvidenceLevel(
      evidenceLevel,
      normalizedConfidence,
      normalizationValidation,
      "evidenceLevel"
    ),
    available: normalizedAvailable,
    dataState: normalizeDataState(
      dataState,
      normalizedAvailable,
      normalizationValidation,
      "dataState"
    ),
    weight: normalizedWeight,
    required: Boolean(required),
    critical: Boolean(critical),
    provenance: normalizeProvenance(
      provenance,
      normalizationValidation,
      "provenance"
    ),
    evidence: normalizeArray(evidence),
    notes: normalizeArray(notes),
    missingEvidence: normalizeStringArray(
      missingEvidence,
      normalizationValidation,
      "missingEvidence"
    ),
    validation: createValidation(),
    diagnostics: normalizeDiagnostics(
      diagnostics,
      normalizationValidation,
      "diagnostics"
    ),
  };

  result.validation = mergeValidation(
    normalizationValidation,
    validateProspectComponentResult(result)
  );

  return result;
}

function normalizeComponents(
  value,
  validation
) {
  if (!isObject(value)) return {};

  return Object.entries(value).reduce(
    (result, [key, component]) => {
      if (!isObject(component)) {
        addError(
          validation,
          "INVALID_COMPONENT_RESULT",
          `components.${key}`,
          "Component must be an object."
        );
      }

      const normalizedComponent =
        createProspectComponentResult({
          ...(isObject(component) ? component : {}),
          key:
            isObject(component) && component.key
              ? component.key
              : key,
        });

      normalizedComponent.validation = mergeValidation(
        normalizedComponent.validation,
        isObject(component?.validation)
          ? component.validation
          : null
      );

      result[key] = normalizedComponent;
      return result;
    },
    {}
  );
}

export function createProspectPositionModelResult({
  model = "UnknownProspectModel",
  playerId = null,
  position = null,
  available = false,
  dataState = null,
  overallGrade = null,
  confidence = 0,
  evidenceLevel = null,
  components = {},
  conclusions = {},
  explanation = {},
  missingEvidence = [],
  provenance = { contributors: [] },
  aggregation = {},
  versions = {},
  diagnostics = null,
} = {}) {
  const normalizationValidation = createValidation();
  const normalizedAvailable = Boolean(available);

  if (
    typeof model !== "string" ||
    !model.trim()
  ) {
    addError(
      normalizationValidation,
      "INVALID_MODEL_IDENTITY",
      "model",
      "Model must be a non-empty string."
    );
  }

  const normalizedConfidence = normalizeConfidence(
    confidence,
    normalizationValidation,
    "confidence"
  );

  const result = {
    contract: MODEL_CONTRACT,
    model:
      typeof model === "string" && model.trim()
        ? model.trim()
        : "UnknownProspectModel",
    playerId:
      typeof playerId === "string" && playerId.trim()
        ? playerId.trim()
        : null,
    position:
      typeof position === "string" && position.trim()
        ? position.trim().toUpperCase()
        : null,
    available: normalizedAvailable,
    dataState: normalizeDataState(
      dataState,
      normalizedAvailable,
      normalizationValidation,
      "dataState"
    ),
    overallGrade: normalizeGrade(
      overallGrade,
      normalizationValidation,
      "overallGrade"
    ),
    confidence: normalizedConfidence,
    evidenceLevel: normalizeEvidenceLevel(
      evidenceLevel,
      normalizedConfidence,
      normalizationValidation,
      "evidenceLevel"
    ),
    components: normalizeComponents(
      components,
      normalizationValidation
    ),
    conclusions: normalizeConclusions(conclusions),
    explanation: normalizeExplanation(explanation),
    missingEvidence: normalizeStringArray(
      missingEvidence,
      normalizationValidation,
      "missingEvidence"
    ),
    provenance: normalizeProvenance(
      provenance,
      normalizationValidation,
      "provenance"
    ),
    aggregation: normalizeAggregation(
      aggregation,
      normalizationValidation
    ),
    versions: normalizeModelVersions(versions),
    validation: createValidation(),
    diagnostics: normalizeDiagnostics(
      diagnostics,
      normalizationValidation,
      "diagnostics"
    ),
  };

  result.validation = mergeValidation(
    normalizationValidation,
    validateProspectPositionModelResult(result)
  );

  return result;
}

export function createUnavailableProspectPositionModelResult({
  model = "UnknownProspectModel",
  playerId = null,
  position = null,
  dataState = DATA_STATES.UNAVAILABLE,
  missingEvidence = [],
  validationErrors = [],
  validationWarnings = [],
  modelVersion = null,
  weightVersion = null,
  dataVersion = null,
  diagnostics = null,
} = {}) {
  const result = createProspectPositionModelResult({
    model,
    playerId,
    position,
    available: false,
    dataState,
    overallGrade: null,
    confidence: 0,
    evidenceLevel: EVIDENCE_LEVELS.NONE,
    components: {},
    aggregation: {
      method: PROSPECT_AGGREGATION_METHODS.NONE,
    },
    missingEvidence,
    versions: {
      model: modelVersion,
      weights: weightVersion,
      data: dataVersion,
    },
    diagnostics,
  });

  result.validation = mergeValidation(
    result.validation,
    {
      errors: normalizeArray(validationErrors).map(
        normalizeValidationEntry
      ),
      warnings: normalizeArray(validationWarnings).map(
        normalizeValidationEntry
      ),
    }
  );

  return result;
}

export default {
  PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
  PROSPECT_AGGREGATION_METHODS,
  PROSPECT_CONTRIBUTOR_ROLES,
  createProspectComponentResult,
  createProspectPositionModelResult,
  createUnavailableProspectPositionModelResult,
  validateProspectComponentResult,
  validateProspectAggregation,
  validateProspectPositionModelResult,
  isProspectComponentResult,
  isProspectPositionModelResult,
};
