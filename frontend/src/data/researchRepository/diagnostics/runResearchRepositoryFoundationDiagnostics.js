import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import researchRepository, * as namedRepository from "../index.js";
import { runResearchSourceContractDiagnostics } from "./runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "./runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "./runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "./runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "./runEvidenceArtifactContractDiagnostics.js";

const SUITE = "ResearchRepositoryFoundationDiagnostics";
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_RELATIVE_FILES = [
  "constants/researchSourceConstants.js",
  "constants/researchSessionConstants.js",
  "constants/recordedObservationConstants.js",
  "constants/analyticalObservationConstants.js",
  "constants/evidenceArtifactConstants.js",
  "contracts/ResearchSourceContract.js",
  "contracts/ResearchSessionContract.js",
  "contracts/RecordedObservationContract.js",
  "contracts/AnalyticalObservationContract.js",
  "contracts/EvidenceArtifactContract.js",
  "index.js",
];
const PRODUCTION_FILES = PRODUCTION_RELATIVE_FILES.map((file) => resolve(REPOSITORY_ROOT, file));
const PRODUCTION_SOURCES = Object.fromEntries(
  PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])
);
const VALIDATION_KEYS = ["valid", "errors", "warnings", "checkedAt", "contractVersion", "schemaVersion"];

const EXPECTED_EXPORTS = [
  "RESEARCH_SOURCE_CONTRACT_NAME", "RESEARCH_SOURCE_CONTRACT_VERSION", "RESEARCH_SOURCE_SCHEMA_VERSION",
  "RESEARCH_SOURCE_CLASSES", "RESEARCH_SOURCE_STATUSES", "RESEARCH_SOURCE_ACCESS_TYPES", "RESEARCH_ROLES",
  "RESEARCH_VERIFICATION_REQUIREMENTS", "createResearchSource", "createUnavailableResearchSource",
  "validateResearchSource", "isResearchSource", "isApprovedResearchSource",
  "RESEARCH_SESSION_CONTRACT_NAME", "RESEARCH_SESSION_CONTRACT_VERSION", "RESEARCH_SESSION_SCHEMA_VERSION",
  "RESEARCH_SESSION_STATUSES", "RESEARCH_SESSION_TYPES", "RESEARCH_SESSION_VERIFICATION_STATES",
  "RESEARCH_SESSION_REVIEW_TYPES", "RESEARCH_SESSION_SUBJECT_TYPES", "RESEARCH_SESSION_SCOPE_STATES",
  "createResearchSession", "createUnavailableResearchSession", "validateResearchSession", "isResearchSession",
  "isCompletedResearchSession", "isVerifiedResearchSession",
  "RECORDED_OBSERVATION_CONTRACT_NAME", "RECORDED_OBSERVATION_CONTRACT_VERSION",
  "RECORDED_OBSERVATION_SCHEMA_VERSION", "RECORDED_OBSERVATION_TYPES", "RECORDED_OBSERVATION_ORIGINS",
  "RECORDED_OBSERVATION_VERIFICATION_STATES", "RECORDED_OBSERVATION_PRECISION_LEVELS",
  "RECORDED_OBSERVATION_TEMPORAL_TYPES", "RECORDED_OBSERVATION_SPATIAL_TYPES",
  "RECORDED_OBSERVATION_SUBJECT_ROLES", "createRecordedObservation", "createUnavailableRecordedObservation",
  "validateRecordedObservation", "isRecordedObservation", "isVerifiedRecordedObservation",
  "isMeasurementObservation", "isStatementObservation",
  "ANALYTICAL_OBSERVATION_CONTRACT_NAME", "ANALYTICAL_OBSERVATION_CONTRACT_VERSION",
  "ANALYTICAL_OBSERVATION_SCHEMA_VERSION", "ANALYTICAL_OBSERVATION_TYPES", "ANALYTICAL_OBSERVATION_SCOPES",
  "ANALYTICAL_CONFIDENCE_LEVELS", "ANALYTICAL_VERIFICATION_STATES", "ANALYTICAL_RELATIONSHIP_TYPES",
  "ANALYTICAL_REVIEW_OUTCOMES", "ANALYTICAL_BASIS_TYPES", "createAnalyticalObservation",
  "createUnavailableAnalyticalObservation", "validateAnalyticalObservation", "isAnalyticalObservation",
  "isReviewedAnalyticalObservation", "isRejectedAnalyticalObservation", "isConflictingAnalyticalObservation",
  "EVIDENCE_ARTIFACT_CONTRACT_NAME", "EVIDENCE_ARTIFACT_CONTRACT_VERSION", "EVIDENCE_ARTIFACT_SCHEMA_VERSION",
  "EVIDENCE_ROLES", "EVIDENCE_DIRECTIONS", "EVIDENCE_STRENGTHS", "EVIDENCE_ARTIFACT_STATES",
  "EVIDENCE_VERIFICATION_STATES", "EVIDENCE_APPLICABILITY_STATES", "EVIDENCE_CONFLICT_STATES",
  "EVIDENCE_BASIS_TYPES", "EVIDENCE_TARGET_TYPES", "EVIDENCE_REVIEW_OUTCOMES", "createEvidenceArtifact",
  "createUnavailableEvidenceArtifact", "validateEvidenceArtifact", "isEvidenceArtifact",
  "isActiveEvidenceArtifact", "isVerifiedEvidenceArtifact", "isDirectEvidenceArtifact",
  "isConflictingEvidenceArtifact", "isSupersededEvidenceArtifact",
];

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => {
    keys.add(key);
    keysDeep(entry, keys);
  });
  return keys;
}

