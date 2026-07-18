import {
  PROSPECT_CONTRIBUTOR_ROLES,
  createProspectComponentResult,
} from "../ProspectPositionModelContract.js";
import {
  createProspectContributor,
} from "../shared/ProspectModelSourceAdapter.js";
import {
  canUseSourceForSupport,
  readScoreProfile,
  readStructuredScoreData,
  readSupportProfile,
} from "./QuarterbackSourceUsage.js";

function isScore(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function getTraits(source) {
  return readStructuredScoreData(
    source,
    "playerTraits",
    "VECTOR"
  );
}

function getProductionProfile(source) {
  return readSupportProfile(source, "production");
}

function getFootballIQProfile(source) {
  return readScoreProfile(source, "footballIQ");
}

function getAthleticProfile(source) {
  return readScoreProfile(source, "athleticism");
}

function getPassingAttempts(source) {
  const value = getProductionProfile(source)
    ?.statistics?.offense?.passing?.attempts;

  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : null;
}

function getPassingSampleFactor(attempts) {
  if (attempts == null) return 0.65;
  if (attempts >= 300) return 1;
  if (attempts >= 150) return 0.9;
  if (attempts >= 75) return 0.75;
  return 0.6;
}

function aggregateDirectInputs(inputs) {
  const available = inputs.filter(({ value }) =>
    isScore(value)
  );
  const availableWeight = available.reduce(
    (sum, input) => sum + input.weight,
    0
  );
  const configuredWeight = inputs.reduce(
    (sum, input) => sum + input.weight,
    0
  );
  const missingEvidence = inputs
    .filter(({ value }) => !isScore(value))
    .map(({ path }) => path);

  if (!available.length || availableWeight <= 0) {
    return {
      score: null,
      coverage: 0,
      missingEvidence,
      used: [],
      conflictCount: 0,
    };
  }

  const score = available.reduce(
    (sum, input) =>
      sum + input.value * (input.weight / availableWeight),
    0
  );
  const values = available.map(({ value }) => value);
  const conflictCount =
    values.length > 1 &&
    Math.max(...values) - Math.min(...values) >= 15
      ? 1
      : 0;

  return {
    score,
    coverage:
      configuredWeight > 0
        ? availableWeight / configuredWeight
        : 0,
    missingEvidence,
    used: available,
    conflictCount,
  };
}

function getDirectSourceConfidence(used) {
  if (!used.length) return 0;

  const totalWeight = used.reduce(
    (sum, input) => sum + input.weight,
    0
  );

  if (totalWeight <= 0) return 0;

  return used.reduce((sum, input) => {
    const confidence =
      typeof input.source?.confidence === "number" &&
      Number.isFinite(input.source.confidence)
        ? input.source.confidence
        : 0;

    return sum + confidence * (input.weight / totalWeight);
  }, 0);
}

function calculateConfidence({
  aggregation,
  sampleFactor = 1,
}) {
  if (aggregation.score == null) return 0;

  const sourceConfidence = getDirectSourceConfidence(
    aggregation.used
  );
  const coverageFactor =
    0.6 + 0.4 * aggregation.coverage;
  const conflictFactor =
    aggregation.conflictCount > 0 ? 0.85 : 1;

  return Math.max(
    0,
    Math.min(
      1,
      sourceConfidence *
        coverageFactor *
        sampleFactor *
        conflictFactor
    )
  );
}

function createContributor({
  contributorId,
  source,
  role,
  componentKey,
  evidenceRefs,
  contributedToScore,
}) {
  return createProspectContributor({
    contributorId,
    domain: source?.domain || null,
    role,
    source,
    evidenceRefs,
    contributedToScore,
    contributedToOverallGrade: false,
    componentKeys: [componentKey],
  });
}

function buildContributors({
  componentKey,
  aggregation,
  supporting = [],
}) {
  const directSources = new Map();

  aggregation.used.forEach((input) => {
    const identity = input.contributorId;
    const current = directSources.get(identity) || {
      contributorId: identity,
      source: input.source,
      refs: [],
    };
    current.refs.push(input.path);
    directSources.set(identity, current);
  });

  const contributors = [...directSources.values()].map(
    (entry) =>
      createContributor({
        contributorId: entry.contributorId,
        source: entry.source,
        role: PROSPECT_CONTRIBUTOR_ROLES.DIRECT,
        componentKey,
        evidenceRefs: entry.refs,
        contributedToScore: true,
      })
  );

  supporting.forEach((entry) => {
    if (
      !canUseSourceForSupport(
        entry.source,
        entry.contributorId
      )
    ) {
      return;
    }

    contributors.push(
      createContributor({
        contributorId: entry.contributorId,
        source: entry.source,
        role: entry.role ||
          PROSPECT_CONTRIBUTOR_ROLES.SUPPORTING,
        componentKey,
        evidenceRefs: entry.evidenceRefs || [],
        contributedToScore: false,
      })
    );
  });

  return contributors;
}

function createComponent({
  key,
  inputs,
  supporting = [],
  required = false,
  critical = false,
  weight = null,
  sampleFactor = 1,
}) {
  const aggregation = aggregateDirectInputs(inputs);
  const confidence = calculateConfidence({
    aggregation,
    sampleFactor,
  });
  const contributors = buildContributors({
    componentKey: key,
    aggregation,
    supporting,
  });

  return createProspectComponentResult({
    key,
    score: aggregation.score,
    confidence,
    available: aggregation.score != null,
    weight,
    required,
    critical,
    provenance: { contributors },
    evidence: aggregation.used.map((input) => ({
      path: input.path,
      value: input.value,
    })),
    missingEvidence: aggregation.missingEvidence,
    diagnostics: {
      coverage: aggregation.coverage,
      conflictCount: aggregation.conflictCount,
      sampleFactor,
    },
  });
}

export function createQuarterbackAccuracyComponent({
  traitsSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);

  return createComponent({
    key: "accuracy",
    weight,
    required: true,
    critical: true,
    sampleFactor: getPassingSampleFactor(
      getPassingAttempts(productionSource)
    ),
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Accuracy",
        value: traits.Accuracy,
        weight: 1,
      },
    ],
    supporting: [
      {
        contributorId: "production",
        source: productionSource,
        evidenceRefs: [
          "rawData.profile.statistics.offense.passing.completionPercentage",
          "rawData.profile.productionScores.consistency",
          "rawData.profile.productionScores.efficiency",
        ],
      },
    ],
  });
}

