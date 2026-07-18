import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import prospectIntakeApi, * as namedProspectIntakeApi from "../prospectIntake/index.js";
import sprint22Constants, * as namedSprint22Constants from "../prospectIntake/prospectPromotionWorkflowConstants.js";
import sprint22Contract, * as namedSprint22Contract from "../prospectIntake/ProspectPromotionWorkflowContract.js";
import sprint22Planner, * as namedSprint22Planner from "../prospectIntake/ProspectPromotionWorkflowPlanner.js";
import { runProspectPromotionDecisionContractDiagnostics } from "./runProspectPromotionDecisionContractDiagnostics.js";

const SUITE = "ProspectPromotionWorkflowDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/prospectPromotionWorkflowConstants.js"), "utf8");
const CONTRACT_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectPromotionWorkflowContract.js"), "utf8");
const PLANNER_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectPromotionWorkflowPlanner.js"), "utf8");
const INTAKE_INDEX_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const DIAGNOSTIC_SOURCE = readFileSync(fileURLToPath(import.meta.url), "utf8");
const PRODUCTION_SOURCE = [CONSTANTS_SOURCE, CONTRACT_SOURCE, PLANNER_SOURCE].join("\n");

const GROUPS = Object.freeze([
  "identity-versions", "frozen-mappings", "workflow-minimal-full", "unavailable-invalid-input",
  "mutation-stability-null", "no-generated-inputs", "mode-status-restrictions", "decision-authorization",
  "independent-partial-targets", "claim-authorization", "target-proposals-actions", "no-action-non-authorizing",
  "contract-mapping-payload", "missing-metadata-errors", "dependency-ordering", "missing-external-self-dependencies",
  "cyclic-dependencies", "record-identity-revisions", "persistence-envelope-boundary", "determinism-idempotency",
  "errors-validations-preconditions", "audit-timestamps-rollback", "repository-intake-fid-boundaries",
  "evaluation-simulator-extension-safety", "export-compatibility", "prior-diagnostic-integration",
]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from({ length: 20 }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

const TARGETS = Object.freeze([
  ["entity", "FOOTBALL_ENTITY", "FootballEntity"],
  ["person", "PERSON_PROFILE", "PersonProfile"],
  ["player", "PLAYER_PROFILE", "PlayerProfile"],
]);

function claimDecision(variant, suffix, targetType, decision = "APPROVED") {
  return { claimDecisionId: `claim-${variant}-${suffix}`, sourceClaimRef: `source-claim-${variant}-${suffix}`, claimType: suffix.toUpperCase(), targetType, targetField: `proposed.${suffix}`, proposedValueDeclaration: { submittedValue: `Fictional ${suffix} ${variant}` }, decision, decisionScope: suffix === "entity" ? "IDENTITY" : suffix === "person" ? "PERSON" : "PLAYER", sourceRefs: [], evidenceRefs: [], reviewerRefs: [`reviewer-${variant}`], rationale: "Governance authorization only.", limitations: [], conflictRefs: [], blockerRefs: [], notes: null };
}

function decisionTarget(variant, suffix, targetType, action, decision, approvedClaimRefs = []) {
  return { targetDecisionId: `decision-target-${variant}-${suffix}`, targetType, targetRef: `proposed-${suffix}-${variant}`, proposedAction: action, decision, approvedClaimRefs, deferredClaimRefs: [], rejectedClaimRefs: [], excludedClaimRefs: [], unresolvedClaimRefs: [], requiredSourceRefs: [], requiredEvidenceRefs: [], blockerRefs: [], reviewerRefs: [`reviewer-${variant}`], rationale: "Explicit governance decision.", limitations: [], notes: null };
}

function promotionDecision(variant, overrides = {}) {
  return {
    decisionId: `decision-${variant}`, decisionRevision: 2, workflowRevision: 3, cycleRef: "cycle:fictional:2027", intakeCandidateRef: `intake-${variant}`, status: "APPROVED",
    targetDecisions: [
      decisionTarget(variant, "entity", "FOOTBALL_ENTITY", "CREATE", "APPROVED", [`claim-${variant}-entity`]),
      decisionTarget(variant, "person", "PERSON_PROFILE", "CREATE", "APPROVED", [`claim-${variant}-person`]),
      decisionTarget(variant, "player", "PLAYER_PROFILE", "CREATE", "PARTIALLY_APPROVED", [`claim-${variant}-player`]),
      decisionTarget(variant, "prospect", "PROSPECT_PROFILE", "DEFER", "DEFERRED", []),
      decisionTarget(variant, "relationship", "FOOTBALL_RELATIONSHIP", "NO_ACTION", "APPROVED", []),
    ],
    claimDecisions: TARGETS.map(([suffix, targetType]) => claimDecision(variant, suffix, targetType)),
    ...overrides,
  };
}

function proposal(variant, suffix, targetType, contract, overrides = {}) {
  return {
    targetProposalId: `proposal-${variant}-${suffix}`, operationId: `operation-${variant}-${suffix}`,
    promotionDecisionTargetRef: `decision-target-${variant}-${suffix}`, targetType, proposedAction: "CREATE",
    targetRecordRef: `record-ref-${variant}-${suffix}`, targetRecordId: `record-${variant}-${suffix}`,
    targetPersistenceId: `persistence-${variant}-${suffix}-1`, targetRecordRevision: 1, targetContract: contract,
    targetContractVersion: `${contract}-1.0.0`, targetSchemaVersion: `${contract}-SCHEMA-1.0.0`,
    proposedPayload: { contract, contractVersion: `${contract}-1.0.0`, schemaVersion: `${contract}-SCHEMA-1.0.0`, recordLabel: `Fictional ${suffix} payload ${variant}` },
    authorizedClaimRefs: [`claim-${variant}-${suffix}`], excludedClaimRefs: [], sourceClaimRefs: [`source-claim-${variant}-${suffix}`],
    fieldMappings: { [`claim-${variant}-${suffix}`]: "recordLabel" }, sourceRefs: [`source-${variant}-${suffix}`], evidenceRefs: [`evidence-${variant}-${suffix}`],
    dependencyRefs: [], predecessorRefs: [], replacementRefs: [], validationStatus: "NOT_RUN", notes: "Caller-supplied payload.", extensions: {}, ...overrides,
  };
}

function noActionProposal(variant) {
  return { targetProposalId: `proposal-${variant}-relationship`, operationId: null, promotionDecisionTargetRef: `decision-target-${variant}-relationship`, targetType: "FOOTBALL_RELATIONSHIP", proposedAction: "NO_ACTION", targetRecordRef: `existing-relationship-${variant}`, targetRecordId: null, targetPersistenceId: null, targetRecordRevision: null, targetContract: null, targetContractVersion: null, targetSchemaVersion: null, proposedPayload: null, authorizedClaimRefs: [], excludedClaimRefs: [], sourceClaimRefs: [], fieldMappings: {}, sourceRefs: [], evidenceRefs: [], dependencyRefs: [], predecessorRefs: [], replacementRefs: [], validationStatus: "NOT_RUN", notes: "Explicitly skipped.", extensions: {} };
}

function identityInput(variant, suffix, targetType, overrides = {}) {
  return { recordIdentityInputId: `identity-input-${variant}-${suffix}`, targetProposalRef: `proposal-${variant}-${suffix}`, targetType, logicalRecordId: `record-${variant}-${suffix}`, persistenceId: `persistence-${variant}-${suffix}-1`, revision: 1, predecessorPersistenceId: null, priorRecordRef: null, replacementRef: null, externalExistingRecord: false, notes: null, ...overrides };
}

function persistenceInput(variant, suffix, contract, overrides = {}) {
  const payload = { contract, contractVersion: `${contract}-1.0.0`, schemaVersion: `${contract}-SCHEMA-1.0.0`, recordLabel: `Fictional ${suffix} payload ${variant}` };
  return { persistenceInputId: `persistence-input-${variant}-${suffix}`, targetProposalRef: `proposal-${variant}-${suffix}`, persistenceId: `persistence-${variant}-${suffix}-1`, recordId: `record-${variant}-${suffix}`, revision: 1, contract, contractVersion: `${contract}-1.0.0`, schemaVersion: `${contract}-SCHEMA-1.0.0`, entityRef: suffix === "entity" ? `entity-${variant}` : null, subjectRef: suffix === "entity" ? null : `entity-${variant}`, recordType: contract, recordVersion: "1.0.0", payload, lifecycleState: "ACTIVE", verificationState: "UNVERIFIED", effectiveFrom: null, effectiveTo: null, recordedAt: null, persistedAt: null, replacedByRef: null, supersedesRef: null, sourceRecordRefs: [], promotionRefs: [`decision-${variant}`], payloadChecksum: null, metadata: { tags: ["dry-run"], notes: null, namespace: "prospect-promotion", attributes: {} }, predecessorRefs: [], replacementRefs: [], extensions: {}, ...overrides };
}

function dependencies(variant) {
  return [
    { dependencyId: `dependency-${variant}-person-entity`, targetProposalRef: `proposal-${variant}-person`, dependencyTargetProposalRef: `proposal-${variant}-entity`, externalExistingRecordRef: null, required: true, notes: null },
    { dependencyId: `dependency-${variant}-player-person`, targetProposalRef: `proposal-${variant}-player`, dependencyTargetProposalRef: `proposal-${variant}-person`, externalExistingRecordRef: null, required: true, notes: null },
  ];
}

function proposals(variant) {
  return [
    proposal(variant, "entity", "FOOTBALL_ENTITY", "FootballEntity"),
    proposal(variant, "person", "PERSON_PROFILE", "PersonProfile", { dependencyRefs: [`dependency-${variant}-person-entity`] }),
    proposal(variant, "player", "PLAYER_PROFILE", "PlayerProfile", { dependencyRefs: [`dependency-${variant}-player-person`] }),
    noActionProposal(variant),
  ];
}

function identities(variant) { return TARGETS.map(([suffix, targetType]) => identityInput(variant, suffix, targetType)); }
function persistence(variant) { return TARGETS.map(([suffix, , contract]) => persistenceInput(variant, suffix, contract)); }

function workflow(variant, overrides = {}) {
  return { workflowId: `workflow-${variant}`, workflowRevision: 1, cycleRef: "cycle:fictional:2027", intakeCandidateRef: `intake-${variant}`, promotionDecisionRef: `decision-${variant}`, promotionDecisionRevision: 2, mode: "DRY_RUN", status: "DRAFT", targetOperations: proposals(variant), dependencyDeclarations: dependencies(variant), recordIdentityInputs: identities(variant), persistenceInputs: persistence(variant), validationRecords: [], errorRecords: [], auditHistory: [], sourceRefs: [], evidenceRefs: [], reviewRefs: [], blockerRefs: [], verification: { state: "UNVERIFIED", reviewedBy: null, reviewedAt: null, notes: null }, provenance: { createdBy: `author-${variant}`, createdAt: null, updatedBy: null, updatedAt: null }, lifecycle: { state: "OPEN", openedAt: null, closedAt: null, archivedAt: null, priorWorkflowRef: null, replacementWorkflowRef: null }, notes: "Dry-run planning only.", extensions: { workflow: { lane: "prospect-promotion" } }, ...overrides };
}

function plannerInput(variant, overrides = {}) {
  return { workflow: workflow(variant), promotionDecision: fidApi.createProspectPromotionDecision(promotionDecision(variant)), targetProposals: proposals(variant), recordIdentityInputs: identities(variant), persistenceInputs: persistence(variant), dependencyDeclarations: dependencies(variant), options: { planId: `plan-${variant}`, actorRef: `actor-${variant}`, occurredAt: null }, ...overrides };
}

function plan(variant, overrides = {}) { return fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, overrides)); }

