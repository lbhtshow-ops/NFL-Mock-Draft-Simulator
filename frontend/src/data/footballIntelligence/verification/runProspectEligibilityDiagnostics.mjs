import { listApplicationInventoryProspects } from "../prospectCatalog/ApplicationProspectInventory.js";
import { getProspectDraftEligibility, isKnownIneligibleForDraft } from "./ProspectEligibilityEngine.js";

const entries = listApplicationInventoryProspects({ draftYear: 2027 });
const qbRef = "app-prospect:2027:carter-smith:source-315";
const qb = entries.find((entry) => entry.applicationProspectRef === qbRef);
const eligibility = getProspectDraftEligibility(qbRef);
const checks = {
  applicationSourceRecordPreserved: Boolean(qb),
  verifiedProgramWisconsin: qb?.identity?.program?.displayName === "Wisconsin",
  notEligibleFor2027: eligibility.status === "NOT_ELIGIBLE",
  earliestDraftYear2028: eligibility.earliestDraftYear === 2028,
  knownIneligiblePredicateTrue: isKnownIneligibleForDraft(qbRef) === true,
  provenanceStillIndiana: qb?.inventoryMetadata?.sourceReportedIdentity?.program === "Indiana",
};
const result = { status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL", contract: "ProspectDraftEligibilityDiagnostics", contractVersion: "MDS-5B.6-REV2-1.0.0", checks, eligibility };
console.log(JSON.stringify(result, null, 2));
if (result.status !== "PASS") process.exitCode = 1;
