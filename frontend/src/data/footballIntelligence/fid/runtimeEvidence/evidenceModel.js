import { deepFreeze } from "./contractSupport.js";
import { createRuntimeEvidenceClaimAssessment, createRuntimeEvidenceCustodyRecord, createRuntimeEvidencePackage } from "./RuntimeEvidenceContracts.js";
import { canonicalizeRefValue, deriveRefContentIdentity, isCanonicalSha256Digest } from "./canonicalIdentity.js";

const vocabulary = (...values) => Object.freeze(Object.fromEntries(values.map((value) => [value, value])));
export const REF_V1_4_MODEL_VERSION = "1.0.0";
export const REF_V1_4_OBSERVATION_STATES = vocabulary("PRESENT", "ABSENT", "UNOBSERVABLE", "INSUFFICIENT", "CONTRADICTORY", "UNRESOLVED", "NOT_APPLICABLE");
export const REF_V1_4_EVIDENCE_SOURCES = vocabulary("DECLARED", "OPERATOR_ATTESTED", "CLIENT_OBSERVED", "PLATFORM_ATTESTED", "RUNTIME_OBSERVED", "DATABASE_OBSERVED", "EXTERNALLY_VERIFIED", "DERIVED", "INFERRED", "UNKNOWN");
export const REF_V1_4_RELATIONSHIP_TYPES = vocabulary("SUPPORTS", "CONTRADICTS", "CORROBORATES", "DERIVES_FROM", "SUPERSEDES", "REFERENCES", "PRECEDES", "FOLLOWS", "BELONGS_TO_EXECUTION", "BELONGS_TO_SESSION", "BELONGS_TO_TRANSACTION", "RESULT_OF_STAGE", "EXPLAINS_GAP", "REDACTED_DERIVATIVE_OF");
export const REF_V1_4_ORDER_STATES = vocabulary("INTENDED", "OBSERVED", "CONFIRMED", "INFERRED", "UNKNOWN", "PARTIAL", "CONCURRENT", "UNORDERED");
export const REF_V1_4_SUFFICIENCY_OUTCOMES = vocabulary("SUFFICIENT_FOR_CLAIM", "PARTIALLY_SUFFICIENT", "INSUFFICIENT", "CONTRADICTED", "UNRESOLVED");
export const REF_V1_4_CONTINUITY_STATES = vocabulary("CONTINUOUS", "PARTIAL", "GAPPED", "CONTRADICTORY", "UNVERIFIABLE", "UNRESOLVED");
export const REF_V1_4_INDEPENDENCE_STATES = vocabulary("INDEPENDENT_WITNESS", "PARTIALLY_INDEPENDENT", "SHARED_DEPENDENCY", "DERIVED_DUPLICATE", "COMMON_MODE_DEPENDENCY", "CIRCULAR_CORROBORATION", "UNKNOWN");

export class RefEvidenceModelError extends TypeError {
  constructor(code, path, message = code) { super(message); this.name = "RefEvidenceModelError"; this.code = code; this.path = path; }
}
const issue = (code, path, detail = null) => deepFreeze({ code, path, detail });
const required = (value, path, errors) => { if (typeof value !== "string" || !value.trim()) errors.push(issue("MISSING_REQUIRED_REFERENCE", path)); return value ?? null; };
const member = (value, allowed, path, errors) => { if (!Object.values(allowed).includes(value)) errors.push(issue("UNSUPPORTED_DECLARATION", path, value)); return value ?? null; };
const list = (value, path, errors) => { if (!Array.isArray(value)) { errors.push(issue("COLLECTION_REQUIRED", path)); return []; } if (value.length > 256) errors.push(issue("COLLECTION_LIMIT_EXCEEDED", path)); return structuredClone(value); };
const validation = (errors, warnings = []) => deepFreeze({ valid: errors.length === 0, errors: [...errors], warnings: [...warnings], checkedAt: null, modelVersion: REF_V1_4_MODEL_VERSION });
const safe = (value) => { canonicalizeRefValue(value); return structuredClone(value); };