function identityVersionChecks(variant) {
  const result = fidApi.createProspectPromotionWorkflow(workflow(variant));
  assert(result.contract === fidApi.PROSPECT_PROMOTION_WORKFLOW_CONTRACT_NAME && result.contractVersion === fidApi.PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION && result.schemaVersion === fidApi.PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION, "Workflow identity/version mismatch.");
  assert(result.validation.valid && fidApi.isProspectPromotionWorkflow(result), "Workflow type guard rejected a valid record.");
}

function frozenMappingChecks() {
  const vocabularies = [fidApi.PROSPECT_PROMOTION_WORKFLOW_MODES, fidApi.PROSPECT_PROMOTION_WORKFLOW_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_TARGET_TYPES, fidApi.PROSPECT_PROMOTION_WORKFLOW_TARGET_CONTRACTS, fidApi.PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_ORDER, fidApi.PROSPECT_PROMOTION_WORKFLOW_ACTIONS, fidApi.PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_PAYLOAD_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES, fidApi.PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES, fidApi.PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS, fidApi.PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS, fidApi.PROSPECT_PROMOTION_WORKFLOW_VERIFICATION_STATES, fidApi.PROSPECT_PROMOTION_WORKFLOW_LIFECYCLE_STATES];
  assert(vocabularies.every((entry) => Object.isFrozen(entry) && Object.keys(entry).length > 0), "Sprint 22 vocabulary or mapping is not frozen.");
  assert(JSON.stringify(fidApi.PROSPECT_PROMOTION_WORKFLOW_TARGET_CONTRACTS) === JSON.stringify({ FOOTBALL_ENTITY: "FootballEntity", PERSON_PROFILE: "PersonProfile", PLAYER_PROFILE: "PlayerProfile", PROSPECT_PROFILE: "ProspectProfile", FOOTBALL_RELATIONSHIP: "FootballRelationship" }), "Target-contract mapping disagrees with approved contract identities.");
  assert(!Object.values(fidApi.PROSPECT_PROMOTION_WORKFLOW_MODES).some((entry) => /COMMIT|EXECUTE|WRITE|PERSIST|APPLY/.test(entry)), "Committing workflow mode was introduced.");
}

function workflowMinimalFullChecks(variant) {
  const minimal = fidApi.createProspectPromotionWorkflow({ workflowId: `minimal-${variant}`, cycleRef: "cycle:fictional:2027", intakeCandidateRef: `intake-${variant}`, promotionDecisionRef: `decision-${variant}`, mode: "PLAN_ONLY", status: "DRAFT" });
  const full = fidApi.createProspectPromotionWorkflow(workflow(variant));
  assert(minimal.validation.valid && full.validation.valid && minimal.targetOperations.length === 0 && full.targetOperations.length === 4, "Minimal/full Workflow normalization failed.");
  assert(!Object.hasOwn(full, "promotionDecision") && !Object.hasOwn(full, "repository") && !Object.hasOwn(full, "fidRecords"), "Workflow embedded an external runtime record.");
}

function unavailableInvalidChecks(variant) {
  [null, [], `invalid-${variant}`, variant, true].forEach((input) => assert(!fidApi.validateProspectPromotionWorkflow(input).valid, "Workflow validator accepted invalid ordinary input."));
  const unavailable = fidApi.createUnavailableProspectPromotionWorkflow({ reason: "Unavailable" });
  assert(!unavailable.validation.valid && unavailable.targetOperations.length === 0 && unavailable.persistenceInputs.length === 0, "Unavailable Workflow invented targets or persistence inputs.");
  const decisionOnly = fidApi.createProspectPromotionWorkflowDryRunPlan({ promotionDecision: fidApi.createProspectPromotionDecision(promotionDecision(variant)) });
  assert(decisionOnly.errors.length > 0 && decisionOnly.repositoryWritePerformed === false, "Promotion Decision alone created a valid workflow plan.");
}

