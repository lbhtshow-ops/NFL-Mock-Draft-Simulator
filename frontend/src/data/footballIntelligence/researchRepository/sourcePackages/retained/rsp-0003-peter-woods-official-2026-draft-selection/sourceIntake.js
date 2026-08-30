import { reviewResearchSourceCandidate } from "../../../sourceIntake/ResearchSourceIntakeReview.js";
import researchRepository from "../../../../../researchRepository/index.js";

export const sourceIntakeDeclaration = Object.freeze({
  intakeId: "source-intake:rsp-0003:chiefs-peter-woods-selection",
  intakeRevision: 1,
  candidateId: "research-source:rsp-0003:chiefs-peter-woods-selection",
  sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.OFFICIAL,
  sourceType: "Official NFL club draft selection report",
  title: "Five Things to Know About New Chiefs DL Peter Woods",
  publisher: "Kansas City Chiefs",
  author: "Matt McMullen, Senior Team Reporter",
  publicationDate: "2026-04-24T09:38:00",
  accessDate: "2026-07-18",
  artifactIdentityType: "STABLE_URL",
  artifactIdentity: "https://www.chiefs.com/news/five-things-to-know-about-new-chiefs-dt-peter-woods-",
  methodology: { available: false, publicDescription: null, methodologyRef: null, notes: "UNAVAILABLE" },
  authorityByDomain: { draftSelection: "Official publication of the selecting NFL organization." },
  permittedRoles: [researchRepository.RESEARCH_ROLES.RECORDED_OBSERVATION, researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE],
  prohibitedRoles: [],
  access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC, requiresAuthentication: false },
  usageRestrictions: { rawContentStorageAllowed: false, quotationAllowed: false, derivedFactsAllowed: true, redistributionAllowed: false, attributionRequired: true, notes: "Only minimal factual declarations and content locators are retained." },
  conflictsOrLimitations: ["The article publication timestamp is not treated as the selection event date.", "No eligibility, declaration, lifecycle, roster, contract, or Population conclusion is authorized."],
  conflictingDeclarations: [],
  reviewerId: "reviewer:repository-owner",
  reviewerAuthorized: true,
  reviewDate: "2026-07-18",
  reviewDecision: "APPROVE",
  reviewNotes: "Approved as an official primary source for the six direct 2026 draft-selection facts declared by RSP-0003. Publication time is not treated as the selection-event date.",
  rejectionReason: null,
  provenance: { createdBy: null, createdAt: "2026-07-18" },
  lifecycle: { state: "DRAFT", revision: 1 },
  duplicateCandidateRefs: [],
});
export const sourceIntakeReview = reviewResearchSourceCandidate(sourceIntakeDeclaration);
export const researchSource = sourceIntakeReview.source;
export default Object.freeze({ sourceIntakeDeclaration, sourceIntakeReview, researchSource });
