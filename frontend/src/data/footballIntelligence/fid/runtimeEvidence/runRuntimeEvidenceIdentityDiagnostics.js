import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import process from "node:process";
import {
  createGovernedOperationEvidenceManifest, createRuntimeEvidenceExecutionPlan, createRuntimeEvidenceObservationPlan,
  createRuntimeEvidencePackage, createRuntimeEvidenceClaimAssessment, createRuntimeEvidenceCustodyRecord, createRuntimeEvidenceReviewRecord,
} from "./RuntimeEvidenceContracts.js";
import { canonicalizeRefValue, deriveRefContentIdentity, sha256Hex, utf8Bytes, verifyArtifactByteIdentity } from "./canonicalIdentity.js";

const cryptoProvider = globalThis.crypto ?? webcrypto;
const expectCode = (code, action) => assert.throws(action, (error) => error?.code === code);
const common = { lifecycle: "DRAFT", extensions: {} };
const manifest = () => createGovernedOperationEvidenceManifest({ ...common, manifestRef: "ref:manifest:successor", governedOperationRef: "ref:operation:future-17c-successor", executionArtifactRef: "ref:artifact:fixture", authorizationRef: "ref:authorization:new-required-not-created", targetRef: "ref:target:dedicated-non-production", environmentRef: "ref:environment:primary-branch-topology", operationOwnerRef: "ref:owner:fid", permittedObservationScope: [], requiredClaimRefs: [], stopConditionRefs: [], evidenceCaptureRequirementRefs: [], prohibitedActionRefs: [] });
const executionPlan = () => createRuntimeEvidenceExecutionPlan({ ...common, executionPlanRef: "ref:execution-plan:successor", manifestRef: "ref:manifest:successor", governedOperationRef: "ref:operation:future-17c-successor", executionBoundaryRef: "ref:boundary:not-implemented", plannedStageRefs: ["ref:stage:verify", "ref:stage:future-execution"], requiredPreconditionRefs: ["ref:authorization:new-required-not-created"], stopConditionRefs: ["ref:stop:identity-mismatch"], expectedResultRefs: [], expectedErrorOrUncertaintyRefs: ["ref:gap:external-platform"], prohibitedStageRefs: ["ref:stage:auto-retry"], completionCriterionRefs: [] });
const observationPlan = () => createRuntimeEvidenceObservationPlan({ ...common, observationPlanRef: "ref:observation-plan:successor", manifestRef: "ref:manifest:successor", executionPlanRef: "ref:execution-plan:successor", observationSubjectRefs: [], observationPointRefs: [], observationLayerRefs: ["ref:layer:local", "ref:layer:external-unobserved"], correlationRequirementRefs: [], identityRequirementRefs: [], fidelityRequirementRefs: [], completenessDimensionRefs: [], acceptableResidualGapRefs: ["ref:gap:external-platform"], leastDisclosureLimitRefs: [], prohibitedCaptureRefs: [], claimSufficiencyRequirementRefs: [] });
const evidencePackage = () => createRuntimeEvidencePackage({ ...common, evidencePackageRef: "ref:package:successor-fixture", manifestRef: "ref:manifest:successor", authorizationRef: "ref:authorization:new-required-not-created", executionOrAttemptRef: "ref:attempt:not-performed", artifactIdentityEvidenceRef: "ref:artifact-verification:local-only", targetEvidenceRef: "ref:target:declared-not-observed", environmentEvidenceRef: "ref:environment:declared-not-observed", integrityDeclarationRef: "ref:integrity:sha256", provenanceDeclarationRef: "ref:provenance:fixture", custodyRecordRef: "ref:custody:fixture", observationState: "UNRESOLVED", operatorEvidenceRefs: [], clientObservationRefs: [], runtimeObservationRefs: [], stageObservationRefs: [], resultObservationRefs: [], errorOrUncertaintyObservationRefs: ["ref:gap:external-platform", "ref:claim:persistent-state-unresolved"], transactionObservationRefs: ["ref:rollback:expected-not-observed"], chronologyRefs: ["ref:event:declared", "ref:event:not-executed"], evidenceRelationshipRefs: [], reviewRefs: [], conclusionRefs: [] });

