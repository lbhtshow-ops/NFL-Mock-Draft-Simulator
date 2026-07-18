import {
  createProspectPositionModelResult,
  createUnavailableProspectPositionModelResult,
} from "../ProspectPositionModelContract.js";
import {
  readProspectIntelligenceSource,
} from "../shared/ProspectModelSourceAdapter.js";
import {
  PROSPECT_MISSING_COMPONENT_STRATEGIES,
  aggregateProspectComponents,
} from "../shared/ProspectModelAggregation.js";
import {
  createQuarterbackAccuracyComponent,
  createQuarterbackArmTalentComponent,
  createQuarterbackProcessingComponent,
  createQuarterbackDecisionMakingComponent,
  createQuarterbackPocketManagementComponent,
  createQuarterbackMobilityComponent,
  createQuarterbackPlaymakingComponent,
  createQuarterbackMechanicsComponent,
} from "./QuarterbackProspectComponents.js";
import {
  canUseSourceForContext,
} from "./QuarterbackSourceUsage.js";

export const QUARTERBACK_PROSPECT_MODEL_NAME =
  "QuarterbackProspectModel";

export const QUARTERBACK_PROSPECT_MODEL_VERSION =
  "QB-PROSPECT-MODEL-1.0.1";

export const QUARTERBACK_PROSPECT_WEIGHT_VERSION =
  "QB-PROSPECT-WEIGHTS-1.0.0";

export const QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS =
  Object.freeze({
    accuracy: 0.2,
    armTalent: 0.15,
    processing: 0.2,
    decisionMaking: 0.15,
    pocketManagement: 0.12,
    mobility: 0.08,
    playmaking: 0.05,
    mechanics: 0.05,
  });

export const QUARTERBACK_REQUIRED_COMPONENTS =
  Object.freeze([
    "accuracy",
    "armTalent",
    "processing",
    "decisionMaking",
    "pocketManagement",
  ]);

export const QUARTERBACK_CRITICAL_COMPONENTS =
  Object.freeze([
    "accuracy",
    "processing",
    "decisionMaking",
  ]);

function isObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function validationEntry(code, path, message) {
  return { code, path, message };
}

function createUnavailable({
  playerId = null,
  code,
  message,
  missingEvidence = [],
  errors = [],
  warnings = [],
  diagnostics = null,
} = {}) {
  return createUnavailableProspectPositionModelResult({
    model: QUARTERBACK_PROSPECT_MODEL_NAME,
    playerId,
    position: "QB",
    missingEvidence,
    validationErrors: [
      validationEntry(code, "quarterbackModel", message),
      ...errors,
    ],
    validationWarnings: warnings,
    modelVersion: QUARTERBACK_PROSPECT_MODEL_VERSION,
    weightVersion: QUARTERBACK_PROSPECT_WEIGHT_VERSION,
    diagnostics,
  });
}

function buildComponents(sources) {
  const common = {
    traitsSource: sources.playerTraits,
    productionSource: sources.production,
    footballIQSource: sources.footballIQ,
    athleticSource: sources.athleticism,
  };

  return {
    accuracy: createQuarterbackAccuracyComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.accuracy,
    }),
    armTalent: createQuarterbackArmTalentComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.armTalent,
    }),
    processing: createQuarterbackProcessingComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.processing,
    }),
    decisionMaking:
      createQuarterbackDecisionMakingComponent({
        ...common,
        weight:
          QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS
            .decisionMaking,
      }),
    pocketManagement:
      createQuarterbackPocketManagementComponent({
        ...common,
        weight:
          QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS
            .pocketManagement,
      }),
    mobility: createQuarterbackMobilityComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.mobility,
    }),
    playmaking: createQuarterbackPlaymakingComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.playmaking,
    }),
    mechanics: createQuarterbackMechanicsComponent({
      ...common,
      weight:
        QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS.mechanics,
    }),
  };
}