export function createRuntimeEvidenceObservation(input = {}) {
  safe(input); const errors = [];
  const result = {
    model: "RuntimeEvidenceObservation", modelVersion: REF_V1_4_MODEL_VERSION,
    observationRef: required(input.observationRef, "observationRef", errors), subjectRef: required(input.subjectRef, "subjectRef", errors),
    layerRef: required(input.layerRef, "layerRef", errors), pointRef: required(input.pointRef, "pointRef", errors), sourceRef: required(input.sourceRef, "sourceRef", errors),
    sourceClassification: member(input.sourceClassification, REF_V1_4_EVIDENCE_SOURCES, "sourceClassification", errors),
    observationState: member(input.observationState, REF_V1_4_OBSERVATION_STATES, "observationState", errors),
    evidenceClassificationRef: input.evidenceClassificationRef ?? null, boundedDetail: input.boundedDetail ?? null, expectedValueDeclaration: input.expectedValueDeclaration ?? null,
    provenanceRef: input.provenanceRef ?? null, authenticityDeclarationRef: input.authenticityDeclarationRef ?? null, integrityDeclarationRef: input.integrityDeclarationRef ?? null,
    fidelity: safe(input.fidelity ?? {}), completeness: safe(input.completeness ?? {}), bindings: safe(input.bindings ?? {}), correlationRefs: list(input.correlationRefs ?? [], "correlationRefs", errors),
    sequencePosition: input.sequencePosition ?? null, orderState: member(input.orderState ?? "UNKNOWN", REF_V1_4_ORDER_STATES, "orderState", errors),
    uncertaintyRefs: list(input.uncertaintyRefs ?? [], "uncertaintyRefs", errors), contradictionRefs: list(input.contradictionRefs ?? [], "contradictionRefs", errors),
    transformationDeclarationRef: input.transformationDeclarationRef ?? null, extensions: safe(input.extensions ?? {}),
  };
  if (result.sequencePosition !== null && (!Number.isInteger(result.sequencePosition) || result.sequencePosition < 0)) errors.push(issue("INVALID_SEQUENCE_POSITION", "sequencePosition"));
  if (result.boundedDetail !== null && canonicalizeRefValue(result.boundedDetail).length > 8192) errors.push(issue("UNBOUNDED_EVIDENCE_DETAIL", "boundedDetail"));
  result.validation = validation(errors); return deepFreeze(result);
}

export function createEvidenceRelationship(input = {}) {
  safe(input); const errors = [];
  const result = { model: "RuntimeEvidenceRelationship", modelVersion: REF_V1_4_MODEL_VERSION, relationshipRef: required(input.relationshipRef, "relationshipRef", errors), sourceRef: required(input.sourceRef, "sourceRef", errors), targetRef: required(input.targetRef, "targetRef", errors), relationshipType: member(input.relationshipType, REF_V1_4_RELATIONSHIP_TYPES, "relationshipType", errors), transactionRef: input.transactionRef ?? null, stageRef: input.stageRef ?? null, orderEvidenceRefs: list(input.orderEvidenceRefs ?? [], "orderEvidenceRefs", errors), resolutionRef: input.resolutionRef ?? null, extensions: safe(input.extensions ?? {}) };
  if (result.sourceRef && result.sourceRef === result.targetRef && ["DERIVES_FROM", "SUPERSEDES", "PRECEDES", "FOLLOWS", "REDACTED_DERIVATIVE_OF"].includes(result.relationshipType)) errors.push(issue("PROHIBITED_SELF_REFERENCE", "targetRef"));
  if (result.relationshipType === "BELONGS_TO_TRANSACTION" && !result.transactionRef) errors.push(issue("TRANSACTION_REFERENCE_REQUIRED", "transactionRef"));
  if (["PRECEDES", "FOLLOWS"].includes(result.relationshipType) && result.orderEvidenceRefs.length === 0) errors.push(issue("ORDER_EVIDENCE_REQUIRED", "orderEvidenceRefs"));
  result.validation = validation(errors); return deepFreeze(result);
}

