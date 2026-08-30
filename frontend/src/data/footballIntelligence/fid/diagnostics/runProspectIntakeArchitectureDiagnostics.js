import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import prospectIntakeApi, * as namedProspectIntakeApi from "../prospectIntake/index.js";
import sprint19ArchitectureApi, * as namedSprint19ArchitectureApi from "../prospectIntake/ProspectIntakeArchitectureSpecification.js";
import sprint19CandidateConstants, * as namedSprint19CandidateConstants from "../prospectIntake/prospectIntakeCandidateConstants.js";
import sprint19CandidateContract, * as namedSprint19CandidateContract from "../prospectIntake/ProspectIntakeCandidateContract.js";
import sprint20WatchlistConstants, * as namedSprint20WatchlistConstants from "../prospectIntake/prospectWatchlistConstants.js";
import sprint20WatchlistApi, * as namedSprint20WatchlistApi from "../prospectIntake/ProspectWatchlistContract.js";
import sprint20IdentityIntakeApi, * as namedSprint20IdentityIntakeApi from "../prospectIntake/ProspectIdentityIntakeContract.js";
import { runFidPersistenceArchitectureDiagnostics } from "./runFidPersistenceArchitectureDiagnostics.js";
import { runInMemoryFidPersistenceRepositoryDiagnostics } from "./runInMemoryFidPersistenceRepositoryDiagnostics.js";
import { runResearchSourceContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSourceContractDiagnostics.js";
import { runResearchSessionContractDiagnostics } from "../../../researchRepository/diagnostics/runResearchSessionContractDiagnostics.js";
import { runRecordedObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runRecordedObservationContractDiagnostics.js";
import { runAnalyticalObservationContractDiagnostics } from "../../../researchRepository/diagnostics/runAnalyticalObservationContractDiagnostics.js";
import { runEvidenceArtifactContractDiagnostics } from "../../../researchRepository/diagnostics/runEvidenceArtifactContractDiagnostics.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchRepositoryPersistenceDiagnostics } from "../../../researchRepository/diagnostics/runResearchRepositoryPersistenceDiagnostics.js";
import { runSupabaseResearchRepositoryAdapterDiagnostics } from "../../../researchRepository/diagnostics/runSupabaseResearchRepositoryAdapterDiagnostics.js";

const SUITE = "ProspectIntakeArchitectureDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPECIFICATION_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectIntakeArchitectureSpecification.js"), "utf8");
const CANDIDATE_CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/prospectIntakeCandidateConstants.js"), "utf8");
const CANDIDATE_CONTRACT_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectIntakeCandidateContract.js"), "utf8");
const INTAKE_INDEX_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const FACTUAL_CONTRACT_SOURCES = [
  "FootballEntityContract.js", "PersonProfileContract.js", "PlayerProfileContract.js", "ProspectProfileContract.js",
  "CoachProfileContract.js", "ExecutiveProfileContract.js", "ScoutProfileContract.js", "OrganizationProfileContract.js",
  "TeamProfileContract.js", "FootballRelationshipContract.js",
].map((file) => readFileSync(resolve(ROOT, "contracts", file), "utf8"));
const GROUPS = Object.freeze([
  "architecture-identity", "architecture-policy", "candidate-minimal-full", "invalid-input-tolerance",
  "mutation-stability-null", "stage-status-independence", "nonlinear-transitions", "cycle-discovery-boundary",
  "identity-review-boundary", "research-plan-boundary", "evidence-sufficiency", "human-review-boundary",
  "blocker-history", "scope-readiness", "promotion-partial-boundary", "version-history",
  "repository-fid-research-evaluation-boundaries", "fictional-2027-compatibility", "extension-safety",
  "exports-dependencies-baselines",
]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from(
  { length: 20 },
  (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`
)));

function assert(condition, message, details = null) {
  if (!condition) {
    const failure = new Error(message);
    failure.details = details;
    throw failure;
  }
}

function imports(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

const sprint19ProspectIntakeApi = Object.freeze({ ...sprint19ArchitectureApi, ...sprint19CandidateConstants, ...sprint19CandidateContract });
const namedSprint19ProspectIntakeApi = Object.freeze({ ...namedSprint19ArchitectureApi, ...namedSprint19CandidateConstants, ...namedSprint19CandidateContract });

function minimalCandidate(suffix = "1", overrides = {}) {
  return {
    intakeId: `intake-${suffix}`,
    cycleRef: `draft-cycle-${suffix}`,
    stage: "DISCOVERED",
    status: "OPEN",
    ...overrides,
  };
}

function fullCandidate(suffix = "1", overrides = {}) {
  return minimalCandidate(suffix, {
    candidateRef: `candidate-${suffix}`,
    candidateLabel: `Fictional Candidate ${suffix}`,
    stage: "EVIDENCE_REVIEW",
    status: "BLOCKED",
    discoveryContext: { origin: "NATIONAL_WATCHLIST", discoveredAt: "2026-08-01", submittedLabel: `Fictional Candidate ${suffix}`, submittedSchool: "Example University", submittedPosition: "QB", submittedClass: "Junior", sourceRefs: [`research-source-${suffix}`], notes: null },
    identityReview: { reviewId: `identity-${suffix}`, outcome: "CONFLICTED", reviewerRef: `reviewer-${suffix}`, reviewedAt: "2026-08-02", candidateName: `Fictional Candidate ${suffix}`, aliases: [], school: "Example University", position: "QB", classYear: 2027, duplicateCandidateConcern: true, sourceRefs: [`research-source-${suffix}`], evidenceRefs: [`identity-evidence-${suffix}`], conflicts: ["Same-name concern"], verification: { state: "REVIEWED", reviewedBy: `reviewer-${suffix}`, reviewedAt: "2026-08-02" } },
    researchPlan: { planId: `research-plan-${suffix}`, requiredCategories: ["IDENTITY", "ROSTER", "ELIGIBILITY"], optionalCategories: ["MEASUREMENTS"], unavailableCategories: ["ATHLETIC_TESTING"], deferredCategories: ["DECLARATION"], assignedReviewerRefs: [`reviewer-${suffix}`], sourceRequirements: ["Independent corroboration requested"], completionDeclared: false, blockerRefs: [`blocker-${suffix}`], notes: null },
    researchSourceRefs: [`research-source-${suffix}`], researchSessionRefs: [`research-session-${suffix}`], recordedObservationRefs: [`recorded-observation-${suffix}`], analyticalObservationRefs: [`analytical-observation-${suffix}`], evidenceArtifactRefs: [`evidence-artifact-${suffix}`], identityEvidenceRefs: [`identity-evidence-${suffix}`], playerEvidenceRefs: [], prospectEvidenceRefs: [], eligibilityEvidenceRefs: [], declarationEvidenceRefs: [], schoolEvidenceRefs: [`school-evidence-${suffix}`], positionEvidenceRefs: [`position-evidence-${suffix}`], measurementEvidenceRefs: [], productionEvidenceRefs: [], recognitionEvidenceRefs: [], scoutingEvidenceRefs: [],
    evidenceSufficiencyDeclarations: [{ declarationId: `sufficiency-${suffix}`, scope: "IDENTITY", state: "PARTIAL", reviewerRef: `reviewer-${suffix}`, reviewedAt: "2026-08-03", sourceRefs: [`research-source-${suffix}`], evidenceRefs: [`identity-evidence-${suffix}`], rationale: "Human declaration", limitations: ["Conflicting identity evidence"], unresolvedConflicts: ["Same-name concern"], verification: { state: "REVIEWED" } }],
    blockerRecords: [{ blockerId: `blocker-${suffix}`, blockerType: "IDENTITY_CONFLICT", status: "OPEN", openedAt: "2026-08-02", openedByRef: `reviewer-${suffix}`, reason: "Identity evidence conflicts", sourceRefs: [`research-source-${suffix}`], evidenceRefs: [`identity-evidence-${suffix}`] }],
    reviewRecords: [{ reviewId: `review-${suffix}`, reviewType: "EVIDENCE_REVIEW", reviewerRef: `reviewer-${suffix}`, status: "COMPLETED", outcome: "CONFLICTED", reviewedAt: "2026-08-03", sourceRefs: [`research-source-${suffix}`], evidenceRefs: [`identity-evidence-${suffix}`], blockerRefs: [`blocker-${suffix}`], findings: ["Additional identity research required"] }],
    readinessDeclaration: [
      { declarationId: `readiness-entity-${suffix}`, scope: "FOOTBALL_ENTITY", state: "READY_FOR_ENTITY_PROMOTION", reviewerRef: `reviewer-${suffix}`, reviewedAt: "2026-08-04", evidenceRefs: [`identity-evidence-${suffix}`] },
      { declarationId: `readiness-prospect-${suffix}`, scope: "PROSPECT_PROFILE", state: "BLOCKED", reviewerRef: `reviewer-${suffix}`, reviewedAt: "2026-08-04", blockerRefs: [`blocker-${suffix}`] },
    ],
    promotionPlan: { planId: `promotion-plan-${suffix}`, createdByRef: `reviewer-${suffix}`, createdAt: "2026-08-04", targets: [
      { targetId: `target-entity-${suffix}`, targetType: "FOOTBALL_ENTITY", targetRef: `proposed-entity-${suffix}`, readinessState: "READY_FOR_ENTITY_PROMOTION", requiredEvidenceRefs: [`identity-evidence-${suffix}`], proposedAction: "CREATE", reviewStatus: "COMPLETED" },
      { targetId: `target-person-${suffix}`, targetType: "PERSON_PROFILE", targetRef: `proposed-person-${suffix}`, readinessState: "READY_FOR_PERSON_PROMOTION", proposedAction: "CREATE", reviewStatus: "COMPLETED" },
      { targetId: `target-player-${suffix}`, targetType: "PLAYER_PROFILE", readinessState: "DEFERRED", proposedAction: "DEFER", reviewStatus: "DEFERRED" },
      { targetId: `target-prospect-${suffix}`, targetType: "PROSPECT_PROFILE", readinessState: "BLOCKED", blockerRefs: [`blocker-${suffix}`], proposedAction: "NO_ACTION", reviewStatus: "BLOCKED" },
      { targetId: `target-relationship-${suffix}`, targetType: "FOOTBALL_RELATIONSHIP", readinessState: "NOT_ASSESSED", proposedAction: "NO_ACTION", reviewStatus: "NOT_STARTED" },
    ] },
    promotionDecisionRefs: [], proposedEntityRef: `proposed-entity-${suffix}`, proposedPersonProfileRef: `proposed-person-${suffix}`, proposedPlayerProfileRef: null, proposedProspectProfileRef: null, proposedRelationshipRefs: [],
    workflowHistory: [
      { transitionId: `transition-discovery-${suffix}`, fromStage: null, toStage: "DISCOVERED", fromStatus: null, toStatus: "OPEN", reason: "Human submission", actorRef: `reviewer-${suffix}`, occurredAt: "2026-08-01" },
      { transitionId: `transition-review-${suffix}`, fromStage: "DISCOVERED", toStage: "IDENTITY_REVIEW", fromStatus: "OPEN", toStatus: "IN_REVIEW", actorRef: `reviewer-${suffix}`, occurredAt: "2026-08-02" },
      { transitionId: `transition-back-${suffix}`, fromStage: "EVIDENCE_REVIEW", toStage: "RESEARCH_COLLECTION", fromStatus: "BLOCKED", toStatus: "OPEN", reason: "Additional research", actorRef: `reviewer-${suffix}`, occurredAt: "2026-08-04" },
    ],
    sourceRefs: [`research-source-${suffix}`], evidenceRefs: [`identity-evidence-${suffix}`], verification: { state: "REVIEWED", reviewedBy: `reviewer-${suffix}`, reviewedAt: "2026-08-04" }, provenance: { createdBy: `reviewer-${suffix}`, createdAt: "2026-08-01", updatedBy: `reviewer-${suffix}`, updatedAt: "2026-08-04" }, lifecycle: { state: "OPEN", openedAt: "2026-08-01", closedAt: null, archivedAt: null, replacesIntakeRef: null, replacedByIntakeRef: null }, version: 1, workflowRevision: 3, notes: null, extensions: { workflow: { descriptiveLabel: "Fictional diagnostic candidate", labels: [] } },
    ...overrides,
  });
}

function architectureIdentityChecks() {
  const architecture = fidApi.createProspectIntakeArchitectureSpecification();
  assert(architecture.validation.valid && fidApi.isProspectIntakeArchitectureSpecification(architecture), "Valid architecture specification rejected.");
  assert(architecture.contract === fidApi.PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME && architecture.contractVersion === fidApi.PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION && architecture.schemaVersion === fidApi.PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION, "Architecture identity or versions changed.");
  [fidApi.PROSPECT_INTAKE_STAGES, fidApi.PROSPECT_INTAKE_STATUSES, fidApi.PROSPECT_INTAKE_DISCOVERY_ORIGINS, fidApi.PROSPECT_INTAKE_IDENTITY_OUTCOMES, fidApi.PROSPECT_INTAKE_RESEARCH_CATEGORIES, fidApi.PROSPECT_INTAKE_EVIDENCE_STATES, fidApi.PROSPECT_INTAKE_BLOCKER_TYPES, fidApi.PROSPECT_INTAKE_READINESS_STATES, fidApi.PROSPECT_INTAKE_PROMOTION_TARGET_TYPES].forEach((value) => assert(Object.isFrozen(value), "Prospect Intake vocabulary is mutable."));
  assert(!fidApi.validateProspectIntakeArchitectureSpecification({ contract: "Wrong" }).valid && !fidApi.isProspectIntakeArchitectureSpecification(null), "Architecture identity validation failed.");
}

function architecturePolicyChecks() {
  const architecture = fidApi.createProspectIntakeArchitectureSpecification({ metadata: { tags: ["architecture"], notes: null } });
  assert(!architecture.transitionPolicy.linearProgressionRequired && architecture.transitionPolicy.backwardMovementAllowed && !architecture.transitionPolicy.inferredFromEvidenceCounts, "Non-linear explicit transition policy changed.");
  assert(!architecture.reviewPolicy.reviewAutomaticallyTransitions && !architecture.reviewPolicy.evidenceSufficiencyCalculated, "Review or sufficiency inference entered architecture.");
  assert(architecture.promotionPolicy.partialPromotionSupported && !architecture.promotionPolicy.approvalCreatesRecords && !architecture.promotionPolicy.approvalPersistsRecords && !architecture.promotionPolicy.approvalTriggersEvaluation && !architecture.promotionPolicy.approvalImpliesSimulatorReadiness, "Promotion boundary changed.");
  assert(architecture.separationModel.researchRepositoryOwnsResearch && architecture.separationModel.fidContractsOwnCanonicalFacts && architecture.separationModel.intakeOwnsWorkflowDeclarationsOnly, "Ownership separation changed.");
  assert(!architecture.separationModel.persistenceImplemented && !architecture.separationModel.evaluationImplemented && !architecture.separationModel.simulatorLoadingImplemented, "Executable runtime entered architecture.");
}

function candidateMinimalFullChecks(variant) {
  const minimal = fidApi.createProspectIntakeCandidate(minimalCandidate(`minimal-${variant}`));
  const full = fidApi.createProspectIntakeCandidate(fullCandidate(`full-${variant}`));
  assert(minimal.validation.valid && fidApi.isProspectIntakeCandidate(minimal), "Minimal intake candidate rejected.");
  assert(full.validation.valid && fidApi.isProspectIntakeCandidate(full), "Full intake candidate rejected.");
  assert(minimal.candidateRef === null && minimal.discoveryContext === null && minimal.identityReview === null && minimal.promotionPlan === null && minimal.readinessDeclaration.length === 0, "Minimal candidate invented workflow declarations.");
  assert(full.contract === fidApi.PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME && full.workflowHistory.length === 3 && full.promotionPlan.targets.length === 5, "Full candidate shape changed.");
}

function invalidInputToleranceChecks() {
  const factories = [fidApi.createProspectIntakeArchitectureSpecification, fidApi.createProspectIntakeCandidate, fidApi.createProspectIntakeIdentityReview, fidApi.createProspectIntakeResearchPlan, fidApi.createProspectIntakeEvidenceSufficiency, fidApi.createProspectIntakeReviewRecord, fidApi.createProspectIntakeBlockerRecord, fidApi.createProspectIntakeReadinessDeclaration, fidApi.createProspectIntakePromotionPlan, fidApi.createProspectIntakeWorkflowTransition];
  [null, [], "invalid", 7, true].forEach((input) => factories.forEach((factory) => { const result = factory(input); assert(result?.validation?.valid === false && Array.isArray(result.validation.errors), "Factory threw or accepted ordinary invalid input."); }));
  assert(!fidApi.createProspectIntakeCandidate({ ...minimalCandidate(), stage: "LATEST_EVIDENCE" }).validation.valid, "Unknown stage accepted.");
  assert(!fidApi.createProspectIntakeCandidate({ ...minimalCandidate(), status: "AUTO_APPROVED" }).validation.valid, "Unknown status accepted.");
  assert(!fidApi.createProspectIntakeCandidate({ ...minimalCandidate(), embeddedPlayerProfile: {} }).validation.valid, "Embedded factual record accepted.");
}

function mutationStabilityNullChecks(variant) {
  const input = fullCandidate(`stable-${variant}`); const snapshot = JSON.stringify(input); const first = fidApi.createProspectIntakeCandidate(input); const second = fidApi.createProspectIntakeCandidate(input);
  assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(second), "Candidate normalization mutated input or is unstable.");
  fidApi.validateProspectIntakeCandidate(first); assert(JSON.stringify(input) === snapshot, "Candidate validator mutated input.");
  const unavailable = fidApi.createUnavailableProspectIntakeCandidate({ reason: "No candidate available" });
  assert(!unavailable.validation.valid && unavailable.intakeId === null && unavailable.cycleRef === null && unavailable.stage === null && unavailable.status === null && unavailable.candidateRef === null && unavailable.promotionPlan === null, "Unavailable candidate invented prospect facts.");
  const minimal = fidApi.createProspectIntakeCandidate(minimalCandidate(`null-${variant}`, { candidateRef: null, candidateLabel: null, notes: null }));
  assert(minimal.candidateRef === null && minimal.candidateLabel === null && minimal.notes === null && minimal.sourceRefs.length === 0, "Explicit null or empty references were not preserved.");
}

function stageStatusIndependenceChecks(variant) {
  const blockedReview = fidApi.createProspectIntakeCandidate(minimalCandidate(`blocked-${variant}`, { stage: "EVIDENCE_REVIEW", status: "BLOCKED" }));
  const openReview = fidApi.createProspectIntakeCandidate(minimalCandidate(`open-${variant}`, { stage: "EVIDENCE_REVIEW", status: "OPEN" }));
  const approvedDiscovery = fidApi.createProspectIntakeCandidate(minimalCandidate(`approved-${variant}`, { stage: "DISCOVERED", status: "APPROVED" }));
  assert(blockedReview.validation.valid && openReview.validation.valid && approvedDiscovery.validation.valid, "Independent stage/status combinations were rejected.");
  assert(blockedReview.stage === "EVIDENCE_REVIEW" && blockedReview.status === "BLOCKED" && openReview.status === "OPEN", "Stage calculated status or status calculated stage.");
  assert(fidApi.createProspectIntakeCandidate(minimalCandidate(`watchlist-${variant}`, { discoveryContext: { origin: "NATIONAL_WATCHLIST" } })).stage === "DISCOVERED", "Watchlist discovery changed stage automatically.");
}

function nonlinearTransitionChecks(variant) {
  const backward = fidApi.createProspectIntakeWorkflowTransition({ transitionId: `back-${variant}`, fromStage: "EVIDENCE_REVIEW", toStage: "RESEARCH_COLLECTION", fromStatus: "BLOCKED", toStatus: "OPEN" });
  const statusOnly = fidApi.createProspectIntakeWorkflowTransition({ transitionId: `status-${variant}`, fromStage: "FACT_REVIEW", toStage: "FACT_REVIEW", fromStatus: "IN_REVIEW", toStatus: "DEFERRED" });
  const stageOnly = fidApi.createProspectIntakeWorkflowTransition({ transitionId: `stage-${variant}`, fromStage: "IDENTITY_REVIEW", toStage: "RESEARCH_COLLECTION", fromStatus: "IN_REVIEW", toStatus: "IN_REVIEW" });
  const reopening = fidApi.createProspectIntakeWorkflowTransition({ transitionId: `reopen-${variant}`, fromStage: "ARCHIVED", toStage: "RESEARCH_COLLECTION", fromStatus: "ARCHIVED", toStatus: "OPEN" });
  assert([backward, statusOnly, stageOnly, reopening].every((entry) => entry.validation.valid), "Non-linear, status-only, stage-only, or reopening transition rejected.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`transition-${variant}`, { stage: "EVIDENCE_REVIEW", status: "BLOCKED", workflowHistory: [backward] }));
  assert(candidate.stage === "EVIDENCE_REVIEW" && candidate.status === "BLOCKED", "Current state was inferred from transition history.");
}

function cycleDiscoveryBoundaryChecks(variant) {
  const first = fidApi.createProspectIntakeCandidate(minimalCandidate(`cycle-${variant}`, { cycleRef: `2027-cycle-${variant}`, discoveryContext: { origin: "NATIONAL_WATCHLIST", submittedLabel: "Fictional Watchlist Candidate", submittedSchool: "Example School", submittedPosition: "WR", submittedClass: null, sourceRefs: [`source-${variant}`] } }));
  const future = fidApi.createProspectIntakeCandidate(minimalCandidate(`future-${variant}`, { cycleRef: `2029-cycle-${variant}` }));
  assert(first.validation.valid && future.validation.valid && first.cycleRef !== future.cycleRef, "Cycle-aware unresolved references rejected.");
  assert(first.identityReview === null && first.proposedEntityRef === null && first.proposedPersonProfileRef === null && first.proposedPlayerProfileRef === null && first.proposedProspectProfileRef === null, "Discovery created or proposed factual profiles.");
  assert(first.eligibilityEvidenceRefs.length === 0 && first.declarationEvidenceRefs.length === 0 && first.readinessDeclaration.length === 0, "Watchlist inclusion proved eligibility, declaration, or readiness.");
}

function identityReviewBoundaryChecks(variant) {
  const review = fidApi.createProspectIntakeIdentityReview({ reviewId: `identity-${variant}`, outcome: "MATCH_CONFIRMED", candidateName: "Fictional Same Name", aliases: ["Fictional Alias"], duplicateCandidateConcern: true, sameNameConcern: true, sourceRefs: [`source-${variant}`] });
  assert(review.validation.valid && review.outcome === "MATCH_CONFIRMED" && review.duplicateCandidateConcern, "Identity review declaration invalid.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`identity-${variant}`, { identityReview: review }));
  assert(candidate.candidateRef === null && candidate.proposedEntityRef === null && candidate.proposedPersonProfileRef === null, "Identity review merged or created canonical identity.");
  assert(!Object.hasOwn(candidate.identityReview, "canonicalEntity") && !Object.hasOwn(candidate.identityReview, "mergedCandidate"), "Identity review embedded a resolved identity.");
}

function researchPlanBoundaryChecks(variant) {
  const plan = fidApi.createProspectIntakeResearchPlan({ planId: `plan-${variant}`, requiredCategories: ["IDENTITY", "ELIGIBILITY"], unavailableCategories: ["ATHLETIC_TESTING"], deferredCategories: ["DECLARATION"], assignedReviewerRefs: [`reviewer-${variant}`], completionDeclared: false });
  assert(plan.validation.valid && !plan.completionDeclared && plan.requiredCategories.length === 2, "Research plan declaration invalid.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`research-${variant}`, { researchPlan: plan, researchSourceRefs: Array.from({ length: 10 }, (_, index) => `source-${variant}-${index}`) }));
  assert(candidate.evidenceSufficiencyDeclarations.length === 0 && candidate.readinessDeclaration.length === 0 && candidate.stage === "DISCOVERED", "Research count calculated completeness, sufficiency, readiness, or stage.");
  assert(!Object.hasOwn(candidate, "researchRecords") && !Object.hasOwn(candidate, "researchConclusions"), "Research Repository records were embedded or reinterpreted.");
}

function evidenceSufficiencyChecks(variant) {
  const partial = fidApi.createProspectIntakeEvidenceSufficiency({ declarationId: `partial-${variant}`, scope: "PROSPECT_PROFILE", state: "PARTIAL", reviewerRef: `reviewer-${variant}`, sourceRefs: Array.from({ length: 20 }, (_, index) => `source-${index}`), evidenceRefs: Array.from({ length: 20 }, (_, index) => `evidence-${index}`), rationale: null, limitations: [], unresolvedConflicts: [] });
  const sufficient = fidApi.createProspectIntakeEvidenceSufficiency({ declarationId: `sufficient-${variant}`, scope: "IDENTITY", state: "SUFFICIENT_FOR_IDENTITY", sourceRefs: [], evidenceRefs: [], reviewerRef: `reviewer-${variant}` });
  assert(partial.validation.valid && sufficient.validation.valid && partial.state === "PARTIAL" && sufficient.state === "SUFFICIENT_FOR_IDENTITY", "Human evidence declarations were calculated from reference counts.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`sufficiency-${variant}`, { evidenceSufficiencyDeclarations: [partial, sufficient] }));
  assert(candidate.stage === "DISCOVERED" && candidate.status === "OPEN" && candidate.readinessDeclaration.length === 0, "Evidence declaration changed workflow or readiness automatically.");
}

function humanReviewBoundaryChecks(variant) {
  const review = fidApi.createProspectIntakeReviewRecord({ reviewId: `review-${variant}`, reviewType: "FINAL_PROMOTION_APPROVAL", reviewerRef: `reviewer-${variant}`, status: "COMPLETED", outcome: "APPROVED", reviewedAt: "2027-01-01", findings: ["Workflow declaration only"] });
  assert(review.validation.valid, "Human review record rejected.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`review-${variant}`, { reviewRecords: [review], stage: "FACT_REVIEW", status: "IN_REVIEW" }));
  assert(candidate.stage === "FACT_REVIEW" && candidate.status === "IN_REVIEW" && candidate.promotionPlan === null && candidate.promotionDecisionRefs.length === 0, "Review completion transitioned or promoted candidate automatically.");
  assert(review.reviewerRef === `reviewer-${variant}` && !Object.hasOwn(review, "userAccount"), "Reviewer reference became an account or permission record.");
}

function blockerHistoryChecks(variant) {
  const opened = fidApi.createProspectIntakeBlockerRecord({ blockerId: `blocker-open-${variant}`, blockerType: "ELIGIBILITY_UNCLEAR", status: "OPEN", openedAt: "2026-09-01" });
  const resolved = fidApi.createProspectIntakeBlockerRecord({ blockerId: `blocker-resolved-${variant}`, blockerType: "ELIGIBILITY_UNCLEAR", status: "RESOLVED", openedAt: "2026-09-01", resolvedAt: "2026-10-01", resolution: "Human review completed" });
  assert(opened.validation.valid && resolved.validation.valid, "Blocker history records invalid.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`blocker-${variant}`, { blockerRecords: [opened, resolved], stage: "EVIDENCE_REVIEW", status: "BLOCKED" }));
  assert(candidate.stage === "EVIDENCE_REVIEW" && candidate.status === "BLOCKED" && candidate.blockerRecords.length === 2, "Blocker resolution deleted history or approved workflow automatically.");
  assert(candidate.promotionPlan === null && candidate.promotionDecisionRefs.length === 0, "Blocker resolution approved promotion.");
  assert(!fidApi.createProspectIntakeBlockerRecord({ blockerId: "bad", blockerType: "OTHER", status: "OPEN", openedAt: "2027-02-01", resolvedAt: "2027-01-01" }).validation.valid, "Invalid blocker date order accepted.");
}

function scopeReadinessChecks(variant) {
  const declarations = [
    { declarationId: `entity-${variant}`, scope: "FOOTBALL_ENTITY", state: "READY_FOR_ENTITY_PROMOTION" },
    { declarationId: `person-${variant}`, scope: "PERSON_PROFILE", state: "READY_FOR_PERSON_PROMOTION" },
    { declarationId: `player-${variant}`, scope: "PLAYER_PROFILE", state: "DEFERRED" },
    { declarationId: `prospect-${variant}`, scope: "PROSPECT_PROFILE", state: "BLOCKED" },
  ];
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`readiness-${variant}`, { stage: "EVIDENCE_REVIEW", status: "BLOCKED", readinessDeclaration: declarations, evidenceSufficiencyDeclarations: [] }));
  assert(candidate.validation.valid && candidate.readinessDeclaration.length === 4, "Scope-specific readiness rejected.");
  assert(candidate.readinessDeclaration.find((entry) => entry.scope === "FOOTBALL_ENTITY").state === "READY_FOR_ENTITY_PROMOTION" && candidate.readinessDeclaration.find((entry) => entry.scope === "PROSPECT_PROFILE").state === "BLOCKED", "Entity/Person readiness could not coexist with blocked Prospect scope.");
  assert(candidate.stage === "EVIDENCE_REVIEW" && candidate.status === "BLOCKED", "Readiness calculated current workflow state.");
}

function promotionPartialBoundaryChecks(variant) {
  const plan = fidApi.createProspectIntakePromotionPlan({ planId: `plan-${variant}`, targets: [
    { targetId: `entity-${variant}`, targetType: "FOOTBALL_ENTITY", readinessState: "READY_FOR_ENTITY_PROMOTION", proposedAction: "CREATE", reviewStatus: "COMPLETED" },
    { targetId: `person-${variant}`, targetType: "PERSON_PROFILE", readinessState: "READY_FOR_PERSON_PROMOTION", proposedAction: "CREATE", reviewStatus: "COMPLETED" },
    { targetId: `player-${variant}`, targetType: "PLAYER_PROFILE", readinessState: "DEFERRED", proposedAction: "DEFER", reviewStatus: "DEFERRED" },
    { targetId: `prospect-${variant}`, targetType: "PROSPECT_PROFILE", readinessState: "BLOCKED", proposedAction: "NO_ACTION", reviewStatus: "BLOCKED" },
    { targetId: `relationship-${variant}`, targetType: "FOOTBALL_RELATIONSHIP", readinessState: "NOT_ASSESSED", proposedAction: "NO_ACTION", reviewStatus: "NOT_STARTED" },
  ] });
  assert(plan.validation.valid && plan.targets.length === 5, "Partial promotion plan rejected.");
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`promotion-${variant}`, { stage: "PROMOTION_APPROVED", status: "APPROVED", promotionPlan: plan }));
  assert(candidate.proposedEntityRef === null && candidate.proposedPersonProfileRef === null && candidate.promotionDecisionRefs.length === 0, "Promotion plan generated records or decision references.");
  assert(!Object.hasOwn(candidate, "persistedEnvelope") && !Object.hasOwn(candidate, "repositoryResult") && !Object.hasOwn(candidate, "playerGrade"), "Approval persisted, evaluated, or promoted records.");
  assert(plan.targets.find((entry) => entry.targetType === "PROSPECT_PROFILE").proposedAction === "NO_ACTION", "Blocked Prospect scope was forced into promotion.");
}

function versionHistoryChecks(variant) {
  const transition = { transitionId: `transition-${variant}`, fromStage: "PROMOTION_DEFERRED", toStage: "RESEARCH_COLLECTION", fromStatus: "DEFERRED", toStatus: "OPEN", occurredAt: "2027-02-01" };
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate(`version-${variant}`, { version: 4, workflowRevision: 9, lifecycle: { state: "REOPENED", openedAt: "2026-08-01", closedAt: null, replacesIntakeRef: `intake-previous-${variant}`, replacedByIntakeRef: null }, workflowHistory: [transition] }));
  assert(candidate.validation.valid && candidate.version === 4 && candidate.workflowRevision === 9 && candidate.lifecycle.replacesIntakeRef === `intake-previous-${variant}`, "Intake version distinctions collapsed.");
  assert(candidate.contractVersion !== String(candidate.version) && candidate.schemaVersion !== String(candidate.workflowRevision), "Contract/schema versions collapsed into workflow versions.");
  assert(candidate.stage === "DISCOVERED" && candidate.status === "OPEN", "Current state was inferred from latest history.");
  assert(!fidApi.createProspectIntakeCandidate(minimalCandidate(`self-${variant}`, { lifecycle: { replacesIntakeRef: `intake-self-${variant}` } })).validation.valid, "Self replacement reference accepted.");
}

function architectureBoundaryChecks() {
  const productionImports = [...imports(SPECIFICATION_SOURCE), ...imports(CANDIDATE_CONSTANTS_SOURCE), ...imports(CANDIDATE_CONTRACT_SOURCE), ...imports(INTAKE_INDEX_SOURCE)];
  assert(productionImports.every((entry) => !/researchRepository|contracts[/\\]|persistence|repository|supabase|database|registry|resolver|engine|draft|components|pages|router|routes/i.test(entry)), "Prospect Intake has a prohibited production dependency.");
  assert(JSON.stringify(imports(SPECIFICATION_SOURCE)) === JSON.stringify(["./prospectIntakeCandidateConstants.js"]), "Prospect Intake specification has dependencies beyond its documented vocabulary.");
  assert(imports(CANDIDATE_CONSTANTS_SOURCE).length === 0 && JSON.stringify(imports(CANDIDATE_CONTRACT_SOURCE)) === JSON.stringify(["./prospectIntakeCandidateConstants.js"]), "Prospect Intake Candidate extraction introduced a prohibited dependency.");
  assert(FACTUAL_CONTRACT_SOURCES.every((source) => imports(source).every((entry) => !/prospectIntake/i.test(entry))), "Existing factual contract imports Prospect Intake.");
  assert(!/\b(?:createVersion|queryRecords|getLatestByRecordId)\s*\(/.test(SPECIFICATION_SOURCE + CANDIDATE_CONTRACT_SOURCE), "Repository operation entered Prospect Intake.");
  assert(!/\b(?:fetch|createClient)\s*\(|\blocalStorage\s*\.|\bindexedDB\s*\./.test(SPECIFICATION_SOURCE + CANDIDATE_CONTRACT_SOURCE), "External, database, or browser runtime entered Prospect Intake.");
  const prohibitedResultFields = ["playerGrade", "prospectGrade", "athleticScore", "productionScore", "footballIQScore", "schemeFit", "teamFit", "draftValue", "consensusScore", "lbhtRanking", "draftProjection", "recommendation", "prediction"];
  const candidate = fidApi.createProspectIntakeCandidate(minimalCandidate());
  assert(prohibitedResultFields.every((field) => !Object.hasOwn(candidate, field)), "Evaluation or intelligence output entered candidate schema.");
}

function fictional2027CompatibilityChecks(variant) {
  const cases = [
    minimalCandidate(`preseason-${variant}`, { cycleRef: "2027-nfl-draft", discoveryContext: { origin: "NATIONAL_WATCHLIST", submittedLabel: "Fictional Preseason Candidate", submittedClass: null } }),
    minimalCandidate(`transfer-${variant}`, { cycleRef: "2027-nfl-draft", stage: "RESEARCH_COLLECTION", status: "OPEN", schoolEvidenceRefs: [`old-school-${variant}`, `new-school-${variant}`], positionEvidenceRefs: [`old-position-${variant}`, `new-position-${variant}`], workflowRevision: 2 }),
    minimalCandidate(`injury-${variant}`, { cycleRef: "2027-nfl-draft", evidenceRefs: [`injury-update-${variant}`], stage: "EVIDENCE_REVIEW", status: "IN_REVIEW" }),
    minimalCandidate(`returning-${variant}`, { cycleRef: "2027-nfl-draft", stage: "PROMOTION_DEFERRED", status: "DEFERRED", blockerRecords: [{ blockerId: `return-${variant}`, blockerType: "ELIGIBILITY_UNCLEAR", status: "DEFERRED" }] }),
    minimalCandidate(`breakout-${variant}`, { cycleRef: "2027-nfl-draft", discoveryContext: { origin: "PRODUCTION_LEADER", discoveredAt: null }, productionEvidenceRefs: [`production-${variant}`] }),
  ];
  const normalized = cases.map(fidApi.createProspectIntakeCandidate);
  assert(normalized.every((entry) => entry.validation.valid), "Fictional 2027 first-use scenario rejected.");
  assert(normalized[0].candidateLabel === null && normalized[0].eligibilityEvidenceRefs.length === 0 && normalized[0].declarationEvidenceRefs.length === 0, "Preseason watchlist invented identity, eligibility, or declaration.");
  assert(normalized[1].schoolEvidenceRefs.length === 2 && normalized[1].positionEvidenceRefs.length === 2 && normalized[1].workflowRevision === 2, "Transfer or position-change evidence history was not preserved.");
  assert(normalized.every((entry) => !/\b(?:Arch|Manning|Sellers|Nussmeier)\b/i.test(JSON.stringify(entry))), "Real prospect fixture entered diagnostics.");
}

function extensionSafetyChecks(variant) {
  const prohibited = ["scraperFunction", "browserAutomation", "apiClient", "credentials", "apiKey", "databaseClient", "supabaseClient", "sql", "executableRepositoryOperation", "automaticPromotion", "hydration", "synchronization", "identityResolutionFunction", "fuzzyMatching", "graphTraversal", "evaluationEngine", "playerGrade", "ranking", "projection", "recommendation", "prediction", "decision", "simulatorReady"];
  prohibited.forEach((key) => {
    const result = fidApi.createProspectIntakeCandidate(minimalCandidate(`extension-${variant}-${key}`, { extensions: { nested: { [key]: "prohibited", descriptiveLabel: "Safe" } } }));
    assert(!result.validation.valid && !Object.hasOwn(result.extensions.nested, key) && result.extensions.nested.descriptiveLabel === "Safe", `Prohibited extension retained: ${key}.`);
  });
  const safe = fidApi.createProspectIntakeCandidate(minimalCandidate(`safe-${variant}`, { extensions: { workflow: { descriptiveLabel: "Repository research ranking words are harmless prose", tags: [] } } }));
  assert(safe.validation.valid && safe.extensions.workflow.descriptiveLabel.includes("harmless"), "Harmless descriptive extension was rejected.");
}

function exportDependencyBaselineChecks(context) {
  const intakeNamed = Object.keys(namedProspectIntakeApi).filter((name) => name !== "default"); const intakeDefaults = Object.keys(prospectIntakeApi);
  const fidNamed = Object.keys(namedFidApi).filter((name) => name !== "default"); const fidDefaults = Object.keys(fidApi);
  const sprint19Named = Object.keys(namedSprint19ProspectIntakeApi).filter((name) => name !== "default"); const sprint19Defaults = Object.keys(sprint19ProspectIntakeApi);
  const sprint20Modules = [
    [namedSprint20WatchlistConstants, sprint20WatchlistConstants],
    [namedSprint20WatchlistApi, sprint20WatchlistApi],
    [namedSprint20IdentityIntakeApi, sprint20IdentityIntakeApi],
  ];
  const sprint20Names = sprint20Modules.flatMap(([namedApi]) => Object.keys(namedApi).filter((name) => name !== "default"));
  const intakeNames = new Set(intakeDefaults); const baselineNames = fidDefaults.filter((name) => !intakeNames.has(name));
  assert(baselineNames.length >= 271 && baselineNames.every((name) => Object.hasOwn(namedFidApi, name) && namedFidApi[name] === fidApi[name]), "A protected pre-Sprint 19 FID export is missing or reference-incompatible.");
  assert(sprint19Named.length === 50 && sprint19Defaults.length === 50 && sprint19Named.every((name) => Object.hasOwn(sprint19ProspectIntakeApi, name) && namedSprint19ProspectIntakeApi[name] === sprint19ProspectIntakeApi[name]), "The protected Sprint 19 module export surface changed.");
  assert(sprint19Named.every((name) => Object.hasOwn(namedProspectIntakeApi, name) && Object.hasOwn(prospectIntakeApi, name) && namedProspectIntakeApi[name] === sprint19ProspectIntakeApi[name] && prospectIntakeApi[name] === sprint19ProspectIntakeApi[name]), "A protected Sprint 19 Prospect Intake export is missing or reference-incompatible.");
  assert(sprint19Named.every((name) => Object.hasOwn(namedFidApi, name) && Object.hasOwn(fidApi, name) && namedFidApi[name] === sprint19ProspectIntakeApi[name] && fidApi[name] === sprint19ProspectIntakeApi[name]), "A protected Sprint 19 FID export is missing or reference-incompatible.");
  assert(new Set(sprint20Names).size === sprint20Names.length && sprint20Modules.every(([namedApi, defaultApi]) => Object.keys(namedApi).filter((name) => name !== "default").every((name) => Object.hasOwn(defaultApi, name) && namedApi[name] === defaultApi[name])), "The approved Sprint 20 source-module exports collide or disagree.");
  assert(sprint20Names.every((name) => Object.hasOwn(namedProspectIntakeApi, name) && Object.hasOwn(prospectIntakeApi, name) && namedProspectIntakeApi[name] === prospectIntakeApi[name] && Object.hasOwn(namedFidApi, name) && Object.hasOwn(fidApi, name) && namedFidApi[name] === fidApi[name] && fidApi[name] === prospectIntakeApi[name]), "An approved Sprint 20 export is missing or reference-incompatible.");
  assert(new Set([...sprint19Named, ...sprint20Names]).size === sprint19Named.length + sprint20Names.length, "A Sprint 19/Sprint 20 Prospect Intake export collision was introduced.");
  assert(new Set([...baselineNames, ...intakeDefaults]).size === baselineNames.length + intakeDefaults.length, "A FID/Prospect Intake export collision was introduced.");
  assert(intakeNamed.length === intakeDefaults.length && new Set(intakeNamed).size === intakeNamed.length && new Set(intakeDefaults).size === intakeDefaults.length && intakeNamed.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name]), "Prospect Intake named/default exports disagree.");
  assert(fidNamed.length >= baselineNames.length + intakeDefaults.length && fidDefaults.length >= baselineNames.length + intakeDefaults.length && new Set(fidNamed).size === fidNamed.length && new Set(fidDefaults).size === fidDefaults.length && fidNamed.every((name) => namedFidApi[name] === fidApi[name]), "FID additive export surface invalid.");
  assert(intakeDefaults.every((name) => fidApi[name] === prospectIntakeApi[name]), "FID Prospect Intake export reference disagreement found.");
  assert(!fidDefaults.some((name) => /^run.*Diagnostics$/.test(name)) && !/runProspectIntakeArchitectureDiagnostics/.test(FID_INDEX_SOURCE), "Diagnostic runner entered production exports.");
  const requiredTotals = { persistenceArchitecture: 340, inMemoryRepository: 400, researchSource: 23, researchSession: 47, recordedObservation: 72, analyticalObservation: 90, evidenceArtifact: 114, researchFoundation: 60, researchPersistence: 100, researchSupabaseAdapter: 110 };
  Object.entries(requiredTotals).forEach(([name, total]) => assert(context.suiteSummaries[name]?.total === total && context.suiteSummaries[name]?.failed === 0, `${name} baseline diagnostics failed.`));
}

const CHECKS = Object.freeze([
  architectureIdentityChecks, architecturePolicyChecks, candidateMinimalFullChecks, invalidInputToleranceChecks,
  mutationStabilityNullChecks, stageStatusIndependenceChecks, nonlinearTransitionChecks, cycleDiscoveryBoundaryChecks,
  identityReviewBoundaryChecks, researchPlanBoundaryChecks, evidenceSufficiencyChecks, humanReviewBoundaryChecks,
  blockerHistoryChecks, scopeReadinessChecks, promotionPartialBoundaryChecks, versionHistoryChecks,
  architectureBoundaryChecks, fictional2027CompatibilityChecks, extensionSafetyChecks, exportDependencyBaselineChecks,
]);

async function buildContext() {
  const persistenceArchitecture = await runFidPersistenceArchitectureDiagnostics();
  const inMemoryRepository = runInMemoryFidPersistenceRepositoryDiagnostics();
  const researchSource = runResearchSourceContractDiagnostics();
  const researchSession = runResearchSessionContractDiagnostics();
  const recordedObservation = runRecordedObservationContractDiagnostics();
  const analyticalObservation = runAnalyticalObservationContractDiagnostics();
  const evidenceArtifact = runEvidenceArtifactContractDiagnostics();
  const researchFoundation = runResearchRepositoryFoundationDiagnostics();
  const researchPersistence = runResearchRepositoryPersistenceDiagnostics();
  const researchSupabaseAdapter = await runSupabaseResearchRepositoryAdapterDiagnostics();
  return { suiteSummaries: { ...persistenceArchitecture.suiteSummaries, persistenceArchitecture, inMemoryRepository, researchSource, researchSession, recordedObservation, analyticalObservation, evidenceArtifact, researchFoundation, researchPersistence, researchSupabaseAdapter } };
}

export async function runProspectIntakeArchitectureDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  CASE_NAMES.forEach((id, index) => {
    const groupIndex = Math.floor(index / 20); const variant = (index % 20) + 1;
    try { CHECKS[groupIndex](groupIndex === 19 ? context : variant); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); }
  });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, schemaVersion: fidApi.PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectIntakeArchitectureDiagnostics });
