import { listApplicationInventoryProspects } from "../prospectCatalog/ApplicationProspectInventory.js";
import { createProspectVerificationReport } from "./VerificationReport.js";
import { footballIntelligenceVerificationGate } from "./ProspectVerificationEngine.js";
import { getProspectDraftEligibility } from "./ProspectEligibilityEngine.js";

const entries = listApplicationInventoryProspects({ draftYear: 2027 });
const byRef = new Map(entries.map((entry) => [entry.applicationProspectRef, entry]));
const carterOt = byRef.get("app-prospect:2027:carter-smith");
const carterQb = byRef.get("app-prospect:2027:carter-smith:source-315");
const carterQbEligibility = getProspectDraftEligibility("app-prospect:2027:carter-smith:source-315");
const report = createProspectVerificationReport(entries);

const checks = {
  applicationInventoryCountPreserved336: entries.length === 336,
  carterOtVerifiedIndiana: carterOt?.identity?.officialPosition === "OT" && carterOt?.identity?.program?.displayName === "Indiana" && carterOt?.verification?.status === "VERIFIED",
  carterQbVerifiedWisconsin: carterQb?.identity?.officialPosition === "QB" && carterQb?.identity?.program?.displayName === "Wisconsin" && carterQb?.verification?.status === "VERIFIED",
  carterQbSourceProgramPreserved: carterQb?.inventoryMetadata?.sourceReportedIdentity?.program === "Indiana",
  carterQbApplicationReferencePreserved: carterQb?.applicationProspectRef === "app-prospect:2027:carter-smith:source-315",
  carterQbEligibilityNotEligible2027: carterQbEligibility.status === "NOT_ELIGIBLE",
  carterQbEarliestDraftYear2028: carterQbEligibility.earliestDraftYear === 2028,
  carterQbBlockedFromFootballIntelligence: footballIntelligenceVerificationGate(carterQb).allowed === false && footballIntelligenceVerificationGate(carterQb).reason === "DRAFT_CLASS_NOT_ELIGIBLE",
  carterOtStillBlockedUntilEligibilityVerified: footballIntelligenceVerificationGate(carterOt).allowed === false && footballIntelligenceVerificationGate(carterOt).reason === "DRAFT_ELIGIBILITY_VERIFICATION_REQUIRED",
  noBulkEligibilityClaim: entries.filter((entry) => entry.verification?.draftEligibility?.status === "ELIGIBLE").length === 0,
};

const result = {
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
  contract: "ProspectSourceVerificationEligibilityDiagnostics",
  contractVersion: "MDS-5B.6-REV2-1.0.0",
  checks,
  report: {
    analyzedCount: report.analyzedCount,
    verifiedIdentityCount: report.verifiedCount,
    sourceReportedIdentityCount: report.sourceReportedCount,
    footballIntelligenceEligibleCount: report.footballIntelligenceEligibleCount,
  },
  carterSmith: { offensiveTackle: carterOt, quarterback: carterQb, quarterbackEligibility: carterQbEligibility },
};

console.log(JSON.stringify(result, null, 2));
if (result.status !== "PASS") process.exitCode = 1;
