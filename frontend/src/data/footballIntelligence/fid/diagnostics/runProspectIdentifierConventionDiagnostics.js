import * as api from "../prospectIntake/index.js";
import { createIdentifierContextFixture, firstCohortIdentifierConventionFixtures } from "../prospectIntake/fixtures/prospectIdentifierConventionFixtures.js";
import snapshots from "../prospectIntake/fixtures/prospectIdentifierConventionSnapshots.js";

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const decision = (kind = "ISSUE_NEW_IDENTITY", overrides = {}) => api.createProspectIdentityAuthorityDecision({ decisionId: `authority-decision:${kind}`, requestRef: "request:diagnostic", operationRef: "operation:diagnostic", dryRunPlanRef: "dry-run:diagnostic", decision: kind, decisionReasonCodes: [], canonicalIdentityRef: kind === "REUSE_EXISTING_IDENTITY" ? "person:existing-person" : null, eligibility: { mayBeConsideredForFutureIssuance: kind === "ISSUE_NEW_IDENTITY", mayBeConsideredForIdentityReuse: kind === "REUSE_EXISTING_IDENTITY" }, reuseEligibility: kind === "REUSE_EXISTING_IDENTITY", issuanceEligibility: kind === "ISSUE_NEW_IDENTITY", reviewRequired: ["REVIEW_REQUIRED", "BLOCKED"].includes(kind), blocked: kind === "BLOCKED", draftCycleAction: "NO_CYCLE_ACTION", lifecycle: { state: "REVIEWED" }, ...overrides });
const context = (key = "diagnostic", overrides = {}) => createIdentifierContextFixture(key, { requestId: "request:diagnostic", operationId: "operation:diagnostic", ...overrides });
const evaluate = (d = decision(), c = context()) => api.evaluateCanonicalProspectIdentifierConvention(d, c);