function calculateOverallConfidence(
  components,
  aggregation
) {
  const appliedWeights =
    aggregation?.aggregation?.appliedWeights || {};
  const included =
    aggregation?.aggregation?.includedComponents || [];

  if (!included.length) return 0;

  const weightedConfidence = included.reduce(
    (sum, key) =>
      sum +
      (components[key]?.confidence || 0) *
        (appliedWeights[key] || 0),
    0
  );
  const criticalConfidences =
    QUARTERBACK_CRITICAL_COMPONENTS.filter((key) =>
      included.includes(key)
    ).map((key) => components[key]?.confidence || 0);
  const minimumCriticalConfidence =
    criticalConfidences.length > 0
      ? Math.min(...criticalConfidences)
      : 0;
  const conflictCount = included.reduce(
    (sum, key) =>
      sum +
      (components[key]?.diagnostics?.conflictCount || 0),
    0
  );
  const conflictFactor = conflictCount > 0 ? 0.95 : 1;

  return Math.max(
    0,
    Math.min(
      1,
      weightedConfidence,
      minimumCriticalConfidence + 0.15
    ) * conflictFactor
  );
}

function buildModelProvenance(components, aggregation) {
  const included = new Set(
    aggregation.aggregation.includedComponents
  );
  const grouped = new Map();

  Object.entries(components).forEach(([key, component]) => {
    const contributors =
      component?.provenance?.contributors || [];

    contributors.forEach((contributor) => {
      const identity = [
        contributor.contributorId,
        contributor.domain,
        contributor.role,
      ].join("|");
      const existing = grouped.get(identity) || {
        ...contributor,
        evidenceRefs: [],
        componentKeys: [],
        contributedToScore: false,
        contributedToOverallGrade: false,
      };

      existing.evidenceRefs = [
        ...new Set([
          ...existing.evidenceRefs,
          ...(contributor.evidenceRefs || []),
        ]),
      ];
      existing.componentKeys = [
        ...new Set([...existing.componentKeys, key]),
      ];
      existing.contributedToScore = Boolean(
        existing.contributedToScore ||
          contributor.contributedToScore
      );
      existing.contributedToOverallGrade = Boolean(
        existing.contributedToOverallGrade ||
          (included.has(key) &&
            contributor.contributedToScore)
      );
      grouped.set(identity, existing);
    });
  });

  return { contributors: [...grouped.values()] };
}

function getComponentExplanation(component) {
  return {
    scoreRationale: component.available
      ? [
          {
            code: "DIRECT_NUMERIC_EVIDENCE",
            score: component.score,
          },
        ]
      : [],
    supportingEvidence:
      component.provenance.contributors
        .filter(
          (contributor) =>
            contributor.role === "SUPPORTING"
        )
        .map((contributor) => ({
          contributorId: contributor.contributorId,
          evidenceRefs: contributor.evidenceRefs,
        })),
    conflictingEvidence:
      component.diagnostics?.conflictCount > 0
        ? [{ code: "MATERIAL_NUMERIC_CONFLICT" }]
        : [],
    missingEvidence: component.missingEvidence,
    confidenceRationale: [
      {
        code: "EVIDENCE_COVERAGE",
        coverage: component.diagnostics?.coverage ?? 0,
      },
      {
        code: "SAMPLE_FACTOR",
        factor: component.diagnostics?.sampleFactor ?? 1,
      },
    ],
    developmentImplications:
      component.available && component.score < 80
        ? [{ code: "COMPONENT_DEVELOPMENT_REQUIRED" }]
        : [],
  };
}

function buildExplanation({
  components,
  aggregation,
  context,
  scouting,
  schemeFitSource,
}) {
  const included = new Set(
    aggregation.aggregation.includedComponents
  );
  const strengths = [];
  const concerns = [];
  const componentExplanations = {};

  Object.entries(components).forEach(([key, component]) => {
    componentExplanations[key] =
      getComponentExplanation(component);

    if (included.has(key) && component.score >= 85) {
      strengths.push({
        componentKey: key,
        code: "HIGH_COMPONENT_GRADE",
      });
    }

    if (!component.available) {
      concerns.push({
        componentKey: key,
        code: "MISSING_COMPONENT_EVIDENCE",
      });
    } else if (component.score < 75) {
      concerns.push({
        componentKey: key,
        code: "LOW_COMPONENT_GRADE",
      });
    } else if (component.confidence < 0.55) {
      concerns.push({
        componentKey: key,
        code: "LOW_COMPONENT_CONFIDENCE",
      });
    }
  });

  return {
    strengths,
    concerns,
    contextualFactors: [
      {
        code: "MODEL_CALIBRATION_STATUS",
        value: "PROVISIONAL",
      },
      {
        code: "PLAYER_CONTEXT_AVAILABLE",
        value: Boolean(context),
      },
      {
        code: "SCOUTING_CONTEXT_AVAILABLE",
        value: Boolean(scouting),
      },
      {
        code: "SCHEME_CONTEXT_AVAILABLE",
        value: Boolean(schemeFitSource?.validShape),
      },
    ],
    componentExplanations,
  };
}

