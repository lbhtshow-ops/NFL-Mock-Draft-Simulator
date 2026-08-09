import { getApplicationProspectInventoryDiagnostics, listApplicationInventoryProspects } from "./ApplicationProspectInventory.js";
import { getApplicationProspectCatalogDiagnostics, listApplicationProspects, resolveApplicationProspect, resolveApplicationProspectResolution } from "./ApplicationProspectCatalog.js";

const inventory = listApplicationInventoryProspects({ draftYear: 2027 });
const catalog = listApplicationProspects({ draftYear: 2027 });
const inventoryDiagnostics = getApplicationProspectInventoryDiagnostics();
const catalogDiagnostics = getApplicationProspectCatalogDiagnostics();

const exactCarterOt = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:carter-smith" });
const exactCarterQb = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:carter-smith:source-315" });
const exactJamariCb = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:jamari-johnson:source-335" });
const exactAnthonyDl = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:anthony-smith:source-336" });
const structuredCarterQb = resolveApplicationProspect({ name: "Carter Smith", year: 2027, position: "QB", college: "Indiana" });
const ambiguousCarter = resolveApplicationProspectResolution({ name: "Carter Smith", year: 2027 });
const ambiguousJamari = resolveApplicationProspectResolution({ name: "Jamari Johnson", year: 2027 });
const ambiguousAnthony = resolveApplicationProspectResolution({ name: "Anthony Smith", year: 2027 });
const jeremiah = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:jeremiah-smith" });

const checks = {
  allPublishedRowsMaterialized: inventory.length === 336 && inventoryDiagnostics.materializedSourceCount === 336,
  noIdentityCollisionExclusionsRemain: inventoryDiagnostics.excludedIdentityCollisionCount === 0,
  threeIdentityDisambiguationsActive: inventoryDiagnostics.disambiguatedIdentityCount === 3 && JSON.stringify(inventoryDiagnostics.disambiguatedSourceOrdinals) === JSON.stringify([315, 335, 336]),
  catalogContainsAllUniqueApplicationProspects: catalog.length === 338 && catalogDiagnostics.uniqueApplicationReferences === 338,
  referencesUnique: inventoryDiagnostics.uniqueApplicationReferences === inventory.length,
  sourceOrdinalsUnique: inventoryDiagnostics.uniqueSourceOrdinals === inventory.length,
  existingCarterOtReferencePreserved: exactCarterOt?.identity?.officialPosition === "OT",
  disambiguatedCarterQbResolves: exactCarterQb?.identity?.officialPosition === "QB" && exactCarterQb?.inventoryMetadata?.sourceOrdinal === 315,
  disambiguatedJamariCbResolves: exactJamariCb?.identity?.officialPosition === "CB" && exactJamariCb?.inventoryMetadata?.sourceOrdinal === 335,
  disambiguatedAnthonyDlResolves: exactAnthonyDl?.identity?.officialPosition === "DL" && exactAnthonyDl?.inventoryMetadata?.sourceOrdinal === 336,
  structuredIdentityResolvesCollision: structuredCarterQb?.applicationProspectRef === "app-prospect:2027:carter-smith:source-315",
  nameOnlyCarterIsAmbiguous: ambiguousCarter?.status === "AMBIGUOUS" && ambiguousCarter?.candidates?.length === 2,
  nameOnlyJamariIsAmbiguous: ambiguousJamari?.status === "AMBIGUOUS" && ambiguousJamari?.candidates?.length === 2,
  nameOnlyAnthonyIsAmbiguous: ambiguousAnthony?.status === "AMBIGUOUS" && ambiguousAnthony?.candidates?.length === 2,
  enrichedPrecedencePreserved: jeremiah?.intelligenceCoverage?.level === "ENRICHED_RESEARCH",
  noCanonicalIdentifiersClaimed: catalogDiagnostics.canonicalIdentifierCount === 0,
  completeSevenRoundDepthAvailable: catalog.length > 257,
};
const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
console.log(JSON.stringify({ status, contract: "UnifiedApplicationProspectIdentityDiagnostics", contractVersion: "MDS-5B.4-1.0.0", checks, inventoryDiagnostics, catalogDiagnostics, samples: { exactCarterOt, exactCarterQb, exactJamariCb, exactAnthonyDl, ambiguousCarter } }, null, 2));
if (status !== "PASS") process.exitCode = 1;