function mutationStabilityNullChecks(variant) {
  const input = plannerInput(variant); const before = clone(input); const first = fidApi.createProspectPromotionWorkflowDryRunPlan(input); const second = fidApi.createProspectPromotionWorkflowDryRunPlan(input);
  assert(JSON.stringify(input) === JSON.stringify(before), "Planner mutated caller input.");
  assert(JSON.stringify(first) === JSON.stringify(second) && first.validation.valid, "Repeated dry-run plan is unstable.");
  assert(first.auditEvents.every((entry) => entry.occurredAt === null) && first.orderedOperations.every((entry) => entry.proposedEnvelope.persistedAt === null), "Explicit null timestamps were not preserved.");
}

function noGeneratedInputsChecks(variant) {
  const workflowResult = fidApi.createProspectPromotionWorkflow({ workflowId: `workflow-${variant}`, cycleRef: "c", intakeCandidateRef: "i", promotionDecisionRef: "d", mode: "DRY_RUN", status: "DRAFT" });
  const proposalResult = fidApi.createProspectPromotionTargetProposal({ targetProposalId: `p-${variant}`, promotionDecisionTargetRef: "t", targetType: "FOOTBALL_ENTITY", proposedAction: "CREATE" });
  assert(workflowResult.workflowRevision === null && workflowResult.targetOperations.length === 0 && workflowResult.auditHistory.length === 0, "Workflow factory generated revisions or records.");
  assert(proposalResult.operationId === null && proposalResult.targetRecordId === null && proposalResult.targetPersistenceId === null && proposalResult.targetRecordRevision === null && proposalResult.proposedPayload === null, "Proposal factory generated caller-owned planning inputs.");
}

function modeStatusChecks(variant) {
  ["COMMIT", "EXECUTE", "WRITE", "PERSIST", "APPLY"].forEach((mode) => assert(!fidApi.validateProspectPromotionWorkflow(workflow(variant, { mode })).valid, `Prohibited mode ${mode} was accepted.`));
  const validating = fidApi.createProspectPromotionWorkflow(workflow(variant, { status: "VALIDATING" })); const draft = fidApi.createProspectPromotionWorkflow(workflow(`${variant}-draft`, { status: "DRAFT" }));
  assert(validating.status === "VALIDATING" && draft.status === "DRAFT", "Production factory calculated Workflow status.");
  const validationPlan = plan(variant, { workflow: workflow(variant, { mode: "VALIDATION_ONLY" }) }); assert(validationPlan.status === "VALIDATION_COMPLETE", "Planner did not derive documented non-committing mode result.");
}

function decisionAuthorizationChecks(variant) {
  const valid = plan(variant); assert(valid.status === "DRY_RUN_COMPLETE" && valid.errors.length === 0, "Explicit authorized Decision did not produce a valid dry run.");
  const alteredDecision = fidApi.createProspectPromotionDecision(promotionDecision(variant, { status: "APPROVED", targetDecisions: promotionDecision(variant).targetDecisions.map((entry) => entry.targetType === "PERSON_PROFILE" ? { ...entry, decision: "DEFERRED", proposedAction: "DEFER" } : entry) }));
  const result = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { promotionDecision: alteredDecision }));
  assert(result.errors.some((entry) => entry.code === "DECISION_NOT_AUTHORIZING") && result.blockedTargets.includes(`proposal-${variant}-person`), "Overall APPROVED status authorized an explicitly deferred target.");
}

function independentPartialTargetChecks(variant) {
  const result = plan(variant); const types = result.orderedOperations.map((entry) => entry.targetType);
  assert(types.join(",") === "FOOTBALL_ENTITY,PERSON_PROFILE,PLAYER_PROFILE" && result.skippedTargets.includes(`proposal-${variant}-relationship`), "Independent target planning or partial approval failed.");
  const player = result.orderedOperations.find((entry) => entry.targetType === "PLAYER_PROFILE");
  assert(player.authorizationStatus === "PARTIALLY_AUTHORIZED" && player.claimAuthorizationStatus === "AUTHORIZED", "PARTIALLY_APPROVED target did not restrict authorization to explicit claims.");
}