function selectArchetype(components, confidence) {
  if (confidence < 0.4) return null;

  const score = (key) =>
    components[key]?.available
      ? components[key].score
      : null;

  if (score("mobility") >= 88 && score("playmaking") >= 88) {
    return {
      primary: "DUAL_THREAT_CREATOR",
      confidence,
    };
  }

  if (score("processing") >= 90 && score("decisionMaking") >= 90) {
    return { primary: "FIELD_GENERAL", confidence };
  }

  if (score("accuracy") >= 90 && score("processing") >= 85) {
    return {
      primary: "POCKET_DISTRIBUTOR",
      confidence,
    };
  }

  if (score("armTalent") >= 90 && score("playmaking") >= 85) {
    return {
      primary: "VERTICAL_CREATOR",
      confidence,
    };
  }

  if (score("mechanics") >= 85 && score("accuracy") >= 85) {
    return {
      primary: "TIMING_RHYTHM_PASSER",
      confidence,
    };
  }

  if (score("mobility") >= 85) {
    return { primary: "MOVEMENT_PASSER", confidence };
  }

  if (score("armTalent") >= 90) {
    return { primary: "POWER_THROWER", confidence };
  }

  return {
    primary: "DEVELOPMENTAL_TOOLSY_PASSER",
    confidence,
  };
}

function buildDevelopmentPriorities(components) {
  return Object.entries(components)
    .filter(
      ([, component]) =>
        !component.available ||
        component.score < 80 ||
        component.confidence < 0.55 ||
        component.diagnostics?.conflictCount > 0
    )
    .map(([key, component]) => ({
      componentKey: key,
      priority:
        QUARTERBACK_CRITICAL_COMPONENTS.includes(key)
          ? "HIGH"
          : "MEDIUM",
      reasonCode: !component.available
        ? "MISSING_EVIDENCE"
        : component.diagnostics?.conflictCount > 0
        ? "CONFLICTING_EVIDENCE"
        : component.score < 80
        ? "LOW_COMPONENT_GRADE"
        : "LOW_EVIDENCE_CONFIDENCE",
    }));
}

function buildConclusions({
  components,
  overallGrade,
  confidence,
  aggregation,
  schemeFitSource,
}) {
  const criticalConfidence = Math.min(
    ...QUARTERBACK_CRITICAL_COMPONENTS.map(
      (key) => components[key]?.confidence || 0
    )
  );
  const readinessLevel =
    confidence >= 0.8 && criticalConfidence >= 0.7
      ? "READY_TO_COMPETE"
      : confidence >= 0.6
      ? "DEVELOPING"
      : "EVIDENCE_LIMITED";
  const riskFactors = [];

  if (confidence < 0.65) {
    riskFactors.push("LOW_EVIDENCE_CONFIDENCE");
  }

  if (aggregation.aggregation.normalizationApplied) {
    riskFactors.push("OPTIONAL_EVIDENCE_MISSING");
  }

  if (
    Object.values(components).some(
      (component) =>
        component.diagnostics?.conflictCount > 0
    )
  ) {
    riskFactors.push("CONFLICTING_COMPONENT_EVIDENCE");
  }

  return {
    archetype: selectArchetype(components, confidence),
    readiness: {
      level: readinessLevel,
      factors: riskFactors,
    },
    ceiling: {
      level:
        overallGrade >= 90
          ? "HIGH_END_STARTER"
          : overallGrade >= 85
          ? "QUALITY_STARTER"
          : "DEVELOPMENTAL_STARTER",
      confidence,
    },
    floor: {
      level:
        confidence >= 0.75
          ? "NFL_BACKUP_OR_BETTER"
          : "DEVELOPMENTAL_BACKUP",
      confidence,
    },
    riskProfile: {
      level:
        riskFactors.length >= 2
          ? "HIGH"
          : riskFactors.length === 1
          ? "MODERATE"
          : "LOW",
      factors: riskFactors,
    },
    translationRisk: {
      level:
        schemeFitSource?.validShape && confidence >= 0.7
          ? "MODERATE"
          : "EVIDENCE_LIMITED",
      factors: schemeFitSource?.validShape
        ? []
        : ["MISSING_SCHEME_CONTEXT"],
    },
    roleProjection: {
      role: "NFL_QUARTERBACK_PROJECTION",
      style:
        selectArchetype(components, confidence)?.primary || null,
    },
    developmentPriorities:
      buildDevelopmentPriorities(components),
  };
}

