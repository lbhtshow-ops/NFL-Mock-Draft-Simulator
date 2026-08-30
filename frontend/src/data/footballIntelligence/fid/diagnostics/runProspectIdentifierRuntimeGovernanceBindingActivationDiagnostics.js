import { CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT as amendment, PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_FIELD_SOURCE_MAP as sources } from "../prospectIntake/CanonicalProspectIdentifierRuntimeGovernanceBindingActivationAmendment.js";
import { evaluateCanonicalProspectIdentifierRuntimeGovernanceBindingActivation as evaluate } from "../prospectIntake/CanonicalProspectIdentifierRuntimeGovernanceBindingActivationEvaluator.js";
import { createProspectIdentifierIssuerAttemptContextV1_1, createProspectIdentifierGenerationInvocationV1_2, createProspectIdentifierAuthorizationRuntimeResultV1_1, createProspectIdentifierGenerationRuntimeResultV1_2, createProspectIdentifierRuntimeGovernanceBindingV1_1 } from "../prospectIntake/ProspectIdentifierRuntimeGovernanceContractsV1_2.js";
import snapshots from "../prospectIntake/fixtures/prospectIdentifierRuntimeGovernanceBindingSnapshots.js";
import { CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT_V1_2, createRuntimeGovernanceCompositionV1_2 } from "../../../../../supabase/functions/canonical-prospect-identifier-issuance/server-v1_2.js";

