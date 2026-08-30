import {
  createUnavailableProspectPositionModelResult,
  isProspectPositionModelResult,
  validateProspectPositionModelResult,
} from "../ProspectPositionModelContract.js";
import {
  quarterbackProspectModelDescriptor,
} from "../quarterback/QuarterbackProspectModel.js";

export const PROSPECT_MODEL_POSITIONS = Object.freeze({
  QB: "QB",
  RB: "RB",
  WR: "WR",
  TE: "TE",
  OT: "OT",
  IOL: "IOL",
  DL: "DL",
  EDGE: "EDGE",
  LB: "LB",
  CB: "CB",
  S: "S",
  K: "K",
  P: "P",
});

export const PROSPECT_POSITION_ALIASES = Object.freeze({
  QUARTERBACK: "QB",
  "RUNNING BACK": "RB",
  HALFBACK: "RB",
  TAILBACK: "RB",
  HB: "RB",
  "WIDE RECEIVER": "WR",
  "TIGHT END": "TE",
  "OFFENSIVE TACKLE": "OT",
  "LEFT TACKLE": "OT",
  "RIGHT TACKLE": "OT",
  LT: "OT",
  RT: "OT",
  "INTERIOR OFFENSIVE LINE": "IOL",
  "INTERIOR OFFENSIVE LINEMAN": "IOL",
  GUARD: "IOL",
  "OFFENSIVE GUARD": "IOL",
  G: "IOL",
  OG: "IOL",
  LG: "IOL",
  RG: "IOL",
  CENTER: "IOL",
  "OFFENSIVE CENTER": "IOL",
  C: "IOL",
  OC: "IOL",
  "DEFENSIVE TACKLE": "DL",
  DT: "DL",
  "NOSE TACKLE": "DL",
  NT: "DL",
  "INTERIOR DEFENSIVE LINE": "DL",
  "INTERIOR DEFENSIVE LINEMAN": "DL",
  "EDGE RUSHER": "EDGE",
  "EDGE DEFENDER": "EDGE",
  "PASS RUSHER": "EDGE",
  LINEBACKER: "LB",
  "INSIDE LINEBACKER": "LB",
  "MIDDLE LINEBACKER": "LB",
  ILB: "LB",
  MLB: "LB",
  CORNER: "CB",
  CORNERBACK: "CB",
  SAFETY: "S",
  "FREE SAFETY": "S",
  "STRONG SAFETY": "S",
  FS: "S",
  SS: "S",
  KICKER: "K",
  PLACEKICKER: "K",
  PK: "K",
  PUNTER: "P",
});

const AMBIGUOUS_POSITIONS = new Set([
  "DE",
  "DEFENSIVE END",
  "OLB",
  "OUTSIDE LINEBACKER",
  "OL",
  "OFFENSIVE LINE",
  "T",
  "TACKLE",
  "DB",
  "DEFENSIVE BACK",
  "ATH",
  "ATHLETE",
  "WR/TE",
  "EDGE/LB",
  "DL/EDGE",
]);

const UNSUPPORTED_POSITIONS = new Set([
  "FB",
  "FULLBACK",
  "LS",
  "LONG SNAPPER",
]);

const CANONICAL_POSITIONS = Object.values(
  PROSPECT_MODEL_POSITIONS
);

function isObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function normalizePositionText(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProspectPosition(position) {
  const input = position ?? null;

  if (typeof position !== "string") {
    return {
      input,
      normalized: null,
      canonicalPosition: null,
      matchedAlias: null,
      ambiguous: false,
      supported: false,
      reason: "INVALID_POSITION_INPUT",
    };
  }

  const normalized = normalizePositionText(position);

  if (!normalized) {
    return {
      input,
      normalized: null,
      canonicalPosition: null,
      matchedAlias: null,
      ambiguous: false,
      supported: false,
      reason: "INVALID_POSITION_INPUT",
    };
  }

  if (CANONICAL_POSITIONS.includes(normalized)) {
    return {
      input,
      normalized,
      canonicalPosition: normalized,
      matchedAlias: null,
      ambiguous: false,
      supported: true,
      reason: "CANONICAL_POSITION",
    };
  }

  const aliasPosition =
    PROSPECT_POSITION_ALIASES[normalized];

  if (aliasPosition) {
    return {
      input,
      normalized,
      canonicalPosition: aliasPosition,
      matchedAlias: normalized,
      ambiguous: false,
      supported: true,
      reason: "ALIASED_POSITION",
    };
  }

  if (
    AMBIGUOUS_POSITIONS.has(normalized) ||
    normalized.includes("/")
  ) {
    return {
      input,
      normalized,
      canonicalPosition: null,
      matchedAlias: normalized,
      ambiguous: true,
      supported: false,
      reason: "AMBIGUOUS_POSITION",
    };
  }

  if (UNSUPPORTED_POSITIONS.has(normalized)) {
    return {
      input,
      normalized,
      canonicalPosition: null,
      matchedAlias: normalized,
      ambiguous: false,
      supported: false,
      reason: "UNSUPPORTED_POSITION",
    };
  }

  return {
    input,
    normalized,
    canonicalPosition: null,
    matchedAlias: null,
    ambiguous: false,
    supported: false,
    reason: "UNKNOWN_POSITION",
  };
}

function createValidation() {
  return { valid: true, errors: [], warnings: [] };
}

function normalizeValidationEntry(
  code,
  path,
  message
) {
  return {
    code:
      typeof code === "string" && code.trim()
        ? code.trim()
        : "REGISTRY_VALIDATION_ERROR",
    path: typeof path === "string" ? path : "",
    message: typeof message === "string" ? message : "",
  };
}

function addEntry(
  validation,
  field,
  code,
  path,
  message
) {
  const entry = normalizeValidationEntry(
    code,
    path,
    message
  );
  const key = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;

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

function normalizeDescriptor(
  descriptor,
  index,
  validation
) {
  const path = `descriptors[${index}]`;

  if (!isObject(descriptor)) {
    addError(
      validation,
      "INVALID_MODEL_DESCRIPTOR",
      path,
      "Model descriptor must be an object."
    );
    return null;
  }

  let valid = true;

  if (
    !CANONICAL_POSITIONS.includes(descriptor.position)
  ) {
    addError(
      validation,
      "INVALID_DESCRIPTOR_POSITION",
      `${path}.position`,
      "Descriptor position must be canonical."
    );
    valid = false;
  }

  if (
    typeof descriptor.modelName !== "string" ||
    !descriptor.modelName.trim()
  ) {
    addError(
      validation,
      "MISSING_MODEL_NAME",
      `${path}.modelName`,
      "Descriptor model name is required."
    );
    valid = false;
  }

  if (
    typeof descriptor.modelVersion !== "string" ||
    !descriptor.modelVersion.trim()
  ) {
    addError(
      validation,
      "MISSING_MODEL_VERSION",
      `${path}.modelVersion`,
      "Descriptor model version is required."
    );
    valid = false;
  }

  if (
    descriptor.weightVersion != null &&
    (typeof descriptor.weightVersion !== "string" ||
      !descriptor.weightVersion.trim())
  ) {
    addError(
      validation,
      "INVALID_WEIGHT_VERSION",
      `${path}.weightVersion`,
      "Descriptor weight version must be a non-empty string or null."
    );
    valid = false;
  }

  if (typeof descriptor.evaluate !== "function") {
    addError(
      validation,
      "MISSING_MODEL_EVALUATOR",
      `${path}.evaluate`,
      "Descriptor evaluator must be a function."
    );
    valid = false;
  }

  if (!valid) return null;

  return Object.freeze({
    position: descriptor.position,
    modelName: descriptor.modelName.trim(),
    modelVersion: descriptor.modelVersion.trim(),
    weightVersion:
      descriptor.weightVersion == null
        ? null
        : descriptor.weightVersion.trim(),
    evaluate: descriptor.evaluate,
  });
}

function safeString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;

  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function createRegistryDiagnostics({
  normalization = null,
  descriptor = null,
  output = null,
  exception = null,
} = {}) {
  const diagnostics = { registry: {} };

  if (normalization) {
    diagnostics.registry.normalization = normalization;
  }

  if (descriptor) {
    diagnostics.registry.descriptor = {
      position: descriptor.position,
      modelName: descriptor.modelName,
      modelVersion: descriptor.modelVersion,
      weightVersion: descriptor.weightVersion,
    };
  }

  if (output !== undefined && output !== null) {
    diagnostics.registry.outputSummary = {
      type: Array.isArray(output)
        ? "array"
        : typeof output,
      contract:
        typeof output?.contract === "string"
          ? output.contract
          : null,
      model:
        typeof output?.model === "string"
          ? output.model
          : null,
      position:
        typeof output?.position === "string"
          ? output.position
          : null,
    };
  }

  if (exception) {
    diagnostics.registry.exception = {
      name: safeString(exception?.name, "Error"),
      message: safeString(
        exception?.message,
        "Prospect position model execution failed."
      ),
    };
  }

  return diagnostics;
}

function createUnavailable({
  code,
  message,
  playerId = null,
  position = null,
  descriptor = null,
  warnings = [],
  diagnostics = null,
} = {}) {
  return createUnavailableProspectPositionModelResult({
    model:
      descriptor?.modelName ||
      "ProspectModelRegistry",
    playerId,
    position,
    missingEvidence: [],
    validationErrors: [
      normalizeValidationEntry(
        code,
        code === "MISSING_PLAYER_ID"
          ? "playerId"
          : "registry",
        message
      ),
    ],
    validationWarnings: warnings,
    modelVersion: descriptor?.modelVersion || null,
    weightVersion:
      descriptor?.weightVersion ?? null,
    diagnostics,
  });
}

function createInvalidOutputResult({
  code,
  message,
  playerId,
  position,
  descriptor,
  output,
  validation = null,
  includeDiagnostics,
  normalization,
}) {
  const errors = [
    normalizeValidationEntry(
      code,
      "modelResult",
      message
    ),
    ...(validation?.errors || []).map((entry) =>
      normalizeValidationEntry(
        entry.code,
        entry.path
          ? `modelResult.${entry.path}`
          : "modelResult",
        entry.message
      )
    ),
  ];
  const warnings = (validation?.warnings || []).map(
    (entry) =>
      normalizeValidationEntry(
        entry.code,
        entry.path
          ? `modelResult.${entry.path}`
          : "modelResult",
        entry.message
      )
  );

  const result = createUnavailable({
    code: errors[0].code,
    message: errors[0].message,
    playerId,
    position,
    descriptor,
    warnings,
    diagnostics: includeDiagnostics
      ? createRegistryDiagnostics({
          normalization,
          descriptor,
          output,
        })
      : null,
  });

  result.validation = {
    valid: false,
    errors: errors.filter(
      (entry, index, values) =>
        values.findIndex(
          (candidate) =>
            candidate.code === entry.code &&
            candidate.path === entry.path &&
            candidate.message === entry.message
        ) === index
    ),
    warnings,
  };

  return result;
}

export function createProspectModelRegistry(input = {}) {
  const validation = createValidation();
  const safeInput = isObject(input) ? input : {};
  const descriptors = Object.prototype.hasOwnProperty.call(
    safeInput,
    "descriptors"
  )
    ? safeInput.descriptors
    : [];
  const descriptorList = Array.isArray(descriptors)
    ? descriptors
    : [];
  const descriptorMap = new Map();

  if (!isObject(input)) {
    addError(
      validation,
      "INVALID_REGISTRY_INPUT",
      "",
      "Registry input must be an object."
    );
  }

  if (!Array.isArray(descriptors)) {
    addError(
      validation,
      "INVALID_DESCRIPTORS_ARRAY",
      "descriptors",
      "Registry descriptors must be an array."
    );
  }

  descriptorList.forEach((descriptor, index) => {
    const normalized = normalizeDescriptor(
      descriptor,
      index,
      validation
    );

    if (!normalized) return;

    if (descriptorMap.has(normalized.position)) {
      addError(
        validation,
        "DUPLICATE_MODEL_POSITION",
        `descriptors[${index}].position`,
        `A model is already registered for ${normalized.position}.`
      );
      return;
    }

    descriptorMap.set(normalized.position, normalized);
  });

  validation.valid = validation.errors.length === 0;
  const frozenValidation = Object.freeze({
    valid: validation.valid,
    errors: Object.freeze(
      validation.errors.map((entry) => Object.freeze(entry))
    ),
    warnings: Object.freeze(
      validation.warnings.map((entry) => Object.freeze(entry))
    ),
  });

  function getModel(position) {
    const normalization =
      normalizeProspectPosition(position);

    if (!normalization.canonicalPosition) return null;

    return (
      descriptorMap.get(
        normalization.canonicalPosition
      ) || null
    );
  }

  function hasModel(position) {
    return getModel(position) !== null;
  }

  function listPositions() {
    return Object.freeze(
      CANONICAL_POSITIONS.map((position) => {
        const descriptor = descriptorMap.get(position);

        return Object.freeze({
          position,
          implemented: Boolean(descriptor),
          modelName: descriptor?.modelName || null,
          modelVersion:
            descriptor?.modelVersion || null,
          weightVersion:
            descriptor?.weightVersion ?? null,
        });
      })
    );
  }

  function evaluate(inputValue = {}) {
    const dispatch = isObject(inputValue)
      ? inputValue
      : {};
    const {
      position,
      player = null,
      playerId = null,
      context = null,
      intelligence = {},
      scouting = null,
      options = {},
      registryOptions = {},
    } = dispatch;
    const includeDiagnostics =
      registryOptions?.includeDiagnostics === true;
    const normalization =
      normalizeProspectPosition(position);
    const canonicalPosition =
      normalization.canonicalPosition;

    if (!frozenValidation.valid) {
      return createUnavailable({
        code: "INVALID_REGISTRY_CONFIGURATION",
        message:
          "Prospect model registry configuration is invalid.",
        playerId:
          typeof playerId === "string" && playerId.trim()
            ? playerId.trim()
            : null,
        position: canonicalPosition,
        warnings: frozenValidation.warnings,
        diagnostics: includeDiagnostics
          ? createRegistryDiagnostics({ normalization })
          : null,
      });
    }

    if (!canonicalPosition) {
      return createUnavailable({
        code: normalization.reason,
        message:
          "Prospect position cannot be dispatched to a model.",
        playerId:
          typeof playerId === "string" && playerId.trim()
            ? playerId.trim()
            : null,
        position: null,
        diagnostics: includeDiagnostics
          ? createRegistryDiagnostics({ normalization })
          : null,
      });
    }

    const descriptor = descriptorMap.get(canonicalPosition);
    const normalizedPlayerId =
      typeof playerId === "string" && playerId.trim()
        ? playerId.trim()
        : null;

    if (!normalizedPlayerId) {
      return createUnavailable({
        code: "MISSING_PLAYER_ID",
        message:
          "A canonical player ID is required for model dispatch.",
        playerId: null,
        position: canonicalPosition,
        descriptor,
        diagnostics: includeDiagnostics
          ? createRegistryDiagnostics({
              normalization,
              descriptor,
            })
          : null,
      });
    }

    if (
      isObject(context) &&
      typeof context.playerId === "string" &&
      context.playerId.trim() &&
      context.playerId.trim() !== normalizedPlayerId
    ) {
      return createUnavailable({
        code: "PLAYER_ID_CONTEXT_MISMATCH",
        message:
          "Dispatch player ID does not match context player ID.",
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        descriptor,
      });
    }

    if (
      isObject(context) &&
      typeof context.position === "string" &&
      context.position.trim()
    ) {
      const contextPosition =
        normalizeProspectPosition(context.position);

      if (
        contextPosition.canonicalPosition &&
        contextPosition.canonicalPosition !==
          canonicalPosition
      ) {
        return createUnavailable({
          code: "POSITION_CONTEXT_MISMATCH",
          message:
            "Dispatch position does not match context position.",
          playerId: normalizedPlayerId,
          position: canonicalPosition,
          descriptor,
        });
      }
    }

    if (!descriptor) {
      return createUnavailable({
        code: "MODEL_NOT_REGISTERED",
        message:
          "No prospect model is registered for this position.",
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        diagnostics: includeDiagnostics
          ? createRegistryDiagnostics({ normalization })
          : null,
      });
    }

    let output;

    try {
      output = descriptor.evaluate({
        player,
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        context,
        intelligence,
        scouting,
        options,
      });
    } catch (error) {
      return createUnavailable({
        code: "MODEL_EXECUTION_FAILED",
        message:
          "Prospect position model execution failed.",
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        descriptor,
        diagnostics: includeDiagnostics
          ? createRegistryDiagnostics({
              normalization,
              descriptor,
              exception: error,
            })
          : null,
      });
    }

    if (!isProspectPositionModelResult(output)) {
      return createInvalidOutputResult({
        code: "INVALID_MODEL_RESULT",
        message:
          "Prospect model returned an invalid result shape.",
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        descriptor,
        output,
        includeDiagnostics,
        normalization,
      });
    }

    const outputValidation =
      validateProspectPositionModelResult(output);

    if (!outputValidation.valid) {
      return createInvalidOutputResult({
        code: "INVALID_MODEL_RESULT",
        message:
          "Prospect model result failed contract validation.",
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        descriptor,
        output,
        validation: outputValidation,
        includeDiagnostics,
        normalization,
      });
    }

    const mismatches = [
      [
        output.position !== descriptor.position,
        "MODEL_RESULT_POSITION_MISMATCH",
        "Prospect model result position does not match its descriptor.",
      ],
      [
        output.model !== descriptor.modelName,
        "MODEL_RESULT_NAME_MISMATCH",
        "Prospect model result name does not match its descriptor.",
      ],
      [
        output.versions?.model !==
          descriptor.modelVersion,
        "MODEL_VERSION_MISMATCH",
        "Prospect model result version does not match its descriptor.",
      ],
      [
        (output.versions?.weights ?? null) !==
          descriptor.weightVersion,
        "WEIGHT_VERSION_MISMATCH",
        "Prospect model weight version does not match its descriptor.",
      ],
    ];
    const mismatch = mismatches.find(([failed]) => failed);

    if (mismatch) {
      return createInvalidOutputResult({
        code: mismatch[1],
        message: mismatch[2],
        playerId: normalizedPlayerId,
        position: canonicalPosition,
        descriptor,
        output,
        includeDiagnostics,
        normalization,
      });
    }

    return output;
  }

  return Object.freeze({
    validation: frozenValidation,
    getProspectModel: getModel,
    hasProspectModel: hasModel,
    listSupportedProspectPositions: listPositions,
    evaluateProspectByPosition: evaluate,
  });
}

const productionRegistry = createProspectModelRegistry({
  descriptors: [quarterbackProspectModelDescriptor],
});

export function getProspectModel(position) {
  return productionRegistry.getProspectModel(position);
}

export function hasProspectModel(position) {
  return productionRegistry.hasProspectModel(position);
}

export function listSupportedProspectPositions() {
  return productionRegistry.listSupportedProspectPositions();
}

export function evaluateProspectByPosition(input = {}) {
  return productionRegistry.evaluateProspectByPosition(input);
}

export default {
  PROSPECT_MODEL_POSITIONS,
  PROSPECT_POSITION_ALIASES,
  normalizeProspectPosition,
  createProspectModelRegistry,
  getProspectModel,
  hasProspectModel,
  listSupportedProspectPositions,
  evaluateProspectByPosition,
};
