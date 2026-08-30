import assert from "node:assert/strict";
import {
  getProspectDataQualityDiagnostics,
  getProspectDataQualityRecord,
  PROSPECT_DATA_QUALITY_STATUS,
} from "./ProspectDataQualityRegistry.js";
import { getApplicationInventoryProspectByRef } from "./ApplicationProspectInventory.js";

const otRef = "app-prospect:2027:carter-smith";
const qbRef = "app-prospect:2027:carter-smith:source-315";
const otQuality = getProspectDataQualityRecord(otRef);
const qbQuality = getProspectDataQualityRecord(qbRef);
const qbInventory = getApplicationInventoryProspectByRef(qbRef);

const checks = {
  officialCarterOtVerified: otQuality?.status === PROSPECT_DATA_QUALITY_STATUS.VERIFIED,
  sourceScopedCarterQbVerified: qbQuality?.status === PROSPECT_DATA_QUALITY_STATUS.VERIFIED,
  sourceScopedCarterQbCorrectedToWisconsin: qbQuality?.correction?.verifiedValue === "Wisconsin",
  sourceScopedCarterQbSourceValuePreserved: qbQuality?.correction?.sourceReportedValue === "Indiana",
  sourceScopedCarterQbPreserved: Boolean(qbInventory),
  sourceScopedCarterQbCarriesQualityState: qbInventory?.dataQuality?.status === PROSPECT_DATA_QUALITY_STATUS.VERIFIED,
  sourceScopedCarterQbEffectiveProgramWisconsin: qbInventory?.identity?.program?.displayName === "Wisconsin",
  sourceScopedCarterQbImportedProgramPreserved: qbInventory?.inventoryMetadata?.sourceReportedIdentity?.program === "Indiana",
  noCanonicalAuthorityClaimed: qbInventory?.canonicalIdentifier == null,
};

Object.entries(checks).forEach(([name, passed]) => assert.equal(Boolean(passed), true, name));

console.log(JSON.stringify({
  status: "PASS",
  contract: "ProspectDataQualityFoundationDiagnostics",
  contractVersion: "MDS-5B.6-1.0.0",
  checks,
  diagnostics: getProspectDataQualityDiagnostics(),
  carterSmith: {
    verifiedOfficialRosterRecord: otQuality,
    verifiedCorrectedQuarterbackRecord: qbQuality,
  },
}, null, 2));
