import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import prospectIntakeApi, * as namedProspectIntakeApi from "../prospectIntake/index.js";
import sprint21Constants, * as namedSprint21Constants from "../prospectIntake/prospectPromotionDecisionConstants.js";
import sprint21Contract, * as namedSprint21Contract from "../prospectIntake/ProspectPromotionDecisionContract.js";
import { runProspectWatchlistIdentityIntakeDiagnostics } from "./runProspectWatchlistIdentityIntakeDiagnostics.js";

const SUITE = "ProspectPromotionDecisionContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/prospectPromotionDecisionConstants.js"), "utf8");
const CONTRACT_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectPromotionDecisionContract.js"), "utf8");
const INTAKE_INDEX_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const DIAGNOSTIC_SOURCE = readFileSync(fileURLToPath(import.meta.url), "utf8");
const SPRINT_21_PRODUCTION_SOURCE = [CONSTANTS_SOURCE, CONTRACT_SOURCE].join("\n");

const GROUPS = Object.freeze([
  "identity-versions", "frozen-vocabularies", "decision-minimal-full", "unavailable-invalid-input",
  "mutation-stability-null", "no-generated-declarations", "status-independence", "independent-targets-partial",
  "proposed-actions", "target-conflict-validation", "claim-independence-scopes", "review-boundary",
  "dissent-no-voting", "limitations-blockers", "approval-boundary", "rejection-exclusion-deferral",
  "history-reopening", "version-lifecycle", "research-intake-fid-persistence-boundaries", "workflow-evaluation-simulator-exclusion",
  "extension-safety", "export-compatibility", "prior-diagnostic-integration",
]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from({ length: 20 }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function minimalDecision(variant, overrides = {}) {
  return { decisionId: `promotion-decision-${variant}`, cycleRef: "cycle:fictional:2027", intakeCandidateRef: `intake-candidate-${variant}`, status: "UNDER_REVIEW", ...overrides };
}

function targetDecision(variant, suffix, targetType, decision, overrides = {}) {
  return {
    targetDecisionId: `target-${variant}-${suffix}`, targetType, targetRef: `proposed-${suffix}-${variant}`,
    proposedAction: decision === "DEFERRED" ? "DEFER" : decision === "REJECTED" ? "REJECT" : decision === "EXCLUDED" ? "EXCLUDE" : decision === "NOT_REVIEWED" ? "NO_ACTION" : "CREATE",
    decision, readinessRef: `readiness-${variant}-${suffix}`, promotionPlanTargetRef: `plan-target-${variant}-${suffix}`,
    approvedClaimRefs: [], deferredClaimRefs: [], rejectedClaimRefs: [], excludedClaimRefs: [], unresolvedClaimRefs: [],
    requiredSourceRefs: [], requiredEvidenceRefs: [], blockerRefs: [], reviewerRefs: [`reviewer-${variant}`],
    rationale: "Governance declaration for a future explicit operation.", limitations: ["No promotion execution"], notes: null,
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-09-20T12:00:00Z", notes: null }, ...overrides,
  };
}

function claimDecision(variant, suffix, decision, overrides = {}) {
  return {
    claimDecisionId: `claim-decision-${variant}-${suffix}`, sourceClaimRef: `identity-claim-${variant}-${suffix}`,
    claimType: suffix.toUpperCase(), targetType: suffix === "name" ? "PERSON_PROFILE" : "PLAYER_PROFILE",
    targetField: `proposed.${suffix}`, proposedValueDeclaration: { submittedValue: `Fictional ${suffix} ${variant}`, canonical: false },
    decision, decisionScope: suffix === "name" ? "IDENTITY" : suffix === "school" ? "SCHOOL" : "POSITION",
    sourceRefs: [`source-${variant}-${suffix}`], evidenceRefs: [`evidence-${variant}-${suffix}`], reviewerRefs: [`reviewer-${variant}`],
    rationale: "Independently reviewed workflow declaration.", limitations: ["Not a canonical field"], conflictRefs: [], blockerRefs: [],
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-09-20T12:00:00Z", notes: null }, notes: null, ...overrides,
  };
}

function fullDecision(variant, overrides = {}) {
  const entityTarget = targetDecision(variant, "entity", "FOOTBALL_ENTITY", "APPROVED", { approvedClaimRefs: [`claim-decision-${variant}-name`] });
  const personTarget = targetDecision(variant, "person", "PERSON_PROFILE", "APPROVED", { approvedClaimRefs: [`claim-decision-${variant}-name`] });
  const playerTarget = targetDecision(variant, "player", "PLAYER_PROFILE", "PARTIALLY_APPROVED", { approvedClaimRefs: [`claim-decision-${variant}-position`], deferredClaimRefs: [`claim-decision-${variant}-school`], blockerRefs: [`blocker-${variant}`] });
  const prospectTarget = targetDecision(variant, "prospect", "PROSPECT_PROFILE", "DEFERRED", { deferredClaimRefs: [`claim-decision-${variant}-school`] });
  const relationshipTarget = targetDecision(variant, "relationship", "FOOTBALL_RELATIONSHIP", "NOT_REVIEWED");
  return {
    ...minimalDecision(variant), decisionRevision: 2, workflowRevision: 4, watchlistRefs: [`watchlist-${variant}`],
    watchlistEntryRefs: [`entry-${variant}`], identityIntakeRefs: [`identity-intake-${variant}`], promotionPlanRefs: [`promotion-plan-${variant}`],
    promotionDecisionLabel: `Fictional Promotion Decision ${variant}`, targetDecisions: [entityTarget, personTarget, playerTarget, prospectTarget, relationshipTarget],
    claimDecisions: [claimDecision(variant, "name", "APPROVED"), claimDecision(variant, "position", "APPROVED"), claimDecision(variant, "school", "DEFERRED")],
    reviewRecords: [{ reviewId: `review-${variant}`, reviewType: "FINAL_APPROVAL", reviewerRef: `reviewer-${variant}`, reviewStatus: "COMPLETED", outcome: "PARTIALLY_APPROVED", reviewedAt: "2026-09-21T12:00:00Z", targetDecisionRefs: [`target-${variant}-entity`, `target-${variant}-person`], claimDecisionRefs: [`claim-decision-${variant}-name`], sourceRefs: [], evidenceRefs: [], blockerRefs: [`blocker-${variant}`], findings: ["Partial governance approval"], rationale: "Future promotion remains explicit.", limitations: ["Does not execute promotion"], notes: null, verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-09-21T12:00:00Z", notes: null } }],
    dissentRecords: [{ dissentId: `dissent-${variant}`, reviewerRef: `dissent-reviewer-${variant}`, relatedReviewRef: `review-${variant}`, targetDecisionRefs: [`target-${variant}-player`], claimDecisionRefs: [`claim-decision-${variant}-school`], position: "PARTIAL_AGREEMENT", rationale: "Additional evidence preferred.", sourceRefs: [], evidenceRefs: [], limitations: [], notes: null, recordedAt: "2026-09-22T12:00:00Z" }],
    blockerRefs: [`blocker-${variant}`], limitationRecords: [{ limitationId: `limitation-${variant}`, scope: "PLAYER_PROFILE", description: "School claim remains deferred.", severity: "MODERATE", sourceRefs: [], evidenceRefs: [], blockerRefs: [`blocker-${variant}`], reviewRefs: [`review-${variant}`], status: "ACKNOWLEDGED", notes: null }],
    decisionHistory: [{ historyId: `history-${variant}-created`, priorDecisionRef: null, eventType: "CREATED", fromStatus: null, toStatus: "DRAFT", actorRef: `actor-${variant}`, occurredAt: "2026-09-01T12:00:00Z", reason: "Decision opened.", targetDecisionRefs: [], claimDecisionRefs: [], reviewRefs: [], blockerRefs: [], sourceRefs: [], evidenceRefs: [], notes: null }, { historyId: `history-${variant}-reviewed`, priorDecisionRef: null, eventType: "REVIEW_COMPLETED", fromStatus: "DRAFT", toStatus: "PARTIALLY_APPROVED", actorRef: `actor-${variant}`, occurredAt: "2026-09-21T12:00:00Z", reason: "Review completed without automatic status authority.", targetDecisionRefs: [`target-${variant}-entity`], claimDecisionRefs: [`claim-decision-${variant}-name`], reviewRefs: [`review-${variant}`], blockerRefs: [`blocker-${variant}`], sourceRefs: [], evidenceRefs: [], notes: null }],
    sourceRefs: [`source-${variant}`], researchSourceRefs: [`research-source-${variant}`], researchSessionRefs: [`research-session-${variant}`],
    recordedObservationRefs: [`recorded-observation-${variant}`], analyticalObservationRefs: [`analytical-observation-${variant}`],
    evidenceArtifactRefs: [`artifact-${variant}`], evidenceRefs: [`evidence-${variant}`],
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-09-22T12:00:00Z", notes: null },
    provenance: { createdBy: `author-${variant}`, createdAt: "2026-09-01T12:00:00Z", updatedBy: `author-${variant}`, updatedAt: "2026-09-22T12:00:00Z" },
    lifecycle: { state: "OPEN", openedAt: "2026-09-01T12:00:00Z", closedAt: null, archivedAt: null, priorDecisionRef: null, replacementDecisionRef: null },
    notes: "Governance only; no promotion execution.", extensions: { governance: { decisionLane: "partial-promotion", reviewLabel: "human-review" } }, ...overrides,
  };
}

function identityVersionChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(minimalDecision(variant));
  assert(result.contract === fidApi.PROSPECT_PROMOTION_DECISION_CONTRACT_NAME && result.contractVersion === fidApi.PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION && result.schemaVersion === fidApi.PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION, "Promotion Decision identity/version mismatch.");
  assert(result.validation.valid && fidApi.isProspectPromotionDecision(result), "Promotion Decision type guard rejected a valid result.");
}

function frozenVocabularyChecks() {
  const vocabularies = [fidApi.PROSPECT_PROMOTION_DECISION_STATUSES, fidApi.PROSPECT_PROMOTION_TARGET_TYPES, fidApi.PROSPECT_PROMOTION_TARGET_DECISIONS, fidApi.PROSPECT_PROMOTION_PROPOSED_ACTIONS, fidApi.PROSPECT_PROMOTION_CLAIM_DECISIONS, fidApi.PROSPECT_PROMOTION_CLAIM_SCOPES, fidApi.PROSPECT_PROMOTION_REVIEW_TYPES, fidApi.PROSPECT_PROMOTION_REVIEW_STATUSES, fidApi.PROSPECT_PROMOTION_REVIEW_OUTCOMES, fidApi.PROSPECT_PROMOTION_DISSENT_POSITIONS, fidApi.PROSPECT_PROMOTION_LIMITATION_SEVERITIES, fidApi.PROSPECT_PROMOTION_LIMITATION_STATUSES, fidApi.PROSPECT_PROMOTION_HISTORY_EVENTS, fidApi.PROSPECT_PROMOTION_VERIFICATION_STATES, fidApi.PROSPECT_PROMOTION_LIFECYCLE_STATES];
  assert(vocabularies.every((value) => Object.isFrozen(value) && Object.keys(value).length > 0 && new Set(Object.values(value)).size === Object.values(value).length), "Promotion Decision vocabulary is not frozen or unique.");
  assert(!Object.values(fidApi.PROSPECT_PROMOTION_TARGET_TYPES).some((value) => /COACH|EXECUTIVE|SCOUT|TEAM|ORGANIZATION/.test(value)), "Prohibited active target type entered Sprint 21.");
}

function decisionMinimalFullChecks(variant) {
  const minimal = fidApi.createProspectPromotionDecision(minimalDecision(variant)); const full = fidApi.createProspectPromotionDecision(fullDecision(variant));
  assert(minimal.validation.valid && full.validation.valid && minimal.targetDecisions.length === 0 && full.targetDecisions.length === 5 && full.claimDecisions.length === 3, "Minimal/full Promotion Decision normalization failed.");
  assert(!Object.hasOwn(full, "footballEntity") && !Object.hasOwn(full, "persistenceEnvelope") && !Object.hasOwn(full, "evaluation"), "Promotion Decision embedded an excluded record.");
}

function unavailableInvalidChecks(variant) {
  [null, [], `invalid-${variant}`, variant, true].forEach((input) => assert(!fidApi.validateProspectPromotionDecision(input).valid, "Promotion Decision validator accepted invalid ordinary input."));
  const unavailable = fidApi.createUnavailableProspectPromotionDecision({ reason: "Unavailable" });
  assert(!unavailable.validation.valid && unavailable.targetDecisions.length === 0 && unavailable.claimDecisions.length === 0 && unavailable.reviewRecords.length === 0, "Unavailable decision invented governance declarations.");
}

function mutationStabilityNullChecks(variant) {
  const input = fullDecision(variant, { promotionDecisionLabel: null }); const before = clone(input); const result = fidApi.createProspectPromotionDecision(input);
  assert(JSON.stringify(input) === JSON.stringify(before), "Promotion Decision factory mutated input.");
  assert(JSON.stringify(fidApi.createProspectPromotionDecision(result)) === JSON.stringify(result), "Promotion Decision repeated normalization is unstable.");
  assert(result.promotionDecisionLabel === null && result.lifecycle.closedAt === null && result.targetDecisions[0].notes === null, "Explicit null was not preserved.");
}

function noGeneratedChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(minimalDecision(variant)); const emptyTarget = fidApi.createProspectPromotionTargetDecision({});
  assert(result.decisionRevision === null && result.workflowRevision === null && result.targetDecisions.length === 0 && result.claimDecisions.length === 0 && result.reviewRecords.length === 0 && result.dissentRecords.length === 0 && result.blockerRefs.length === 0 && result.evidenceRefs.length === 0, "Promotion Decision factory generated revisions or declarations.");
  assert(emptyTarget.targetDecisionId === null && emptyTarget.targetType === null && emptyTarget.decision === null && emptyTarget.proposedAction === null && emptyTarget.targetRef === null, "Target factory generated identity, decision, action, or FID reference.");
}

function statusIndependenceChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant, { status: "UNDER_REVIEW" }));
  assert(result.validation.valid && result.status === "UNDER_REVIEW" && result.targetDecisions.some((entry) => entry.decision === "APPROVED") && result.targetDecisions.some((entry) => entry.decision === "DEFERRED"), "Overall status was calculated from target decisions.");
  const noTargets = fidApi.createProspectPromotionDecision(minimalDecision(`${variant}-approved`, { status: "APPROVED" })); assert(noTargets.status === "APPROVED" && noTargets.targetDecisions.length === 0, "Status requires calculated target state.");
}

function independentTargetChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant)); const decisions = Object.fromEntries(result.targetDecisions.map((entry) => [entry.targetType, entry.decision]));
  assert(decisions.FOOTBALL_ENTITY === "APPROVED" && decisions.PERSON_PROFILE === "APPROVED" && decisions.PLAYER_PROFILE === "PARTIALLY_APPROVED" && decisions.PROSPECT_PROFILE === "DEFERRED" && decisions.FOOTBALL_RELATIONSHIP === "NOT_REVIEWED", "Independent partial target decisions failed.");
  assert(result.status === "UNDER_REVIEW", "Target counts calculated overall status.");
}

function proposedActionChecks(variant) {
  const approved = fidApi.createProspectPromotionTargetDecision(targetDecision(variant, "entity", "FOOTBALL_ENTITY", "APPROVED")); const deferred = fidApi.createProspectPromotionTargetDecision(targetDecision(variant, "prospect", "PROSPECT_PROFILE", "DEFERRED"));
  assert(approved.proposedAction === "CREATE" && deferred.proposedAction === "DEFER" && !Object.hasOwn(approved, "createdRecord") && !Object.hasOwn(approved, "persistenceId"), "Proposed action executed or generated a record.");
  assert(!fidApi.validateProspectPromotionTargetDecision(targetDecision(variant, "team", "TEAM_PROFILE", "APPROVED")).valid, "Prohibited active promotion target was accepted.");
}

