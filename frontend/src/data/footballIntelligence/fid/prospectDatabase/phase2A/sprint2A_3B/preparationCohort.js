import { createProspectProfilePreparationRecord } from "../sprint2A_3A/ProspectProfilePreparationRecord.js";
import { sprint2A2Candidates } from "../sprint2A_2/cohortResearch.js";
import { sprint2A2IntakeCandidates } from "../sprint2A_2/intakeCandidates.js";
import { SPRINT_2A3B_COHORT_REF, SPRINT_2A3B_TEMPORAL_REFERENCE, supportingRecordsFor } from "./supportingRecords.js";

const freeze = (value) => { Object.values(value).forEach((item) => item && typeof item === "object" && !Object.isFrozen(item) && freeze(item)); return Object.freeze(value); };
const intakeByCandidate = new Map(sprint2A2IntakeCandidates.map((record) => [record.candidateRef, record]));

export const preparationRecords = freeze(sprint2A2Candidates.map((candidate) => {
  const slug = candidate.candidateRef.split(":").at(-1);
  const intake = intakeByCandidate.get(candidate.candidateRef);
  const records = supportingRecordsFor(candidate.candidateRef);
  const draftRoomStatus = "DRAFT_ROOM_FIXTURE_READY_WITH_LIMITATIONS";
  const draftResultsStatus = "DRAFT_RESULTS_FIXTURE_REFERENCE_READY_WITH_LIMITATIONS";
  return createProspectProfilePreparationRecord({
    preparationRecordRef: `preparation:2027:2a3b:${slug}`,
    intakeCandidateRef: candidate.candidateRef,
    identityClassification: "NON_CANONICAL_PREPARATION_RECORD",
    cohortRef: SPRINT_2A3B_COHORT_REF,
    operationRef: "operation:repository-only:2027:2a3b",
    expectedDraftYear: 2027,
    draftYearStatus: "ELIGIBILITY_REVIEW_REQUIRED",
    provisionalProgram: candidate.program,
    canonicalProgramResolutionRequired: true,
    sourceRefs: candidate.sources.map(({ sourceRef }) => sourceRef),
    evidenceRefs: candidate.evidence.map(({ evidenceRef }) => evidenceRef),
    eligibilityRefs: [`review:eligibility:${candidate.candidateRef}`],
    declarationRefs: [`supporting:2027:2a3b:${slug}:eligibility-declaration`],
    supportingRecordRefs: records.map(({ supportingRecordRef }) => supportingRecordRef),
    reviewRefs: intake.reviewRecords.map(({ reviewId }) => reviewId),
    blockerRefs: intake.blockerRecords.map(({ blockerId }) => blockerId),
    assemblyCompleteness: "VALID_WITH_LIMITATIONS",
    lifecycle: "VALIDATED_WITH_LIMITATIONS",
    promotion: { readiness: "DEFERRED", authorized: false, decisionRef: null },
    persistence: { readiness: "DEFERRED", authorized: false },
    availability: { research: true, intake: true, preparation: true, review: true, fixtureDraftRoom: true, fixtureDraftResultsReference: true, resolver: false, simulator: false, bigBoard: false, liveDraftRoom: false, liveDraftResults: false, persistence: false },
    provenance: { createdBy: "codex-repository-preparation", createdAt: SPRINT_2A3B_TEMPORAL_REFERENCE, predecessorCohortRef: "FID_2027_FIRST_RESEARCH_COHORT_2A2", boundaryRef: "FID-PROSPECT-PROFILE-PREPARATION-1.0.0" },
    notes: "Repository-only preparation; no canonical identity, promotion, persistence, or application registration.",
    extensions: { outcome: "PREPARATION_RECORD_VALID_WITH_LIMITATIONS", draftRoomStatus, draftResultsStatus, eligibilityStatus: candidate.eligibilityStatus, declarationStatus: candidate.declarationStatus }
  });
}));

const countBy = (values) => freeze(Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length])));
export const preparedCohortManifest = freeze({
  cohortRef: SPRINT_2A3B_COHORT_REF,
  predecessorCohortRef: "FID_2027_FIRST_RESEARCH_COHORT_2A2",
  preparationBoundaryRef: "FID-PROSPECT-PROFILE-PREPARATION-1.0.0",
  targetDraftYear: 2027,
  candidateRefs: sprint2A2Candidates.map(({ candidateRef }) => candidateRef),
  preparationRecordRefs: preparationRecords.map(({ preparationRecordRef }) => preparationRecordRef),
  constructedCount: 16, validCount: 0, validWithLimitationsCount: 16, reviewRequiredCount: 0, blockedCount: 0, deferredCount: 0,
  positionDistribution: countBy(sprint2A2Candidates.map(({ officialPosition }) => officialPosition)),
  programDistribution: countBy(sprint2A2Candidates.map(({ program }) => program.displayName)),
  dataCompletenessDistribution: countBy(sprint2A2Candidates.map(({ objectiveCompleteness }) => objectiveCompleteness)),
  eligibilityDistribution: { ELIGIBILITY_REVIEW_REQUIRED: 16 },
  draftRoomFixtureReadinessDistribution: { DRAFT_ROOM_FIXTURE_READY_WITH_LIMITATIONS: 16 },
  draftResultsFixtureReadinessDistribution: { DRAFT_RESULTS_FIXTURE_REFERENCE_READY_WITH_LIMITATIONS: 16 },
  sharedBlockers: ["CANONICAL_PROGRAM_RESOLUTION_REQUIRED", "ELIGIBILITY_REVIEW_REQUIRED", "DECLARATION_UNRESOLVED", "LIVE_PERSISTENCE_DEFERRED"],
  promotionProhibited: true, persistenceDeferred: true, resolverAvailable: false, simulatorAvailable: false, bigBoardAvailable: false, ranked: false,
  provenance: { createdAt: SPRINT_2A3B_TEMPORAL_REFERENCE, predecessor: "Sprint 2A.2 official-source evidence and intake records" },
  limitations: ["Numeric measurements, season stat lines, testing results, and detailed scouting statements were not retained by Sprint 2A.2 and remain unpopulated.", "All identities and program references remain non-canonical/provisional."]
});