function claimAuthorizationChecks(variant) {
  const altered = proposals(variant); altered.find((entry) => entry.targetType === "PLAYER_PROFILE").authorizedClaimRefs = [`claim-${variant}-person`];
  const mismatch = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals: altered }));
  assert(mismatch.errors.some((entry) => ["CLAIM_NOT_AUTHORIZED", "CLAIM_TARGET_MISMATCH"].includes(entry.code)), "Claim approved for another target entered authorization list.");
  const deferredDecision = promotionDecision(variant); deferredDecision.claimDecisions = deferredDecision.claimDecisions.map((entry) => entry.targetType === "PLAYER_PROFILE" ? { ...entry, decision: "DEFERRED" } : entry);
  const deferred = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { promotionDecision: fidApi.createProspectPromotionDecision(deferredDecision) }));
  assert(deferred.errors.some((entry) => entry.code === "CLAIM_NOT_AUTHORIZED"), "Deferred claim entered a planned authorization list.");
}

function targetProposalActionChecks(variant) {
  const valid = fidApi.createProspectPromotionTargetProposal(proposal(variant, "entity", "FOOTBALL_ENTITY", "FootballEntity"));
  assert(valid.validation.valid && valid.proposedPayload.recordLabel.includes("Fictional"), "Caller-supplied Target Proposal did not normalize.");
  ["DEFER", "REJECT", "EXCLUDE", "DELETE", "MERGE", "UPSERT", "REPLACE_IN_PLACE", "HARD_DELETE"].forEach((action) => {
    const raw = proposals(variant); raw[0] = { ...raw[0], proposedAction: action };
    const result = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals: raw }));
    assert(result.errors.some((entry) => entry.code === "UNSUPPORTED_ACTION" || entry.code === "INVALID_WORKFLOW"), `Unsupported action ${action} created a planned operation.`);
  });
}

function noActionNonAuthorizingChecks(variant) {
  const result = plan(variant); assert(result.skippedTargets.includes(`proposal-${variant}-relationship`) && !result.orderedOperations.some((entry) => entry.targetType === "FOOTBALL_RELATIONSHIP"), "NO_ACTION created a write operation.");
  const deferredProposal = proposal(variant, "prospect", "PROSPECT_PROFILE", "ProspectProfile", { promotionDecisionTargetRef: `decision-target-${variant}-prospect` });
  const input = plannerInput(variant, { targetProposals: [...proposals(variant), deferredProposal], recordIdentityInputs: [...identities(variant), identityInput(variant, "prospect", "PROSPECT_PROFILE")], persistenceInputs: [...persistence(variant), persistenceInput(variant, "prospect", "ProspectProfile")] });
  const blocked = fidApi.createProspectPromotionWorkflowDryRunPlan(input); assert(blocked.errors.some((entry) => entry.code === "DECISION_NOT_AUTHORIZING") && !blocked.orderedOperations.some((entry) => entry.targetType === "PROSPECT_PROFILE"), "Deferred decision created an operation.");
}

function contractMappingPayloadChecks(variant) {
  const altered = proposals(variant); altered[0] = { ...altered[0], targetContract: "PersonProfile" };
  const mismatch = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals: altered })); assert(mismatch.errors.some((entry) => entry.code === "CONTRACT_TARGET_MISMATCH"), "Contract-target mismatch was accepted.");
  const valid = plan(variant); const operation = valid.orderedOperations[0];
  assert(operation.payloadPlanningStatus === "FID_CONTRACT_VALIDATION_REQUIRED" && operation.proposedEnvelope.payload.recordLabel === `Fictional entity payload ${variant}`, "Planner claimed full FID validity or generated a different payload.");
  assert(operation.proposedEnvelope.repositoryValidated === false, "Proposed envelope claimed repository validation.");
}

function missingMetadataErrorChecks(variant) {
  const cases = [
    ["proposedPayload", null, "MISSING_PAYLOAD"], ["targetRecordId", null, "MISSING_RECORD_ID"],
    ["targetPersistenceId", null, "MISSING_PERSISTENCE_ID"], ["targetContract", null, "MISSING_TARGET_CONTRACT"],
  ];
  cases.forEach(([field, value, code]) => { const targetProposals = proposals(variant); targetProposals[0] = { ...targetProposals[0], [field]: value }; const identityValues = identities(variant); if (field === "targetRecordId") identityValues[0] = { ...identityValues[0], logicalRecordId: null }; if (field === "targetPersistenceId") identityValues[0] = { ...identityValues[0], persistenceId: null }; const result = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals, recordIdentityInputs: identityValues })); assert(result.errors.some((entry) => entry.code === code), `Missing ${field} did not produce ${code}.`); });
}