function targetConflictChecks(variant) {
  const conflict = targetDecision(variant, "player", "PLAYER_PROFILE", "PARTIALLY_APPROVED", { approvedClaimRefs: [`claim-${variant}`], rejectedClaimRefs: [`claim-${variant}`] });
  const result = fidApi.createProspectPromotionTargetDecision(conflict);
  assert(!result.validation.valid && result.validation.errors.some((entry) => entry.code === "CONTRADICTORY_LOCAL_CLAIM_REFERENCE"), "Contradictory target claim declaration was accepted.");
  const duplicate = fidApi.createProspectPromotionDecision(fullDecision(variant, { targetDecisions: [targetDecision(variant, "entity", "FOOTBALL_ENTITY", "APPROVED"), targetDecision(variant, "entity", "PERSON_PROFILE", "APPROVED")] }));
  assert(!duplicate.validation.valid, "Duplicate target-decision ID was accepted.");
}

function claimIndependenceScopeChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant)); const decisions = Object.fromEntries(result.claimDecisions.map((entry) => [entry.decisionScope, entry.decision]));
  assert(decisions.IDENTITY === "APPROVED" && decisions.POSITION === "APPROVED" && decisions.SCHOOL === "DEFERRED", "Claim decisions were coupled.");
  assert(result.targetDecisions.find((entry) => entry.targetType === "PLAYER_PROFILE").decision === "PARTIALLY_APPROVED", "Claim counts calculated a target decision.");
  assert(!Object.hasOwn(result.claimDecisions[0], "canonicalValue") && result.claimDecisions[0].proposedValueDeclaration.canonical === false, "Claim declaration became a canonical payload.");
}

function reviewBoundaryChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant)); const review = result.reviewRecords[0];
  assert(review.reviewType === "FINAL_APPROVAL" && review.reviewStatus === "COMPLETED" && result.status === "UNDER_REVIEW", "Completed review changed decision status automatically.");
  assert(!Object.hasOwn(review, "authorityLevel") && !Object.hasOwn(review, "executedPromotion") && !Object.hasOwn(result, "authentication"), "Review introduced authority hierarchy or promotion execution.");
}

function dissentNoVotingChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant)); const dissent = result.dissentRecords[0];
  assert(dissent.position === "PARTIAL_AGREEMENT" && result.status === "UNDER_REVIEW", "Dissent changed decision status.");
  assert(!Object.hasOwn(result, "voteTotal") && !Object.hasOwn(result, "majority") && !Object.hasOwn(result, "authoritativeReviewer"), "Dissent calculated votes or authority.");
}

function limitationsBlockersChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant)); const limitation = result.limitationRecords[0];
  assert(result.blockerRefs.length === 1 && limitation.status === "ACKNOWLEDGED" && result.status === "UNDER_REVIEW", "Blocker or limitation calculated overall status.");
  assert(result.targetDecisions.find((entry) => entry.targetType === "PLAYER_PROFILE").decision === "PARTIALLY_APPROVED", "Unresolved blocker prevented explicit partial approval.");
  assert(!Object.hasOwn(limitation, "confidenceReduction") && !Object.hasOwn(limitation, "automaticDeferral"), "Limitation introduced automatic consequence.");
}

function approvalBoundaryChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant));
  assert(result.targetDecisions[0].decision === "APPROVED" && result.targetDecisions[0].limitations.length > 0, "Approval could not retain limitations.");
  const excluded = ["createdRecord", "footballEntity", "personProfile", "playerProfile", "prospectProfile", "persistenceEnvelope", "canonicalId", "repositoryResult", "simulatorRegistration"];
  assert(excluded.every((key) => !Object.hasOwn(result, key)), "Approval created a record, ID, persistence result, or simulator registration.");
}

function rejectionExclusionDeferralChecks(variant) {
  const decisions = ["REJECTED", "EXCLUDED", "DEFERRED"].map((decision) => fidApi.createProspectPromotionClaimDecision(claimDecision(variant, decision.toLowerCase(), decision)));
  assert(decisions.every((entry) => entry.validation.valid) && new Set(decisions.map((entry) => entry.decision)).size === 3, "Rejection, exclusion, and deferral were collapsed.");
  assert(decisions.every((entry) => !Object.hasOwn(entry, "deletedResearch") && !Object.hasOwn(entry, "deletedIntake") && !Object.hasOwn(entry, "prospectQuality")), "Claim disposition deleted records or inferred prospect quality.");
}

function historyReopeningChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant, { status: "UNDER_REVIEW", decisionHistory: [...fullDecision(variant).decisionHistory, { historyId: `history-${variant}-reopened`, priorDecisionRef: `prior-decision-${variant}`, eventType: "REOPENED", fromStatus: "DEFERRED", toStatus: "UNDER_REVIEW", actorRef: `actor-${variant}`, occurredAt: "2026-10-01T12:00:00Z", reason: "Additional review requested.", targetDecisionRefs: [], claimDecisionRefs: [], reviewRefs: [], blockerRefs: [], sourceRefs: [], evidenceRefs: [], notes: null }] }));
  assert(result.validation.valid && result.decisionHistory.at(-1).eventType === "REOPENED" && result.status === "UNDER_REVIEW", "Explicit reopening history failed.");
  const latestApproved = fidApi.createProspectPromotionDecision(fullDecision(variant, { status: "DRAFT" })); assert(latestApproved.decisionHistory.at(-1).toStatus === "PARTIALLY_APPROVED" && latestApproved.status === "DRAFT", "Latest history event became authoritative.");
}

function versionLifecycleChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant));
  assert(result.contractVersion !== String(result.decisionRevision) && result.schemaVersion !== String(result.workflowRevision) && result.decisionRevision === 2 && result.workflowRevision === 4, "Version concepts were collapsed.");
  assert(!fidApi.validateProspectPromotionDecision(fullDecision(variant, { lifecycle: { priorDecisionRef: `promotion-decision-${variant}` } })).valid, "Self predecessor was accepted.");
  assert(!fidApi.validateProspectPromotionDecision(fullDecision(variant, { lifecycle: { openedAt: "2026-10-01", closedAt: "2026-09-01" } })).valid, "Invalid lifecycle date ordering was accepted.");
}

function repositoryBoundaryChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant));
  assert(result.researchSourceRefs.length === 1 && result.identityIntakeRefs.length === 1 && result.promotionPlanRefs.length === 1, "Unresolved governance references were not preserved.");
  const imports = [...SPRINT_21_PRODUCTION_SOURCE.matchAll(/(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  const barrelImports = [...INTAKE_INDEX_SOURCE.matchAll(/(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  assert(imports.every((entry) => entry === "./prospectPromotionDecisionConstants.js"), "Sprint 21 production has a prohibited dependency.");
  assert(!imports.some((entry) => /researchRepository|contracts[/\\]|persistence|repository|supabase|database|registry|resolver|engine|draftV3|components|pages|router|routes/i.test(entry)), "Promotion Decision imports a prohibited runtime boundary.");
  assert(barrelImports.every((entry) => entry.startsWith("./") && !/diagnostics|researchRepository|persistence|supabase|database|components|pages|router|routes/i.test(entry)), "Shared Prospect Intake barrel introduced prohibited external infrastructure.");
}

function workflowEvaluationSimulatorChecks(variant) {
  const result = fidApi.createProspectPromotionDecision(fullDecision(variant));
  const prohibitedOperations = /\b(?:createVersion|getByPersistenceId|getLatestByRecordId|queryRecords|dispatchPromotion|executePromotion|rollback|synchronize|fetch|XMLHttpRequest|axios)\s*\(/;
  assert(!prohibitedOperations.test(SPRINT_21_PRODUCTION_SOURCE), "Promotion workflow, repository, or external-source operation entered Sprint 21.");
  const prohibitedOutputs = ["score", "grade", "rating", "ranking", "projection", "expectedRound", "draftRange", "athleticScore", "productionScore", "footballIQScore", "schemeFit", "teamFit", "draftValue", "positionalValue", "recommendation", "prediction", "decisionQuality", "prospectQuality", "simulatorReadiness"];
  assert(prohibitedOutputs.every((key) => !Object.hasOwn(result, key)), "Evaluation, intelligence, or simulator output entered Promotion Decision.");
  assert(result.cycleRef === "cycle:fictional:2027" && !/\b(?:Arch|Manning|Sellers|Nussmeier|Allar)\b/i.test(JSON.stringify(result)), "Real 2027 prospect fixture entered Sprint 21.");
}

function extensionSafetyChecks(variant) {
  const prohibited = ["score", "scores", "grade", "grades", "rating", "ratings", "ranking", "rankings", "evaluation", "evaluations", "recommendation", "recommendations", "projection", "projections", "prediction", "predictions", "expectedRound", "draftRange", "schemeFit", "teamFit", "draftValue", "positionalValue", "simulatorReady", "draftV3Ready", "repositoryOperations", "promotionExecutionFunctions", "apiClient", "databaseClient", "supabaseClient", "credentials", "apiKey", "sql", "hydrationFunctions", "synchronizationFunctions", "identityResolutionFunctions", "graphTraversalFunctions", "engineFunctions"];
  prohibited.forEach((key) => { const result = fidApi.createProspectPromotionDecision(minimalDecision(`${variant}-${key}`, { extensions: { nested: { [key]: "prohibited", governanceLabel: "Safe" } } })); assert(!result.validation.valid && !Object.hasOwn(result.extensions.nested, key) && result.extensions.nested.governanceLabel === "Safe", `Prohibited Sprint 21 extension retained: ${key}.`); });
  const safe = fidApi.createProspectPromotionDecision(minimalDecision(variant, { extensions: { governance: { decisionLabel: "Promotion decision review metadata", promotionQueue: "human review" } } }));
  assert(safe.validation.valid && safe.extensions.governance.decisionLabel.includes("decision"), "Harmless governance decision metadata was rejected.");
}

function exportCompatibilityChecks() {
  const modules = [[namedSprint21Constants, sprint21Constants], [namedSprint21Contract, sprint21Contract]];
  const sprint21Names = modules.flatMap(([namedApi]) => Object.keys(namedApi).filter((name) => name !== "default"));
  const intakeNamed = Object.keys(namedProspectIntakeApi).filter((name) => name !== "default"); const intakeDefaults = Object.keys(prospectIntakeApi);
  const fidNamed = Object.keys(namedFidApi).filter((name) => name !== "default"); const fidDefaults = Object.keys(fidApi);
  assert(sprint21Names.length === 34 && new Set(sprint21Names).size === sprint21Names.length && modules.every(([namedApi, defaultApi]) => Object.keys(namedApi).filter((name) => name !== "default").every((name) => namedApi[name] === defaultApi[name])), "Sprint 21 source exports disagree or collide.");
  assert(sprint21Names.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === prospectIntakeApi[name]), "Sprint 21 export is missing or reference-incompatible.");
  assert(intakeNamed.length >= 92 + sprint21Names.length && intakeDefaults.length >= 92 + sprint21Names.length && new Set(intakeNamed).size === intakeNamed.length && new Set(intakeDefaults).size === intakeDefaults.length && intakeNamed.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name]), "Prospect Intake additive API is invalid.");
  assert(fidNamed.length >= 363 + sprint21Names.length && fidDefaults.length >= 363 + sprint21Names.length && new Set(fidNamed).size === fidNamed.length && new Set(fidDefaults).size === fidDefaults.length && fidNamed.every((name) => namedFidApi[name] === fidApi[name]), "FID additive API is invalid.");
  assert(!fidDefaults.some((name) => /^run.*Diagnostics$/.test(name)) && !/runProspectPromotionDecisionContractDiagnostics/.test(INTAKE_INDEX_SOURCE + FID_INDEX_SOURCE) && !/\.length\s*===\s*(?:397|126)\b/.test(DIAGNOSTIC_SOURCE), "Diagnostic export or exact public export ceiling was introduced.");
}

function priorDiagnosticIntegrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, executiveProfileFoundation: 352, scoutProfile: 320, personnelSpecializationFoundation: 340, footballRelationship: 300, relationshipProfileBoundary: 240, persistenceArchitecture: 340, inMemoryRepository: 400, prospectIntakeArchitecture: 400, prospectWatchlistIdentityIntake: 440, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name]?.total === total && context.suiteSummaries[name]?.failed === 0, `${name} prior diagnostics failed.`));
}

const CHECKS = Object.freeze([
  identityVersionChecks, frozenVocabularyChecks, decisionMinimalFullChecks, unavailableInvalidChecks,
  mutationStabilityNullChecks, noGeneratedChecks, statusIndependenceChecks, independentTargetChecks,
  proposedActionChecks, targetConflictChecks, claimIndependenceScopeChecks, reviewBoundaryChecks,
  dissentNoVotingChecks, limitationsBlockersChecks, approvalBoundaryChecks, rejectionExclusionDeferralChecks,
  historyReopeningChecks, versionLifecycleChecks, repositoryBoundaryChecks, workflowEvaluationSimulatorChecks,
  extensionSafetyChecks, exportCompatibilityChecks, priorDiagnosticIntegrationChecks,
]);

async function buildContext() {
  const prospectWatchlistIdentityIntake = await runProspectWatchlistIdentityIntakeDiagnostics();
  return { suiteSummaries: { ...prospectWatchlistIdentityIntake.suiteSummaries, prospectWatchlistIdentityIntake } };
}

export async function runProspectPromotionDecisionContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  CASE_NAMES.forEach((id, index) => {
    const groupIndex = Math.floor(index / 20); const variant = (index % 20) + 1;
    try { CHECKS[groupIndex](groupIndex === 22 ? context : variant); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); }
  });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION, schemaVersion: fidApi.PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectPromotionDecisionContractDiagnostics });
