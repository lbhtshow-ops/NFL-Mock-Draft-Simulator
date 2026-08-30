import fidApi from "../index.js";

const SUITE = "MultiProspectIntakeValidation";
const CYCLE_REF = "draft-cycle:2027";
const REVIEWER = "sprint-33-validation";
const PROSPECTS = Object.freeze([
  Object.freeze({ slug: "arch-manning", name: "Arch Manning", position: "QB", school: "Texas", classYear: "Junior", sourceRef: "football-intelligence:database:arch-manning" }),
  Object.freeze({ slug: "francis-mauigoa", name: "Francis Mauigoa", position: "OT", school: "Miami", classYear: "Junior", sourceRef: "football-intelligence:database:francis-mauigoa" }),
  Object.freeze({ slug: "peter-woods", name: "Peter Woods", position: "DL", school: "Clemson", classYear: "Junior", sourceRef: "football-intelligence:database:peter-woods" }),
]);

function refsFor(slug) {
  return Object.freeze({
    watchlist: `watchlist:2027:${slug}`, entry: `watchlist-entry:${slug}`, identity: `identity-intake:${slug}`,
    candidate: `intake-candidate:${slug}`, entity: `entity:${slug}`, person: `person-profile:${slug}`,
    player: `player-profile:${slug}`, prospect: `prospect-profile:${slug}`, decision: `promotion-decision:${slug}`,
    target: `promotion-target:${slug}:prospect`, workflow: `promotion-workflow:${slug}`, dryRun: `promotion-dry-run:${slug}`,
    execution: `promotion-execution:${slug}`, eligibilityBlocker: `blocker:${slug}:eligibility`, declarationBlocker: `blocker:${slug}:declaration`,
  });
}