const cycles = (relationships, types) => {
  const graph = new Map(); for (const item of relationships.filter((entry) => types.includes(entry.relationshipType))) { if (!graph.has(item.sourceRef)) graph.set(item.sourceRef, []); graph.get(item.sourceRef).push(item.targetRef); }
  const visiting = new Set(), visited = new Set();
  const visit = (node) => { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); for (const next of graph.get(node) ?? []) if (visit(next)) return true; visiting.delete(node); visited.add(node); return false; };
  return [...graph.keys()].some(visit);
};

export function validateEvidenceRelationships(observations = [], relationships = []) {
  const errors = [], observationRefs = new Set();
  for (const [index, item] of observations.entries()) { if (!item?.validation?.valid) errors.push(issue("INVALID_OBSERVATION", `observations[${index}]`)); if (observationRefs.has(item?.observationRef)) errors.push(issue("DUPLICATE_OBSERVATION_IDENTITY", `observations[${index}].observationRef`)); observationRefs.add(item?.observationRef); }
  const relationshipRefs = new Set();
  for (const [index, item] of relationships.entries()) {
    if (!item?.validation?.valid) errors.push(issue("INVALID_RELATIONSHIP", `relationships[${index}]`));
    if (relationshipRefs.has(item?.relationshipRef)) errors.push(issue("DUPLICATE_RELATIONSHIP_IDENTITY", `relationships[${index}].relationshipRef`)); relationshipRefs.add(item?.relationshipRef);
    if (!observationRefs.has(item?.sourceRef)) errors.push(issue("DANGLING_OBSERVATION_REFERENCE", `relationships[${index}].sourceRef`));
    if (!observationRefs.has(item?.targetRef) && !["BELONGS_TO_EXECUTION", "BELONGS_TO_SESSION", "BELONGS_TO_TRANSACTION", "RESULT_OF_STAGE"].includes(item?.relationshipType)) errors.push(issue("DANGLING_OBSERVATION_REFERENCE", `relationships[${index}].targetRef`));
  }
  if (cycles(relationships, ["DERIVES_FROM", "REDACTED_DERIVATIVE_OF"])) errors.push(issue("DERIVATIVE_LINEAGE_CYCLE", "relationships"));
  if (cycles(relationships, ["SUPERSEDES"])) errors.push(issue("SUPERSESSION_CYCLE", "relationships"));
  const positions = observations.filter((item) => item.sequencePosition !== null).map((item) => item.sequencePosition);
  if (new Set(positions).size !== positions.length) errors.push(issue("DUPLICATE_SEQUENCE_POSITION", "observations"));
  const ordered = observations.filter((item) => item.sequencePosition !== null && ["OBSERVED", "CONFIRMED"].includes(item.orderState)).map((item) => item.sequencePosition);
  if (ordered.some((value, index) => index > 0 && value < ordered[index - 1])) errors.push(issue("INVALID_CHRONOLOGY", "observations"));
  return validation(errors);
}