export function createQuarterbackArmTalentComponent({
  traitsSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);

  return createComponent({
    key: "armTalent",
    weight,
    required: true,
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.ArmStrength",
        value: traits.ArmStrength,
        weight: 1,
      },
    ],
    supporting: [
      {
        contributorId: "production",
        source: productionSource,
        evidenceRefs: [
          "rawData.profile.productionScores.explosiveness",
        ],
      },
    ],
  });
}

export function createQuarterbackProcessingComponent({
  traitsSource,
  footballIQSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);
  const mental = getFootballIQProfile(footballIQSource)
    ?.mentalProcessing || {};

  return createComponent({
    key: "processing",
    weight,
    required: true,
    critical: true,
    sampleFactor: getPassingSampleFactor(
      getPassingAttempts(productionSource)
    ),
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Processing",
        value: traits.Processing,
        weight: 0.5,
      },
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        path: "rawData.profile.mentalProcessing.processingSpeed",
        value: mental.processingSpeed,
        weight: 0.3,
      },
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        path: "rawData.profile.mentalProcessing.playRecognition",
        value: mental.playRecognition,
        weight: 0.2,
      },
    ],
  });
}

export function createQuarterbackDecisionMakingComponent({
  traitsSource,
  footballIQSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);
  const mental = getFootballIQProfile(footballIQSource)
    ?.mentalProcessing || {};

  return createComponent({
    key: "decisionMaking",
    weight,
    required: true,
    critical: true,
    sampleFactor: getPassingSampleFactor(
      getPassingAttempts(productionSource)
    ),
    inputs: [
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        path: "rawData.profile.mentalProcessing.decisionMaking",
        value: mental.decisionMaking,
        weight: 0.35,
      },
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        path: "rawData.profile.mentalProcessing.anticipation",
        value: mental.anticipation,
        weight: 0.25,
      },
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        path: "rawData.profile.mentalProcessing.situationalAwareness",
        value: mental.situationalAwareness,
        weight: 0.2,
      },
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Anticipation",
        value: traits.Anticipation,
        weight: 0.2,
      },
    ],
    supporting: [
      {
        contributorId: "production",
        source: productionSource,
        evidenceRefs: [
          "rawData.profile.statistics.offense.passing.interceptions",
          "rawData.profile.productionScores.consistency",
        ],
      },
    ],
  });
}

