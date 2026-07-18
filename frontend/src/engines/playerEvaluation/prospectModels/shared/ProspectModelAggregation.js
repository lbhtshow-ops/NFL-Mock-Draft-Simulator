import {
  PROSPECT_AGGREGATION_METHODS,
  isProspectComponentResult,
  validateProspectComponentResult,
} from "../ProspectPositionModelContract.js";

export const PROSPECT_MISSING_COMPONENT_STRATEGIES = {
  BLOCK_GRADE: "BLOCK_GRADE",
  EXCLUDE_AND_RENORMALIZE: "EXCLUDE_AND_RENORMALIZE",
};

const WEIGHT_TOLERANCE = 1e-9;

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
    code,
    path,
    message,
  };
}

function addEntry(validation, field, code, path, message) {
  const entry = createEntry(code, path, message);
  const key = `${code}\u0000${path}\u0000${message}`;

  if (
    !validation[field].some(
      (candidate) =>
        `${candidate.code}\u0000${candidate.path}\u0000${candidate.message}` ===
        key
    )
  ) {
    validation[field].push(entry);
  }

  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addEntry(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addEntry(validation, "warnings", code, path, message);
}

function normalizeDeclarationList(value, path, validation) {
  if (!Array.isArray(value)) {
    addWarning(
      validation,
      "INVALID_COMPONENT_DECLARATION_LIST",
      path,
      `${path} must be an array.`
    );
    return [];
  }

  const result = [];
  const seen = new Set();

  value.forEach((entry) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addWarning(
        validation,
        "INVALID_COMPONENT_DECLARATION",
        path,
        `${path} contains an invalid component key.`
      );
      return;
    }

    const key = entry.trim();

    if (seen.has(key)) {
      addWarning(
        validation,
        "DUPLICATE_COMPONENT_DECLARATION",
        path,
        `Duplicate component declaration removed: ${key}.`
      );
      return;
    }

    seen.add(key);
    result.push(key);
  });

  return result;
}

function addUniqueString(target, seen, value) {
  if (!seen.has(value)) {
    seen.add(value);
    target.push(value);
  }
}

function addExcluded(target, seen, key, reason) {
  const identity = `${key}\u0000${reason}`;

  if (!seen.has(identity)) {
    seen.add(identity);
    target.push({ key, reason });
  }
}

function createEmptyResult(validation) {
  return {
    available: false,
    overallGrade: null,
    rawOverallGrade: null,
    aggregation: {
      method:
        PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
      includedComponents: [],
      excludedComponents: [],
      requestedWeights: {},
      appliedWeights: {},
      requestedWeightTotal: 0,
      appliedWeightTotal: 0,
      normalizationApplied: false,
      criticalMissingComponents: [],
      confidenceCap: null,
      gradeCap: null,
      notes: [],
    },
    missingEvidence: [],
    validation,
    diagnostics: {
      // Null consistently means no completed grade calculation.
      weightedSum: null,
      usableWeightTotal: 0,
    },
  };
}

function componentHasEmbeddedErrors(component) {
  return Boolean(
    component?.validation?.valid === false ||
      (Array.isArray(component?.validation?.errors) &&
        component.validation.errors.length > 0)
  );
}

function getComponentFailureReason(component) {
  if (!isProspectComponentResult(component)) {
    return "INVALID_COMPONENT";
  }

  const componentValidation =
    validateProspectComponentResult(component);

  if (
    !componentValidation.valid ||
    componentHasEmbeddedErrors(component)
  ) {
    return "INVALID_COMPONENT";
  }

  if (!component.available) {
    return "UNAVAILABLE_COMPONENT";
  }

  if (component.score == null) {
    return "NULL_COMPONENT_SCORE";
  }

  if (
    typeof component.score !== "number" ||
    !Number.isFinite(component.score) ||
    component.score < 0 ||
    component.score > 100
  ) {
    return "INVALID_COMPONENT";
  }

  return null;
}

