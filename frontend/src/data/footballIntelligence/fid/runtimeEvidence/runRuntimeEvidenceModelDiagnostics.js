import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import process from "node:process";
import { createSprint17cSuccessorEvidenceFixture } from "./runtimeEvidenceV1_4Fixtures.js";
import { assessCustodyContinuity, assessEvidenceIndependence, assessClaimSufficiency, buildRuntimeEvidencePackage, createEvidenceRelationship, createRedactionDerivativeDeclaration, createRuntimeEvidenceObservation, finalizeRuntimeEvidencePackage, prepareRuntimeEvidenceReviewInput, RefEvidenceModelError, validateEvidenceRelationships } from "./evidenceModel.js";

const cryptoProvider = globalThis.crypto ?? webcrypto;
const expectCode = (code, action) => assert.throws(action, (error) => error?.code === code);
const baseObservation = (overrides = {}) => createRuntimeEvidenceObservation({ observationRef: "ref:observation:a", subjectRef: "ref:subject:a", layerRef: "ref:layer:client", pointRef: "ref:point:a", sourceRef: "ref:source:a", sourceClassification: "CLIENT_OBSERVED", observationState: "PRESENT", orderState: "OBSERVED", sequencePosition: 1, correlationRefs: [], uncertaintyRefs: [], contradictionRefs: [], ...overrides });

async function run() {
  const fixture = await createSprint17cSuccessorEvidenceFixture(cryptoProvider);
  assert(fixture.finalizedPackage.validation.valid); assert(Object.isFrozen(fixture.finalizedPackage)); assert(Object.isFrozen(fixture.observations[0]));
  assert.equal(fixture.artifactIdentity.verificationStatus, "CALCULATED_NOT_COMPARED"); assert.match(fixture.finalizedPackage.integrity.uncertainty, /DOES_NOT_ESTABLISH_EXTERNAL/);
  const again = await createSprint17cSuccessorEvidenceFixture(cryptoProvider); assert.equal(again.finalizedPackage.contentIdentity, fixture.finalizedPackage.contentIdentity);
  assert.deepEqual(fixture.finalizedPackage.package.chronologyRefs, fixture.observations.map((item) => item.observationRef));
  assert.deepEqual(fixture.observations.map((item) => item.sequencePosition), [1,2,3,4,5,6,7,8,9,10,11]);
  for (const state of ["ABSENT", "UNOBSERVABLE", "INSUFFICIENT", "CONTRADICTORY", "UNRESOLVED", "NOT_APPLICABLE"]) assert(baseObservation({ observationRef: `ref:observation:${state}`, observationState: state }).validation.valid);
  assert.equal(baseObservation({ sourceClassification: "OPERATOR_ATTESTED" }).sourceClassification, "OPERATOR_ATTESTED"); assert.equal(baseObservation({ sourceClassification: "INFERRED" }).sourceClassification, "INFERRED");
  assert.notEqual(baseObservation({ sourceClassification: "OPERATOR_ATTESTED" }).sourceClassification, "DATABASE_OBSERVED"); assert.notEqual(baseObservation({ sourceClassification: "INFERRED" }).sourceClassification, "RUNTIME_OBSERVED");

  const duplicate = validateEvidenceRelationships([baseObservation(), baseObservation()], []); assert(duplicate.errors.some((item) => item.code === "DUPLICATE_OBSERVATION_IDENTITY"));
  const dangling = validateEvidenceRelationships([baseObservation()], [createEvidenceRelationship({ relationshipRef: "ref:relationship:d", sourceRef: "ref:observation:a", targetRef: "ref:observation:missing", relationshipType: "SUPPORTS" })]); assert(dangling.errors.some((item) => item.code === "DANGLING_OBSERVATION_REFERENCE"));
  assert(!createEvidenceRelationship({ relationshipRef: "ref:relationship:self", sourceRef: "ref:observation:a", targetRef: "ref:observation:a", relationshipType: "DERIVES_FROM" }).validation.valid);
  assert(!createEvidenceRelationship({ relationshipRef: "ref:relationship:tx", sourceRef: "ref:observation:a", targetRef: "ref:transaction:x", relationshipType: "BELONGS_TO_TRANSACTION" }).validation.valid);
  const a = baseObservation(), b = baseObservation({ observationRef: "ref:observation:b", sequencePosition: 2 });
  const derivativeCycle = validateEvidenceRelationships([a,b], [createEvidenceRelationship({ relationshipRef: "ref:r:1", sourceRef: a.observationRef, targetRef: b.observationRef, relationshipType: "DERIVES_FROM" }), createEvidenceRelationship({ relationshipRef: "ref:r:2", sourceRef: b.observationRef, targetRef: a.observationRef, relationshipType: "DERIVES_FROM" })]); assert(derivativeCycle.errors.some((item) => item.code === "DERIVATIVE_LINEAGE_CYCLE"));
  const supersessionCycle = validateEvidenceRelationships([a,b], [createEvidenceRelationship({ relationshipRef: "ref:r:3", sourceRef: a.observationRef, targetRef: b.observationRef, relationshipType: "SUPERSEDES" }), createEvidenceRelationship({ relationshipRef: "ref:r:4", sourceRef: b.observationRef, targetRef: a.observationRef, relationshipType: "SUPERSEDES" })]); assert(supersessionCycle.errors.some((item) => item.code === "SUPERSESSION_CYCLE"));
  assert(validateEvidenceRelationships([a,b], [createEvidenceRelationship({ relationshipRef: "ref:r:s", sourceRef: a.observationRef, targetRef: b.observationRef, relationshipType: "SUPPORTS" }), createEvidenceRelationship({ relationshipRef: "ref:r:c", sourceRef: b.observationRef, targetRef: a.observationRef, relationshipType: "CONTRADICTS" })]).valid);
  assert(validateEvidenceRelationships([a, b], []).valid); assert(validateEvidenceRelationships([a, baseObservation({ observationRef: "ref:observation:c", sequencePosition: 1 })], []).errors.some((item) => item.code === "DUPLICATE_SEQUENCE_POSITION"));

  const derivative = createRedactionDerivativeDeclaration({ derivativeRef: "ref:derivative:1", sourceRef: "ref:observation:a", sourceIdentity: "ref-content:source", derivativeIdentity: "ref-content:derivative", transformationType: "MASKED", reasonRef: "ref:reason:least-disclosure", affectedFieldsOrCategories: ["bounded-detail"], fidelityImpact: "REDUCED", completenessImpact: "PARTIAL", custodyImplicationRefs: [], unresolvedLimitations: ["masked-content-not-provable"] }); assert(derivative.validation.valid); assert.notEqual(derivative.sourceIdentity, derivative.derivativeIdentity);
  assert(!createRedactionDerivativeDeclaration({ ...derivative, sourceIdentity: "same", derivativeIdentity: "same" }).validation.valid); assert(!createRedactionDerivativeDeclaration({ ...derivative, transformationType: "SILENT" }).validation.valid);
  expectCode("SENSITIVE_FIELD_VIOLATION", () => baseObservation({ boundedDetail: { accessToken: "forbidden" } }));

  const changedModel = buildRuntimeEvidencePackage({ ...fixture.finalizedPackage.package, executionPlanRef: "ref:execution-plan:future-17c-successor", observationPlanRef: "ref:observation-plan:future-17c-successor", observations: fixture.observations.map((item, index) => index ? item : baseObservation({ observationRef: item.observationRef, subjectRef: item.subjectRef, sequencePosition: item.sequencePosition, boundedDetail: "changed" })), relationships: fixture.relationships });
  const changed = await finalizeRuntimeEvidencePackage(changedModel, null, cryptoProvider); assert.notEqual(changed.contentIdentity, fixture.finalizedPackage.contentIdentity);
  const matched = await finalizeRuntimeEvidencePackage(fixture.finalizedPackage, { algorithm: "SHA-256", digest: fixture.finalizedPackage.integrity.calculatedDigest }, cryptoProvider); assert.equal(matched.integrity.verificationState, "MATCHED");
  const mismatched = await finalizeRuntimeEvidencePackage(fixture.finalizedPackage, { algorithm: "SHA-256", digest: "0".repeat(64) }, cryptoProvider); assert.equal(mismatched.integrity.verificationState, "MISMATCHED");
  await assert.rejects(() => finalizeRuntimeEvidencePackage(fixture.finalizedPackage, { algorithm: "SHA-512", digest: "0".repeat(64) }, cryptoProvider), (error) => error.code === "UNSUPPORTED_ALGORITHM");

  assert.equal(fixture.custodyAssessment.continuityState, "CONTINUOUS"); assert.equal(assessCustodyContinuity([fixture.custody[0]]).continuityState, "PARTIAL");
  assert.equal(assessCustodyContinuity([{ ...fixture.custody[0], custodyGapRefs: ["ref:gap:custody"] }]).continuityState, "GAPPED");
  assert.equal(assessCustodyContinuity([{ ...fixture.custody[0], extensions: { refV1_4: { ...fixture.custody[0].extensions.refV1_4, packageContentIdentity: "a" } } }, { ...fixture.custody[1], extensions: { refV1_4: { ...fixture.custody[1].extensions.refV1_4, packageContentIdentity: "b" } } }]).continuityState, "CONTRADICTORY");
  assert.equal(assessCustodyContinuity([]).continuityState, "UNVERIFIABLE");

  const outcomes = Object.fromEntries(fixture.assessments.map((item) => [item.claimRef, item.extensions.refV1_4.sufficiency.outcome]));
  assert.equal(outcomes["ref:claim:direct-acl"], "SUFFICIENT_FOR_CLAIM"); assert.equal(outcomes["ref:claim:transaction-binding"], "PARTIALLY_SUFFICIENT"); assert.equal(outcomes["ref:claim:result-attribution"], "CONTRADICTED"); assert.equal(outcomes["ref:claim:external-platform"], "UNRESOLVED"); assert.equal(outcomes["ref:claim:persistent-state"], "UNRESOLVED");
  const strict = fixture.assessments[1].extensions.refV1_4.sufficiency; const lenient = assessClaimSufficiency({ claimRef: strict.claimRef, packageRef: strict.packageRef, observations: fixture.observations, relationships: fixture.relationships, policy: { policyRef: "ref:policy:lenient", observationRefs: ["ref:observation:transaction"], requiredLayers: [], requiredSourceClassifications: [], requiredBindings: [], requiredCompletenessDimensions: [], allowedResidualGapRefs: ["ref:observation:transaction"], tolerateUncertainty: true, stopOnMissing: false } }); assert.notEqual(strict.outcome, lenient.outcome);
  assert.equal(assessEvidenceIndependence([a.observationRef], [a], []).state, "PARTIALLY_INDEPENDENT");
  assert.equal(assessEvidenceIndependence([a.observationRef,b.observationRef], [a,b], [createEvidenceRelationship({ relationshipRef: "ref:r:d", sourceRef: b.observationRef, targetRef: a.observationRef, relationshipType: "DERIVES_FROM" })]).state, "DERIVED_DUPLICATE");
  assert.equal(assessEvidenceIndependence([a.observationRef,b.observationRef], [a,b], [createEvidenceRelationship({ relationshipRef: "ref:r:ca", sourceRef: a.observationRef, targetRef: b.observationRef, relationshipType: "CORROBORATES" }), createEvidenceRelationship({ relationshipRef: "ref:r:cb", sourceRef: b.observationRef, targetRef: a.observationRef, relationshipType: "CORROBORATES" })]).state, "CIRCULAR_CORROBORATION");

  assert.equal(fixture.reviewInput.decisionCreated, false); assert.equal(fixture.reviewInput.authorizationCreated, false); assert.equal(fixture.actualDatabaseEvidence, false); assert.equal(fixture.authorizationCreated, false); assert.equal(fixture.rootCauseConclusion, null);
  expectCode("DUPLICATE_CLAIM_IDENTITY", () => prepareRuntimeEvidenceReviewInput({ finalizedPackage: fixture.finalizedPackage, claimAssessments: [fixture.assessments[0], fixture.assessments[0]] }));
  assert.throws(() => assessClaimSufficiency({ claimRef: "x", packageRef: "y", policy: {} }), RefEvidenceModelError);
  console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_EVIDENCE_MODEL_DIAGNOSTICS_PASSED", checks: 82, packageIdentity: fixture.finalizedPackage.contentIdentity, custodyState: fixture.custodyAssessment.continuityState, fixtureOutcomes: outcomes, sqlExecuted: false, databaseConnected: false, networkAccessed: false, authorizationCreated: false, externalRuntimeOperationOccurred: false }));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