function hasInventedReference(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, entry]) => {
    if (key.endsWith("Ref") && entry !== null) return true;
    if (key.endsWith("Refs") && Array.isArray(entry) && entry.length > 0) return true;
    return hasInventedReference(entry);
  });
}

function containsEmbeddedContract(value, root = true) {
  if (!value || typeof value !== "object") return false;
  if (!root && typeof value.contract === "string") return true;
  return Object.values(value).some((entry) =>
    Array.isArray(entry)
      ? entry.some((item) => containsEmbeddedContract(item, false))
      : containsEmbeddedContract(entry, false)
  );
}

function importSpecifiers(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function localProductionGraph() {
  const nodes = new Set(PRODUCTION_FILES);
  return Object.fromEntries(PRODUCTION_FILES.map((file) => {
    const imports = importSpecifiers(PRODUCTION_SOURCES[file])
      .filter((specifier) => specifier.startsWith("."))
      .map((specifier) => resolve(dirname(file), specifier))
      .filter((target) => nodes.has(target));
    return [file, imports];
  }));
}

function hasCycle(graph) {
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((graph[node] || []).some(visit)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return Object.keys(graph).some(visit);
}

function layer(file) {
  const name = file.toLowerCase();
  if (name.includes("researchsource")) return 0;
  if (name.includes("researchsession")) return 1;
  if (name.includes("recordedobservation")) return 2;
  if (name.includes("analyticalobservation")) return 3;
  if (name.includes("evidenceartifact")) return 4;
  return null;
}

function buildChain() {
  const source = researchRepository.createResearchSource({
    sourceId: "source-foundation", name: "Foundation Source",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
    access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC },
  });
  const session = researchRepository.createResearchSession({
    sessionId: "session-foundation", title: "Foundation Session",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.SOURCE_REVIEW,
    status: researchRepository.RESEARCH_SESSION_STATUSES.PLANNED,
    sourceRefs: [source.sourceId], scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.DEFINED },
    verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED },
    review: { required: false, reviewTypes: [] },
  });
  const recorded = researchRepository.createRecordedObservation({
    observationId: "recorded-foundation", sessionRef: session.sessionId, sourceRefs: [source.sourceId],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.OFFICIAL_RECORD,
    title: "Foundation Record", description: "The source documented the stated record.",
    temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN },
    spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    record: { field: "documentedField", valueText: "documentedValue" },
    verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED },
    provenance: { recordedBy: "researcher-foundation" },
  });
  const analytical = researchRepository.createAnalyticalObservation({
    analysisId: "analysis-foundation", sessionRef: session.sessionId, sourceRefs: [source.sourceId],
    recordedObservationRefs: [recorded.observationId],
    analysisType: researchRepository.ANALYTICAL_OBSERVATION_TYPES.INTERPRETATION,
    scope: researchRepository.ANALYTICAL_OBSERVATION_SCOPES.SINGLE_OBSERVATION,
    statement: { text: "The recorded material demonstrates a documented relationship." },
    evaluator: { evaluatorRef: "evaluator-foundation" },
    confidence: { level: researchRepository.ANALYTICAL_CONFIDENCE_LEVELS.MODERATE },
    verification: { state: researchRepository.ANALYTICAL_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false },
  });
  const evidence = researchRepository.createEvidenceArtifact({
    evidenceId: "evidence-foundation", sessionRef: session.sessionId, sourceRefs: [source.sourceId],
    recordedObservationRefs: [recorded.observationId], analyticalObservationRefs: [analytical.analysisId],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.DRAFT,
    summary: "The referenced research supports later consideration.",
    classification: {
      role: researchRepository.EVIDENCE_ROLES.SUPPORTING,
      direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL,
      strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED,
      applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.UNKNOWN,
    },
    targets: [{ targetType: researchRepository.EVIDENCE_TARGET_TYPES.CONCEPT, targetRef: "external-concept-foundation" }],
    conflicts: { state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE },
    verification: { state: researchRepository.EVIDENCE_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false },
  });
  return { source, session, recorded, analytical, evidence };
}

