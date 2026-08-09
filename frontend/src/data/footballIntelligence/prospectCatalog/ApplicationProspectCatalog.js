import { ApplicationResolverBoundary } from "../fid/prospectDatabase/phase2B/sprint2B_1/ApplicationResolverBoundary.js";
import { fixtureProspectReferences } from "../fid/prospectDatabase/phase2B/sprint2B_1/FixtureResolver.js";
import { RESOLUTION_STATUSES } from "../fid/prospectDatabase/phase2B/sprint2B_1/ProspectResolverContract.js";
import { getApplicationInventoryProspectByRef, listApplicationInventoryProspects } from "./ApplicationProspectInventory.js";
import { APPLICATION_PROSPECT_RESOLUTION_STATUS, resolveUnifiedApplicationProspect } from "./UnifiedApplicationProspectResolver.js";

export const APPLICATION_PROSPECT_CATALOG_CONTRACT = "ApplicationProspectCatalog";
export const APPLICATION_PROSPECT_CATALOG_VERSION = "FIP-APPLICATION-PROSPECT-CATALOG-1.5.0";

export const PROSPECT_INTELLIGENCE_COVERAGE = Object.freeze({
  ENRICHED_RESEARCH: "ENRICHED_RESEARCH",
  BASE_PROFILE: "BASE_PROFILE",
  UNAVAILABLE: "UNAVAILABLE",
});

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

const normalizeDraftYear = (input) => {
  const raw = input?.draftYear ?? input?.draftClass ?? input?.year ?? input?.identity?.draftClass ?? input?.identity?.year;
  const year = Number(raw);
  return Number.isFinite(year) ? year : null;
};

const prospectName = (input) => String(
  input?.displayName ??
  input?.name ??
  input?.player ??
  input?.playerName ??
  input?.bio?.name ??
  input?.identity?.name ??
  input?.identity?.playerName ??
  ""
).trim();

export function createApplicationProspectRef({ draftYear, displayName, identityDiscriminator } = {}) {
  const year = Number(draftYear);
  const slug = normalizeName(displayName);
  const suffix = identityDiscriminator ? normalizeName(identityDiscriminator) : "";
  if (!Number.isFinite(year) || !slug) return null;
  return `app-prospect:${year}:${slug}${suffix ? `:${suffix}` : ""}`;
}

function applicationReferenceFromInput(input) {
  if (typeof input === "string" && input.startsWith("app-prospect:")) return input.trim();
  const candidate = [
    input?.application_prospect_ref,
    input?.applicationProspectRef,
    input?.appProspectRef,
  ].find((value) => typeof value === "string" && value.startsWith("app-prospect:"));
  return candidate?.trim() || null;
}

function applicationEntryFromResolution(resolution) {
  if (resolution?.status !== RESOLUTION_STATUSES.RESOLVED || !resolution.prospect) return null;
  const prospect = resolution.prospect;
  const draftYear = Number(prospect.reference?.split(":")?.[1]) || 2027;
  const applicationProspectRef = createApplicationProspectRef({ draftYear, displayName: prospect.displayName });
  return deepFreeze({
    contract: APPLICATION_PROSPECT_CATALOG_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_CATALOG_VERSION,
    applicationProspectRef,
    fidProspectRef: prospect.reference,
    draftYear,
    identity: {
      displayName: prospect.displayName,
      officialPosition: prospect.officialPosition,
      projectedRole: prospect.projectedRole,
      program: prospect.program,
    },
    normalizedProspectView: prospect,
    intelligenceCoverage: {
      level: PROSPECT_INTELLIGENCE_COVERAGE.ENRICHED_RESEARCH,
      available: true,
      sourceClassification: "FID_NORMALIZED_PROSPECT_VIEW",
      reviewStatus: prospect.reviewStatus,
      draftRoomReadiness: prospect.draftRoomReadiness,
      limitations: prospect.limitations || [],
    },
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    canonicalIdentifier: null,
  });
}

const enrichedEntries = Object.freeze(
  fixtureProspectReferences
    .map((reference) => applicationEntryFromResolution(ApplicationResolverBoundary.resolveProspect(reference)))
    .filter(Boolean)
);

const inventoryEntries = Object.freeze(listApplicationInventoryProspects());
const combinedEntryMap = new Map(inventoryEntries.map((entry) => [entry.applicationProspectRef, entry]));
enrichedEntries.forEach((entry) => combinedEntryMap.set(entry.applicationProspectRef, entry));
const catalogEntries = Object.freeze([...combinedEntryMap.values()]);