const tests = [
  ["convention-valid", () => assert(api.validateCanonicalProspectIdentifierConvention(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION).valid, "Convention invalid.")],
  ["convention-frozen", () => assert(Object.isFrozen(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers), "Convention mutable.")],
  ["layer-inventory", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.length === 19, "Layer inventory incomplete.")],
  ["specifications-valid", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.every(api.isProspectIdentifierSpecification), "Specification invalid.")],
  ["invalid-specification", () => assert(!api.createProspectIdentifierSpecification({}).validation.valid, "Invalid specification accepted.")],
  ["context-valid", () => assert(api.isProspectIdentifierContext(api.createProspectIdentifierContext(context())), "Context invalid.")],
  ["invalid-context", () => assert(!api.createProspectIdentifierContext({}).validation.valid, "Invalid context accepted.")],
  ...["databaseClient", "repositoryClient", "identifierGenerator", "randomFunction", "persistenceAdapter", "callback"].map((key) => [`reject-${key}`, () => assert(!api.createProspectIdentifierContext({ ...context(), [key]: key === "callback" ? () => null : {} }).validation.valid, `${key} accepted.`)]),
  ["assessment-valid", () => assert(api.isProspectIdentifierConventionAssessment(evaluate()), "Assessment invalid.")],
  ["assessment-immutable", () => assert(Object.isFrozen(evaluate().permissions), "Assessment mutable.")],
  ["serialization", () => assert(JSON.parse(JSON.stringify(evaluate())).status === "CONVENTION_SATISFIED", "Serialization failed.")],
  ["raw-input-rejected", () => assert(evaluate("Raw Name").status === "CONVENTION_BLOCKED", "Raw input accepted.")],
  ...["PERSON", "PLAYER", "PROSPECT"].map((type) => [`stable-${type.toLowerCase()}`, () => { const layer = api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.find((item) => item.identifierType === type); assert(layer.immutable && layer.reuseRequired && !layer.draftCycleScoped, `${type} boundary invalid.`); }]),
  ["profile-cycle-scoped", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.find((item) => item.identifierType === "PROSPECT_PROFILE").draftCycleScoped, "Profile cycle scope missing.")],
  ["person-cycle-prohibited", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.find((item) => item.identifierType === "PERSON").prohibitedInputs.includes("DRAFT_CYCLE"), "Draft cycle entered Person ID.")],
  ["persistence-distinct", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.persistenceRules.canonicalAndPersistenceDistinct, "Persistence conflated.")],
  ["persistence-substitution-blocked", () => assert(evaluate(decision(), context("p", { existingCanonicalReferences: ["persistence:row"], existingPersistenceReferences: ["persistence:row"] })).status === "CONVENTION_BLOCKED", "Persistence substituted.")],
  ["request-substitution-blocked", () => assert(evaluate(decision(), context("r", { existingCanonicalReferences: ["request:diagnostic"] })).status === "CONVENTION_BLOCKED", "Request substituted.")],
  ["operation-substitution-blocked", () => assert(evaluate(decision(), context("o", { existingCanonicalReferences: ["operation:diagnostic"] })).status === "CONVENTION_BLOCKED", "Operation substituted.")],
  ["simulator-prohibited", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.find((item) => item.identifierType === "SIMULATOR").formatStatus === "PROHIBITED_AS_CANONICAL", "Simulator canonicalized.")],
  ["ui-slug-prohibited", () => assert(api.CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.find((item) => item.identifierType === "UI_SLUG").formatStatus === "PROHIBITED_AS_CANONICAL", "UI slug canonicalized.")],
  ["legacy-review", () => assert(evaluate(decision(), context("legacy", { legacyIdentifierReferences: [{ reference: "2026-example", classification: "UNRESOLVED" }] })).status === "CONVENTION_REVIEW_REQUIRED", "Legacy ID auto-approved.")],
  ["existing-reuse", () => { const result = evaluate(decision("REUSE_EXISTING_IDENTITY"), context("reuse", { existingCanonicalReferences: ["person:existing-person"] })); assert(result.status === "CONVENTION_SATISFIED" && result.canonicalReferencesToReuse.includes("person:existing-person"), "Reuse failed."); }],
  ["review-not-eligible", () => assert(!evaluate(decision("REVIEW_REQUIRED")).eligibleForFutureIssuanceRequest, "Review became eligible.")],
  ["blocked-not-eligible", () => assert(!evaluate(decision("BLOCKED")).eligibleForFutureIssuanceRequest, "Blocked became eligible.")],
  ["future-request-eligible", () => assert(evaluate().eligibleForFutureIssuanceRequest, "Eligibility missing.")],
  ["cycle-conflict-review", () => assert(evaluate(decision("REUSE_EXISTING_IDENTITY"), context("cycle", { draftCycleConflict: true })).status === "CONVENTION_REVIEW_REQUIRED", "Cycle conflict mishandled.")],
  ...Object.values(api.PROSPECT_IDENTIFIER_COLLISION_CLASSES).map((collision) => [`collision-${collision.toLowerCase()}`, () => assert(evaluate(decision(), context(collision, { collisionClasses: [collision] })).status !== "CONVENTION_SATISFIED", `${collision} ignored.`)]),
  ["batch-cross-request", () => { const result = api.evaluateCanonicalProspectIdentifierConventionBatch([decision(), decision("ISSUE_NEW_IDENTITY", { decisionId: "authority-decision:two" })], [context("one", { existingCanonicalReferences: ["person:same"] }), context("two", { existingCanonicalReferences: ["person:same"] })]); assert(result.status === "CONVENTION_BLOCKED" && result.collisionIndexes.length === 2 && !result.inputOrderSelectsWinner, "Batch collision failed."); }],
  ["batch-input-preserving", () => assert(api.evaluateCanonicalProspectIdentifierConventionBatch([decision()], [context()]).assessments.length === 1, "Batch dropped input.")],
  ["batch-mismatch", () => assert(api.evaluateCanonicalProspectIdentifierConventionBatch([decision()], []).status === "CONVENTION_BLOCKED", "Mismatch accepted.")],
  ["deterministic", () => assert(JSON.stringify(evaluate()) === JSON.stringify(evaluate()), "Nondeterministic.")],
  ["no-generation", () => assert(!JSON.stringify(evaluate()).match(/randomUUID|Math\.random|createHash|generatedIdentifier/i), "Generation detected.")],
  ["permissions-false", () => assert(Object.values(evaluate().permissions).every((value) => value === false), "Permission granted.")],
  ...firstCohortIdentifierConventionFixtures.map((fixture) => [`cohort-${fixture.name}`, () => { const result = api.evaluateCanonicalProspectIdentifierConvention(fixture.authorityDecision, fixture.identifierContext); assert(["CONVENTION_REVIEW_REQUIRED", "CONVENTION_BLOCKED"].includes(result.status) && !result.eligibleForFutureIssuanceRequest && Object.values(result.permissions).every((value) => !value), `${fixture.name} invalid.`); }]),
  ["snapshots-eight", () => assert(Object.keys(snapshots).length === 8, "Snapshot count changed.")],
];

export function runProspectIdentifierConventionDiagnostics({ throwOnFailure = false } = {}) { const cases = tests.map(([id, test]) => { try { test(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message }; } }); const passed = cases.filter((item) => item.passed).length; const result = { suite: "ProspectIdentifierConventionDiagnostics", total: cases.length, passed, failed: cases.length - passed, snapshots: { total: 8, passed: Object.keys(snapshots).length }, cohort: { total: 4, passed: cases.filter((item) => item.id.startsWith("cohort-") && item.passed).length }, cases }; if (throwOnFailure && result.failed) throw new Error(`${result.suite} failed ${result.failed} of ${result.total}: ${cases.filter((item) => !item.passed).map((item) => `${item.id} (${item.message})`).join(", ")}`); return result; }
export default Object.freeze({ runProspectIdentifierConventionDiagnostics });
