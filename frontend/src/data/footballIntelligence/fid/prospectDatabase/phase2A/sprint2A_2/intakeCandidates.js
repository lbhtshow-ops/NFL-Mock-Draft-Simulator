import { createProspectIntakeCandidate } from "../../../prospectIntake/ProspectIntakeCandidateContract.js";
import { sprint2A2Candidates, SPRINT_2A2_CAPTURE_DATE, SPRINT_2A2_CYCLE_REF } from "./cohortResearch.js";

export const sprint2A2IntakeCandidates = Object.freeze(sprint2A2Candidates.map((record) => createProspectIntakeCandidate({
  intakeId: `intake:2027:2a2:${record.candidateRef.split(":").at(-1)}`,
  cycleRef: SPRINT_2A2_CYCLE_REF,
  candidateRef: record.candidateRef,
  candidateLabel: record.name,
  stage: "EVIDENCE_REVIEW",
  status: "BLOCKED",
  discoveryContext: { origin: "MANUAL_RESEARCH", discoveredAt: SPRINT_2A2_CAPTURE_DATE, submittedLabel: record.name, submittedSchool: record.program.displayName, submittedPosition: record.officialPosition, submittedClass: record.academicClass, sourceRefs: record.sources.map(({ sourceRef }) => sourceRef) },
  identityReview: { reviewId: `review:identity:${record.candidateRef}`, outcome: "MATCH_PROPOSED", reviewedAt: SPRINT_2A2_CAPTURE_DATE, candidateName: record.name, school: record.program.displayName, position: record.officialPosition, duplicateCandidateConcern: false, transferConcern: record.transferStatus.startsWith("TRANSFER_CONFIRMED"), sourceRefs: record.sources.map(({ sourceRef }) => sourceRef), evidenceRefs: record.evidence.map(({ evidenceRef }) => evidenceRef), verification: { state: "REVIEWED", reviewedAt: SPRINT_2A2_CAPTURE_DATE } },
  blockerRecords: record.blockers.map((blockerType, index) => ({ blockerId: `blocker:${record.candidateRef}:${index + 1}`, blockerType: blockerType.split(":")[0] === "TECHNICAL_BLOCKER" ? "TECHNICAL_BLOCKER" : blockerType, status: "OPEN", openedAt: SPRINT_2A2_CAPTURE_DATE, reason: blockerType })),
  reviewRecords: [{ reviewId: `review:eligibility:${record.candidateRef}`, reviewType: "ELIGIBILITY_REVIEW", status: "IN_PROGRESS", outcome: "NO_CONCLUSION", reviewedAt: SPRINT_2A2_CAPTURE_DATE, sourceRefs: record.sources.map(({ sourceRef }) => sourceRef), evidenceRefs: record.evidence.map(({ evidenceRef }) => evidenceRef), findings: [record.eligibilityStatus, record.declarationStatus], blockerRefs: record.blockers.map((_, index) => `blocker:${record.candidateRef}:${index + 1}`) }],
  sourceRefs: record.sources.map(({ sourceRef }) => sourceRef),
  evidenceRefs: record.evidence.map(({ evidenceRef }) => evidenceRef),
  eligibilityEvidenceRefs: [`evidence:2027:${record.candidateRef.split(":").at(-1)}:pathway`],
  declarationEvidenceRefs: [],
  schoolEvidenceRefs: [`evidence:2027:${record.candidateRef.split(":").at(-1)}:roster`],
  positionEvidenceRefs: [`evidence:2027:${record.candidateRef.split(":").at(-1)}:roster`],
  readinessDeclaration: [{ declarationId: `readiness:${record.candidateRef}`, scope: "PROSPECT_PROFILE", state: "DEFERRED", reviewedAt: SPRINT_2A2_CAPTURE_DATE, blockerRefs: record.blockers.map((_, index) => `blocker:${record.candidateRef}:${index + 1}`), rationale: "Promotion and persistence are outside Sprint 2A.2 authorization." }],
  promotionPlan: { planId: `promotion-plan:${record.candidateRef}`, targets: [{ targetId: `promotion-target:${record.candidateRef}`, targetType: "PROSPECT_PROFILE", proposedAction: "DEFER", readinessState: "DEFERRED", reviewStatus: "DEFERRED", blockerRefs: record.blockers.map((_, index) => `blocker:${record.candidateRef}:${index + 1}`), notes: "No promotion authorized." }], createdAt: SPRINT_2A2_CAPTURE_DATE, blockerRefs: record.blockers.map((_, index) => `blocker:${record.candidateRef}:${index + 1}`) },
  verification: { state: "REVIEWED", reviewedAt: SPRINT_2A2_CAPTURE_DATE, notes: "Repository-only provisional intake fixture." },
  provenance: { createdBy: "codex-repository-research", createdAt: SPRINT_2A2_CAPTURE_DATE },
  lifecycle: { state: "OPEN", openedAt: SPRINT_2A2_CAPTURE_DATE },
  version: 1,
  workflowRevision: 1,
  notes: "No canonical identifier, promotion, persistence, or application availability."
})));

export default sprint2A2IntakeCandidates;
