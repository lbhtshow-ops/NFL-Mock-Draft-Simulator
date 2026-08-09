import {
  INITIAL_2027_BASE_INVENTORY_SOURCE,
  INITIAL_2027_BASE_INVENTORY_EXCLUSIONS,
  initial2027BaseInventoryRows,
} from "./initial2027BaseInventory.js";

export const APPLICATION_PROSPECT_INVENTORY_CONTRACT = "ApplicationProspectInventory";
export const APPLICATION_PROSPECT_INVENTORY_VERSION = "FIP-APPLICATION-PROSPECT-INVENTORY-1.3.0";

const normalizeRefName = (value = "") => String(value)
  .trim()
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const createInventoryApplicationProspectRef = ({ draftYear, displayName } = {}) => {
  const year = Number(draftYear);
  const slug = normalizeRefName(displayName);
  if (!Number.isFinite(year) || !slug) return null;
  return `app-prospect:${year}:${slug}`;
};

const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
};

const normalizeName = (value = "") => String(value)
  .trim()
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const normalizePosition = (value = "") => {
  const raw = String(value || "").trim().toUpperCase();
  const aliases = {
    "DE/ED": "EDGE",
    "DL/ED": "EDGE",
    "LB/ED": "EDGE",
    ED: "EDGE",
    DE: "EDGE",
    DB: "DB",
  };
  return aliases[raw] || raw || null;
};

export function createApplicationInventoryEntry(row, source = INITIAL_2027_BASE_INVENTORY_SOURCE) {
  const displayName = String(row?.displayName || "").trim();
  const draftYear = Number(source?.draftYear ?? 2027);
  const applicationProspectRef = createInventoryApplicationProspectRef({ draftYear, displayName });
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
      program: {
        displayName: row?.program || null,
        conference: null,
        status: "PROVISIONAL_APPLICATION_INVENTORY",
      },
    },
    inventoryMetadata: {
      sourceId: source.sourceId,
      publisher: source.publisher,
      sourceClassification: source.sourceClassification,
      sourceDate: source.sourceDate,
      sourceOrdinal: Number(row?.sourceOrdinal) || null,
      sourceOrdinalAuthority: "PROVENANCE_ONLY_NOT_LBHT_RANK",
      verificationStatus: "BASE_FACTS_REVIEW_REQUIRED",
    },
    normalizedProspectView: null,
    intelligenceCoverage: {
      level: "BASE_PROFILE",
      available: false,
      sourceClassification: "APPLICATION_BASE_INVENTORY",
      reviewStatus: "BASE_FACTS_REVIEW_REQUIRED",
      draftRoomReadiness: "BASE_PROFILE_ONLY",
      limitations: [
        "Enriched Football Intelligence is not available for this application inventory entry.",
        "Eligibility, declaration, transfer status, position, and program remain subject to verification.",
      ],
    },
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    canonicalIdentifier: null,
  });
}

const initialEntries = Object.freeze(
  initial2027BaseInventoryRows
    .map((row) => createApplicationInventoryEntry(row))
    .filter(Boolean)
);

const byApplicationRef = new Map(initialEntries.map((entry) => [entry.applicationProspectRef, entry]));
const byYearAndName = new Map(initialEntries.map((entry) => [
  `${entry.draftYear}:${normalizeName(entry.identity.displayName)}`,
  entry,
]));

export function listApplicationInventoryProspects({ draftYear } = {}) {
  if (draftYear == null) return initialEntries;
  return Object.freeze(initialEntries.filter((entry) => entry.draftYear === Number(draftYear)));
}

export function getApplicationInventoryProspectByRef(reference) {
  return reference ? byApplicationRef.get(reference) || null : null;
}

export function getApplicationInventoryProspectByIdentity({ draftYear, displayName } = {}) {
  const key = `${Number(draftYear)}:${normalizeName(displayName)}`;
  return byYearAndName.get(key) || null;
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
    sourceId: INITIAL_2027_BASE_INVENTORY_SOURCE.sourceId,
    sourceOrdinalAuthority: "PROVENANCE_ONLY_NOT_LBHT_RANK",
    intelligenceAuthority: false,
    canonicalAuthority: false,
  });
}

export default Object.freeze({
  listApplicationInventoryProspects,
  getApplicationInventoryProspectByRef,
  getApplicationInventoryProspectByIdentity,
  getApplicationProspectInventoryDiagnostics,
});
