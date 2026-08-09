import {
  INITIAL_2027_BASE_INVENTORY_SOURCE,
  INITIAL_2027_BASE_INVENTORY_EXCLUSIONS,
  INITIAL_2027_BASE_INVENTORY_DISAMBIGUATIONS,
  initial2027BaseInventoryRows,
} from "./initial2027BaseInventory.js";

export const APPLICATION_PROSPECT_INVENTORY_CONTRACT = "ApplicationProspectInventory";
export const APPLICATION_PROSPECT_INVENTORY_VERSION = "FIP-APPLICATION-PROSPECT-INVENTORY-1.4.0";

const normalizeRefName = (value = "") => String(value).trim().toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const normalizeText = (value = "") => String(value || "").trim().toLowerCase();
const normalizePosition = (value = "") => {
  const raw = String(value || "").trim().toUpperCase();
  const aliases = { "DE/ED": "EDGE", "DL/ED": "EDGE", "LB/ED": "EDGE", ED: "EDGE", DE: "EDGE", DB: "DB" };
  return aliases[raw] || raw || null;
};
const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value); Object.values(value).forEach((child) => deepFreeze(child, seen)); return Object.freeze(value);
};

export const createInventoryApplicationProspectRef = ({ draftYear, displayName, identityDiscriminator } = {}) => {
  const year = Number(draftYear); const slug = normalizeRefName(displayName); const suffix = identityDiscriminator ? normalizeRefName(identityDiscriminator) : "";
  if (!Number.isFinite(year) || !slug) return null;
  return `app-prospect:${year}:${slug}${suffix ? `:${suffix}` : ""}`;
};

export function createApplicationInventoryEntry(row, source = INITIAL_2027_BASE_INVENTORY_SOURCE) {
  const displayName = String(row?.displayName || "").trim();
  const draftYear = Number(source?.draftYear ?? 2027);
  const identityDiscriminator = row?.identityDiscriminator || null;
  const applicationProspectRef = createInventoryApplicationProspectRef({ draftYear, displayName, identityDiscriminator });
  if (!applicationProspectRef || !displayName || !Number.isFinite(draftYear)) return null;

  return deepFreeze({
    contract: APPLICATION_PROSPECT_INVENTORY_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_INVENTORY_VERSION,
    applicationProspectRef,
    fidProspectRef: null,
    draftYear,
    identity: {
      displayName,
      officialPosition: normalizePosition(row?.position),
      projectedRole: null,
      program: { displayName: row?.program || null, conference: null, status: "PROVISIONAL_APPLICATION_INVENTORY" },
      applicationIdentityDiscriminator: identityDiscriminator,
    },
    inventoryMetadata: {
      sourceId: source.sourceId,
      publisher: source.publisher,
      sourceClassification: source.sourceClassification,
      sourceDate: source.sourceDate,
      sourceOrdinal: Number(row?.sourceOrdinal) || null,
      identityDiscriminator,
      identityResolutionAuthority: identityDiscriminator ? "EXPLICIT_SOURCE_SCOPED_APPLICATION_DISCRIMINATOR" : "UNAMBIGUOUS_YEAR_NAME_APPLICATION_REFERENCE",
      sourceOrdinalAuthority: "PROVENANCE_ONLY_NOT_LBHT_RANK",
      verificationStatus: "BASE_FACTS_REVIEW_REQUIRED",
    },
    normalizedProspectView: null,
    intelligenceCoverage: {
      level: "BASE_PROFILE", available: false, sourceClassification: "APPLICATION_BASE_INVENTORY",
      reviewStatus: "BASE_FACTS_REVIEW_REQUIRED", draftRoomReadiness: "BASE_PROFILE_ONLY",
      limitations: [
        "Enriched Football Intelligence is not available for this application inventory entry.",
        "Eligibility, declaration, transfer status, position, and program remain subject to verification.",
      ],
    },
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    canonicalIdentifier: null,
  });
}