export function aggregateProspectComponents(input = {}) {
  const validation = createValidation();
  const safeInput = isObject(input) ? input : {};

  if (!isObject(input)) {
    addError(
      validation,
      "INVALID_AGGREGATION_INPUT",
      "",
      "Aggregation input must be an object."
    );
  }

  const {
    components = {},
    weights = {},
    requiredComponents = [],
    criticalComponents = [],
    missingComponentStrategy =
      PROSPECT_MISSING_COMPONENT_STRATEGIES.BLOCK_GRADE,
  } = safeInput;
  const componentMap = isObject(components)
    ? components
    : {};
  const weightMap = isObject(weights) ? weights : {};

  if (!isObject(components)) {
    addError(
      validation,
      "INVALID_COMPONENTS_MAP",
      "components",
      "Components must be a plain object."
    );
  }

  if (!isObject(weights)) {
    addError(
      validation,
      "INVALID_WEIGHTS_MAP",
      "weights",
      "Weights must be a plain object."
    );
  }

  const strategyValid = Object.values(
    PROSPECT_MISSING_COMPONENT_STRATEGIES
  ).includes(missingComponentStrategy);

  if (!strategyValid) {
    addError(
      validation,
      "INVALID_MISSING_COMPONENT_STRATEGY",
      "missingComponentStrategy",
      "Missing-component strategy is not supported."
    );
  }

  const required = normalizeDeclarationList(
    requiredComponents,
    "requiredComponents",
    validation
  );
  const critical = normalizeDeclarationList(
    criticalComponents,
    "criticalComponents",
    validation
  );
  const requiredSet = new Set(required);
  const criticalSet = new Set(critical);

  Object.entries(componentMap).forEach(([key, component]) => {
    if (component?.required === true) requiredSet.add(key);
    if (component?.critical === true) criticalSet.add(key);
  });

  const result = createEmptyResult(validation);
  const aggregation = result.aggregation;
  const includedScores = {};
  const excludedSeen = new Set();
  const missingSeen = new Set();
  const criticalMissingSeen = new Set();
  let configuredPositiveWeightCount = 0;
  let optionalExclusionOccurred = false;
  let blockingEvidence = false;

  Object.entries(weightMap).forEach(([key, weight]) => {
    const weightPath = `weights.${key}`;

    if (
      typeof weight !== "number" ||
      !Number.isFinite(weight) ||
      weight < 0
    ) {
      addError(
        validation,
        "INVALID_REQUESTED_WEIGHT",
        weightPath,
        "Requested weight must be a finite nonnegative number."
      );
      addExcluded(
        aggregation.excludedComponents,
        excludedSeen,
        key,
        "INVALID_REQUESTED_WEIGHT"
      );
      blockingEvidence = true;
      return;
    }

    aggregation.requestedWeights[key] = weight;
    aggregation.requestedWeightTotal += weight;

    const materiallyRequired = requiredSet.has(key);
    const materiallyCritical = criticalSet.has(key);

    if (weight === 0) {
      addExcluded(
        aggregation.excludedComponents,
        excludedSeen,
        key,
        "ZERO_REQUESTED_WEIGHT"
      );
      addWarning(
        validation,
        "ZERO_REQUESTED_WEIGHT",
        weightPath,
        `Zero-weight component ${key} does not contribute.`
      );

      if (materiallyRequired || materiallyCritical) {
        addError(
          validation,
          "MATERIAL_COMPONENT_HAS_ZERO_WEIGHT",
          weightPath,
          `Required or critical component ${key} must have a positive weight.`
        );
        addUniqueString(
          result.missingEvidence,
          missingSeen,
          `components.${key}`
        );
        if (materiallyCritical) {
          addUniqueString(
            aggregation.criticalMissingComponents,
            criticalMissingSeen,
            key
          );
        }
        blockingEvidence = true;
      }
      return;
    }

    configuredPositiveWeightCount += 1;
    const component = componentMap[key];
    const failureReason = component
      ? getComponentFailureReason(component)
      : "MISSING_COMPONENT";

    if (!failureReason) {
      aggregation.includedComponents.push(key);
      includedScores[key] = component.score;
      result.diagnostics.usableWeightTotal += weight;
      return;
    }

    addExcluded(
      aggregation.excludedComponents,
      excludedSeen,
      key,
      failureReason
    );
    addUniqueString(
      result.missingEvidence,
      missingSeen,
      `components.${key}`
    );

    if (materiallyCritical) {
      addUniqueString(
        aggregation.criticalMissingComponents,
        criticalMissingSeen,
        key
      );
    }

    if (materiallyRequired || materiallyCritical) {
      addError(
        validation,
        materiallyCritical
          ? "MISSING_CRITICAL_COMPONENT"
          : "MISSING_REQUIRED_COMPONENT",
        `components.${key}`,
        `Required or critical component ${key} is not usable: ${failureReason}.`
      );
      blockingEvidence = true;
    } else if (
      missingComponentStrategy ===
      PROSPECT_MISSING_COMPONENT_STRATEGIES
        .EXCLUDE_AND_RENORMALIZE
    ) {
      addWarning(
        validation,
        "OPTIONAL_COMPONENT_EXCLUDED",
        `components.${key}`,
        `Optional component ${key} was excluded: ${failureReason}.`
      );
      optionalExclusionOccurred = true;
    } else {
      addError(
        validation,
        "MISSING_CONFIGURED_COMPONENT",
        `components.${key}`,
        `Configured component ${key} is not usable: ${failureReason}.`
      );
      blockingEvidence = true;
    }
  });

  [...requiredSet].forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(weightMap, key)) {
      addError(
        validation,
        "REQUIRED_COMPONENT_WITHOUT_WEIGHT",
        `weights.${key}`,
        `Required component ${key} has no configured weight.`
      );
      addUniqueString(
        result.missingEvidence,
        missingSeen,
        `components.${key}`
      );
      blockingEvidence = true;
    }
  });

  [...criticalSet].forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(weightMap, key)) {
      addError(
        validation,
        "CRITICAL_COMPONENT_WITHOUT_WEIGHT",
        `weights.${key}`,
        `Critical component ${key} has no configured weight.`
      );
      addUniqueString(
        result.missingEvidence,
        missingSeen,
        `components.${key}`
      );
      addUniqueString(
        aggregation.criticalMissingComponents,
        criticalMissingSeen,
        key
      );
      blockingEvidence = true;
    }
  });

  if (configuredPositiveWeightCount === 0) {
    addError(
      validation,
      "NO_POSITIVE_REQUESTED_WEIGHTS",
      "weights",
      "At least one positive requested weight is required."
    );
  }

  if (
    aggregation.includedComponents.length === 0 &&
    configuredPositiveWeightCount > 0
  ) {
    addError(
      validation,
      "NO_USABLE_COMPONENTS",
      "components",
      "No positive-weight configured component is usable."
    );
  }

  if (!strategyValid || validation.errors.length > 0) {
    validation.valid = false;
    return result;
  }

  if (blockingEvidence) return result;

  if (optionalExclusionOccurred) {
    const usableTotal = result.diagnostics.usableWeightTotal;

    if (
      !Number.isFinite(usableTotal) ||
      usableTotal <= WEIGHT_TOLERANCE
    ) {
      addError(
        validation,
        "IMPOSSIBLE_RENORMALIZATION",
        "aggregation",
        "Remaining usable component weight cannot be renormalized."
      );
      return result;
    }

    aggregation.includedComponents.forEach((key) => {
      aggregation.appliedWeights[key] =
        aggregation.requestedWeights[key] / usableTotal;
    });
    aggregation.appliedWeightTotal = Object.values(
      aggregation.appliedWeights
    ).reduce((sum, weight) => sum + weight, 0);
    aggregation.normalizationApplied = true;
    aggregation.notes.push(
      "Optional missing components were excluded and remaining weights were renormalized."
    );
    addWarning(
      validation,
      "WEIGHTS_RENORMALIZED",
      "aggregation.appliedWeights",
      "Remaining component weights were explicitly renormalized."
    );
  } else {
    if (
      Math.abs(
        aggregation.requestedWeightTotal - 1
      ) > WEIGHT_TOLERANCE
    ) {
      addError(
        validation,
        "REQUESTED_WEIGHT_TOTAL_INVALID",
        "weights",
        "Complete usable requested weights must total 1."
      );
      return result;
    }

    Object.entries(aggregation.requestedWeights).forEach(
      ([key, weight]) => {
        aggregation.appliedWeights[key] = weight;
      }
    );
    aggregation.appliedWeightTotal =
      aggregation.requestedWeightTotal;
  }

  if (
    Math.abs(
      aggregation.appliedWeightTotal - 1
    ) > WEIGHT_TOLERANCE
  ) {
    addError(
      validation,
      "APPLIED_WEIGHT_TOTAL_INVALID",
      "aggregation.appliedWeights",
      "Numeric grade requires applied weights totaling 1."
    );
    aggregation.appliedWeights = {};
    aggregation.appliedWeightTotal = 0;
    aggregation.normalizationApplied = false;
    return result;
  }

  const weightedSum = aggregation.includedComponents.reduce(
    (sum, key) =>
      sum +
      includedScores[key] *
        aggregation.appliedWeights[key],
    0
  );

  if (!Number.isFinite(weightedSum)) {
    addError(
      validation,
      "INVALID_AGGREGATED_GRADE",
      "overallGrade",
      "Aggregated grade must be finite."
    );
    aggregation.appliedWeights = {};
    aggregation.appliedWeightTotal = 0;
    aggregation.normalizationApplied = false;
    return result;
  }

  result.available = true;
  result.overallGrade = weightedSum;
  result.rawOverallGrade = weightedSum;
  result.diagnostics.weightedSum = weightedSum;
  validation.valid = true;

  return result;
}

export default {
  PROSPECT_MISSING_COMPONENT_STRATEGIES,
  aggregateProspectComponents,
};
