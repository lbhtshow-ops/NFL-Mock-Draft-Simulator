import { sprint2A2Candidates } from "../sprint2A_2/cohortResearch.js";

export const SPRINT_2A3B_TEMPORAL_REFERENCE = "2026-08-03";
export const SPRINT_2A3B_COHORT_REF = "preparation-cohort:2027:2a3b";
const freeze = (value) => { Object.values(value).forEach((item) => item && typeof item === "object" && !Object.isFrozen(item) && freeze(item)); return Object.freeze(value); };
const slugOf = ({ candidateRef }) => candidateRef.split(":").at(-1);

const projectedPosition = ({ officialPosition, secondaryPositions }) => {
  if (officialPosition === "ER") return "EDGE";
  if (officialPosition === "DB") return secondaryPositions.find((value) => value === "S" || value === "CB") ?? "DB";
  if (officialPosition === "OL" && secondaryPositions.includes("OT")) return "OT";
  return officialPosition;
};

export const supportingRecords = freeze(sprint2A2Candidates.flatMap((candidate) => {
  const slug = slugOf(candidate);
  const sourceRefs = candidate.sources.map(({ sourceRef }) => sourceRef);
  const evidenceRefs = candidate.evidence.map(({ evidenceRef }) => evidenceRef);
  const base = { intakeCandidateRef: candidate.candidateRef, sourceRefs, evidenceRefs, temporalRef: SPRINT_2A3B_TEMPORAL_REFERENCE, classification: "NON_CANONICAL_PREPARATION_DECLARATION" };
  const record = (domain, body) => ({ supportingRecordRef: `supporting:2027:2a3b:${slug}:${domain}`, domain, ...base, ...body });
  return [
    record("bio", { displayName: candidate.name, aliases: candidate.aliases, academicClassDeclaration: candidate.academicClass, officialRosterPosition: candidate.officialPosition, limitations: ["Only fields retained by Sprint 2A.2 are declared; numeric roster measurements and jersey number are not present in predecessor evidence."] }),
    record("program-role", { provisionalProgramRef: candidate.program.programRef, officialProgramDisplay: candidate.program.displayName, conferenceDeclaration: candidate.program.conference, canonicalProgramResolutionRequired: true, transferRelationship: candidate.transferStatus, officialPosition: candidate.officialPosition, normalizedPosition: candidate.officialPosition === "ER" ? null : candidate.officialPosition, projectedNflPosition: projectedPosition(candidate), secondaryPositions: candidate.secondaryPositions, limitations: ["Program identity is provisional.", "Official and projected positions remain separate."] }),
    record("measurements", { availability: "MEASUREMENTS_NOT_RETAINED_IN_PREDECESSOR", measurements: [], conflictStatus: "UNRESOLVED", limitations: ["No value is inferred from the official biography claim summary."] }),
    record("production", { seasons: [], completeness: candidate.objectiveCompleteness, modeledOutput: false, limitations: ["Sprint 2A.2 classifies objective-data completeness but retains no governed season stat line; production values are deferred."] }),
    record("testing", { availability: "TESTING_UNAVAILABLE", results: [], limitations: ["No verified or reported testing result is retained by Sprint 2A.2."] }),
    record("scouting", { observedRole: candidate.purpose, projectedNflRole: projectedPosition(candidate), strengths: [], concerns: [], notes: [], versatilityRoles: candidate.secondaryPositions, completeness: "LIMITED", limitations: ["Purpose and position declarations are preparation context, not a grade, ranking, or FID-derived intelligence."] }),
    record("eligibility-declaration", { expectedDraftYear: candidate.expectedDraftYear, draftYearStatus: candidate.draftYearStatus, eligibilityStatus: candidate.eligibilityStatus, declarationStatus: candidate.declarationStatus, limitations: ["Expected draft year is not eligibility confirmation or a declaration."] })
  ];
}));

export const supportingRecordIndex = freeze(Object.fromEntries(supportingRecords.map((record) => [record.supportingRecordRef, record])));
export const supportingRecordsFor = (candidateRef) => supportingRecords.filter((record) => record.intakeCandidateRef === candidateRef);

export const supportingRecordArchitectureDecisions = freeze({
  bio: "CREATE_BOUNDED_PREPARATION_DECLARATION", currentProgram: "CREATE_BOUNDED_PREPARATION_DECLARATION", transferHistory: "CREATE_BOUNDED_PREPARATION_DECLARATION", officialPosition: "CREATE_BOUNDED_PREPARATION_DECLARATION", normalizedPosition: "CREATE_BOUNDED_PREPARATION_DECLARATION", projectedRole: "CREATE_BOUNDED_PREPARATION_DECLARATION", secondaryPositions: "CREATE_BOUNDED_PREPARATION_DECLARATION", measurements: "CREATE_BOUNDED_PREPARATION_DECLARATION", objectiveProduction: "CREATE_BOUNDED_PREPARATION_DECLARATION", athleticTesting: "CREATE_BOUNDED_PREPARATION_DECLARATION", scoutingObservations: "CREATE_BOUNDED_PREPARATION_DECLARATION", strengths: "CREATE_BOUNDED_PREPARATION_DECLARATION", concerns: "CREATE_BOUNDED_PREPARATION_DECLARATION", notes: "CREATE_BOUNDED_PREPARATION_DECLARATION", traits: "DEFER_DATA_DOMAIN", schemeRole: "CREATE_BOUNDED_PREPARATION_DECLARATION", eligibility: "REUSE_EXISTING_DECLARATION_CONTRACT", declaration: "REUSE_EXISTING_DECLARATION_CONTRACT", evidence: "REFERENCE_SPRINT_2A2_EVIDENCE_ONLY", review: "REUSE_EXISTING_DECLARATION_CONTRACT", blockers: "REUSE_EXISTING_DECLARATION_CONTRACT", provenance: "REFERENCE_SPRINT_2A2_EVIDENCE_ONLY"
});
