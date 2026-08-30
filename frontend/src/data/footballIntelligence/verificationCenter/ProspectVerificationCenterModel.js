import { listApplicationProspects } from "../prospectCatalog/ApplicationProspectCatalog.js";
import { verifyApplicationProspect, footballIntelligenceVerificationGate } from "../verification/ProspectVerificationEngine.js";
import { PROSPECT_DRAFT_ELIGIBILITY_STATUS } from "../verification/EligibilityStatuses.js";
import { PROSPECT_VERIFICATION_STATUS } from "../verification/VerificationStatuses.js";

export const PROSPECT_VERIFICATION_CENTER_CONTRACT = "ProspectVerificationCenter";
export const PROSPECT_VERIFICATION_CENTER_VERSION = "MDS-5B.7-1.0.0";

function normalized(entry) {
  const verification = entry?.verification || verifyApplicationProspect(entry);
  const gate = footballIntelligenceVerificationGate({ ...entry, verification });
  const identity = verification?.effectiveIdentity || verification?.sourceIdentity || {};
  const eligibility = verification?.draftEligibility || {};
  const findings = verification?.findings || [];
  return Object.freeze({
    applicationProspectRef: entry?.applicationProspectRef || verification?.applicationProspectRef || null,
    draftYear: entry?.draftYear || eligibility?.draftYear || null,
    displayName: identity.displayName || entry?.identity?.displayName || "Unknown prospect",
    position: identity.position || entry?.identity?.officialPosition || "--",
    program: identity.program || entry?.identity?.program?.displayName || "Program pending",
    verificationStatus: verification?.status || PROSPECT_VERIFICATION_STATUS.UNKNOWN,
    identityStatus: verification?.verifiedFields?.identity || "UNKNOWN",
    programStatus: verification?.verifiedFields?.program || "UNKNOWN",
    positionStatus: verification?.verifiedFields?.position || "UNKNOWN",
    eligibilityStatus: eligibility?.status || PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN,
    earliestDraftYear: eligibility?.earliestDraftYear ?? null,
    reviewRequired: Boolean(verification?.reviewRequired),
    footballIntelligenceEligible: Boolean(gate?.allowed),
    gateReason: gate?.reason || "IDENTITY_VERIFICATION_REQUIRED",
    authority: verification?.authority || null,
    supportingEvidence: Object.freeze([...(verification?.supportingEvidence || []), ...(eligibility?.authority || [])]),
    findings: Object.freeze(findings),
    limitations: Object.freeze(verification?.limitations || []),
  });
}

export function listProspectVerificationCenterRecords({ draftYear = 2027 } = {}) {
  return Object.freeze(listApplicationProspects({ draftYear }).map(normalized));
}

export function getProspectVerificationCenterRecord(input) {
  if (!input) return null;
  const ref = typeof input === "string" ? input : input.application_prospect_ref || input.applicationProspectRef;
  if (!ref) return null;
  return listProspectVerificationCenterRecords({ draftYear: input?.year || input?.draftYear || 2027 })
    .find((record) => record.applicationProspectRef === ref) || null;
}

export function createProspectVerificationCenterSummary(records = listProspectVerificationCenterRecords()) {
  const count = (predicate) => records.filter(predicate).length;
  return Object.freeze({
    contract: PROSPECT_VERIFICATION_CENTER_CONTRACT,
    contractVersion: PROSPECT_VERIFICATION_CENTER_VERSION,
    totalProspects: records.length,
    identityVerified: count((r) => r.identityStatus === "VERIFIED"),
    sourceReported: count((r) => r.verificationStatus === PROSPECT_VERIFICATION_STATUS.SOURCE_REPORTED),
    eligibilityEligible: count((r) => r.eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE),
    eligibilityNotEligible: count((r) => r.eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE),
    eligibilityPending: count((r) => [PROSPECT_DRAFT_ELIGIBILITY_STATUS.UNKNOWN, PROSPECT_DRAFT_ELIGIBILITY_STATUS.REVIEW_REQUIRED].includes(r.eligibilityStatus)),
    reviewRequired: count((r) => r.reviewRequired),
    footballIntelligenceReady: count((r) => r.footballIntelligenceEligible),
    findings: records.reduce((sum, r) => sum + r.findings.length, 0),
  });
}

export function listProspectVerificationQueue({ draftYear = 2027 } = {}) {
  const records = listProspectVerificationCenterRecords({ draftYear });
  const priority = (record) => {
    if (record.eligibilityStatus === PROSPECT_DRAFT_ELIGIBILITY_STATUS.NOT_ELIGIBLE) return 0;
    if (record.findings.some((finding) => finding.severity === "HIGH")) return 1;
    if (record.verificationStatus === PROSPECT_VERIFICATION_STATUS.VERIFIED && record.eligibilityStatus !== PROSPECT_DRAFT_ELIGIBILITY_STATUS.ELIGIBLE) return 2;
    if (record.verificationStatus === PROSPECT_VERIFICATION_STATUS.SOURCE_REPORTED) return 3;
    return 4;
  };
  return Object.freeze(records.filter((r) => r.reviewRequired).sort((a, b) => priority(a) - priority(b) || a.displayName.localeCompare(b.displayName)));
}