function dependencyOrderingChecks(variant) {
  const shuffled = proposals(variant).reverse(); const result = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals: shuffled }));
  assert(result.errors.length === 0 && result.orderedOperations.map((entry) => entry.targetType).join(",") === "FOOTBALL_ENTITY,PERSON_PROFILE,PLAYER_PROFILE", "Deterministic dependency ordering failed.");
  assert(result.orderedOperations.map((entry) => entry.order).join(",") === "1,2,3", "Operation order was not deterministic.");
}

function missingExternalSelfDependencyChecks(variant) {
  const missing = dependencies(variant); missing[0] = { ...missing[0], dependencyTargetProposalRef: `proposal-${variant}-missing` };
  const missingResult = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { dependencyDeclarations: missing })); assert(missingResult.errors.some((entry) => entry.code === "MISSING_DEPENDENCY"), "Missing dependency did not block target.");
  const external = dependencies(variant); external[0] = { ...external[0], dependencyTargetProposalRef: null, externalExistingRecordRef: `external-entity-${variant}` };
  const externalResult = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { dependencyDeclarations: external })); assert(!externalResult.errors.some((entry) => entry.targetProposalRef === `proposal-${variant}-person` && entry.code === "MISSING_DEPENDENCY"), "Explicit external existing-record dependency was rejected.");
  const self = fidApi.createProspectPromotionDependencyDeclaration({ dependencyId: `self-${variant}`, targetProposalRef: `proposal-${variant}-entity`, dependencyTargetProposalRef: `proposal-${variant}-entity`, required: true }); assert(!self.validation.valid, "Self-dependency was accepted.");
}

function cyclicDependencyChecks(variant) {
  const declarations = dependencies(variant); declarations.push({ dependencyId: `dependency-${variant}-entity-player`, targetProposalRef: `proposal-${variant}-entity`, dependencyTargetProposalRef: `proposal-${variant}-player`, externalExistingRecordRef: null, required: true, notes: null });
  const targetProposals = proposals(variant); targetProposals[0] = { ...targetProposals[0], dependencyRefs: [`dependency-${variant}-entity-player`] };
  const result = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { targetProposals, dependencyDeclarations: declarations }));
  assert(result.errors.some((entry) => entry.code === "CYCLIC_DEPENDENCY") && result.repositoryWritePerformed === false, "Cyclic dependency was not rejected.");
}

function recordIdentityRevisionChecks(variant) {
  const createBad = identities(variant); createBad[0] = { ...createBad[0], revision: 2 }; const createResult = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { recordIdentityInputs: createBad })); assert(createResult.errors.some((entry) => entry.code === "INVALID_REVISION"), "CREATE accepted revision other than 1.");
  const appendDecision = promotionDecision(variant); appendDecision.targetDecisions[0] = { ...appendDecision.targetDecisions[0], proposedAction: "APPEND_REVISION" };
  const appendProposals = proposals(variant); appendProposals[0] = { ...appendProposals[0], proposedAction: "APPEND_REVISION", targetPersistenceId: `persistence-${variant}-entity-2`, targetRecordRevision: 2 };
  const appendIdentity = identities(variant); appendIdentity[0] = { ...appendIdentity[0], revision: 2, persistenceId: `persistence-${variant}-entity-2`, predecessorPersistenceId: `persistence-${variant}-entity-1` };
  const appendPersistence = persistence(variant); appendPersistence[0] = { ...appendPersistence[0], revision: 2, persistenceId: `persistence-${variant}-entity-2`, supersedesRef: `persistence-${variant}-entity-1` };
  const append = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { promotionDecision: fidApi.createProspectPromotionDecision(appendDecision), targetProposals: appendProposals, recordIdentityInputs: appendIdentity, persistenceInputs: appendPersistence }));
  assert(!append.errors.some((entry) => entry.targetProposalRef === `proposal-${variant}-entity`) && append.orderedOperations[0].preconditions.includes("PRIOR_RECORD_EXISTS"), "Valid APPEND_REVISION planning failed.");
  assert(append.orderedOperations[0].preconditions.includes("RECORD_REVISION_SEQUENCE"), "Planner falsely verified latest repository revision instead of recording a precondition.");
}

function persistenceEnvelopeChecks(variant) {
  const result = plan(variant); const envelope = result.orderedOperations[0].proposedEnvelope;
  assert(envelope.preparationStatus === "REQUIRES_PERSISTENCE_VALIDATION" && envelope.repositoryPreconditionStatus === "REQUIRES_REPOSITORY_PRECONDITION_CHECK", "Envelope boundary labels are incorrect.");
  assert(envelope.stored === false && envelope.persisted === false && envelope.committed === false && envelope.repositoryValidated === false, "Dry-run envelope claimed persistence.");
  assert(envelope.persistenceId === `persistence-${variant}-entity-1` && envelope.recordId === `record-${variant}-entity` && envelope.revision === 1, "Planner generated or replaced caller-owned persistence identity.");
}