function buildContext() {
  const chain = buildChain();
  const suiteSummaries = {
    researchSource: runResearchSourceContractDiagnostics(),
    researchSession: runResearchSessionContractDiagnostics(),
    recordedObservation: runRecordedObservationContractDiagnostics(),
    analyticalObservation: runAnalyticalObservationContractDiagnostics(),
    evidenceArtifact: runEvidenceArtifactContractDiagnostics(),
  };
  const specs = [
    { name: "source", create: researchRepository.createResearchSource, unavailable: researchRepository.createUnavailableResearchSource, validate: researchRepository.validateResearchSource, guard: researchRepository.isResearchSource, input: { sourceId: "s", name: "S", sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL, status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE, access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC } }, unavailableInput: { sourceId: "missing-source" } },
    { name: "session", create: researchRepository.createResearchSession, unavailable: researchRepository.createUnavailableResearchSession, validate: researchRepository.validateResearchSession, guard: researchRepository.isResearchSession, input: { sessionId: "s", title: "S", sessionType: researchRepository.RESEARCH_SESSION_TYPES.OTHER, status: researchRepository.RESEARCH_SESSION_STATUSES.PLANNED, scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.UNDEFINED }, verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED }, review: { required: false } }, unavailableInput: { sessionId: "missing-session", title: "Missing" } },
    { name: "recorded", create: researchRepository.createRecordedObservation, unavailable: researchRepository.createUnavailableRecordedObservation, validate: researchRepository.validateRecordedObservation, guard: researchRepository.isRecordedObservation, input: { observationId: "o", sessionRef: "s", observationType: researchRepository.RECORDED_OBSERVATION_TYPES.OTHER, origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.RESEARCHER_RECORDED, description: "Recorded.", temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN }, spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE }, verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED }, provenance: { recordedBy: "r" } }, unavailableInput: { observationId: "missing-observation", title: "Missing" } },
    { name: "analytical", create: researchRepository.createAnalyticalObservation, unavailable: researchRepository.createUnavailableAnalyticalObservation, validate: researchRepository.validateAnalyticalObservation, guard: researchRepository.isAnalyticalObservation, input: { analysisId: "a", sourceRefs: ["s"], analysisType: researchRepository.ANALYTICAL_OBSERVATION_TYPES.OTHER, scope: researchRepository.ANALYTICAL_OBSERVATION_SCOPES.OTHER, statement: { text: "Analysis." }, evaluator: { evaluatorLabel: "Evaluator" }, confidence: { level: researchRepository.ANALYTICAL_CONFIDENCE_LEVELS.UNSPECIFIED }, verification: { state: researchRepository.ANALYTICAL_VERIFICATION_STATES.UNVERIFIED }, review: { required: false } }, unavailableInput: { analysisId: "missing-analysis", title: "Missing", statement: { text: "Unavailable." }, evaluator: { evaluatorLabel: "Evaluator" } } },
    { name: "evidence", create: researchRepository.createEvidenceArtifact, unavailable: researchRepository.createUnavailableEvidenceArtifact, validate: researchRepository.validateEvidenceArtifact, guard: researchRepository.isEvidenceArtifact, input: { evidenceId: "e", sourceRefs: ["s"], state: researchRepository.EVIDENCE_ARTIFACT_STATES.DRAFT, summary: "Evidence.", classification: { role: researchRepository.EVIDENCE_ROLES.OTHER, direction: researchRepository.EVIDENCE_DIRECTIONS.UNKNOWN, strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED, applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.UNKNOWN }, conflicts: { state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE }, verification: { state: researchRepository.EVIDENCE_VERIFICATION_STATES.UNVERIFIED }, review: { required: false } }, unavailableInput: { evidenceId: "missing-evidence", title: "Missing", summary: "Unavailable." } },
  ];
  return { chain, suiteSummaries, specs, graph: localProductionGraph() };
}

