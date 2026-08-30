import { createProspectProfilePreparationRecord } from "../../phase2A/sprint2A_3A/ProspectProfilePreparationRecord.js";
import { quarterbackResearchRecords, SPRINT_2C1_CAPTURE_DATE, SPRINT_2C1_COHORT_REF } from "./quarterbackResearch.js";

const freeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
};

export const quarterbackPreparationRecords = freeze(quarterbackResearchRecords.map((record) => {
  const slug = record.candidateRef.split(":").at(-1);
  return createProspectProfilePreparationRecord({
    preparationRecordRef: `preparation:2027:2c1:qb:${slug}`,
    intakeCandidateRef: record.candidateRef,
    identityClassification: "NON_CANONICAL_PREPARATION_RECORD",
    cohortRef: SPRINT_2C1_COHORT_REF,
    operationRef: "operation:repository-only:2027:2c1:quarterback-cohort",
    expectedDraftYear: 2027,
    draftYearStatus: "ELIGIBILITY_REVIEW_REQUIRED",
    provisionalProgram: record.currentProgram,
    canonicalProgramResolutionRequired: true,
    sourceRefs: record.sources.map((source) => source.sourceRef),
    evidenceRefs: record.evidence.map((evidence) => evidence.evidenceRef),
    eligibilityRefs: [`review:eligibility:${record.candidateRef}`],
    declarationRefs: [`review:declaration:${record.candidateRef}`],
    supportingRecordRefs: [
      `supporting:2027:2c1:qb:${slug}:measurements`,
      `supporting:2027:2c1:qb:${slug}:production`,
      `supporting:2027:2c1:qb:${slug}:testing`,
      `supporting:2027:2c1:qb:${slug}:scouting`
    ],
    reviewRefs: [`review:quarterback-cohort:${record.candidateRef}`],
    blockerRefs: [
      `blocker:${record.candidateRef}:eligibility`,
      `blocker:${record.candidateRef}:declaration`,
      `blocker:${record.candidateRef}:canonical-identity`,
      `blocker:${record.candidateRef}:independent-scouting`
    ],
    assemblyCompleteness: "VALID_WITH_LIMITATIONS",
    lifecycle: "VALIDATED_WITH_LIMITATIONS",
    promotion: { readiness: "DEFERRED", authorized: false, decisionRef: null },
    persistence: { readiness: "DEFERRED", authorized: false },
    availability: { research: true, intake: true, preparation: true, review: true, fixtureDraftRoom: false, fixtureDraftResultsReference: false, resolver: false, simulator: false, bigBoard: false, liveDraftRoom: false, liveDraftResults: false, persistence: false },
    provenance: { createdBy: "chatgpt-release-package-workflow", createdAt: SPRINT_2C1_CAPTURE_DATE, predecessorStatus: record.cohortStatus },
    notes: "Position-group preparation record only; no canonical mapping, persistence, resolver registration, or application availability.",
    extensions: {
      positionGroup: "QUARTERBACK",
      rosterClass: record.rosterClass,
      measurementStatus: record.measurements.classification,
      productionStatus: record.production.productionStatus ?? "BOUNDED_OFFICIAL_PRODUCTION_RETAINED",
      eligibilityStatus: record.eligibilityStatus,
      declarationStatus: record.declarationStatus,
      testingStatus: record.testingStatus,
      scoutingStatus: record.scoutingStatus
    }
  });
}));

export default quarterbackPreparationRecords;