function determinismIdempotencyChecks(variant) {
  const input = plannerInput(variant); const first = fidApi.createProspectPromotionWorkflowDryRunPlan(input); const second = fidApi.createProspectPromotionWorkflowDryRunPlan(input);
  assert(JSON.stringify(first) === JSON.stringify(second) && first.planId === `plan-${variant}`, "Identical planner input did not produce a stable plan.");
  assert(first.summary.crossProcessIdempotencyClaimed === false && !Object.hasOwn(first, "idempotencyStore"), "Planner claimed cross-process idempotency or created a store.");
  assert(first.orderedOperations.every((entry) => entry.operationId.startsWith(`operation-${variant}`)), "Planner generated operation identifiers.");
}

function errorValidationPreconditionChecks(variant) {
  const valid = plan(variant); assert(valid.validationRecords.some((entry) => entry.status === "REQUIRED_LATER" && entry.code === "FID_VALIDATION_REQUIRED"), "Future factual validation was not declared.");
  assert(valid.preconditions.includes("PERSISTENCE_ENVELOPE_VALIDATION") && valid.preconditions.includes("REPOSITORY_AVAILABILITY") && valid.preconditions.includes("HUMAN_EXECUTION_APPROVAL"), "Required future preconditions are missing.");
  const invalid = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { options: { planId: null } })); assert(invalid.errors.every((entry) => !Object.hasOwn(entry, "stack")) && invalid.errors.some((entry) => entry.code === "INVALID_WORKFLOW"), "Structured error model failed or exposed stack traces.");
}

function auditTimestampRollbackChecks(variant) {
  const result = plan(variant); assert(result.auditEvents.length >= 3 && result.auditEvents.every((entry) => entry.occurredAt === null), "Planner generated audit timestamps.");
  assert(result.summary.rollbackPerformed === false && result.summary.repositoryWritesPerformed === false && !Object.hasOwn(result, "rollbackCallback") && !Object.hasOwn(result, "transaction"), "Dry-run planner executed rollback or a transaction.");
  const dated = fidApi.createProspectPromotionWorkflowDryRunPlan(plannerInput(variant, { options: { planId: `plan-${variant}`, actorRef: `actor-${variant}`, occurredAt: "2026-10-01T12:00:00Z" } })); assert(dated.auditEvents.every((entry) => entry.occurredAt === "2026-10-01T12:00:00Z"), "Explicit audit timestamp was not preserved.");
}