const byApplicationRef = new Map(catalogEntries.map((entry) => [entry.applicationProspectRef, entry]));
const byFidRef = new Map(enrichedEntries.map((entry) => [entry.fidProspectRef, entry]));

function baseRuntimeEntry(input) {
  const displayName = prospectName(input);
  const draftYear = normalizeDraftYear(input);
  const applicationProspectRef = applicationReferenceFromInput(input) || createApplicationProspectRef({ draftYear, displayName });
  if (!applicationProspectRef || !displayName || !draftYear) return null;

  return deepFreeze({
    contract: APPLICATION_PROSPECT_CATALOG_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_CATALOG_VERSION,
    applicationProspectRef,
    fidProspectRef: null,
    draftYear,
    identity: {
      displayName,
      officialPosition: input?.position ?? input?.bio?.position ?? null,
      projectedRole: null,
      program: {
        displayName: input?.school ?? input?.college ?? input?.bio?.school ?? null,
        conference: null,
        status: "RUNTIME_BASE_PROFILE",
      },
    },
    normalizedProspectView: null,
    intelligenceCoverage: {
      level: PROSPECT_INTELLIGENCE_COVERAGE.BASE_PROFILE,
      available: false,
      sourceClassification: "RUNTIME_BASE_PROFILE",
      reviewStatus: null,
      draftRoomReadiness: "BASE_PROFILE_ONLY",
      limitations: ["Enriched Football Intelligence has not yet been resolved for this application prospect."],
    },
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    canonicalIdentifier: null,
  });
}

export function listApplicationProspects({ draftYear, intelligenceCoverage } = {}) {
  let entries = catalogEntries;
  if (draftYear != null) entries = entries.filter((entry) => entry.draftYear === Number(draftYear));
  if (intelligenceCoverage) {
    entries = entries.filter((entry) => entry.intelligenceCoverage?.level === intelligenceCoverage);
  }
  return Object.freeze(entries);
}

export function getApplicationProspectByRef(reference) {
  if (!reference) return null;
  return byApplicationRef.get(reference) || byFidRef.get(reference) || null;
}

export function resolveApplicationProspectResolution(input) {
  return resolveUnifiedApplicationProspect(input, { entries: catalogEntries, byApplicationRef, byFidRef });
}

export function resolveApplicationProspect(input, { allowRuntimeBaseProfile = true } = {}) {
  if (!input) return null;
  const resolution = resolveApplicationProspectResolution(input);
  if (resolution.status === APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED) return resolution.prospect;
  // Ambiguous identity must never silently collapse into a fabricated base profile.
  if (resolution.status === APPLICATION_PROSPECT_RESOLUTION_STATUS.AMBIGUOUS) return null;

  const applicationRef = applicationReferenceFromInput(input);
  if (applicationRef) {
    const inventoryMatch = getApplicationInventoryProspectByRef(applicationRef);
    if (inventoryMatch) return inventoryMatch;
  }
  return allowRuntimeBaseProfile ? baseRuntimeEntry(input) : null;
}

export function getApplicationProspectCatalogDiagnostics() {
  return deepFreeze({
    contract: APPLICATION_PROSPECT_CATALOG_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_CATALOG_VERSION,
    catalogCount: catalogEntries.length,
    enrichedCount: enrichedEntries.length,
    baseInventoryCount: catalogEntries.filter((entry) => entry.intelligenceCoverage?.level === PROSPECT_INTELLIGENCE_COVERAGE.BASE_PROFILE).length,
    inventorySourceCount: inventoryEntries.length,
    inventoryOverlapReplacedByEnrichment: inventoryEntries.length + enrichedEntries.length - catalogEntries.length,
    draftYears: [...new Set(catalogEntries.map((entry) => entry.draftYear))].sort(),
    uniqueApplicationReferences: new Set(catalogEntries.map((entry) => entry.applicationProspectRef)).size,
    uniqueFidReferences: new Set(enrichedEntries.map((entry) => entry.fidProspectRef)).size,
    canonicalIdentifierCount: catalogEntries.filter((entry) => entry.canonicalIdentifier).length,
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    resolverBoundary: "ApplicationResolverBoundary",
    applicationResolver: "UnifiedApplicationProspectResolver",
    ambiguityPolicy: "NO_SILENT_NAME_COLLAPSE",
  });
}

export default Object.freeze({
  listApplicationProspects,
  getApplicationProspectByRef,
  resolveApplicationProspect,
  resolveApplicationProspectResolution,
  createApplicationProspectRef,
  getApplicationProspectCatalogDiagnostics,
});