export function createRedactionDerivativeDeclaration(input = {}) {
  safe(input); const errors = [];
  const allowed = ["REMOVED", "MASKED", "NORMALIZED", "SUMMARIZED", "TRANSFORMED"];
  const result = { model: "RuntimeEvidenceDerivativeDeclaration", modelVersion: REF_V1_4_MODEL_VERSION, derivativeRef: required(input.derivativeRef, "derivativeRef", errors), sourceRef: required(input.sourceRef, "sourceRef", errors), sourceIdentity: required(input.sourceIdentity, "sourceIdentity", errors), derivativeIdentity: required(input.derivativeIdentity, "derivativeIdentity", errors), transformationType: input.transformationType ?? null, reasonRef: required(input.reasonRef, "reasonRef", errors), affectedFieldsOrCategories: list(input.affectedFieldsOrCategories, "affectedFieldsOrCategories", errors), fidelityImpact: required(input.fidelityImpact, "fidelityImpact", errors), completenessImpact: required(input.completenessImpact, "completenessImpact", errors), identityImpact: input.identityImpact ?? "NEW_DERIVATIVE_IDENTITY_REQUIRED", custodyImplicationRefs: list(input.custodyImplicationRefs ?? [], "custodyImplicationRefs", errors), unresolvedLimitations: list(input.unresolvedLimitations ?? [], "unresolvedLimitations", errors), extensions: safe(input.extensions ?? {}) };
  if (!allowed.includes(result.transformationType)) errors.push(issue("INVALID_TRANSFORMATION", "transformationType"));
  if (result.sourceIdentity && result.sourceIdentity === result.derivativeIdentity) errors.push(issue("DERIVATIVE_IDENTITY_REUSE", "derivativeIdentity"));
  if (!result.fidelityImpact || !result.completenessImpact) errors.push(issue("REDACTION_IMPACT_REQUIRED", "impact"));
  result.validation = validation(errors); return deepFreeze(result);
}

export function buildRuntimeEvidencePackage(input = {}) {
  safe(input); const errors = [];
  required(input.executionPlanRef, "executionPlanRef", errors); required(input.observationPlanRef, "observationPlanRef", errors);
  const observations = (input.observations ?? []).map((item) => item?.model === "RuntimeEvidenceObservation" ? item : createRuntimeEvidenceObservation(item));
  const relationships = (input.relationships ?? []).map((item) => item?.model === "RuntimeEvidenceRelationship" ? item : createEvidenceRelationship(item));
  const relationshipValidation = validateEvidenceRelationships(observations, relationships); errors.push(...relationshipValidation.errors);
  const bySource = (source) => observations.filter((item) => item.sourceClassification === source).map((item) => item.observationRef);
  const packageDeclaration = createRuntimeEvidencePackage({
    ...input, operatorEvidenceRefs: bySource("OPERATOR_ATTESTED"), clientObservationRefs: bySource("CLIENT_OBSERVED"), runtimeObservationRefs: bySource("RUNTIME_OBSERVED"),
    stageObservationRefs: observations.filter((item) => item.bindings.stageRef).map((item) => item.observationRef), resultObservationRefs: observations.filter((item) => item.bindings.resultRef).map((item) => item.observationRef),
    errorOrUncertaintyObservationRefs: observations.filter((item) => item.observationState !== "PRESENT").map((item) => item.observationRef), transactionObservationRefs: observations.filter((item) => item.bindings.transactionRef).map((item) => item.observationRef),
    chronologyRefs: observations.map((item) => item.observationRef), evidenceRelationshipRefs: relationships.map((item) => item.relationshipRef),
    extensions: { ...(input.extensions ?? {}), refV1_4: { executionPlanRef: input.executionPlanRef, observationPlanRef: input.observationPlanRef, executionRef: input.executionRef ?? null, attemptRef: input.attemptRef ?? null, operatorDeclarationRef: input.operatorDeclarationRef ?? null, databaseObservationRefs: bySource("DATABASE_OBSERVED"), platformObservationRefs: bySource("PLATFORM_ATTESTED"), sessionObservationRefs: observations.filter((item) => item.bindings.sessionRef).map((item) => item.observationRef), predecessorPackageRef: input.predecessorPackageRef ?? null, investigationRefs: [...(input.investigationRefs ?? [])], observations, relationships, derivativeDeclarations: safe(input.derivativeDeclarations ?? []) } },
  });
  if (!packageDeclaration.validation.valid) errors.push(...packageDeclaration.validation.errors.map((entry) => issue("INVALID_PACKAGE_DECLARATION", entry.path, entry.code)));
  return deepFreeze({ model: "RuntimeEvidencePackageModel", modelVersion: REF_V1_4_MODEL_VERSION, package: packageDeclaration, observations, relationships, validation: validation(errors) });
}