function repositoryIntakeFidBoundaryChecks(variant) {
  const result = plan(variant); assert(result.summary.repositoryReadsPerformed === false && result.summary.repositoryWritesPerformed === false && result.summary.factualPayloadsGenerated === false, "Planner crossed Research, FID, or persistence boundary.");
  const imports = [...PRODUCTION_SOURCE.matchAll(/(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  assert(imports.every((entry) => entry.startsWith("./") && !/researchRepository|persistence|InMemory|supabase|database|components|pages|router|routes|engines/i.test(entry)), "Sprint 22 production imports prohibited infrastructure.");
  assert(!/\b(?:fetch|XMLHttpRequest|axios|createVersion|getByPersistenceId|getLatestByRecordId|queryRecords)\s*\(/.test(PRODUCTION_SOURCE), "Sprint 22 executes an external or repository operation.");
  assert(!Object.hasOwn(result, "researchRecords") && !Object.hasOwn(result, "intakeRecords") && !Object.hasOwn(result, "canonicalFidRecords"), "Dry-run plan owns external records.");
}

function evaluationSimulatorExtensionChecks(variant) {
  const result = plan(variant); const excluded = ["playerScore", "grade", "ranking", "projection", "expectedRound", "draftRange", "teamFit", "schemeFit", "draftValue", "recommendation", "prediction", "decisionQuality", "prospectQuality", "simulatorReadiness"];
  assert(excluded.every((key) => !Object.hasOwn(result, key)), "Evaluation or simulator output entered dry-run plan.");
  const prohibited = ["repositoryFunctions", "createVersionCallbacks", "databaseClient", "supabaseClient", "apiClient", "credentials", "apiKey", "sql", "persistenceExecution", "promotionExecution", "rollbackCallbacks", "retryCallbacks", "hydration", "synchronization", "identityResolution", "fuzzyMatching", "graphTraversal", "evaluationEngines", "scores", "grades", "rankings", "projections", "recommendations", "predictions", "schemeFit", "teamFit", "draftValue", "simulatorReady", "draftV3Ready"];
  prohibited.forEach((key) => { const workflowResult = fidApi.createProspectPromotionWorkflow({ workflowId: `w-${variant}-${key}`, cycleRef: "c", intakeCandidateRef: "i", promotionDecisionRef: "d", mode: "DRY_RUN", status: "DRAFT", extensions: { nested: { [key]: "prohibited", workflowLabel: "Safe" } } }); assert(!workflowResult.validation.valid && !Object.hasOwn(workflowResult.extensions.nested, key), `Prohibited extension retained: ${key}.`); });
  const safe = fidApi.createProspectPromotionWorkflow({ workflowId: `safe-${variant}`, cycleRef: "c", intakeCandidateRef: "i", promotionDecisionRef: "d", mode: "DRY_RUN", status: "DRAFT", extensions: { metadata: { workflowPlanDecisionOperation: "harmless descriptive text" } } });
  assert(safe.validation.valid && !/\b(?:Arch|Manning|Sellers|Nussmeier|Allar)\b/i.test(JSON.stringify(result)), "Harmless workflow metadata was rejected or a real prospect fixture was loaded.");
}

function exportCompatibilityChecks() {
  const modules = [[namedSprint22Constants, sprint22Constants], [namedSprint22Contract, sprint22Contract], [namedSprint22Planner, sprint22Planner]];
  const sprint22Names = [...new Set(modules.flatMap(([namedApi]) => Object.keys(namedApi).filter((name) => name !== "default")))];
  const intakeNamed = Object.keys(namedProspectIntakeApi).filter((name) => name !== "default"); const intakeDefaults = Object.keys(prospectIntakeApi);
  const fidNamed = Object.keys(namedFidApi).filter((name) => name !== "default"); const fidDefaults = Object.keys(fidApi);
  assert(modules.every(([namedApi, defaultApi]) => Object.keys(namedApi).filter((name) => name !== "default").every((name) => namedApi[name] === defaultApi[name])) && sprint22Names.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === prospectIntakeApi[name]), "Sprint 22 export identity/reference agreement failed.");
  assert(intakeNamed.length >= 126 + sprint22Names.length && intakeDefaults.length >= 126 + sprint22Names.length && new Set(intakeNamed).size === intakeNamed.length && new Set(intakeDefaults).size === intakeDefaults.length && intakeNamed.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name]), "Prospect Intake additive API is invalid.");
  assert(fidNamed.length >= 397 + sprint22Names.length && fidDefaults.length >= 397 + sprint22Names.length && new Set(fidNamed).size === fidNamed.length && new Set(fidDefaults).size === fidDefaults.length && fidNamed.every((name) => namedFidApi[name] === fidApi[name]), "FID additive API is invalid.");
  assert(!fidDefaults.some((name) => /^run.*Diagnostics$/.test(name)) && !/runProspectPromotionWorkflowDiagnostics/.test(INTAKE_INDEX_SOURCE + FID_INDEX_SOURCE) && !/\.length\s*===\s*(?:443|172)\b/.test(DIAGNOSTIC_SOURCE), "Diagnostic export or exact public export ceiling was introduced.");
}

function priorDiagnosticIntegrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, executiveProfileFoundation: 352, scoutProfile: 320, personnelSpecializationFoundation: 340, footballRelationship: 300, relationshipProfileBoundary: 240, persistenceArchitecture: 340, inMemoryRepository: 400, prospectIntakeArchitecture: 400, prospectWatchlistIdentityIntake: 440, prospectPromotionDecision: 460, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name]?.total === total && context.suiteSummaries[name]?.failed === 0, `${name} prior diagnostics failed.`));
}

const CHECKS = Object.freeze([
  identityVersionChecks, frozenMappingChecks, workflowMinimalFullChecks, unavailableInvalidChecks,
  mutationStabilityNullChecks, noGeneratedInputsChecks, modeStatusChecks, decisionAuthorizationChecks,
  independentPartialTargetChecks, claimAuthorizationChecks, targetProposalActionChecks, noActionNonAuthorizingChecks,
  contractMappingPayloadChecks, missingMetadataErrorChecks, dependencyOrderingChecks, missingExternalSelfDependencyChecks,
  cyclicDependencyChecks, recordIdentityRevisionChecks, persistenceEnvelopeChecks, determinismIdempotencyChecks,
  errorValidationPreconditionChecks, auditTimestampRollbackChecks, repositoryIntakeFidBoundaryChecks,
  evaluationSimulatorExtensionChecks, exportCompatibilityChecks, priorDiagnosticIntegrationChecks,
]);

async function buildContext() {
  const prospectPromotionDecision = await runProspectPromotionDecisionContractDiagnostics();
  return { suiteSummaries: { ...prospectPromotionDecision.suiteSummaries, prospectPromotionDecision } };
}

export async function runProspectPromotionWorkflowDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  CASE_NAMES.forEach((id, index) => {
    const groupIndex = Math.floor(index / 20); const variant = (index % 20) + 1;
    try { CHECKS[groupIndex](groupIndex === 25 ? context : variant); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); }
  });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION, schemaVersion: fidApi.PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectPromotionWorkflowDiagnostics });
