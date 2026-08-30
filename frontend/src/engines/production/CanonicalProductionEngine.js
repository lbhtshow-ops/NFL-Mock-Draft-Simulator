import {
  createIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../contracts/IntelligenceResultContract.js";
import {
  createProductionInput,
  isProductionInput,
  PRODUCTION_COMPLETENESS,
} from "./ProductionInputProjection.js";

export const CANONICAL_PRODUCTION_MODEL_NAME = "CanonicalProductionEngine";
export const CANONICAL_PRODUCTION_MODEL_VERSION = "1.0.0";

const OUTPUT_GOVERNANCE = Object.freeze({
  owner: "CANONICAL_ENGINE",
  derivationStatus: "DERIVED",
  governanceStatus: "CANONICAL",
  calibrationStatus: "NOT_APPLICABLE",
  reproducibilityStatus: "REPRODUCIBLE",
  canonicalDerivation: true,
});

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, clone(item)])
  );
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

/*
 * Traversal is factual and syntax-preserving: object keys are sorted, array
 * positions retain their indices, zero is supplied, null is unresolved, and
 * absent keys create no path. Counts never imply completeness or sufficiency.
 */
function inventoryEvidence(value) {
  const suppliedPaths = [];
  const unresolvedPaths = [];
  const categoryPaths = [];

  function visit(item, path) {
    if (item === null) {
      unresolvedPaths.push(path);
      return;
    }
    if (Array.isArray(item)) {
      categoryPaths.push(path);
      item.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (isObject(item)) {
      if (path) categoryPaths.push(path);
      Object.entries(item)
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([key, entry]) => visit(entry, path ? `${path}.${key}` : key));
      return;
    }
    suppliedPaths.push(path);
  }

  if (isObject(value)) visit(value, "");

  return {
    topLevelCategories: isObject(value)
      ? Object.keys(value).sort((left, right) => left.localeCompare(right))
      : [],
    categoryPaths: categoryPaths.filter(Boolean),
    suppliedPaths,
    unresolvedPaths,
    suppliedScalarCount: suppliedPaths.length,
    unresolvedFieldCount: unresolvedPaths.length,
    expectedFieldCount: null,
    coverageRatio: null,
  };
}

function explicitRepresentedContext(input) {
  const evidence = input.objectiveEvidence;
  const season = evidence?.season || evidence?.statistics?.season || null;
  const context = input.playerContext;
  return {
    season: season?.year ?? null,
    school: season?.school ?? context?.school ?? null,
    team: season?.team ?? context?.team ?? null,
  };
}

function declarationReport(declaration) {
  if (!declaration) return { supplied: false };
  return {
    supplied: true,
    classification: declaration.classification,
    derivationStatus: declaration.derivationStatus,
    governanceStatus: declaration.governanceStatus,
    calibrationStatus: declaration.calibrationStatus,
    canonicalDerivation: declaration.canonicalDerivation,
    modelVersion: declaration.modelVersion,
    limitations: clone(declaration.limitations),
    removalCondition: declaration.removalCondition,
  };
}

function reconstructedInput(input) {
  if (!isProductionInput(input)) return null;
  const reconstructed = createProductionInput({
    playerContext: input.playerContext,
    evidenceState: input.evidenceState,
    objectiveEvidence: input.objectiveEvidence,
    completeness: input.completeness,
    sample: input.sample,
    legacyModeledOutputDeclaration: input.legacyModeledOutputDeclaration,
  });
  return reconstructed.validation.valid ? reconstructed : null;
}

function invalidResult(input) {
  const validation = isObject(input) && input.validation ? clone(input.validation) : null;
  return deepFreeze(createIntelligenceResult({
    domain: "production",
    available: false,
    dataState: DATA_STATES.UNKNOWN,
    score: null,
    confidence: 0,
    evidenceLevel: EVIDENCE_LEVELS.NONE,
    summary: "A valid ProductionInputProjection is required; no Production conclusion was produced.",
    explanation: {
      positiveFactors: [],
      limitingFactors: ["The supplied input is invalid rather than governed missing Production evidence."],
      contextualFactors: [
        "Confidence is unknown; numeric zero is only the IntelligenceResultContract representation of unknown confidence.",
        "No canonical Production score was calculated.",
      ],
    },
    missingEvidence: ["productionInput"],
    value: {
      model: CANONICAL_PRODUCTION_MODEL_NAME,
      modelVersion: CANONICAL_PRODUCTION_MODEL_VERSION,
      inputStatus: "INVALID",
      confidenceKnown: false,
      governance: OUTPUT_GOVERNANCE,
      objectiveEvidence: null,
      evidenceInventory: inventoryEvidence(null),
      declaration: { supplied: false },
    },
    rawData: { validation },
    frameworkVersion: "1.0.0",
    modelVersion: CANONICAL_PRODUCTION_MODEL_VERSION,
  }));
}

function factualSummary(input, inventory, declaration) {
  const categories = inventory.topLevelCategories;
  const categoryText = categories.length
    ? `${categories.join(", ")} categor${categories.length === 1 ? "y is" : "ies are"} present.`
    : "No objective Production categories were reported.";
  const unresolvedText = `${inventory.unresolvedFieldCount} explicit unresolved field(s) remain.`;
  const limitationText = `${input.completeness.limitations.length} explicit limitation(s) were supplied.`;
  const declarationText = declaration.supplied
    ? "A transitional legacy modeled-output declaration was supplied, but its analytical values were not canonically derived."
    : "No legacy modeled-output declaration was supplied.";
  return `Production evidence state is ${input.evidenceState} for the declared scope ${input.completeness.scope || "UNKNOWN"}. ${categoryText} Sample status was declared ${input.sample.status}. ${unresolvedText} ${limitationText} ${declarationText}`;
}

export function getCanonicalProductionIntelligenceResult(productionInput) {
  const input = reconstructedInput(productionInput);
  if (!input) return invalidResult(productionInput);

  const hasFacts = [DATA_STATES.AVAILABLE, DATA_STATES.INSUFFICIENT_SAMPLE]
    .includes(input.evidenceState);
  const available = hasFacts;
  const objectiveEvidence = hasFacts ? clone(input.objectiveEvidence) : null;
  const inventory = inventoryEvidence(objectiveEvidence);
  const representedContext = explicitRepresentedContext(input);
  const declaration = declarationReport(input.legacyModeledOutputDeclaration);
  const limitations = [...input.completeness.limitations];

  if (input.completeness.status !== PRODUCTION_COMPLETENESS.COMPLETE) {
    limitations.push("Production evidence is not declared complete for its stated scope.");
  } else {
    limitations.push("Completeness applies only to the caller-declared scope.");
  }
  if (input.evidenceState === DATA_STATES.INSUFFICIENT_SAMPLE) {
    limitations.push("The caller declared an insufficient sample; supplied facts remain traceable but support no modeled conclusion.");
  }
  if (!available) {
    limitations.push(
      input.evidenceState === DATA_STATES.UNKNOWN
        ? "Production evidence availability is unknown; absence was not inferred."
        : "Production evidence is unavailable; an empty evidence conclusion was not produced."
    );
  }

  const facts = inventory.topLevelCategories.length
    ? [`Supplied objective categories: ${inventory.topLevelCategories.join(", ")}.`]
    : [];
  const declaredLegacyOutputs = declaration.supplied
    ? ["A separately governed transitional legacy modeled-output declaration is present and is not a canonical conclusion."]
    : [];
  const confidenceRationale = [
    "No governed numeric Production-confidence formula is defined.",
    "Confidence is unknown; numeric zero is only the IntelligenceResultContract representation of unknown confidence.",
  ];

  return deepFreeze(createIntelligenceResult({
    domain: "production",
    available,
    dataState: input.evidenceState,
    score: null,
    value: {
      model: CANONICAL_PRODUCTION_MODEL_NAME,
      modelVersion: CANONICAL_PRODUCTION_MODEL_VERSION,
      inputStatus: "VALID",
      outputType: "FACTUAL_PRODUCTION_REPORT",
      confidenceKnown: false,
      governance: OUTPUT_GOVERNANCE,
      context: {
        position: input.playerContext.position ?? null,
        frameworkVersion: input.playerContext.frameworkVersion,
        represented: representedContext,
      },
      evidenceState: input.evidenceState,
      objectiveEvidence,
      evidenceInventory: inventory,
      completeness: {
        status: input.completeness.status,
        scope: input.completeness.scope,
        appliesOnlyToDeclaredScope: input.completeness.status === PRODUCTION_COMPLETENESS.COMPLETE,
        inferredFromFieldCounts: false,
      },
      sample: {
        status: input.sample.status,
        opportunities: clone(input.sample.opportunities),
        inferredFromOpportunities: false,
      },
      limitations,
      declaration,
      explanationSections: {
        facts,
        canonicalFactualAnalysis: [
          `${inventory.suppliedScalarCount} supplied scalar field(s) and ${inventory.unresolvedFieldCount} explicit unresolved field(s) were inventoried without evaluation.`,
        ],
        declaredLegacyOutputs,
        limitations: [...limitations],
        confidenceRationale,
      },
    },
    confidence: 0,
    evidenceLevel: EVIDENCE_LEVELS.NONE,
    playerId: input.playerContext.playerId,
    competitionLevel: input.playerContext.competition.level,
    careerStage: input.playerContext.careerStage,
    summary: factualSummary(input, inventory, declaration),
    explanation: {
      positiveFactors: facts,
      limitingFactors: limitations,
      contextualFactors: [
        `Declared completeness: ${input.completeness.status}.`,
        `Declared scope: ${input.completeness.scope || "UNKNOWN"}.`,
        `Declared sample status: ${input.sample.status}.`,
        ...declaredLegacyOutputs,
        "No canonical Production score was calculated.",
        ...confidenceRationale,
      ],
    },
    evidence: objectiveEvidence === null ? [] : [objectiveEvidence],
    missingEvidence: available
      ? [...inventory.unresolvedPaths]
      : ["objectiveEvidence"],
    sources: [],
    rawData: {
      model: CANONICAL_PRODUCTION_MODEL_NAME,
      validation: clone(input.validation),
      declarationReportingOnly: declaration.supplied,
    },
    frameworkVersion: input.playerContext.frameworkVersion,
    modelVersion: CANONICAL_PRODUCTION_MODEL_VERSION,
    dataVersion: null,
  }));
}

export default { getCanonicalProductionIntelligenceResult };