export function createQuarterbackPocketManagementComponent({
  traitsSource,
  footballIQSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);

  return createComponent({
    key: "pocketManagement",
    weight,
    required: true,
    sampleFactor: getPassingSampleFactor(
      getPassingAttempts(productionSource)
    ),
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.PocketPresence",
        value: traits.PocketPresence,
        weight: 1,
      },
    ],
    supporting: [
      {
        contributorId: "footballIQ",
        source: footballIQSource,
        evidenceRefs: [
          "rawData.profile.mentalProcessing.situationalAwareness",
        ],
      },
    ],
  });
}

export function createQuarterbackMobilityComponent({
  traitsSource,
  athleticSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);
  const scores = getAthleticProfile(athleticSource)
    ?.scores || {};

  return createComponent({
    key: "mobility",
    weight,
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Mobility",
        value: traits.Mobility,
        weight: 0.5,
      },
      {
        contributorId: "athleticism",
        source: athleticSource,
        path: "rawData.profile.scores.speed",
        value: scores.speed,
        weight: 0.15,
      },
      {
        contributorId: "athleticism",
        source: athleticSource,
        path: "rawData.profile.scores.agility",
        value: scores.agility,
        weight: 0.2,
      },
      {
        contributorId: "athleticism",
        source: athleticSource,
        path: "rawData.profile.scores.explosiveness",
        value: scores.explosiveness,
        weight: 0.1,
      },
      {
        contributorId: "athleticism",
        source: athleticSource,
        path: "rawData.profile.scores.sizeAdjustedAthleticism",
        value: scores.sizeAdjustedAthleticism,
        weight: 0.05,
      },
    ],
  });
}

export function createQuarterbackPlaymakingComponent({
  traitsSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);

  return createComponent({
    key: "playmaking",
    weight,
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Playmaking",
        value: traits.Playmaking,
        weight: 0.6,
      },
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Creativity",
        value: traits.Creativity,
        weight: 0.4,
      },
    ],
    supporting: [
      {
        contributorId: "production",
        source: productionSource,
        evidenceRefs: [
          "rawData.profile.productionScores.explosiveness",
          "rawData.profile.statistics.offense.rushing",
        ],
      },
    ],
  });
}

export function createQuarterbackMechanicsComponent({
  traitsSource,
  productionSource,
  weight,
} = {}) {
  const traits = getTraits(traitsSource);

  return createComponent({
    key: "mechanics",
    weight,
    sampleFactor: getPassingSampleFactor(
      getPassingAttempts(productionSource)
    ),
    inputs: [
      {
        contributorId: "playerTraits",
        source: traitsSource,
        path: "value.data.Mechanics",
        value: traits.Mechanics,
        weight: 1,
      },
    ],
  });
}

export default {
  createQuarterbackAccuracyComponent,
  createQuarterbackArmTalentComponent,
  createQuarterbackProcessingComponent,
  createQuarterbackDecisionMakingComponent,
  createQuarterbackPocketManagementComponent,
  createQuarterbackMobilityComponent,
  createQuarterbackPlaymakingComponent,
  createQuarterbackMechanicsComponent,
};
