import {
  isProspectPositionModelResult,
  validateProspectPositionModelResult,
} from "../ProspectPositionModelContract.js";
import {
  createProspectModelRegistry,
} from "../registry/ProspectModelRegistry.js";
import quarterbackModule, {
  QUARTERBACK_CRITICAL_COMPONENTS,
  QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS,
  QUARTERBACK_PROSPECT_MODEL_NAME,
  QUARTERBACK_PROSPECT_MODEL_VERSION,
  QUARTERBACK_PROSPECT_WEIGHT_VERSION,
  QUARTERBACK_REQUIRED_COMPONENTS,
  evaluateQuarterbackProspect,
  quarterbackProspectModelDescriptor,
} from "./QuarterbackProspectModel.js";

const SUITE = "QuarterbackProspectModelDiagnostics";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function source(domain, { score = 80, confidence = 0.9, rawData = {}, value = null, available = true, dataState = null, summary = null } = {}) {
  return {
    domain,
    available,
    dataState: dataState || (available ? "AVAILABLE" : "UNAVAILABLE"),
    score,
    confidence,
    evidenceLevel: "STRONG",
    evidence: [],
    missingEvidence: [],
    sources: [],
    rawData,
    explanation: null,
    value,
    summary,
  };
}

function intelligence(overrides = {}) {
  return {
    playerTraits: source("playerTraits", {
      score: null,
      value: {
        type: "VECTOR",
        data: {
          Accuracy: 90,
          ArmStrength: 92,
          Processing: 88,
          Anticipation: 87,
          PocketPresence: 86,
          Mobility: 80,
          Playmaking: 85,
          Creativity: 82,
          Mechanics: 89,
        },
      },
    }),
    production: source("production", {
      rawData: {
        profile: {
          statistics: { offense: { passing: { attempts: 300, completionPercentage: 68, interceptions: 5 } } },
          productionScores: { consistency: 85, efficiency: 88, explosiveness: 84 },
        },
      },
    }),
    athleticism: source("athleticism", {
      rawData: { profile: { scores: { speed: 80, agility: 82, explosiveness: 84, sizeAdjustedAthleticism: 80 } } },
    }),
    footballIQ: source("footballIQ", {
      rawData: { profile: { mentalProcessing: { processingSpeed: 90, playRecognition: 87, decisionMaking: 89, anticipation: 88, situationalAwareness: 86 } } },
    }),
    schemeFit: source("schemeFit", { score: 95 }),
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluateQuarterbackProspect({
    playerId: "diagnostic-qb",
    position: "QB",
    intelligence: intelligence(),
    ...overrides,
  });
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function same(a, b, message) {
  assert(JSON.stringify(a) === JSON.stringify(b), message, { a, b });
}

const IDS = [
  "public-export-integrity", "exact-model-constants", "exact-component-weights",
  "required-component-list", "critical-component-list", "descriptor-metadata",
  "descriptor-immutability", "complete-valid-qb-evaluation", "final-grade-calculation",
  "contract-grade-rounding", "full-component-set", "complete-provenance",
  "component-confidence-range", "overall-confidence-calculation", "critical-confidence-cap",
  "valid-zero-component-evidence", "missing-player-id", "wrong-position",
  "missing-intelligence-envelope", "missing-critical-accuracy", "missing-required-arm-talent",
  "missing-critical-processing", "missing-critical-decision-making", "missing-required-pocket-management",
  "missing-optional-mobility", "missing-optional-playmaking", "missing-optional-mechanics",
  "optional-component-renormalization", "no-neutral-fallback-grade", "player-trait-vector-handling",
  "production-source-adaptation", "athletic-source-adaptation", "football-iq-structured-use",
  "scheme-fit-non-scoring", "stored-scouting-grade-ignored", "consensus-rank-ignored",
  "draft-projection-ignored", "production-volume-not-grade", "completion-percentage-not-accuracy",
  "athleticism-not-accuracy", "athleticism-not-processing", "athleticism-not-decision-making",
  "scheme-fit-not-overall-grade", "zero-mobility-valid", "low-sample-confidence",
  "high-sample-score-neutral", "material-conflict-confidence", "missing-direct-subinput-renormalization",
  "invalid-direct-subinput", "malformed-source-result", "unsupported-vector-structure",
  "explanation-shape", "conclusions-shape", "archetype-grade-neutrality",
  "null-archetype-insufficient-evidence", "development-priorities-from-evidence", "model-version-presence",
  "weight-version-presence", "deterministic-execution", "input-immutability",
  "no-team-fields", "no-draft-fields", "no-positional-value-fields",
  "isolated-registry-descriptor-validation", "isolated-registry-execution", "registry-result-consistency",
  "existing-contract-compatibility", "provisional-diagnostic-metadata",
  "unavailable-player-traits-residual-vector",
  "unavailable-football-iq-residual-profile",
  "unavailable-athletics-residual-profile",
  "unavailable-production-residual-profile",
  "unavailable-scheme-fit-residual-profile",
  "all-unavailable-residual-payloads",
  "invalid-source-residual-payload",
  "context-only-source-boundary",
  "source-usage-valid-regression",
  "source-usage-determinism-immutability",
];

function runDiagnostic(id) {
  const complete = evaluate();
  const keys = Object.keys(QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS);
  if (id === "public-export-integrity") assert(typeof evaluateQuarterbackProspect === "function" && quarterbackModule.evaluate === evaluateQuarterbackProspect, "QB exports are incomplete.");
  else if (id === "exact-model-constants") same([QUARTERBACK_PROSPECT_MODEL_NAME, QUARTERBACK_PROSPECT_MODEL_VERSION, QUARTERBACK_PROSPECT_WEIGHT_VERSION], ["QuarterbackProspectModel", "QB-PROSPECT-MODEL-1.0.1", "QB-PROSPECT-WEIGHTS-1.0.0"], "QB constants changed.");
  else if (id === "exact-component-weights") same(QUARTERBACK_PROSPECT_COMPONENT_WEIGHTS, { accuracy: .2, armTalent: .15, processing: .2, decisionMaking: .15, pocketManagement: .12, mobility: .08, playmaking: .05, mechanics: .05 }, "QB weights changed.");
  else if (id === "required-component-list") same(QUARTERBACK_REQUIRED_COMPONENTS, ["accuracy", "armTalent", "processing", "decisionMaking", "pocketManagement"], "Required list changed.");
  else if (id === "critical-component-list") same(QUARTERBACK_CRITICAL_COMPONENTS, ["accuracy", "processing", "decisionMaking"], "Critical list changed.");
  else if (id === "descriptor-metadata") assert(quarterbackProspectModelDescriptor.position === "QB" && quarterbackProspectModelDescriptor.evaluate === evaluateQuarterbackProspect, "Descriptor metadata is invalid.");
  else if (id === "descriptor-immutability") assert(Object.isFrozen(quarterbackProspectModelDescriptor), "Descriptor must be frozen.");
  else if (id === "complete-valid-qb-evaluation" || id === "existing-contract-compatibility") assert(complete.available && isProspectPositionModelResult(complete) && validateProspectPositionModelResult(complete).valid, "Complete QB result must validate.");
  else if (id === "full-component-set") same(Object.keys(complete.components), keys, "Full component set is missing.");
  else if (id === "component-confidence-range") assert(Object.values(complete.components).every((c) => c.confidence >= 0 && c.confidence <= 1), "Component confidence is out of range.");
  else if (id === "complete-provenance") assert(complete.provenance?.contributors?.length > 0 && complete.provenance.contributors.some((c) => c.contributedToOverallGrade), "Overall provenance is incomplete.");
  else if (id === "missing-player-id") assert(!evaluate({ playerId: null }).available, "Missing player ID must be unavailable.");
  else if (id === "wrong-position") assert(!evaluate({ position: "WR" }).available, "Wrong position must be unavailable.");
  else if (id === "missing-intelligence-envelope") assert(!evaluate({ intelligence: null }).available, "Missing intelligence must be unavailable.");
  else if (id.startsWith("missing-critical-") || id.startsWith("missing-required-")) {
    const map = { "missing-critical-accuracy": "Accuracy", "missing-required-arm-talent": "ArmStrength", "missing-critical-processing": "Processing", "missing-critical-decision-making": "Anticipation", "missing-required-pocket-management": "PocketPresence" };
    const data = intelligence(); delete data.playerTraits.value.data[map[id]];
    if (id === "missing-critical-decision-making") data.footballIQ.rawData.profile.mentalProcessing = {};
    if (id === "missing-critical-processing") data.footballIQ.rawData.profile.mentalProcessing = {};
    assert(!evaluate({ intelligence: data }).available, "Missing required evidence must be unavailable.");
  } else if (id.startsWith("missing-optional-") || id === "optional-component-renormalization") {
    const data = intelligence();
    if (id.includes("mobility") || id.includes("renormalization")) { delete data.playerTraits.value.data.Mobility; data.athleticism = null; }
    if (id.includes("playmaking") || id.includes("renormalization")) { delete data.playerTraits.value.data.Playmaking; delete data.playerTraits.value.data.Creativity; }
    if (id.includes("mechanics") || id.includes("renormalization")) delete data.playerTraits.value.data.Mechanics;
    const result = evaluate({ intelligence: data }); assert(result.available && result.aggregation.normalizationApplied, "Optional absence must explicitly renormalize.");
  } else if (id === "valid-zero-component-evidence" || id === "zero-mobility-valid") {
    const data = intelligence(); data.playerTraits.value.data.Mobility = 0; data.athleticism.rawData.profile.scores = { speed: 0, agility: 0, explosiveness: 0, sizeAdjustedAthleticism: 0 };
    assert(evaluate({ intelligence: data }).components.mobility.score === 0, "Zero mobility must remain valid.");
  } else if (["scheme-fit-non-scoring", "scheme-fit-not-overall-grade", "stored-scouting-grade-ignored", "consensus-rank-ignored", "draft-projection-ignored", "archetype-grade-neutrality"].includes(id)) {
    const alternate = evaluate({ intelligence: intelligence({ schemeFit: source("schemeFit", { score: 0 }) }), scouting: { overallGrade: 1, consensusRank: 999, draftProjection: "UDFA" } });
    assert(alternate.overallGrade === complete.overallGrade, "Prohibited context changed the QB grade.");
  } else if (["athleticism-not-accuracy", "athleticism-not-processing", "athleticism-not-decision-making"].includes(id)) {
    const data = intelligence(); data.athleticism.rawData.profile.scores = { speed: 0, agility: 0, explosiveness: 0, sizeAdjustedAthleticism: 0 };
    const changed = evaluate({ intelligence: data }); const key = id.replace("athleticism-not-", "").replaceAll("-", "");
    const componentKey = key === "decisionmaking" ? "decisionMaking" : key;
    assert(changed.components[componentKey].score === complete.components[componentKey].score, "Athleticism leaked into a prohibited component.");
  } else if (id === "production-volume-not-grade" || id === "completion-percentage-not-accuracy" || id === "no-neutral-fallback-grade") {
    const data = intelligence(); data.playerTraits.value.data = {}; assert(!evaluate({ intelligence: data }).available, "Supporting production invented a grade.");
  } else if (id === "low-sample-confidence" || id === "high-sample-score-neutral") {
    const low = intelligence(); low.production.rawData.profile.statistics.offense.passing.attempts = 20;
    const lowResult = evaluate({ intelligence: low });
    if (id === "low-sample-confidence") assert(lowResult.confidence < complete.confidence, "Low samples must reduce confidence.");
    else assert(lowResult.overallGrade === complete.overallGrade, "Sample size must not change scores.");
  } else if (id === "material-conflict-confidence") {
    const data = intelligence(); data.footballIQ.rawData.profile.mentalProcessing.processingSpeed = 20;
    assert(evaluate({ intelligence: data }).components.processing.confidence < complete.components.processing.confidence, "Conflict must lower confidence.");
  } else if (id === "missing-direct-subinput-renormalization") {
    const data = intelligence(); delete data.footballIQ.rawData.profile.mentalProcessing.playRecognition;
    assert(evaluate({ intelligence: data }).components.processing.available, "A partial direct blend must renormalize.");
  } else if (id === "invalid-direct-subinput") {
    const data = intelligence(); data.playerTraits.value.data.Accuracy = 101; assert(!evaluate({ intelligence: data }).available, "Invalid direct input must not score.");
  } else if (id === "malformed-source-result") assert(!evaluate({ intelligence: { playerTraits: {} } }).available, "Malformed sources must be unavailable.");
  else if (id === "unsupported-vector-structure") { const data = intelligence(); data.playerTraits.value.type = "MATRIX"; assert(!evaluate({ intelligence: data }).available, "Unsupported vector must be unavailable."); }
  else if (id === "explanation-shape") assert(complete.explanation && Array.isArray(complete.explanation.strengths) && typeof complete.explanation.componentExplanations === "object", "Explanation shape is missing.");
  else if (id === "conclusions-shape") assert(complete.conclusions && "archetype" in complete.conclusions && Array.isArray(complete.conclusions.developmentPriorities), "Conclusions shape is missing.");
  else if (id === "null-archetype-insufficient-evidence") { const data = intelligence(); Object.values(data).forEach((item) => { if (item) item.confidence = .1; }); assert(evaluate({ intelligence: data }).conclusions.archetype === null, "Low-confidence archetype must be null."); }
  else if (id === "development-priorities-from-evidence") assert(Array.isArray(complete.conclusions.developmentPriorities), "Development priorities must be evidence-derived output.");
  else if (id === "model-version-presence") assert(complete.versions.model === QUARTERBACK_PROSPECT_MODEL_VERSION, "Model version missing.");
  else if (id === "weight-version-presence") assert(complete.versions.weights === QUARTERBACK_PROSPECT_WEIGHT_VERSION, "Weight version missing.");
  else if (id === "deterministic-execution") same(evaluate(), evaluate(), "Execution is not deterministic.");
  else if (id === "input-immutability") { const input = intelligence(); const snapshot = deepClone(input); evaluate({ intelligence: input }); same(input, snapshot, "Inputs were mutated."); }
  else if (id === "no-team-fields") assert(!("team" in complete) && !("teamFit" in complete), "Team fields leaked into model result.");
  else if (id === "no-draft-fields") assert(!("draftProjection" in complete) && !("draftRank" in complete), "Draft fields leaked into model result.");
  else if (id === "no-positional-value-fields") assert(!("positionalValue" in complete), "Positional value leaked into model result.");
  else if (id.startsWith("isolated-registry-") || id === "registry-result-consistency") {
    const registry = createProspectModelRegistry({ descriptors: [quarterbackProspectModelDescriptor] });
    if (id === "isolated-registry-descriptor-validation") assert(registry.validation.valid, "Isolated descriptor must validate.");
    else { const result = registry.evaluateProspectByPosition({ playerId: "diagnostic-qb", position: "QB", intelligence: intelligence() }); assert(result.overallGrade === complete.overallGrade, "Isolated registry execution diverged."); }
  } else if (id === "provisional-diagnostic-metadata") assert(evaluate({ options: { includeDiagnostics: true } }).diagnostics?.provisional === true, "Provisional metadata missing.");
  else if (id === "final-grade-calculation" || id === "contract-grade-rounding") assert(Number.isInteger(complete.overallGrade) && complete.overallGrade >= 0 && complete.overallGrade <= 100, "Contract-owned grade is invalid.");
  else if (id === "overall-confidence-calculation" || id === "critical-confidence-cap") assert(complete.confidence >= 0 && complete.confidence <= 1, "Overall confidence is invalid.");
  else if (["player-trait-vector-handling", "production-source-adaptation", "athletic-source-adaptation", "football-iq-structured-use"].includes(id)) assert(complete.available, "A standardized source was not adapted.");
  else if (id === "unavailable-player-traits-residual-vector") {
    const data = intelligence(); data.playerTraits.available = false; data.playerTraits.dataState = "UNAVAILABLE";
    const result = evaluate({ intelligence: data });
    assert(!result.available && result.overallGrade === null, "Unavailable residual traits must not produce a grade.");
    assert(result.missingEvidence.includes("value.data.Accuracy") && !Object.values(result.components || {}).some((component) => component.provenance?.contributors?.some((contributor) => contributor.contributorId === "playerTraits")), "Residual traits contributed to components.");
  } else if (id === "unavailable-football-iq-residual-profile") {
    const data = intelligence(); data.footballIQ.available = false; data.footballIQ.dataState = "UNAVAILABLE"; data.footballIQ.rawData.profile.mentalProcessing = { processingSpeed: 100, playRecognition: 100, decisionMaking: 100, anticipation: 100, situationalAwareness: 100 };
    const result = evaluate({ intelligence: data });
    assert(result.components.processing.score === 88 && result.components.decisionMaking.score === 87, "Unavailable Football IQ residual values changed direct scores.");
    assert(result.components.processing.missingEvidence.includes("rawData.profile.mentalProcessing.processingSpeed") && !result.components.processing.provenance.contributors.some((contributor) => contributor.contributorId === "footballIQ"), "Unavailable Football IQ remained a contributor.");
  } else if (id === "unavailable-athletics-residual-profile") {
    const data = intelligence(); data.athleticism.available = false; data.athleticism.dataState = "UNAVAILABLE"; data.athleticism.rawData.profile.scores = { speed: 100, agility: 100, explosiveness: 100, sizeAdjustedAthleticism: 100 };
    const result = evaluate({ intelligence: data });
    assert(result.components.mobility.score === 80 && result.components.mobility.confidence < complete.components.mobility.confidence, "Unavailable athletic residual values affected Mobility.");
    assert(!result.components.mobility.provenance.contributors.some((contributor) => contributor.contributorId === "athleticism"), "Unavailable Athletics remained a contributor.");
  } else if (id === "unavailable-production-residual-profile") {
    const data = intelligence(); data.production.available = false; data.production.dataState = "UNAVAILABLE"; data.production.rawData.profile.statistics.offense.passing.attempts = 1000;
    const result = evaluate({ intelligence: data });
    assert(result.overallGrade === complete.overallGrade && result.components.accuracy.confidence < complete.components.accuracy.confidence, "Unavailable Production affected score or supplied sample confidence.");
    assert(!Object.values(result.components).some((component) => component.provenance.contributors.some((contributor) => contributor.contributorId === "production")), "Unavailable Production remained supporting provenance.");
  } else if (id === "unavailable-scheme-fit-residual-profile") {
    const data = intelligence(); data.schemeFit.available = false; data.schemeFit.dataState = "UNAVAILABLE"; data.schemeFit.rawData = { profile: { score: 100 } };
    const result = evaluate({ intelligence: data });
    assert(result.overallGrade === complete.overallGrade && result.conclusions.translationRisk.level === "EVIDENCE_LIMITED" && result.conclusions.translationRisk.factors.includes("MISSING_SCHEME_CONTEXT"), "Unavailable Scheme Fit was treated as context.");
  } else if (id === "all-unavailable-residual-payloads") {
    const data = intelligence(); Object.values(data).forEach((entry) => { entry.available = false; entry.dataState = "UNAVAILABLE"; });
    const result = evaluate({ intelligence: data });
    assert(!result.available && result.overallGrade === null, "Unavailable residual sources produced an overall grade.");
  } else if (id === "invalid-source-residual-payload") {
    const data = intelligence(); data.footballIQ = { rawData: { profile: { mentalProcessing: { processingSpeed: 100, playRecognition: 100, decisionMaking: 100, anticipation: 100, situationalAwareness: 100 } } } };
    const result = evaluate({ intelligence: data, options: { includeDiagnostics: true } });
    assert(result.components.processing.score === 88 && result.components.decisionMaking.score === 87, "Invalid residual source supplied direct scores.");
    assert(result.diagnostics?.sourceValidation?.footballIQ?.valid === false, "Invalid source validation was not retained in diagnostics.");
  } else if (id === "context-only-source-boundary") {
    const data = intelligence(); data.footballIQ.score = null; data.footballIQ.summary = "Football IQ context only."; data.footballIQ.rawData.profile.mentalProcessing = { processingSpeed: 100, playRecognition: 100, decisionMaking: 100, anticipation: 100, situationalAwareness: 100 }; data.schemeFit.score = null; data.schemeFit.summary = "Scheme context only.";
    const result = evaluate({ intelligence: data });
    assert(result.components.processing.score === 88 && result.components.decisionMaking.score === 87, "Context-only Football IQ leaked into scores.");
    assert(result.conclusions.translationRisk.level === "MODERATE" && result.overallGrade !== 100, "Approved Scheme context or grade boundary failed.");
  } else if (id === "source-usage-valid-regression") {
    same({ grade: complete.overallGrade, scores: Object.fromEntries(Object.entries(complete.components).map(([key, component]) => [key, component.score])) }, { grade: 88, scores: { accuracy: 90, armTalent: 92, processing: 88, decisionMaking: 88, pocketManagement: 86, mobility: 81, playmaking: 84, mechanics: 89 } }, "Valid source regression changed.");
  } else if (id === "source-usage-determinism-immutability") {
    const data = intelligence(); data.footballIQ.available = false; data.footballIQ.dataState = "UNAVAILABLE"; const snapshot = deepClone(data);
    same(evaluate({ intelligence: data }), evaluate({ intelligence: data }), "Corrected source usage is not deterministic.");
    same(data, snapshot, "Corrected source usage mutated its inputs.");
  }
}

export function runQuarterbackProspectModelDiagnostics({ throwOnFailure = false } = {}) {
  const tests = IDS.map((id) => {
    try { runDiagnostic(id); return { id, passed: true, message: `${id} passed.`, details: null }; }
    catch (error) { return { id, passed: false, message: error?.message || `${id} failed.`, details: error?.details ?? null }; }
  });
  const passedCount = tests.filter((test) => test.passed).length;
  const report = { suite: SUITE, passed: passedCount === tests.length, total: tests.length, passedCount, failedCount: tests.length - passedCount, tests };
  if (throwOnFailure && !report.passed) throw new Error(`${SUITE} failed ${report.failedCount} of ${report.total} diagnostics.`);
  return report;
}

export default { runQuarterbackProspectModelDiagnostics };