function collectMissingEvidence(components, aggregation) {
  return [
    ...new Set([
      ...Object.values(components).flatMap(
        (component) => component.missingEvidence || []
      ),
      ...(aggregation.missingEvidence || []),
    ]),
  ];
}

function buildDiagnostics({ sources, components, aggregation }) {
  return {
    provisional: true,
    calibrationStatus:
      "QB v1 is provisional and not historically calibrated.",
    sourceValidation: Object.fromEntries(
      Object.entries(sources).map(([key, source]) => [
        key,
        source.validation,
      ])
    ),
    componentDiagnostics: Object.fromEntries(
      Object.entries(components).map(([key, component]) => [
        key,
        component.diagnostics,
      ])
    ),
    aggregation: aggregation.diagnostics,
  };
}

export function evaluateQuarterbackProspect({
  playerId,
  position = "QB",
  context = null,
  intelligence = {},
  scouting = null,
  options = {},
} = {}) {
  const normalizedPlayerId =
    typeof playerId === "string" && playerId.trim()
      ? playerId.trim()
      : null;

  if (!normalizedPlayerId) {
    return createUnavailable({
      code: "MISSING_PLAYER_ID",
      message: "Quarterback model requires a player ID.",
      missingEvidence: ["playerId"],
    });
  }

  if (
    typeof position !== "string" ||
    position.trim().toUpperCase() !== "QB"
  ) {
    return createUnavailable({
      playerId: normalizedPlayerId,
      code: "INVALID_MODEL_POSITION",
      message: "Quarterback model only evaluates QB inputs.",
      missingEvidence: ["position.QB"],
    });
  }

  if (!isObject(intelligence)) {
    return createUnavailable({
      playerId: normalizedPlayerId,
      code: "MISSING_INTELLIGENCE",
      message:
        "Quarterback model requires an intelligence envelope.",
      missingEvidence: ["intelligence"],
    });
  }

  try {
    const sources = {
      production: readProspectIntelligenceSource(
        intelligence.production,
        { expectedDomain: "production" }
      ),
      athleticism: readProspectIntelligenceSource(
        intelligence.athleticism,
        { expectedDomain: "athleticism" }
      ),
      footballIQ: readProspectIntelligenceSource(
        intelligence.footballIQ,
        { expectedDomain: "footballIQ" }
      ),
      schemeFit: readProspectIntelligenceSource(
        intelligence.schemeFit,
        { expectedDomain: "schemeFit" }
      ),
      playerTraits: readProspectIntelligenceSource(
        intelligence.playerTraits,
        { expectedDomain: "playerTraits" }
      ),
    };

    if (
      sources.playerTraits.value != null &&
      (sources.playerTraits.value?.type !== "VECTOR" ||
        !isObject(sources.playerTraits.value?.data))
    ) {
      return createUnavailable({
        playerId: normalizedPlayerId,
        code: "UNSUPPORTED_QB_EVIDENCE_STRUCTURE",
        message:
          "Quarterback trait evidence must use a VECTOR value.",
        missingEvidence: ["playerTraits.value.data"],
      });
    }

    const components = buildComponents(sources);
    const usableComponents = Object.values(components).filter(
      (component) => component.available
    );

    if (!usableComponents.length) {
      return createUnavailable({
        playerId: normalizedPlayerId,
        code: "NO_USABLE_QB_EVIDENCE",
        message:
          "No defensible quarterback component evidence is available.",
        missingEvidence: Object.values(components).flatMap(
          (component) => component.missingEvidence
        ),
        diagnostics:
          options.includeDiagnostics === true
            ? {
                provisional: true,
                calibrationStatus:
                  "QB v1 is provisional and not historically calibrated.",
              }
            : null,
      });
    }

    const aggregation = aggregateProspectComponents({
      components,
      weights: QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS,
      requiredComponents:
        QUARTERBACK_REQUIRED_COMPONENTS,
      criticalComponents:
        QUARTERBACK_CRITICAL_COMPONENTS,
      missingComponentStrategy:
        PROSPECT_MISSING_COMPONENT_STRATEGIES
          .EXCLUDE_AND_RENORMALIZE,
    });

    if (!aggregation.available || !aggregation.validation.valid) {
      return createUnavailable({
        playerId: normalizedPlayerId,
        code: "NO_USABLE_QB_EVIDENCE",
        message:
          "Quarterback component aggregation did not produce a defensible grade.",
        missingEvidence: collectMissingEvidence(
          components,
          aggregation
        ),
        errors: aggregation.validation.errors,
        warnings: aggregation.validation.warnings,
        diagnostics:
          options.includeDiagnostics === true
            ? buildDiagnostics({
                sources,
                components,
                aggregation,
              })
            : null,
      });
    }

    const confidence = calculateOverallConfidence(
      components,
      aggregation
    );
    const schemeFitContext = canUseSourceForContext(
      sources.schemeFit,
      "schemeFit"
    )
      ? sources.schemeFit
      : null;
    const explanation = buildExplanation({
      components,
      aggregation,
      context,
      scouting,
      schemeFitSource: schemeFitContext,
    });
    const conclusions = buildConclusions({
      components,
      overallGrade: aggregation.overallGrade,
      confidence,
      aggregation,
      schemeFitSource: schemeFitContext,
    });

    return createProspectPositionModelResult({
      model: QUARTERBACK_PROSPECT_MODEL_NAME,
      playerId: normalizedPlayerId,
      position: "QB",
      available: true,
      overallGrade: aggregation.overallGrade,
      confidence,
      components,
      conclusions,
      explanation,
      missingEvidence: collectMissingEvidence(
        components,
        aggregation
      ),
      provenance: buildModelProvenance(
        components,
        aggregation
      ),
      aggregation: aggregation.aggregation,
      versions: {
        model: QUARTERBACK_PROSPECT_MODEL_VERSION,
        weights: QUARTERBACK_PROSPECT_WEIGHT_VERSION,
        data: null,
      },
      diagnostics:
        options.includeDiagnostics === true
          ? buildDiagnostics({
              sources,
              components,
              aggregation,
            })
          : null,
    });
  } catch (error) {
    return createUnavailable({
      playerId: normalizedPlayerId,
      code: "QB_MODEL_EXECUTION_FAILED",
      message:
        "Quarterback prospect model execution failed.",
      diagnostics:
        options.includeDiagnostics === true
          ? {
              provisional: true,
              calibrationStatus:
                "QB v1 is provisional and not historically calibrated.",
              exception: {
                name:
                  typeof error?.name === "string"
                    ? error.name
                    : "Error",
                message:
                  typeof error?.message === "string"
                    ? error.message
                    : "Quarterback model execution failed.",
              },
            }
          : null,
    });
  }
}

export const quarterbackProspectModelDescriptor =
  Object.freeze({
    position: "QB",
    modelName: QUARTERBACK_PROSPECT_MODEL_NAME,
    modelVersion: QUARTERBACK_PROSPECT_MODEL_VERSION,
    weightVersion: QUARTERBACK_PROSPECT_WEIGHT_VERSION,
    evaluate: evaluateQuarterbackProspect,
  });

export default quarterbackProspectModelDescriptor;