export async function finalizeRuntimeEvidencePackage(model, expected = null, cryptoProvider = globalThis.crypto) {
  if (!model?.validation?.valid) throw new RefEvidenceModelError("INVALID_PACKAGE_DECLARATION", "$", "Only a structurally valid package model can be finalized.");
  const expectedDigest = expected && typeof expected === "object" ? expected.digest ?? null : expected;
  const expectedAlgorithm = expected && typeof expected === "object" ? expected.algorithm ?? "SHA-256" : "SHA-256";
  if (expectedAlgorithm !== "SHA-256") throw new RefEvidenceModelError("UNSUPPORTED_ALGORITHM", "$.expected.algorithm");
  if (expectedDigest !== null && !isCanonicalSha256Digest(expectedDigest)) throw new RefEvidenceModelError("INVALID_DIGEST_FORMAT", "$.expectedDigest");
  const identity = await deriveRefContentIdentity(model.package, cryptoProvider); const matches = expectedDigest === null ? null : identity.digest === expectedDigest;
  const integrity = deepFreeze({ profile: identity.profile, algorithm: identity.algorithm, calculatedDigest: identity.digest, expectedDigest, comparisonOutcome: matches === null ? "NOT_PROVIDED" : matches ? "MATCHED" : "MISMATCHED", verificationState: matches === null ? "CALCULATED" : matches ? "MATCHED" : "MISMATCHED", canonicalByteLength: new TextEncoder().encode(identity.canonicalRepresentation).byteLength, mismatchDetail: matches === false ? "EXPECTED_AND_CALCULATED_DIGEST_DIFFER" : null, uncertainty: "LOCAL_MATCH_DOES_NOT_ESTABLISH_EXTERNAL_AUTHENTICITY_RECEIPT_EXECUTION_TARGET_OR_SUCCESS" });
  return deepFreeze({ ...model, contentIdentity: identity.identity, integrity, reviewReady: { packageRef: model.package.evidencePackageRef, packageContentIdentity: identity.identity, unresolvedObservationRefs: model.observations.filter((item) => ["UNOBSERVABLE", "INSUFFICIENT", "CONTRADICTORY", "UNRESOLVED"].includes(item.observationState)).map((item) => item.observationRef), contradictionRelationshipRefs: model.relationships.filter((item) => item.relationshipType === "CONTRADICTS").map((item) => item.relationshipRef), prohibitedNextActionRefs: ["ref:action:auto-conclusion", "ref:action:authority-from-evidence", "ref:action:auto-retry"] } });
}

export function buildRuntimeEvidenceCustodyRecord(input = {}) {
  safe(input); const record = createRuntimeEvidenceCustodyRecord({ ...input, extensions: { ...(input.extensions ?? {}), refV1_4: { predecessorCustodyRecordRef: input.predecessorCustodyRecordRef ?? null, successorCustodyRecordRef: input.successorCustodyRecordRef ?? null, packageContentIdentity: input.packageContentIdentity ?? null, transferCompleted: input.transferCompleted === true, receiptConfirmed: input.receiptConfirmed === true, integrityState: input.integrityState ?? "NOT_CALCULATED", redactionOrTransformationRef: input.redactionOrTransformationRef ?? null } } });
  return record;
}

export function assessCustodyContinuity(records = []) {
  const errors = [], warnings = []; if (!Array.isArray(records) || records.length === 0) return deepFreeze({ continuityState: "UNVERIFIABLE", errors: [], warnings: [issue("NO_CUSTODY_RECORDS", "records")] });
  const refs = new Set(), identities = new Set();
  for (const [index, record] of records.entries()) { if (!record?.validation?.valid) errors.push(issue("INVALID_CUSTODY_RECORD", `records[${index}]`)); if (refs.has(record.custodyRecordRef)) errors.push(issue("DUPLICATE_CUSTODY_IDENTITY", `records[${index}]`)); refs.add(record.custodyRecordRef); const ext = record.extensions?.refV1_4 ?? {}; if (ext.packageContentIdentity) identities.add(ext.packageContentIdentity); if (record.custodyGapRefs?.length) warnings.push(issue("CUSTODY_GAP", `records[${index}]`)); if (index > 0 && ext.predecessorCustodyRecordRef !== records[index - 1].custodyRecordRef) warnings.push(issue("MISSING_CUSTODY_LINK", `records[${index}]`)); }
  if (identities.size > 1) errors.push(issue("CUSTODY_IDENTITY_MISMATCH", "records"));
  let continuityState = errors.length ? "CONTRADICTORY" : warnings.some((item) => item.code === "CUSTODY_GAP") ? "GAPPED" : warnings.length ? "PARTIAL" : records.length < 2 ? "PARTIAL" : records.every((record, index) => index === 0 || (record.extensions.refV1_4.receiptConfirmed && record.extensions.refV1_4.integrityState === "MATCHED")) ? "CONTINUOUS" : "UNRESOLVED";
  return deepFreeze({ continuityState, errors, warnings, packageContentIdentity: identities.size === 1 ? [...identities][0] : null });
}