const CASES = [
  ["unique-contract-names", ({ chain }) => assert(new Set(Object.values(chain).map((item) => item.contract)).size === 5, "Contract names collide.")],
  ["contract-versions-present", ({ chain }) => assert(Object.values(chain).every((item) => typeof item.contractVersion === "string" && item.contractVersion), "Contract version missing.")],
  ["schema-versions-present", ({ chain }) => assert(Object.values(chain).every((item) => typeof item.schemaVersion === "string" && item.schemaVersion), "Schema version missing.")],
  ["factory-contract-identities", ({ specs }) => assert(specs.every((spec) => ["contract", "contractVersion", "schemaVersion"].every((key) => spec.create(spec.input)[key])), "Factory identity incomplete.")],
  ["factory-validation-shapes", ({ specs }) => assert(specs.every((spec) => VALIDATION_KEYS.every((key) => Object.hasOwn(spec.create(spec.input).validation, key))), "Validation shape incomplete.")],
  ["unavailable-complete-shapes", ({ specs }) => assert(specs.every((spec) => JSON.stringify(Object.keys(spec.create(spec.input)).sort()) === JSON.stringify(Object.keys(spec.unavailable(spec.unavailableInput)).sort())), "Unavailable shape incomplete.")],
  ["validation-errors-arrays", ({ specs }) => assert(specs.every((spec) => Array.isArray(spec.create(spec.input).validation.errors)), "Validation errors not arrays.")],
  ["validation-warnings-arrays", ({ specs }) => assert(specs.every((spec) => Array.isArray(spec.create(spec.input).validation.warnings)), "Validation warnings not arrays.")],
  ["validators-tolerate-null", ({ specs }) => assert(specs.every((spec) => { try { return spec.validate(null) && true; } catch { return false; } }), "Validator rejected null by throwing.")],
  ["validators-tolerate-arrays", ({ specs }) => assert(specs.every((spec) => { try { return spec.validate([]) && true; } catch { return false; } }), "Validator rejected array by throwing.")],
  ["validators-tolerate-primitives", ({ specs }) => assert(specs.every((spec) => [0, true, "invalid"].every((value) => { try { return spec.validate(value) && true; } catch { return false; } })), "Validator rejected primitive by throwing.")],
  ["type-guards-return-booleans", ({ specs }) => assert(specs.every((spec) => typeof spec.guard(spec.create(spec.input)) === "boolean" && typeof spec.guard(null) === "boolean"), "Type guard returned non-boolean.")],
  ["source-ownership-boundary", ({ chain }) => { const keys = keysDeep(chain.source); assert(["observations", "analyses", "evidenceArtifacts", "score", "grade", "intelligence"].every((key) => !keys.has(key)), "Source owns later-layer data."); }],
  ["session-reference-only", ({ chain }) => assert(!containsEmbeddedContract(chain.session) && Object.values(chain.session.artifactRefs).every((refs) => refs.every((ref) => typeof ref === "string")), "Session embeds records.")],
  ["recorded-ownership-boundary", ({ chain }) => { const keys = keysDeep(chain.recorded); assert(["interpretation", "confidence", "evidenceRole", "direction", "strength", "trait", "component", "score", "grade", "recommendation", "conclusion"].every((key) => !keys.has(key)), "Recorded observation leaks interpretation or evaluation."); }],
  ["analytical-ownership-boundary", ({ chain }) => { const keys = keysDeep(chain.analytical); assert(["evidenceRole", "evidenceStrength", "traitResult", "componentResult", "score", "grade", "projection", "recommendation", "ranking", "intelligence"].every((key) => !keys.has(key)) && chain.analytical.statement.text, "Analytical boundary failed."); }],
  ["evidence-ownership-boundary", ({ chain }) => { const keys = keysDeep(chain.evidence); assert(["weight", "multiplier", "score", "grade", "probability", "percentage", "traitResult", "componentResult", "evaluationResult", "projectionResult", "recommendation", "ranking", "consensusResult"].every((key) => !keys.has(key)) && chain.evidence.classification.role, "Evidence boundary failed."); }],
  ["source-reference-compatibility", ({ chain }) => assert(chain.session.sourceRefs[0] === chain.source.sourceId && chain.recorded.sourceRefs[0] === chain.source.sourceId, "Source IDs incompatible.")],
  ["session-reference-compatibility", ({ chain }) => assert(chain.recorded.sessionRef === chain.session.sessionId && chain.analytical.sessionRef === chain.session.sessionId, "Session IDs incompatible.")],
  ["recorded-reference-compatibility", ({ chain }) => assert(chain.analytical.recordedObservationRefs[0] === chain.recorded.observationId, "Recorded ID incompatible.")],
  ["analytical-reference-compatibility", ({ chain }) => assert(chain.evidence.analyticalObservationRefs[0] === chain.analytical.analysisId, "Analytical ID incompatible.")],
  ["related-evidence-reference-compatibility", () => { const result = researchRepository.createEvidenceArtifact({ ...buildChain().evidence, evidenceId: "evidence-related", relatedEvidenceRefs: ["evidence-foundation"] }); assert(result.relatedEvidenceRefs[0] === "evidence-foundation", "Related evidence ID incompatible."); }],
  ["external-target-unresolved", ({ chain }) => assert(chain.evidence.targets[0].targetRef === "external-concept-foundation" && typeof chain.evidence.targets[0].targetRef === "string", "Target was resolved or hydrated.")],
  ["full-chain-valid", ({ chain }) => assert(Object.values(chain).every((item) => item.validation.valid), "Reference chain invalid.")],
  ["full-chain-no-embedded-contracts", ({ chain }) => assert(Object.values(chain).every((item) => !containsEmbeddedContract(item)), "Chain embeds contract objects.")],
  ["full-chain-no-score", ({ chain }) => assert(Object.values(chain).every((item) => !keysDeep(item).has("score")), "Chain produced score.")],
  ["full-chain-no-grade", ({ chain }) => assert(Object.values(chain).every((item) => !keysDeep(item).has("grade")), "Chain produced grade.")],
  ["full-chain-no-recommendation", ({ chain }) => assert(Object.values(chain).every((item) => !keysDeep(item).has("recommendation")), "Chain produced recommendation.")],
  ["full-chain-no-intelligence-output", ({ chain }) => assert(Object.values(chain).every((item) => !keysDeep(item).has("intelligence")), "Chain produced intelligence.")],
  ["dependency-direction", ({ graph }) => assert(Object.entries(graph).every(([file, imports]) => file.endsWith("index.js") || imports.every((target) => layer(target) === null || layer(file) === null || layer(target) <= layer(file))), "Earlier contract imports later layer.")],
  ["contracts-do-not-import-diagnostics", () => assert(PRODUCTION_FILES.filter((file) => file.includes("contracts")).every((file) => importSpecifiers(PRODUCTION_SOURCES[file]).every((specifier) => !specifier.includes("diagnostic"))), "Contract imports diagnostics.")],
  ["production-index-does-not-import-diagnostics", () => { const file = resolve(REPOSITORY_ROOT, "index.js"); assert(importSpecifiers(PRODUCTION_SOURCES[file]).every((specifier) => !specifier.includes("diagnostic")), "Production index imports diagnostics."); }],
  ["no-circular-production-dependency", ({ graph }) => assert(!hasCycle(graph), "Production dependency cycle found.")],
  ["public-named-exports-complete", () => assert(EXPECTED_EXPORTS.every((name) => Object.hasOwn(namedRepository, name)), "Named API incomplete.")],
  ["default-export-complete", () => assert(EXPECTED_EXPORTS.every((name) => Object.hasOwn(researchRepository, name)), "Default API incomplete.")],
  ["named-exports-no-collisions", () => { const names = Object.keys(namedRepository).filter((name) => name !== "default"); assert(names.length === new Set(names).size && EXPECTED_EXPORTS.length === new Set(EXPECTED_EXPORTS).size, "Named export collision."); }],
  ["default-export-no-collisions", () => {
    const names = Object.keys(researchRepository);
    const missing = EXPECTED_EXPORTS.filter((name) => !Object.hasOwn(researchRepository, name));
    const disagreements = EXPECTED_EXPORTS.filter(
      (name) => namedRepository[name] !== researchRepository[name]
    );
    assert(
      names.length === new Set(names).size &&
        EXPECTED_EXPORTS.length === new Set(EXPECTED_EXPORTS).size &&
        missing.length === 0 &&
        disagreements.length === 0,
      "Default export collision, missing original export, or named/default disagreement.",
      { missing, disagreements }
    );
  }],
  ["source-diagnostics-pass", ({ suiteSummaries }) => assert(suiteSummaries.researchSource.failed === 0, "Source diagnostics regressed.")],
  ["session-diagnostics-pass", ({ suiteSummaries }) => assert(suiteSummaries.researchSession.failed === 0, "Session diagnostics regressed.")],
  ["recorded-diagnostics-pass", ({ suiteSummaries }) => assert(suiteSummaries.recordedObservation.failed === 0, "Recorded diagnostics regressed.")],
  ["analytical-diagnostics-pass", ({ suiteSummaries }) => assert(suiteSummaries.analyticalObservation.failed === 0, "Analytical diagnostics regressed.")],
  ["evidence-diagnostics-pass", ({ suiteSummaries }) => assert(suiteSummaries.evidenceArtifact.failed === 0, "Evidence diagnostics regressed.")],
  ["factories-do-not-mutate", ({ specs }) => assert(specs.every((spec) => { const input = structuredClone(spec.input); const before = JSON.stringify(input); spec.create(input); return JSON.stringify(input) === before; }), "Factory mutated input.")],
  ["validators-do-not-mutate", ({ specs }) => assert(specs.every((spec) => { const input = structuredClone(spec.input); const before = JSON.stringify(input); spec.validate(input); return JSON.stringify(input) === before; }), "Validator mutated input.")],
  ["normalization-stable", ({ specs }) => assert(specs.every((spec) => JSON.stringify(spec.create(spec.input)) === JSON.stringify(spec.create(spec.input))), "Normalization unstable.")],
  ["unavailable-no-invented-dates", ({ specs }) => assert(specs.every((spec) => { const result = spec.unavailable(spec.unavailableInput); const dateValues = []; (function walk(value, key = "") { if (Array.isArray(value)) value.forEach((entry) => walk(entry, key)); else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, entry]) => { if ((childKey.endsWith("At") || childKey.endsWith("Date")) && childKey !== "checkedAt") dateValues.push(entry); walk(entry, childKey); }); })(result); return dateValues.every((value) => value === null); }), "Unavailable factory invented date.")],
  ["unavailable-no-invented-references", ({ specs }) => assert(specs.every((spec) => !hasInventedReference(spec.unavailable(spec.unavailableInput))), "Unavailable factory invented references.")],
  ["unavailable-no-invented-verification", ({ specs }) => assert(specs.every((spec) => { const result = spec.unavailable(spec.unavailableInput); return !result.verification || result.verification.state === null; }), "Unavailable factory invented verification.")],
  ["unavailable-no-intelligence", ({ specs }) => assert(specs.every((spec) => { const keys = keysDeep(spec.unavailable(spec.unavailableInput)); return !keys.has("score") && !keys.has("grade") && !keys.has("intelligence"); }), "Unavailable factory created intelligence.")],
  ["production-sport-agnostic", () => { const forbidden = /\b(football|quarterback|qb|player|team|coach|coverage|scheme|draft|prospect)\b/i; const sources = Object.values(PRODUCTION_SOURCES).map((source) => source.replace(/\bDRAFT:\s*"DRAFT"/g, "")); assert(sources.every((source) => !forbidden.test(source)), "Domain-specific vocabulary found outside the approved generic DRAFT lifecycle constant."); }],
  ["no-prohibited-position-or-trait-vocabulary", () => { const forbidden = /\b(running back|wide receiver|tight end|offensive tackle|linebacker|cornerback|kicker|punter|arm talent|pocket management|route tree|pass rush)\b/i; assert(Object.values(PRODUCTION_SOURCES).every((source) => !forbidden.test(source)), "Position or trait vocabulary found."); }],
  ["diagnostics-excluded-from-production", () => assert(Object.keys(researchRepository).every((name) => !name.toLowerCase().includes("diagnostic")), "Diagnostic runner exported.")],
  ["foundation-runner-diagnostics-only", () => assert(!Object.hasOwn(namedRepository, "runResearchRepositoryFoundationDiagnostics") && import.meta.url.includes("/diagnostics/"), "Foundation runner entered production API.")],
  ["usable-without-fid", ({ graph }) => assert(Object.values(graph).flat().every((target) => !/fid|footballintelligencedatabase/i.test(target)), "Foundation depends on FID.")],
  ["usable-without-ontology", ({ graph }) => assert(Object.values(graph).flat().every((target) => !/ontology/i.test(target)), "Foundation depends on ontology.")],
  ["usable-without-persistence", ({ graph }) => assert(Object.values(graph).flat().every((target) => !/persistence|storage|database/i.test(target)), "Foundation depends on persistence.")],
  ["usable-without-engines", ({ graph }) => assert(Object.values(graph).flat().every((target) => !/engines/i.test(target)), "Foundation depends on engines.")],
  ["usable-without-ui", ({ graph }) => assert(Object.values(graph).flat().every((target) => !/components|pages|routes|app\.jsx/i.test(target)), "Foundation depends on UI.")],
  ["diagnostic-suites-run-independently", ({ suiteSummaries }) => assert(typeof runResearchRepositoryFoundationDiagnostics === "function" && Object.values(suiteSummaries).every((summary) => summary.total > 0), "A diagnostic suite is not independently runnable.")],
  ["diagnostic-summaries-structured", ({ suiteSummaries }) => assert(Object.values(suiteSummaries).every((summary) => ["suite", "contractVersion", "schemaVersion", "total", "passed", "failed", "cases"].every((key) => Object.hasOwn(summary, key))), "Diagnostic summary shape inconsistent.")],
];