const assert = (value, message) => { if (!value) throw new Error(message); };
const refs = Object.freeze({ requestRef: "governed-request-ref", operationRef: "governed-operation-ref", authorizationRef: "governed-authorization-decision-ref", identifierLayer: "PROSPECT", namespace: "prospect", strategyRef: "CANONICAL_PROSPECT_IDENTIFIER_GENERATION_STRATEGY@1.0.0", conventionRef: "CANONICAL_PROSPECT_IDENTIFIER_CONVENTION@1.0.0", environment: "TEST" });
const attempt = createProspectIdentifierIssuerAttemptContextV1_1({ attemptContextRef: "governed-attempt-context-ref", attemptNumber: 1, attemptPolicyRef: "CANONICAL_PROSPECT_IDENTIFIER_MAXIMUM_ATTEMPTS_POLICY@1.0.0", maximumAttempts: 3, origin: "ISSUER" });
const authorization = createProspectIdentifierAuthorizationRuntimeResultV1_1({ status: "AUTHORIZATION_APPROVED", active: true, revoked: false, actorRef: "governed-actor-ref", attemptContextRef: attempt.attemptContextRef, ...refs });
const invocation = createProspectIdentifierGenerationInvocationV1_2({ invocationRef: "governed-generation-invocation-ref", generationResultRef: "governed-generation-result-ref", generationResultRefOrigin: "ISSUER_GENERATION_OPERATION", generatorPortRef: "CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT@1.2.0", adapterRef: "CANONICAL_PROSPECT_IDENTIFIER_SECURE_OPAQUE_NON_PRODUCTION_ADAPTER@1.1.0", providerRef: "CANONICAL_PROSPECT_IDENTIFIER_SECURE_OPAQUE_NON_PRODUCTION_PROVIDER@1.1.0", outputSizePolicyRef: "CANONICAL_PROSPECT_IDENTIFIER_ENTROPY_OUTPUT_SIZE_POLICY@1.1.0", encodingPolicyRef: "CANONICAL_PROSPECT_IDENTIFIER_ENCODING_POLICY@1.1.0", attemptContext: attempt, ...refs });
const result = createProspectIdentifierGenerationRuntimeResultV1_2({ status: "CANDIDATE_GENERATED", generationResultRef: invocation.generationResultRef, invocation, declarationOnlyRedacted: true });
const binding = createProspectIdentifierRuntimeGovernanceBindingV1_1({ authenticationResult: { ok: true, actorRef: authorization.actorRef }, authorizationResult: authorization, generationInvocation: invocation, generationResult: result });
const context = Object.freeze({ historicalPreserved: true, productionEnabled: false, browserRuntime: false });
const tests = [
  ["amendment-identity", () => assert(amendment.amendmentVersion === "1.0.0", "identity")],
  ["historical-preservation", () => assert(amendment.historicalPreservation.length === 3 && !amendment.runtimeSuccessor.historicalHandlerModified, "history")],
  ["result-successor", () => assert(result.contractVersion === "1.2.0" && result.generationResultRef, "result")],
  ["generator-port-successor", () => assert(CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT_V1_2.portVersion === "1.2.0", "port")],
  ["attempt-context", () => assert(attempt.validation.valid && attempt.origin === "ISSUER", "attempt")],
  ["attempt-immutable", () => assert(!attempt.runtimeMayIncrement && !attempt.adapterMayIncrement && !attempt.transactionPortMayIncrement, "mutation")],
  ["authorization-result", () => assert(authorization.validation.valid && authorization.authorizationRef, "authorization")],
  ["authentication-separate", () => assert(!authorization.authenticationIsAuthorization && amendment.authorizationBinding.authenticationSeparate, "separation")],
  ["invocation", () => assert(invocation.validation.valid && invocation.generationResultRefOrigin === "ISSUER_GENERATION_OPERATION", "invocation")],
  ["reference-not-derived", () => assert(!invocation.candidateDerivedReference && !invocation.entropyDerivedReference && !invocation.timestampDerivedReference, "derivation")],
  ["binding", () => assert(binding.validation.valid && binding.status === "BINDING_VALIDATED", "binding")],
  ["candidate-redacted", () => assert(result.candidatePresent && result.candidateValueRedacted && result.generatedCandidate === null, "candidate")],
  ["pre-issuance-claims", () => assert([result.uniquenessClaimed, result.collisionChecked, result.reserved, result.issued, result.ledgerWritten, result.identityCreated, result.recordCreated, result.persisted].every((value) => !value), "claims")],
  ["source-count", () => assert(sources.length === 20, "sources")],
  ["source-authority", () => assert(sources.every((item) => item.required && !item.clientControlled && !item.staticConfiguration), "authority")],
  ["source-unique", () => assert(new Set(sources.map((item) => item.field)).size === sources.length, "duplicates")],
  ["actor-binding", () => assert(binding.actorBindingValid, "actor")],
  ["request-operation", () => assert(result.requestRef === authorization.requestRef && result.operationRef === authorization.operationRef, "request operation")],
  ["environment", () => assert(result.environment === authorization.environment, "environment")],
  ["layer-namespace", () => assert(result.identifierLayer === authorization.identifierLayer && result.namespace === authorization.namespace, "layer")],
  ["strategy-convention", () => assert(result.strategyRef === authorization.strategyRef && result.conventionRef === authorization.conventionRef, "policy")],
  ["attempt-binding", () => assert(result.attemptNumber === attempt.attemptNumber && result.attemptPolicyRef === attempt.attemptPolicyRef, "attempt binding")],
  ["output-policies", () => assert(result.outputSizePolicyRef.endsWith("@1.1.0") && result.encodingPolicyRef.endsWith("@1.1.0"), "output policy")],
  ["assessment", () => assert(evaluate(amendment, context).status === "RUNTIME_GOVERNANCE_BINDINGS_READY", "assessment")],
  ["next-action", () => assert(evaluate(amendment, context).requiredNextAction.startsWith("RESUME_CANONICAL"), "next")],
  ["deterministic", () => assert(JSON.stringify(evaluate(amendment, context)) === JSON.stringify(evaluate(amendment, context)), "deterministic")],
  ["production-blocked", () => assert(snapshots.productionRejected.status === "RUNTIME_GOVERNANCE_BINDINGS_BLOCKED", "production")],
  ["browser-blocked", () => assert(snapshots.browserRejected.status === "RUNTIME_GOVERNANCE_BINDINGS_BLOCKED", "browser")],
  ["batch", () => assert(snapshots.mixedBatch.status === "BATCH_RUNTIME_GOVERNANCE_BINDINGS_BLOCKED" && !snapshots.mixedBatch.inputOrderSelectsAuthority, "batch")],
  ["negative-scenarios", () => assert(Object.values(snapshots).filter((item) => item?.status === "BINDING_REJECTED").length === 24, "negative total")],
  ["snapshots", () => assert(Object.keys(snapshots).length === 30, "snapshot total")],
  ["cohort", () => assert(snapshots.cohort.length === 4 && snapshots.cohort.every((item) => Object.entries(item).filter(([key]) => key.endsWith("Count")).every(([, value]) => value === 0)), "cohort")],
  ["replay", () => assert(snapshots.matchingReplay.generationCount === 0 && snapshots.matchingReplay.transactionPortInvocationCount === 0, "replay")],
  ["composition", () => assert(createRuntimeGovernanceCompositionV1_2({ environment: "TEST", runtimeTarget: "SERVER", generatorPortVersion: "1.2.0", authenticationVerifier() {}, authorizationVerifier() {}, issuerContextProvider() {} }).valid, "composition")],
  ["composition-browser", () => assert(!createRuntimeGovernanceCompositionV1_2({ environment: "TEST", runtimeTarget: "BROWSER", generatorPortVersion: "1.2.0", authenticationVerifier() {}, authorizationVerifier() {}, issuerContextProvider() {} }).valid, "browser composition")],
  ["composition-no-port", () => assert(createRuntimeGovernanceCompositionV1_2({ environment: "TEST", runtimeTarget: "SERVER", generatorPortVersion: "1.2.0", authenticationVerifier() {}, authorizationVerifier() {}, issuerContextProvider() {} }).transactionPort === null, "port exists")],
  ["permissions", () => assert(Object.values(amendment.permissions).every((value) => !value), "permissions")],
  ["no-side-effects", () => assert(evaluate(amendment, context).executions === 0 && evaluate(amendment, context).persistenceOperations === 0, "effects")],
];

let passed = 0;
for (const [name, test] of tests) { try { test(); passed += 1; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); } }
console.log(`Prospect identifier runtime governance binding activation diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