async function run() {
  assert.equal(canonicalizeRefValue({ b: 2, a: { y: [], x: null } }), canonicalizeRefValue({ a: { x: null, y: [] }, b: 2 }));
  assert.equal(canonicalizeRefValue(["b", "a"]), '["b","a"]');
  assert.notEqual(canonicalizeRefValue(["b", "a"]), canonicalizeRefValue(["a", "b"]));
  assert.equal(canonicalizeRefValue("é"), '"é"');
  assert.notEqual(canonicalizeRefValue("é"), canonicalizeRefValue("e\u0301"));
  for (const [code, value] of [["NON_FINITE_NUMBER", NaN], ["NON_FINITE_NUMBER", Infinity], ["AMBIGUOUS_NEGATIVE_ZERO", -0], ["UNDEFINED_VALUE", undefined], ["EXECUTABLE_VALUE", () => 1], ["SYMBOL_VALUE", Symbol("x")], ["BIGINT_VALUE", 1n], ["NON_PLAIN_OBJECT", new Map()], ["NON_PLAIN_OBJECT", new Set()], ["NON_PLAIN_OBJECT", new Date()]]) expectCode(code, () => canonicalizeRefValue(value));
  const circular = {}; circular.self = circular; expectCode("CIRCULAR_REFERENCE", () => canonicalizeRefValue(circular));
  const sparse = []; sparse.length = 1; expectCode("SPARSE_ARRAY", () => canonicalizeRefValue(sparse));
  expectCode("NON_PLAIN_OBJECT", () => canonicalizeRefValue(Object.create({ inherited: true })));
  expectCode("EXECUTABLE_PROPERTY", () => canonicalizeRefValue(Object.defineProperty({}, "value", { enumerable: true, get: () => 1 })));
  for (const key of ["password", "accessToken", "connectionString", "authorizationHeader", "environmentDump", "roleGraph"]) expectCode("SENSITIVE_FIELD_VIOLATION", () => canonicalizeRefValue({ [key]: "x" }));

  assert.equal(await sha256Hex(new Uint8Array(), cryptoProvider), "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855");
  assert.equal(await sha256Hex(utf8Bytes("abc"), cryptoProvider), "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD");
  const arbitrary = Uint8Array.from([0, 255, 1, 128]);
  assert.equal(await sha256Hex(arbitrary, cryptoProvider), createHash("sha256").update(arbitrary).digest("hex").toUpperCase());
  const artifactBytes = utf8Bytes("-- IN-MEMORY NON-EXECUTABLE SUCCESSOR SQL BYTE FIXTURE\nSELECT 'DECLARATION_ONLY';\n");
  const artifact = await verifyArtifactByteIdentity({ bytes: artifactBytes, expectedDigest: await sha256Hex(artifactBytes, cryptoProvider), artifactRef: "ref:artifact:fixture" }, cryptoProvider);
  assert.equal(artifact.comparisonOutcome, "MATCH"); assert.match(artifact.uncertainty, /DOES_NOT_PROVE/);
  await assert.rejects(() => verifyArtifactByteIdentity({ bytes: artifactBytes, expectedDigest: "bad" }, cryptoProvider), (error) => error.code === "INVALID_DIGEST_FORMAT");
  const mismatch = await verifyArtifactByteIdentity({ bytes: artifactBytes, expectedDigest: "0".repeat(64) }, cryptoProvider); assert.equal(mismatch.verificationStatus, "DIGEST_MISMATCH");

  const declarations = [manifest(), executionPlan(), observationPlan(), evidencePackage(), createRuntimeEvidenceClaimAssessment({ ...common, claimAssessmentRef: "ref:assessment:fixture", claimRef: "ref:claim:persistent-state", evidencePackageRef: "ref:package:successor-fixture", classificationRef: "ref:classification:unresolved", assessorRef: "ref:assessor:fixture", assessmentOutcome: "UNRESOLVED", supportingObservationRefs: [], contradictingObservationRefs: [], uncertaintyRefs: ["ref:gap:external-platform"], residualGapRefs: ["ref:claim:persistent-state-unresolved"] }), createRuntimeEvidenceCustodyRecord({ ...common, custodyRecordRef: "ref:custody:fixture", evidencePackageRef: "ref:package:successor-fixture", custodianRef: "ref:custodian:fixture", temporalReference: "ref:time:declared", custodyStage: "CREATED", transferDeclarationRefs: [], integrityVerificationRefs: [], preservationDeclarationRefs: [], custodyGapRefs: [] }), createRuntimeEvidenceReviewRecord({ ...common, reviewRef: "ref:review:fixture", evidencePackageRef: "ref:package:successor-fixture", reviewerRef: "ref:reviewer:fixture", reviewRoleRef: "ref:role:adversarial", reviewedScopeRef: "ref:scope:fixture", reviewOutcome: "UNRESOLVED", claimAssessmentRefs: [], unresolvedIssueRefs: ["ref:gap:external-platform"], contradictionRefs: [], permissibleNextActionRefs: [], prohibitedNextActionRefs: ["ref:action:reuse-consumed-authorization"] })];
  assert(declarations.every((item) => item.validation.valid));
  const identities = await Promise.all(declarations.map((item) => deriveRefContentIdentity(item, cryptoProvider)));
  assert.equal(new Set(identities.map((item) => item.identity)).size, 7);
  assert.equal((await deriveRefContentIdentity(manifest(), cryptoProvider)).identity, identities[0].identity);
  const reordered = { ...manifest() }; const reorderedIdentity = await deriveRefContentIdentity(reordered, cryptoProvider); assert.equal(reorderedIdentity.identity, identities[0].identity);
  const changed = createGovernedOperationEvidenceManifest({ ...manifest(), targetRef: "ref:target:changed" }); assert.notEqual((await deriveRefContentIdentity(changed, cryptoProvider)).identity, identities[0].identity);
  assert.notEqual((await deriveRefContentIdentity({ ...manifest(), contractVersion: "1.0.1" }, cryptoProvider)).identity, identities[0].identity);
  assert.notEqual((await deriveRefContentIdentity({ ...manifest(), schemaVersion: "1.0.1" }, cryptoProvider)).identity, identities[0].identity);
  const withSelfDigest = { ...manifest(), contentIdentity: "ignored-self-field" }; assert.equal((await deriveRefContentIdentity(withSelfDigest, cryptoProvider)).identity, identities[0].identity);
  assert(Object.isFrozen(identities[0])); assert.equal(artifact.profile === identities[0].profile, false);
  assert.equal(evidencePackage().observationState, "UNRESOLVED"); assert.deepEqual(evidencePackage().chronologyRefs, ["ref:event:declared", "ref:event:not-executed"]);

  console.log(JSON.stringify({ status: "RUNTIME_EVIDENCE_FRAMEWORK_V1_DETERMINISTIC_IDENTITY_DIAGNOSTICS_PASSED", checks: 52, contracts: declarations.length, artifactDigest: artifact.calculatedDigest, structuredIdentities: identities.map(({ identity }) => identity), externalRuntimeOperationOccurred: false }));
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
