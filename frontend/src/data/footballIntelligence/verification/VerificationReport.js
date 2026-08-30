import { PROSPECT_VERIFICATION_STATUS } from "./VerificationStatuses.js";
import { verifyApplicationProspect } from "./ProspectVerificationEngine.js";

export function createProspectVerificationReport(entries = []) {
  const results = entries.map((entry) => verifyApplicationProspect(entry));
  const count = (status) => results.filter((result) => result.status === status).length;
  return Object.freeze({
    analyzedCount: results.length,
    verifiedCount: count(PROSPECT_VERIFICATION_STATUS.VERIFIED),
    sourceReportedCount: count(PROSPECT_VERIFICATION_STATUS.SOURCE_REPORTED),
    reviewRequiredCount: results.filter((result) => result.reviewRequired).length,
    conflictFindingCount: results.reduce((sum, result) => sum + result.findings.filter((finding) => String(finding.rule).includes("MISMATCH") || String(finding.rule).includes("CONFLICT")).length, 0),
    footballIntelligenceEligibleCount: results.filter((result) => result.footballIntelligenceEligible).length,
    results: Object.freeze(results),
  });
}
