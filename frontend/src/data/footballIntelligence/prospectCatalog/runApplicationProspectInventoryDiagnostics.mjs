import {
  getApplicationProspectInventoryDiagnostics,
  listApplicationInventoryProspects,
} from "./ApplicationProspectInventory.js";
import {
  getApplicationProspectCatalogDiagnostics,
  listApplicationProspects,
  resolveApplicationProspect,
} from "./ApplicationProspectCatalog.js";

const inventory = listApplicationInventoryProspects({ draftYear: 2027 });
const catalog = listApplicationProspects({ draftYear: 2027 });
const inventoryDiagnostics = getApplicationProspectInventoryDiagnostics();
const catalogDiagnostics = getApplicationProspectCatalogDiagnostics();

const jeremiah = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:jeremiah-smith", name: "Jeremiah Smith", year: 2027 });
const arch = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:arch-manning", name: "Arch Manning", year: 2027 });
const braydon = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:braydon-bennett", name: "Braydon Bennett", year: 2027 });
const carter = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:carter-smith", name: "Carter Smith", year: 2027 });
const jamari = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:jamari-johnson", name: "Jamari Johnson", year: 2027 });
const anthony = resolveApplicationProspect({ application_prospect_ref: "app-prospect:2027:anthony-smith", name: "Anthony Smith", year: 2027 });

const checks = {
  finalAvailableSourceInventoryMaterialized: inventory.length === 333,
  publishedSourceCoverageTracked: inventoryDiagnostics.publishedSourceCount === 336 && inventoryDiagnostics.materializedSourceCount === 333,
  identityCollisionsExplicitlyWithheld: inventoryDiagnostics.excludedIdentityCollisionCount === 3 && JSON.stringify(inventoryDiagnostics.excludedSourceOrdinals) === JSON.stringify([315, 335, 336]),
  inventoryReferencesUnique: inventoryDiagnostics.uniqueApplicationReferences === inventory.length,
  sourceOrdinalsUnique: inventoryDiagnostics.uniqueSourceOrdinals === inventory.length,
  completeSevenRoundDepthAvailable: catalog.length > 257,
  enrichedEntryOverridesBaseInventory: jeremiah?.intelligenceCoverage?.level === "ENRICHED_RESEARCH",
  baseInventoryResolvesWithoutInventedIntelligence: arch?.intelligenceCoverage?.level === "BASE_PROFILE" && arch?.fidProspectRef == null,
  noCanonicalIdentifiersClaimed: catalogDiagnostics.canonicalIdentifierCount === 0,
  sourceOrdinalNotLbhtRank: inventory.every((entry) => entry.inventoryMetadata?.sourceOrdinalAuthority === "PROVENANCE_ONLY_NOT_LBHT_RANK"),
  finalMaterializedTailResolves: braydon?.intelligenceCoverage?.level === "BASE_PROFILE" && braydon?.inventoryMetadata?.sourceOrdinal === 334,
  collisionDoesNotOverwriteCarterSmithOT: carter?.identity?.officialPosition === "OT",
  collisionDoesNotOverwriteJamariJohnsonTE: jamari?.identity?.officialPosition === "TE",
  collisionDoesNotOverwriteAnthonySmithEdge: anthony?.identity?.officialPosition === "EDGE",
};

const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
console.log(JSON.stringify({
  status,
  contract: "Final2027ApplicationProspectInventoryDiagnostics",
  contractVersion: "MDS-5B.3D-1.0.0",
  checks,
  inventoryDiagnostics,
  catalogDiagnostics,
  samples: {
    enrichedOverride: jeremiah && { applicationProspectRef: jeremiah.applicationProspectRef, coverage: jeremiah.intelligenceCoverage?.level, fidProspectRef: jeremiah.fidProspectRef },
    finalMaterializedTail: braydon && { applicationProspectRef: braydon.applicationProspectRef, coverage: braydon.intelligenceCoverage?.level, sourceOrdinal: braydon.inventoryMetadata?.sourceOrdinal },
    collisionPreservation: {
      carterSmith: carter && { position: carter.identity?.officialPosition, sourceOrdinal: carter.inventoryMetadata?.sourceOrdinal },
      jamariJohnson: jamari && { position: jamari.identity?.officialPosition, sourceOrdinal: jamari.inventoryMetadata?.sourceOrdinal },
      anthonySmith: anthony && { position: anthony.identity?.officialPosition, sourceOrdinal: anthony.inventoryMetadata?.sourceOrdinal },
    },
  },
}, null, 2));

if (status !== "PASS") process.exitCode = 1;
