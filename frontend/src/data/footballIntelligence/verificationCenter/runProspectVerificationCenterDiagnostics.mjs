import {
  createProspectVerificationCenterSummary,
  getProspectVerificationCenterRecord,
  listProspectVerificationCenterRecords,
  listProspectVerificationQueue,
} from "./ProspectVerificationCenterModel.js";

const records = listProspectVerificationCenterRecords({ draftYear: 2027 });
const summary = createProspectVerificationCenterSummary(records);
const queue = listProspectVerificationQueue({ draftYear: 2027 });
const carterOt = getProspectVerificationCenterRecord("app-prospect:2027:carter-smith");
const carterQb = getProspectVerificationCenterRecord("app-prospect:2027:carter-smith:source-315");
const checks = {
  catalogVisible: records.length === 338,
  summaryMatchesCatalog: summary.totalProspects === records.length,
  verifiedIdentityVisible: summary.identityVerified >= 2,
  sourceReportedRemainUnverified: summary.sourceReported >= 334,
  noFalseFootballIntelligenceReadiness: summary.footballIntelligenceReady === 0,
  reviewQueuePopulated: queue.length > 0,
  carterOtIndianaVerified: carterOt?.program === "Indiana" && carterOt?.identityStatus === "VERIFIED",
  carterQbWisconsinVerified: carterQb?.program === "Wisconsin" && carterQb?.identityStatus === "VERIFIED",
  carterQbNotEligible2027: carterQb?.eligibilityStatus === "NOT_ELIGIBLE" && carterQb?.earliestDraftYear === 2028,
  carterQbIntelligenceLocked: carterQb?.footballIntelligenceEligible === false,
};
console.log(JSON.stringify({
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
  contract: "ProspectVerificationCenterDiagnostics",
  contractVersion: "MDS-5B.7-1.0.0",
  checks,
  summary,
  queueHead: queue.slice(0, 5).map((record) => ({ applicationProspectRef: record.applicationProspectRef, displayName: record.displayName, program: record.program, eligibilityStatus: record.eligibilityStatus, gateReason: record.gateReason })),
}, null, 2));
