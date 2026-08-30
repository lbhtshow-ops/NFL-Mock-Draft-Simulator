import { reviewResearchSourceCandidate } from "../../../sourceIntake/ResearchSourceIntakeReview.js";
import researchRepository from "../../../../../researchRepository/index.js";

export const sourceIntakeDeclaration = Object.freeze({
  intakeId: "source-intake:rsp-0001:sports-reference-peter-woods", intakeRevision: 1,
  candidateId: "research-source:rsp-0001:sports-reference-peter-woods", sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER,
  sourceType: "College player statistics page", title: "Peter Woods College Stats, School, Draft, Gamelog, Splits | College Football at Sports-Reference.com",
  publisher: "Sports Reference", author: "UNAVAILABLE", publicationDate: "UNKNOWN", accessDate: "2026-07-18",
  artifactIdentityType: "STABLE_URL", artifactIdentity: "https://www.sports-reference.com/cfb/players/peter-woods-1.html",
  methodology: { available: false, publicDescription: null, methodologyRef: null, notes: "UNKNOWN" }, authorityByDomain: {},
  permittedRoles: [researchRepository.RESEARCH_ROLES.RECORDED_OBSERVATION, researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE], prohibitedRoles: [],
  access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC, requiresAuthentication: false },
  usageRestrictions: { rawContentStorageAllowed: false, quotationAllowed: false, derivedFactsAllowed: null, redistributionAllowed: false, attributionRequired: true, notes: "Only minimal factual statistics and locators are retained." },
  conflictsOrLimitations: ["Publication date is UNKNOWN.", "Named author is UNAVAILABLE."], conflictingDeclarations: [],
  reviewerId: "reviewer:repository-owner", reviewerAuthorized: true, reviewDate: "2026-07-18", reviewDecision: "APPROVE", reviewNotes: "Approved for objective production-statistics research only; declared UNKNOWN and UNAVAILABLE metadata remains preserved.", rejectionReason: null,
  provenance: { createdBy: null, createdAt: "2026-07-18" }, lifecycle: { state: "DRAFT", revision: 1 }, duplicateCandidateRefs: [],
});

export const sourceIntakeReview = reviewResearchSourceCandidate(sourceIntakeDeclaration);
export const researchSource = sourceIntakeReview.source;

export default Object.freeze({ sourceIntakeDeclaration, sourceIntakeReview, researchSource });