export function runResearchRepositoryFoundationDiagnostics({ throwOnFailure = false } = {}) {
  const context = buildContext();
  const cases = CASES.map(([id, execute]) => {
    try {
      execute(context);
      return { id, passed: true, message: `${id} passed.`, details: null };
    } catch (error) {
      return { id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersions: {
      researchSource: researchRepository.RESEARCH_SOURCE_CONTRACT_VERSION,
      researchSession: researchRepository.RESEARCH_SESSION_CONTRACT_VERSION,
      recordedObservation: researchRepository.RECORDED_OBSERVATION_CONTRACT_VERSION,
      analyticalObservation: researchRepository.ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
      evidenceArtifact: researchRepository.EVIDENCE_ARTIFACT_CONTRACT_VERSION,
    },
    schemaVersions: {
      researchSource: researchRepository.RESEARCH_SOURCE_SCHEMA_VERSION,
      researchSession: researchRepository.RESEARCH_SESSION_SCHEMA_VERSION,
      recordedObservation: researchRepository.RECORDED_OBSERVATION_SCHEMA_VERSION,
      analyticalObservation: researchRepository.ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
      evidenceArtifact: researchRepository.EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    },
    total: cases.length,
    passed,
    failed,
    cases,
    suiteSummaries: context.suiteSummaries,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runResearchRepositoryFoundationDiagnostics });