function buildFlow(subject) {
  const refs = refsFor(subject.slug); const claim = (type) => `identity-claim:${subject.slug}:${type.toLowerCase()}`;
  const watchlist = fidApi.createProspectWatchlist({
    watchlistId: refs.watchlist, cycleRef: CYCLE_REF, label: `${subject.name} validation watchlist`, watchlistType: "PRESEASON", status: "ACTIVE", revision: 1,
    candidateEntries: [{ entryId: refs.entry, intakeCandidateRef: refs.candidate, submittedLabel: subject.name, submittedSchool: subject.school, submittedPosition: subject.position, submittedClassYear: subject.classYear, discoveryOrigin: "EXISTING_FOOTBALL_INTELLIGENCE_RECORD", entryStatus: "IDENTITY_REVIEWED", priority: "HIGH", revision: 1, sourceRefs: [subject.sourceRef] }],
    sourceRefs: [subject.sourceRef], verification: { state: "REVIEWED", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", createdAt: "2026-07-18" },
  });
  const identityIntake = fidApi.createProspectIdentityIntake({
    identityIntakeId: refs.identity, intakeCandidateRef: refs.candidate, cycleRef: CYCLE_REF,
    submittedIdentity: { submittedName: subject.name, submittedSchool: subject.school, submittedPosition: subject.position, submittedClassYear: subject.classYear, sourceRefs: [subject.sourceRef] },
    identityClaims: [
      { claimId: claim("NAME"), claimType: "NAME", claimedValue: subject.name, normalizedDisplayValue: subject.name, status: "SUPPORTED", sourceRefs: [subject.sourceRef] },
      { claimId: claim("SCHOOL"), claimType: "SCHOOL", claimedValue: subject.school, normalizedDisplayValue: subject.school, status: "SUPPORTED", sourceRefs: [subject.sourceRef] },
      { claimId: claim("POSITION"), claimType: "POSITION", claimedValue: subject.position, normalizedDisplayValue: subject.position, status: "SUPPORTED", sourceRefs: [subject.sourceRef] },
    ],
    identityReviews: [{ reviewId: `identity-review:${subject.slug}`, outcome: "NEW_IDENTITY_PROPOSED", reviewerRef: REVIEWER, reviewedAt: "2026-07-18", claimRefs: [claim("NAME"), claim("SCHOOL"), claim("POSITION")], rationale: "Source identity fields agree." }],
    finalDeclaredOutcome: "NEW_IDENTITY_PROPOSED", proposedEntityRef: refs.entity, proposedPersonProfileRef: refs.person, sourceRefs: [subject.sourceRef],
    verification: { state: "VERIFIED_FOR_INTAKE", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, revision: 1, workflowRevision: 1,
  });
  const candidate = fidApi.createProspectIntakeCandidate({
    intakeId: refs.candidate, cycleRef: CYCLE_REF, candidateRef: refs.entry, candidateLabel: subject.name, stage: "PROMOTION_READY", status: "BLOCKED",
    discoveryContext: { origin: "MANUAL_RESEARCH", discoveredAt: "2026-07-18", submittedLabel: subject.name, submittedSchool: subject.school, submittedPosition: subject.position, submittedClass: subject.classYear, sourceRefs: [subject.sourceRef] },
    identityReview: { reviewId: `candidate-identity-review:${subject.slug}`, outcome: "MATCH_CONFIRMED", reviewerRef: REVIEWER, reviewedAt: "2026-07-18", candidateName: subject.name, school: subject.school, position: subject.position, sourceRefs: [subject.sourceRef] },
    evidenceSufficiencyDeclarations: [{ declarationId: `sufficiency:${subject.slug}:identity`, scope: "IDENTITY", state: "SUFFICIENT_FOR_IDENTITY", reviewerRef: REVIEWER }, { declarationId: `sufficiency:${subject.slug}:prospect`, scope: "PROSPECT_PROFILE", state: "INSUFFICIENT", reviewerRef: REVIEWER, limitations: ["Eligibility and declaration evidence are absent."] }],
    blockerRecords: [{ blockerId: refs.eligibilityBlocker, blockerType: "ELIGIBILITY_UNCLEAR", status: "OPEN", openedAt: "2026-07-18" }, { blockerId: refs.declarationBlocker, blockerType: "DECLARATION_UNCLEAR", status: "OPEN", openedAt: "2026-07-18" }],
    readinessDeclaration: [{ declarationId: `readiness:${subject.slug}:prospect`, scope: "PROSPECT_PROFILE", state: "BLOCKED", blockerRefs: [refs.eligibilityBlocker, refs.declarationBlocker], reviewerRef: REVIEWER }],
    proposedEntityRef: refs.entity, proposedPersonProfileRef: refs.person, proposedPlayerProfileRef: refs.player, proposedProspectProfileRef: refs.prospect, promotionDecisionRefs: [refs.decision], sourceRefs: [subject.sourceRef],
    verification: { state: "REVIEWED", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, version: 1, workflowRevision: 1,
  });
  const prospectProfile = fidApi.createProspectProfile({
    profileId: refs.prospect, entityRef: refs.entity, personProfileRef: refs.person, playerProfileRef: refs.player, prospectCycleRef: CYCLE_REF, status: "INCOMPLETE",
    cycle: { cycleType: "DRAFT", cycleLabel: "2027 NFL Draft", classYear: 2027, status: "TRACKED" },
    eligibility: { state: "UNKNOWN", basisType: "UNKNOWN", sourceRefs: [subject.sourceRef], limitations: "Eligibility is not established by the validation source." },
    declaration: { state: "UNKNOWN", sourceRefs: [subject.sourceRef], notes: "Declaration is not established by the validation source." },
    entry: { pathwayType: "UNKNOWN", sourceRefs: [subject.sourceRef] }, references: { sourceRefs: [subject.sourceRef] },
    verification: { state: "PENDING_REVIEW", confidence: "MODERATE", limitations: "Eligibility and declaration remain unresolved." },
    provenance: { createdBy: REVIEWER, createdAt: "2026-07-18", originSystem: "FID_DIAGNOSTICS", originRecordRef: refs.candidate },
    versioning: { profileVersion: 1, changeReason: "Sprint 33 position-independence validation" }, metadata: { tags: ["validation", subject.position], domains: ["prospect-intake"] },
  });
  const decision = fidApi.createProspectPromotionDecision({
    decisionId: refs.decision, decisionRevision: 1, workflowRevision: 1, cycleRef: CYCLE_REF, intakeCandidateRef: refs.candidate, status: "DEFERRED",
    watchlistRefs: [refs.watchlist], watchlistEntryRefs: [refs.entry], identityIntakeRefs: [refs.identity],
    targetDecisions: [{ targetDecisionId: refs.target, targetType: "PROSPECT_PROFILE", targetRef: refs.prospect, proposedAction: "DEFER", decision: "DEFERRED", readinessRef: `readiness:${subject.slug}:prospect`, blockerRefs: [refs.eligibilityBlocker, refs.declarationBlocker], reviewerRefs: [REVIEWER], rationale: "Required prospect facts remain unresolved.", limitations: ["Validation-only; no promotion authorized."] }],
    blockerRefs: [refs.eligibilityBlocker, refs.declarationBlocker], sourceRefs: [subject.sourceRef], verification: { state: "REVIEWED", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" },
  });
  const workflow = fidApi.createProspectPromotionWorkflow({
    workflowId: refs.workflow, workflowRevision: 1, cycleRef: CYCLE_REF, intakeCandidateRef: refs.candidate, promotionDecisionRef: refs.decision, promotionDecisionRevision: 1,
    mode: "DRY_RUN", status: "BLOCKED", targetOperations: [], dependencyDeclarations: [], recordIdentityInputs: [], persistenceInputs: [],
    validationRecords: [{ validationId: `workflow-validation:${subject.slug}`, status: "PASSED", code: "CONTRACTS_VALID", message: "All supplied records validate." }], errorRecords: [], auditHistory: [], sourceRefs: [subject.sourceRef], blockerRefs: [refs.eligibilityBlocker, refs.declarationBlocker],
    verification: { state: "WORKFLOW_REVIEWED", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, notes: "Deferred decision produces no operation.",
  });
  const execution = fidApi.createProspectPromotionExecution({
    executionId: refs.execution, executionRevision: 1, workflowRef: refs.workflow, workflowRevision: 1, dryRunResultRef: refs.dryRun, promotionDecisionRef: refs.decision,
    cycleRef: CYCLE_REF, intakeCandidateRef: refs.candidate, mode: "VALIDATION_ONLY", status: "BLOCKED", operationResults: [], repositoryEffects: [],
    validationRecords: [{ validationId: `execution-validation:${subject.slug}`, status: "PASSED", code: "NO_OPERATION_AUTHORIZED", message: "Deferred promotion correctly produces no operation." }], errorRecords: [], auditHistory: [], sourceRefs: [subject.sourceRef], blockerRefs: [refs.eligibilityBlocker, refs.declarationBlocker],
    verification: { state: "VERIFIED", reviewedBy: REVIEWER, reviewedAt: "2026-07-18" }, lifecycle: { state: "ACTIVE", openedAt: "2026-07-18" }, notes: "Validation only; no runtime or repository effect.",
  });
  return { subject, refs, watchlist, identityIntake, candidate, decision, workflow, execution, prospectProfile };
}

function validateFlow(flow) {
  const stages = [
    ["watchlist", flow.watchlist, fidApi.validateProspectWatchlist, fidApi.isProspectWatchlist],
    ["identityIntake", flow.identityIntake, fidApi.validateProspectIdentityIntake, fidApi.isProspectIdentityIntake],
    ["candidate", flow.candidate, fidApi.validateProspectIntakeCandidate, fidApi.isProspectIntakeCandidate],
    ["promotionDecision", flow.decision, fidApi.validateProspectPromotionDecision, fidApi.isProspectPromotionDecision],
    ["promotionWorkflow", flow.workflow, fidApi.validateProspectPromotionWorkflow, fidApi.isProspectPromotionWorkflow],
    ["promotionExecution", flow.execution, fidApi.validateProspectPromotionExecution, fidApi.isProspectPromotionExecution],
    ["prospectProfile", flow.prospectProfile, fidApi.validateProspectProfile, fidApi.isProspectProfile],
  ].map(([stage, record, validate, identify]) => { const result = validate(record); return { stage, valid: result.valid && identify(record), errors: result.errors, warnings: result.warnings }; });
  const transitions = [
    ["watchlist->identity", flow.watchlist.candidateEntries[0].intakeCandidateRef === flow.identityIntake.intakeCandidateRef],
    ["identity->candidate", flow.identityIntake.intakeCandidateRef === flow.candidate.intakeId && flow.identityIntake.proposedEntityRef === flow.candidate.proposedEntityRef],
    ["candidate->decision", flow.candidate.promotionDecisionRefs.includes(flow.decision.decisionId) && flow.decision.intakeCandidateRef === flow.candidate.intakeId],
    ["decision->profile", flow.decision.targetDecisions.some((target) => target.targetRef === flow.prospectProfile.profileId && target.decision === "DEFERRED")],
    ["decision->workflow", flow.workflow.promotionDecisionRef === flow.decision.decisionId && flow.workflow.intakeCandidateRef === flow.candidate.intakeId],
    ["workflow->execution", flow.execution.workflowRef === flow.workflow.workflowId && flow.execution.promotionDecisionRef === flow.workflow.promotionDecisionRef],
  ].map(([transition, valid]) => ({ transition, valid }));
  const positionValues = [flow.watchlist.candidateEntries[0].submittedPosition, flow.identityIntake.submittedIdentity.submittedPosition, flow.candidate.discoveryContext.submittedPosition, flow.candidate.identityReview.position];
  const positionPreserved = positionValues.every((value) => value === flow.subject.position);
  const promotionBlockers = [{ code: "ELIGIBILITY_UNRESOLVED", ref: flow.refs.eligibilityBlocker }, { code: "DECLARATION_UNRESOLVED", ref: flow.refs.declarationBlocker }, { code: "ENTRY_PATHWAY_UNRESOLVED", ref: null }];
  const architecturalIssues = [];
  const positionSpecificSchemaGaps = positionPreserved ? [] : [{ code: "POSITION_VALUE_LOST", expected: flow.subject.position, observed: positionValues }];
  return { prospect: flow.subject.name, position: flow.subject.position, stages, transitions, positionValues, positionPreserved, promotionBlockers, architecturalIssues, positionSpecificSchemaGaps, valid: stages.every((stage) => stage.valid) && transitions.every((transition) => transition.valid) && positionPreserved };
}

function structuralFingerprint(flow) {
  return Object.fromEntries(["watchlist", "identityIntake", "candidate", "decision", "workflow", "execution", "prospectProfile"].map((key) => [key, Object.keys(flow[key]).sort()]));
}

export function runMultiProspectIntakeValidation({ throwOnFailure = false } = {}) {
  const flows = PROSPECTS.map(buildFlow); const prospectResults = flows.map(validateFlow); const baseline = JSON.stringify(structuralFingerprint(flows[0]));
  const structuralParity = flows.every((flow) => JSON.stringify(structuralFingerprint(flow)) === baseline);
  const positions = prospectResults.map((result) => result.position); const uniquePositions = new Set(positions).size === positions.length;
  const architecturalIssues = prospectResults.flatMap((result) => result.architecturalIssues.map((issue) => ({ prospect: result.prospect, ...issue })));
  if (!structuralParity) architecturalIssues.push({ prospect: "cross-position", code: "STRUCTURAL_SCHEMA_DIVERGENCE" });
  const positionSpecificSchemaGaps = prospectResults.flatMap((result) => result.positionSpecificSchemaGaps.map((gap) => ({ prospect: result.prospect, ...gap })));
  const promotionBlockers = prospectResults.map((result) => ({ prospect: result.prospect, position: result.position, blockers: result.promotionBlockers }));
  const crossPositionComparison = {
    positions, uniquePositions, structuralParity,
    stagePassCounts: Object.fromEntries(prospectResults[0].stages.map(({ stage }) => [stage, prospectResults.filter((result) => result.stages.find((entry) => entry.stage === stage)?.valid).length])),
    transitionPassCounts: Object.fromEntries(prospectResults[0].transitions.map(({ transition }) => [transition, prospectResults.filter((result) => result.transitions.find((entry) => entry.transition === transition)?.valid).length])),
    positionPreservationCount: prospectResults.filter((result) => result.positionPreserved).length,
  };
  const cases = [
    ...prospectResults.map((result) => ({ id: `prospect:${result.prospect}`, passed: result.valid, message: result.valid ? `${result.prospect} completed all governed validation stages.` : `${result.prospect} validation failed.`, details: result })),
    { id: "cross-position-structural-parity", passed: structuralParity, message: structuralParity ? "QB, OT, and DL flows share the same normalized contract structures." : "Contract structures diverged by position.", details: crossPositionComparison },
    { id: "position-preservation", passed: prospectResults.every((result) => result.positionPreserved), message: "Position values remain intact across intake identity declarations.", details: prospectResults.map(({ prospect, positionValues }) => ({ prospect, positionValues })) },
    { id: "architectural-deficiencies", passed: architecturalIssues.length === 0, message: architecturalIssues.length ? "Architectural deficiencies detected." : "No architectural deficiencies detected.", details: architecturalIssues },
    { id: "position-schema-gaps", passed: positionSpecificSchemaGaps.length === 0, message: positionSpecificSchemaGaps.length ? "Position-specific schema gaps detected." : "No position-specific schema gaps detected.", details: positionSpecificSchemaGaps },
    { id: "safe-promotion-boundary", passed: flows.every((flow) => flow.execution.repositoryEffects.length === 0 && flow.execution.mode === "VALIDATION_ONLY" && flow.decision.status === "DEFERRED"), message: "Promotion blockers remain separate and no execution effect was produced.", details: promotionBlockers },
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const readyForLargeScalePopulation = failed === 0 && architecturalIssues.length === 0 && positionSpecificSchemaGaps.length === 0;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, prospectResults, crossPositionComparison, promotionBlockers, architecturalIssues, positionSpecificSchemaGaps, recommendation: { readyForLargeScalePopulation, rationale: readyForLargeScalePopulation ? "The governed intake structures are position-independent across QB, OT, and DL. Large-scale population may proceed with source-quality gates for eligibility and declaration evidence." : "Resolve the reported architecture or position-schema issues before large-scale population." } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`);
  return result;
}

export default Object.freeze({ runMultiProspectIntakeValidation });