const initialEntries = Object.freeze(initial2027BaseInventoryRows.map((row) => createApplicationInventoryEntry(row)).filter(Boolean));
const byApplicationRef = new Map(initialEntries.map((entry) => [entry.applicationProspectRef, entry]));
const byYearAndName = new Map();
for (const entry of initialEntries) {
  const key = `${entry.draftYear}:${normalizeRefName(entry.identity.displayName)}`;
  const candidates = byYearAndName.get(key) || [];
  candidates.push(entry); byYearAndName.set(key, candidates);
}

export function listApplicationInventoryProspects({ draftYear } = {}) {
  if (draftYear == null) return initialEntries;
  return Object.freeze(initialEntries.filter((entry) => entry.draftYear === Number(draftYear)));
}
export function getApplicationInventoryProspectByRef(reference) { return reference ? byApplicationRef.get(reference) || null : null; }
export function listApplicationInventoryIdentityCandidates({ draftYear, displayName } = {}) {
  const key = `${Number(draftYear)}:${normalizeRefName(displayName)}`;
  return Object.freeze([...(byYearAndName.get(key) || [])]);
}
export function getApplicationInventoryProspectByIdentity({ draftYear, displayName, officialPosition, position, program } = {}) {
  let candidates = [...listApplicationInventoryIdentityCandidates({ draftYear, displayName })];
  const requestedPosition = normalizePosition(officialPosition ?? position);
  const requestedProgram = normalizeText(program?.displayName ?? program);
  if (requestedPosition) candidates = candidates.filter((entry) => entry.identity.officialPosition === requestedPosition);
  if (requestedProgram) candidates = candidates.filter((entry) => normalizeText(entry.identity.program?.displayName) === requestedProgram);
  return candidates.length === 1 ? candidates[0] : null;
}

export function getApplicationProspectInventoryDiagnostics() {
  const refs = initialEntries.map((entry) => entry.applicationProspectRef);
  const sourceOrdinals = initialEntries.map((entry) => entry.inventoryMetadata.sourceOrdinal);
  return deepFreeze({
    contract: APPLICATION_PROSPECT_INVENTORY_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_INVENTORY_VERSION,
    inventoryCount: initialEntries.length,
    draftYears: [...new Set(initialEntries.map((entry) => entry.draftYear))].sort(),
    uniqueApplicationReferences: new Set(refs).size,
    uniqueSourceOrdinals: new Set(sourceOrdinals).size,
    canonicalIdentifierCount: initialEntries.filter((entry) => entry.canonicalIdentifier).length,
    publishedSourceCount: INITIAL_2027_BASE_INVENTORY_SOURCE.publishedSourceCount,
    materializedSourceCount: INITIAL_2027_BASE_INVENTORY_SOURCE.materializedSourceCount,
    excludedIdentityCollisionCount: INITIAL_2027_BASE_INVENTORY_EXCLUSIONS.length,
    excludedSourceOrdinals: INITIAL_2027_BASE_INVENTORY_EXCLUSIONS.map((entry) => entry.sourceOrdinal),
    disambiguatedIdentityCount: INITIAL_2027_BASE_INVENTORY_DISAMBIGUATIONS.length,
    disambiguatedSourceOrdinals: INITIAL_2027_BASE_INVENTORY_DISAMBIGUATIONS.map((entry) => entry.sourceOrdinal),
    sourceId: INITIAL_2027_BASE_INVENTORY_SOURCE.sourceId,
    sourceOrdinalAuthority: "PROVENANCE_ONLY_NOT_LBHT_RANK",
    intelligenceAuthority: false,
    canonicalAuthority: false,
  });
}

export default Object.freeze({
  listApplicationInventoryProspects, getApplicationInventoryProspectByRef,
  listApplicationInventoryIdentityCandidates, getApplicationInventoryProspectByIdentity,
  getApplicationProspectInventoryDiagnostics,
});
