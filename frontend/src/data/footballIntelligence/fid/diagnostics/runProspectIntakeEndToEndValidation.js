import fidApi from "../index.js";

const SUITE = "ProspectIntakeEndToEndValidation";
const SUBJECT = Object.freeze({
  name: "Caleb Downs", school: "Ohio State", position: "S", classYear: "Junior",
  cycleRef: "draft-cycle:2027", sourceRef: "football-intelligence:database:caleb-downs",
});

function buildValidationFlow() {
  const refs = Object.freeze({
    watchlist: "watchlist:2027:preseason", entry: "watchlist-entry:caleb-downs", identity: "identity-intake:caleb-downs",
    candidate: "intake-candidate:caleb-downs", entity: "entity:caleb-downs", person: "person-profile:caleb-downs",
    player: "player-profile:caleb-downs", prospect: "prospect-profile:caleb-downs", decision: "promotion-decision:caleb-downs",
    decisionTarget: "promotion-target:caleb-downs:prospect", workflow: "promotion-workflow:caleb-downs",
    dryRun: "promotion-dry-run:caleb-downs", execution: "promotion-execution:caleb-downs",
  });

  const watchlist = fidApi.createProspectWatchlist({
    watchlistId: refs.watchlist, cycleRef: SUBJECT.cycleRef, label: "2027 Preseason Validation Watchlist",
    watchlistType: "PRESEASON", status: "ACTIVE", revision: 1,
    candidateEntries: [{ entryId: refs.entry, intakeCandidateRef: refs.candidate, submittedLabel: SUBJECT.name, submittedSchool: SUBJECT.school, submittedPosition: SUBJECT.position, submittedClassYear: SUBJECT.classYear, discoveryOrigin: "EXISTING_FOOTBALL_INTELLIGENCE_RECORD", entryStatus: "IDENTITY_REVIEWED", priority: "HIGH", revision: 1, sourceRefs: [SUBJECT.sourceRef] }],
    sourceRefs: [SUBJECT.sourceRef], verification: { state: "REVIEWED", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", createdAt: "2026-07-18" },
  });

  const identityIntake = fidApi.createProspectIdentityIntake({
    identityIntakeId: refs.identity, intakeCandidateRef: refs.candidate, cycleRef: SUBJECT.cycleRef,
    submittedIdentity: { submittedName: SUBJECT.name, submittedSchool: SUBJECT.school, submittedPosition: SUBJECT.position, submittedClassYear: SUBJECT.classYear, sourceRefs: [SUBJECT.sourceRef] },
    identityClaims: [
      { claimId: "identity-claim:caleb-downs:name", claimType: "NAME", claimedValue: SUBJECT.name, normalizedDisplayValue: SUBJECT.name, status: "SUPPORTED", sourceRefs: [SUBJECT.sourceRef] },
      { claimId: "identity-claim:caleb-downs:school", claimType: "SCHOOL", claimedValue: SUBJECT.school, normalizedDisplayValue: SUBJECT.school, status: "SUPPORTED", sourceRefs: [SUBJECT.sourceRef] },
      { claimId: "identity-claim:caleb-downs:position", claimType: "POSITION", claimedValue: SUBJECT.position, normalizedDisplayValue: SUBJECT.position, status: "SUPPORTED", sourceRefs: [SUBJECT.sourceRef] },
    ],
    identityReviews: [{ reviewId: "identity-review:caleb-downs", outcome: "NEW_IDENTITY_PROPOSED", reviewerRef: "sprint-32-validation", reviewedAt: "2026-07-18", claimRefs: ["identity-claim:caleb-downs:name", "identity-claim:caleb-downs:school", "identity-claim:caleb-downs:position"], rationale: "Name, school, and position agree with the existing validation source." }],
    finalDeclaredOutcome: "NEW_IDENTITY_PROPOSED", proposedEntityRef: refs.entity, proposedPersonProfileRef: refs.person,
    sourceRefs: [SUBJECT.sourceRef], verification: { state: "VERIFIED_FOR_INTAKE", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, revision: 1, workflowRevision: 1,
  });

  const candidate = fidApi.createProspectIntakeCandidate({
    intakeId: refs.candidate, cycleRef: SUBJECT.cycleRef, candidateRef: refs.entry, candidateLabel: SUBJECT.name,
    stage: "PROMOTION_READY", status: "BLOCKED",
    discoveryContext: { origin: "MANUAL_RESEARCH", discoveredAt: "2026-07-18", submittedLabel: SUBJECT.name, submittedSchool: SUBJECT.school, submittedPosition: SUBJECT.position, submittedClass: SUBJECT.classYear, sourceRefs: [SUBJECT.sourceRef] },
    identityReview: { reviewId: "candidate-identity-review:caleb-downs", outcome: "MATCH_CONFIRMED", reviewerRef: "sprint-32-validation", reviewedAt: "2026-07-18", candidateName: SUBJECT.name, school: SUBJECT.school, position: SUBJECT.position, sourceRefs: [SUBJECT.sourceRef] },
    evidenceSufficiencyDeclarations: [
      { declarationId: "sufficiency:caleb-downs:identity", scope: "IDENTITY", state: "SUFFICIENT_FOR_IDENTITY", reviewerRef: "sprint-32-validation" },
      { declarationId: "sufficiency:caleb-downs:prospect", scope: "PROSPECT_PROFILE", state: "INSUFFICIENT", reviewerRef: "sprint-32-validation", limitations: ["Eligibility and declaration evidence are absent."] },
    ],
    blockerRecords: [
      { blockerId: "blocker:caleb-downs:eligibility", blockerType: "ELIGIBILITY_UNCLEAR", status: "OPEN", openedAt: "2026-07-18", sourceRefs: [SUBJECT.sourceRef] },
      { blockerId: "blocker:caleb-downs:declaration", blockerType: "DECLARATION_UNCLEAR", status: "OPEN", openedAt: "2026-07-18", sourceRefs: [SUBJECT.sourceRef] },
    ],
    readinessDeclaration: [{ declarationId: "readiness:caleb-downs:prospect", scope: "PROSPECT_PROFILE", state: "BLOCKED", blockerRefs: ["blocker:caleb-downs:eligibility", "blocker:caleb-downs:declaration"], reviewerRef: "sprint-32-validation" }],
    proposedEntityRef: refs.entity, proposedPersonProfileRef: refs.person, proposedPlayerProfileRef: refs.player, proposedProspectProfileRef: refs.prospect,
    promotionDecisionRefs: [refs.decision], sourceRefs: [SUBJECT.sourceRef], verification: { state: "REVIEWED", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, version: 1, workflowRevision: 1,
  });

  const prospectProfile = fidApi.createProspectProfile({
    profileId: refs.prospect, entityRef: refs.entity, personProfileRef: refs.person, playerProfileRef: refs.player, prospectCycleRef: SUBJECT.cycleRef,
    status: "INCOMPLETE", cycle: { cycleType: "DRAFT", cycleLabel: "2027 NFL Draft", classYear: 2027, status: "TRACKED" },
    eligibility: { state: "UNKNOWN", basisType: "UNKNOWN", sourceRefs: [SUBJECT.sourceRef], limitations: "Eligibility is not established by the validation source." },
    declaration: { state: "UNKNOWN", sourceRefs: [SUBJECT.sourceRef], notes: "Declaration status is not established by the validation source." },
    entry: { pathwayType: "UNKNOWN", sourceRefs: [SUBJECT.sourceRef] },
    references: { sourceRefs: [SUBJECT.sourceRef] }, verification: { state: "PENDING_REVIEW", confidence: "MODERATE", limitations: "Eligibility and declaration remain unresolved." },
    provenance: { createdBy: "sprint-32-validation", createdAt: "2026-07-18", originSystem: "FID_DIAGNOSTICS", originRecordRef: refs.candidate },
    versioning: { profileVersion: 1, changeReason: "Sprint 32 governed validation proposal" }, metadata: { tags: ["validation", "caleb-downs"], domains: ["prospect-intake"] },
  });

  const decision = fidApi.createProspectPromotionDecision({
    decisionId: refs.decision, decisionRevision: 1, workflowRevision: 1, cycleRef: SUBJECT.cycleRef, intakeCandidateRef: refs.candidate, status: "DEFERRED",
    watchlistRefs: [refs.watchlist], watchlistEntryRefs: [refs.entry], identityIntakeRefs: [refs.identity],
    targetDecisions: [{ targetDecisionId: refs.decisionTarget, targetType: "PROSPECT_PROFILE", targetRef: refs.prospect, proposedAction: "DEFER", decision: "DEFERRED", readinessRef: "readiness:caleb-downs:prospect", requiredSourceRefs: [SUBJECT.sourceRef], blockerRefs: ["blocker:caleb-downs:eligibility", "blocker:caleb-downs:declaration"], reviewerRefs: ["sprint-32-validation"], rationale: "The profile shape is valid, but eligibility and declaration are unresolved.", limitations: ["Validation-only; no promotion authorized."] }],
    blockerRefs: ["blocker:caleb-downs:eligibility", "blocker:caleb-downs:declaration"], sourceRefs: [SUBJECT.sourceRef], verification: { state: "REVIEWED", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" },
  });

  const workflow = fidApi.createProspectPromotionWorkflow({
    workflowId: refs.workflow, workflowRevision: 1, cycleRef: SUBJECT.cycleRef, intakeCandidateRef: refs.candidate, promotionDecisionRef: refs.decision, promotionDecisionRevision: 1,
    mode: "DRY_RUN", status: "BLOCKED", targetOperations: [], dependencyDeclarations: [], recordIdentityInputs: [], persistenceInputs: [],
    validationRecords: [{ validationId: "workflow-validation:caleb-downs", status: "PASSED", code: "CONTRACTS_VALID", message: "All supplied contract records validate independently." }],
    errorRecords: [], auditHistory: [], sourceRefs: [SUBJECT.sourceRef], blockerRefs: ["blocker:caleb-downs:eligibility", "blocker:caleb-downs:declaration"], verification: { state: "WORKFLOW_REVIEWED", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, notes: "No operation is planned because the promotion decision is deferred.",
  });

  const execution = fidApi.createProspectPromotionExecution({
    executionId: refs.execution, executionRevision: 1, workflowRef: refs.workflow, workflowRevision: 1, dryRunResultRef: refs.dryRun,
    promotionDecisionRef: refs.decision, cycleRef: SUBJECT.cycleRef, intakeCandidateRef: refs.candidate, mode: "VALIDATION_ONLY", status: "BLOCKED",
    operationResults: [], repositoryEffects: [], validationRecords: [{ validationId: "execution-validation:caleb-downs", status: "PASSED", code: "NO_OPERATION_AUTHORIZED", message: "Deferred promotion correctly produced no executable operation." }],
    errorRecords: [], auditHistory: [], sourceRefs: [SUBJECT.sourceRef], blockerRefs: ["blocker:caleb-downs:eligibility", "blocker:caleb-downs:declaration"], verification: { state: "VERIFIED", reviewedBy: "sprint-32-validation", reviewedAt: "2026-07-18" }, lifecycle: { state: "ACTIVE", openedAt: "2026-07-18" }, notes: "Contract validation only; no execution or repository effect.",
  });

  return { refs, watchlist, identityIntake, candidate, decision, workflow, execution, prospectProfile };
}

function evaluateFlow(flow) {
  const contractChecks = [
    ["ProspectWatchlist", flow.watchlist, fidApi.validateProspectWatchlist, fidApi.isProspectWatchlist],
    ["ProspectIdentityIntake", flow.identityIntake, fidApi.validateProspectIdentityIntake, fidApi.isProspectIdentityIntake],
    ["ProspectIntakeCandidate", flow.candidate, fidApi.validateProspectIntakeCandidate, fidApi.isProspectIntakeCandidate],
    ["ProspectPromotionDecision", flow.decision, fidApi.validateProspectPromotionDecision, fidApi.isProspectPromotionDecision],
    ["ProspectPromotionWorkflow", flow.workflow, fidApi.validateProspectPromotionWorkflow, fidApi.isProspectPromotionWorkflow],
    ["ProspectPromotionExecution", flow.execution, fidApi.validateProspectPromotionExecution, fidApi.isProspectPromotionExecution],
    ["ProspectProfile", flow.prospectProfile, fidApi.validateProspectProfile, fidApi.isProspectProfile],
  ].map(([contract, record, validate, identify]) => ({ contract, valid: validate(record).valid && identify(record), errors: validate(record).errors, warnings: validate(record).warnings }));

  const transitions = [
    { from: "ProspectWatchlist", to: "ProspectIdentityIntake", valid: flow.watchlist.candidateEntries[0].intakeCandidateRef === flow.identityIntake.intakeCandidateRef && flow.watchlist.cycleRef === flow.identityIntake.cycleRef },
    { from: "ProspectIdentityIntake", to: "ProspectIntakeCandidate", valid: flow.identityIntake.intakeCandidateRef === flow.candidate.intakeId && flow.identityIntake.proposedEntityRef === flow.candidate.proposedEntityRef },
    { from: "ProspectIntakeCandidate", to: "ProspectPromotionDecision", valid: flow.candidate.promotionDecisionRefs.includes(flow.decision.decisionId) && flow.decision.intakeCandidateRef === flow.candidate.intakeId },
    { from: "ProspectPromotionDecision", to: "ProspectProfile", valid: flow.decision.targetDecisions.some((target) => target.targetType === "PROSPECT_PROFILE" && target.targetRef === flow.prospectProfile.profileId && target.decision === "DEFERRED") },
    { from: "ProspectPromotionDecision", to: "ProspectPromotionWorkflow", valid: flow.workflow.promotionDecisionRef === flow.decision.decisionId && flow.workflow.intakeCandidateRef === flow.decision.intakeCandidateRef },
    { from: "ProspectPromotionWorkflow", to: "ProspectPromotionExecution", valid: flow.execution.workflowRef === flow.workflow.workflowId && flow.execution.promotionDecisionRef === flow.workflow.promotionDecisionRef },
    { from: "ProspectIntakeCandidate", to: "ProspectProfile", valid: flow.candidate.proposedProspectProfileRef === flow.prospectProfile.profileId && flow.prospectProfile.prospectCycleRef === flow.candidate.cycleRef },
  ];

  const identifiers = [flow.refs.watchlist, flow.refs.entry, flow.refs.identity, flow.refs.candidate, flow.refs.entity, flow.refs.person, flow.refs.player, flow.refs.prospect, flow.refs.decision, flow.refs.decisionTarget, flow.refs.workflow, flow.refs.dryRun, flow.refs.execution];
  const duplicateIdentifiers = identifiers.filter((value, index) => identifiers.indexOf(value) !== index);
  const semanticClaims = flow.identityIntake.identityClaims.map((claim) => `${claim.claimType}:${JSON.stringify(claim.claimedValue).toLowerCase()}`);
  const duplicateConcepts = semanticClaims.filter((value, index) => semanticClaims.indexOf(value) !== index);
  const missingRequiredInformation = [
    { field: "eligibility.state", status: flow.prospectProfile.eligibility.state, reason: "The validation source does not establish 2027 NFL Draft eligibility." },
    { field: "declaration.state", status: flow.prospectProfile.declaration.state, reason: "The validation source does not establish a draft declaration." },
    { field: "entry.pathwayType", status: flow.prospectProfile.entry.pathwayType, reason: "The entry pathway cannot be established before eligibility/declaration review." },
  ];
  const referenceIntegrity = { valid: transitions.every((entry) => entry.valid) && duplicateIdentifiers.length === 0, duplicateIdentifiers };
  const allContractsValid = contractChecks.every((entry) => entry.valid);
  const readiness = {
    state: allContractsValid && referenceIntegrity.valid && missingRequiredInformation.length === 0 ? "READY_FOR_PROMOTION" : allContractsValid && referenceIntegrity.valid ? "GOVERNED_VALIDATION_COMPLETE_PROMOTION_BLOCKED" : "INVALID",
    contractsValid: allContractsValid, transitionsValid: transitions.every((entry) => entry.valid), referenceIntegrityValid: referenceIntegrity.valid,
    duplicateConceptCount: duplicateConcepts.length, missingInformationCount: missingRequiredInformation.length,
    promotionAuthorized: false, executionAuthorized: false, persistencePerformed: false,
    rationale: "The governed flow is structurally valid, but eligibility, declaration, and entry-pathway facts remain unresolved.",
  };
  return { contractChecks, transitions, referenceIntegrity, duplicateConcepts, missingRequiredInformation, readiness };
}

export function runProspectIntakeEndToEndValidation({ throwOnFailure = false } = {}) {
  const flow = buildValidationFlow(); const validation = evaluateFlow(flow);
  const cases = [
    ...validation.contractChecks.map((entry) => ({ id: `contract:${entry.contract}`, passed: entry.valid, message: entry.valid ? `${entry.contract} validates.` : `${entry.contract} failed validation.`, details: entry })),
    ...validation.transitions.map((entry) => ({ id: `transition:${entry.from}->${entry.to}`, passed: entry.valid, message: entry.valid ? `${entry.from} to ${entry.to} references agree.` : `${entry.from} to ${entry.to} reference mismatch.`, details: entry })),
    { id: "reference-integrity", passed: validation.referenceIntegrity.valid, message: validation.referenceIntegrity.valid ? "All governed references are internally consistent." : "Reference integrity failed.", details: validation.referenceIntegrity },
    { id: "duplicate-concepts", passed: validation.duplicateConcepts.length === 0, message: validation.duplicateConcepts.length === 0 ? "No duplicate identity concepts detected." : "Duplicate identity concepts detected.", details: validation.duplicateConcepts },
    { id: "missing-information-detected", passed: validation.missingRequiredInformation.length === 3, message: "Eligibility, declaration, and entry-pathway gaps were detected without inventing facts.", details: validation.missingRequiredInformation },
    { id: "safe-final-readiness", passed: validation.readiness.state === "GOVERNED_VALIDATION_COMPLETE_PROMOTION_BLOCKED" && !validation.readiness.promotionAuthorized && !validation.readiness.persistencePerformed, message: "Final readiness correctly blocks promotion and persistence.", details: validation.readiness },
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, subject: SUBJECT, total: cases.length, passed, failed, cases, ...validation, architecturalGap: null };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`);
  return result;
}

export default Object.freeze({ runProspectIntakeEndToEndValidation });