const DIMENSIONS = Object.freeze(["identity", "artifact", "target", "environment", "authorizationReference", "executionCorrelation", "sessionCorrelation", "transactionCorrelation", "ordering", "subject", "authenticity", "integrity", "provenance", "fidelity", "completeness", "custody", "independence", "contradiction", "uncertainty", "residualGap"]);
export function assessClaimSufficiency({ claimRef, packageRef, observations = [], relationships = [], policy = {}, custodyAssessment = null } = {}) {
  const errors = []; required(claimRef, "claimRef", errors); required(packageRef, "packageRef", errors); safe(policy);
  if (!Array.isArray(policy.requiredLayers) || !Array.isArray(policy.requiredSourceClassifications) || !Array.isArray(policy.requiredBindings)) errors.push(issue("INVALID_SUFFICIENCY_POLICY", "policy"));
  if (errors.length) throw new RefEvidenceModelError("INVALID_SUFFICIENCY_POLICY", "$.policy", canonicalizeRefValue(errors));
  const scoped = Array.isArray(policy.observationRefs) ? observations.filter((item) => policy.observationRefs.includes(item.observationRef)) : observations;
  const usable = scoped.filter((item) => item.observationState === "PRESENT");
  const checks = Object.fromEntries(DIMENSIONS.map((name) => [name, { required: false, satisfied: true, evidenceRefs: [], reason: "NOT_REQUIRED_BY_POLICY" }]));
  const set = (name, requiredValue, evidence, reason) => { checks[name] = { required: requiredValue, satisfied: !requiredValue || evidence.length > 0, evidenceRefs: evidence.map((item) => item.observationRef), reason: !requiredValue ? "NOT_REQUIRED_BY_POLICY" : evidence.length ? "SATISFIED" : reason }; };
  for (const layer of policy.requiredLayers) set(layer.dimension ?? "subject", true, usable.filter((item) => item.layerRef === layer.layerRef && (!layer.sourceClassification || item.sourceClassification === layer.sourceClassification)), "REQUIRED_LAYER_MISSING");
  for (const source of policy.requiredSourceClassifications) set(source.dimension ?? "authenticity", true, usable.filter((item) => item.sourceClassification === source.sourceClassification), "REQUIRED_SOURCE_CLASSIFICATION_MISSING");
  for (const binding of policy.requiredBindings) set(binding.dimension, true, usable.filter((item) => item.bindings?.[binding.binding] != null), "REQUIRED_BINDING_MISSING");
  if (policy.minimumFidelity) set("fidelity", true, usable.filter((item) => item.fidelity?.level === policy.minimumFidelity), "INSUFFICIENT_FIDELITY");
  for (const name of policy.requiredCompletenessDimensions ?? []) set("completeness", true, usable.filter((item) => item.completeness?.[name] === true), "INCOMPLETE_EVIDENCE");
  if (policy.custodyRequired) checks.custody = { required: true, satisfied: custodyAssessment?.continuityState === "CONTINUOUS", evidenceRefs: [], reason: custodyAssessment?.continuityState === "CONTINUOUS" ? "SATISFIED" : "CUSTODY_NOT_CONTINUOUS" };
  if (policy.requiredIndependence) set("independence", true, usable.filter((item) => item.extensions?.independenceState === policy.requiredIndependence), "INDEPENDENCE_REQUIREMENT_NOT_MET");
  const scopedRefs = new Set(scoped.map((item) => item.observationRef));
  const contradictions = scoped.filter((item) => item.observationState === "CONTRADICTORY").map((item) => item.observationRef).concat(relationships.filter((item) => item.relationshipType === "CONTRADICTS" && !item.resolutionRef && scopedRefs.has(item.sourceRef)).map((item) => item.relationshipRef));
  checks.contradiction = { required: policy.prohibitContradictions === true, satisfied: policy.prohibitContradictions !== true || contradictions.length === 0, evidenceRefs: contradictions, reason: contradictions.length ? "UNRESOLVED_CONTRADICTION" : "NO_CONTRADICTION_OBSERVED" };
  const unresolved = scoped.filter((item) => ["UNOBSERVABLE", "UNRESOLVED"].includes(item.observationState) && !(policy.allowedResidualGapRefs ?? []).includes(item.observationRef)).map((item) => item.observationRef);
  checks.uncertainty = { required: policy.tolerateUncertainty !== true, satisfied: policy.tolerateUncertainty === true || unresolved.length === 0, evidenceRefs: unresolved, reason: unresolved.length ? "UNTOLERATED_UNCERTAINTY" : "NO_UNTOLERATED_UNCERTAINTY" };
  checks.residualGap = { required: policy.stopOnMissing === true, satisfied: policy.stopOnMissing !== true || unresolved.length === 0, evidenceRefs: unresolved, reason: unresolved.length ? "RESIDUAL_GAP" : "NO_DISALLOWED_RESIDUAL_GAP" };
  const requiredChecks = Object.values(checks).filter((item) => item.required), failed = requiredChecks.filter((item) => !item.satisfied);
  const outcome = contradictions.length && policy.prohibitContradictions ? "CONTRADICTED" : unresolved.length && failed.length ? "UNRESOLVED" : failed.length === 0 ? "SUFFICIENT_FOR_CLAIM" : failed.length < requiredChecks.length ? "PARTIALLY_SUFFICIENT" : "INSUFFICIENT";
  return deepFreeze({ model: "RuntimeEvidenceClaimSufficiencyAssessment", modelVersion: REF_V1_4_MODEL_VERSION, claimRef, packageRef, policyRef: policy.policyRef ?? null, dimensions: checks, outcome, supportingObservationRefs: usable.map((item) => item.observationRef), contradictingRefs: contradictions, unresolvedRefs: unresolved, residualGapRefs: [...(policy.allowedResidualGapRefs ?? [])] });
}

export function assessEvidenceIndependence(observationRefs = [], observations = [], relationships = []) {
  const selected = observations.filter((item) => observationRefs.includes(item.observationRef));
  if (selected.length === 0) return deepFreeze({ state: "UNKNOWN", witnessCount: 0, reasons: ["NO_EVIDENCE"] });
  if (cycles(relationships.filter((item) => observationRefs.includes(item.sourceRef) && observationRefs.includes(item.targetRef)), ["CORROBORATES"])) return deepFreeze({ state: "CIRCULAR_CORROBORATION", witnessCount: 0, reasons: ["CORROBORATION_CYCLE"] });
  const derivedTargets = new Set(relationships.filter((item) => ["DERIVES_FROM", "REDACTED_DERIVATIVE_OF"].includes(item.relationshipType)).map((item) => item.sourceRef));
  const originals = selected.filter((item) => !derivedTargets.has(item.observationRef));
  if (originals.length < selected.length && originals.length <= 1) return deepFreeze({ state: "DERIVED_DUPLICATE", witnessCount: originals.length, reasons: ["DERIVATIVES_SHARE_SOURCE"] });
  const sourceRefs = new Set(originals.map((item) => item.sourceRef));
  if (originals.some((item) => item.extensions?.independenceState === "COMMON_MODE_DEPENDENCY")) return deepFreeze({ state: "COMMON_MODE_DEPENDENCY", witnessCount: sourceRefs.size, reasons: ["DECLARED_COMMON_MODE"] });
  if (sourceRefs.size < originals.length) return deepFreeze({ state: "SHARED_DEPENDENCY", witnessCount: sourceRefs.size, reasons: ["SHARED_SOURCE_REFERENCE"] });
  return deepFreeze({ state: originals.length > 1 ? "INDEPENDENT_WITNESS" : "PARTIALLY_INDEPENDENT", witnessCount: originals.length, reasons: [] });
}

export function buildRuntimeEvidenceClaimAssessment(input = {}) {
  const sufficiency = assessClaimSufficiency(input); const mapped = { SUFFICIENT_FOR_CLAIM: "SUPPORTED", PARTIALLY_SUFFICIENT: "PARTIALLY_SUPPORTED", INSUFFICIENT: "INSUFFICIENT", CONTRADICTED: "CONTRADICTED", UNRESOLVED: "UNRESOLVED" }[sufficiency.outcome];
  return createRuntimeEvidenceClaimAssessment({ ...input, claimAssessmentRef: input.claimAssessmentRef, claimRef: input.claimRef, evidencePackageRef: input.packageRef, classificationRef: input.classificationRef, assessorRef: input.assessorRef, assessmentOutcome: mapped, lifecycle: input.lifecycle ?? "DRAFT", supportingObservationRefs: sufficiency.supportingObservationRefs, contradictingObservationRefs: sufficiency.contradictingRefs, uncertaintyRefs: sufficiency.unresolvedRefs, residualGapRefs: sufficiency.residualGapRefs, extensions: { ...(input.extensions ?? {}), refV1_4: { sufficiency, contextualObservationRefs: [...(input.contextualObservationRefs ?? [])], custodyAssessment: input.custodyAssessment ?? null, independenceAssessment: input.independenceAssessment ?? null, finalOperationalConclusionCreated: false } } });
}

export function prepareRuntimeEvidenceReviewInput({ finalizedPackage, claimAssessments = [], custodyAssessment = null } = {}) {
  if (!finalizedPackage?.contentIdentity) throw new RefEvidenceModelError("FINALIZED_PACKAGE_REQUIRED", "$.finalizedPackage");
  const refs = new Set(); for (const item of claimAssessments) { if (refs.has(item.claimAssessmentRef)) throw new RefEvidenceModelError("DUPLICATE_CLAIM_IDENTITY", "$.claimAssessments"); refs.add(item.claimAssessmentRef); }
  return deepFreeze({ packageRef: finalizedPackage.package.evidencePackageRef, packageContentIdentity: finalizedPackage.contentIdentity, claimAssessmentRefs: claimAssessments.map((item) => item.claimAssessmentRef), unresolvedIssueRefs: [...finalizedPackage.reviewReady.unresolvedObservationRefs, ...claimAssessments.flatMap((item) => item.uncertaintyRefs)], contradictionRefs: finalizedPackage.reviewReady.contradictionRelationshipRefs, custodyState: custodyAssessment?.continuityState ?? "UNVERIFIABLE", requiredReviewAreaRefs: ["ref:review:claim-scope", "ref:review:external-gaps", "ref:review:custody"], prohibitedNextActionRefs: finalizedPackage.reviewReady.prohibitedNextActionRefs, decisionCreated: false, conclusionCreated: false, authorizationCreated: false });
}
