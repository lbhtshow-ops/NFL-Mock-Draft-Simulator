import { ApplicationResolverBoundary } from "../fid/prospectDatabase/phase2B/sprint2B_1/ApplicationResolverBoundary.js";
import { fixtureProspectReferences } from "../fid/prospectDatabase/phase2B/sprint2B_1/FixtureResolver.js";
import { RESOLUTION_STATUSES } from "../fid/prospectDatabase/phase2B/sprint2B_1/ProspectResolverContract.js";

export const APPLICATION_PROSPECT_CATALOG_CONTRACT = "ApplicationProspectCatalog";
export const APPLICATION_PROSPECT_CATALOG_VERSION = "FIP-APPLICATION-PROSPECT-CATALOG-1.0.0";

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

export function createApplicationProspectRef({ draftYear, displayName } = {}) {
  const year = Number(draftYear);
  const slug = normalizeName(displayName);
  if (!Number.isFinite(year) || !slug) return null;
  return `app-prospect:${year}:${slug}`;
}

function fidReferenceFromInput(input) {
  if (typeof input === "string" && input.startsWith("intake-candidate:")) return input.trim();
  const candidate = [
    input?.fidProspectRef,
    input?.candidateRef,
    input?.reference,
    input?.prospectRef,
  ].find((value) => typeof value === "string" && value.startsWith("intake-candidate:"));
  return candidate?.trim() || null;
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

const byApplicationRef = new Map(enrichedEntries.map((entry) => [entry.applicationProspectRef, entry]));
const byFidRef = new Map(enrichedEntries.map((entry) => [entry.fidProspectRef, entry]));
const byYearAndName = new Map(
  enrichedEntries.map((entry) => [`${entry.draftYear}:${normalizeName(entry.identity.displayName)}`, entry])
);

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

export function listApplicationProspects({ draftYear } = {}) {
  if (draftYear == null) return enrichedEntries;
  return Object.freeze(enrichedEntries.filter((entry) => entry.draftYear === Number(draftYear)));
}

export function getApplicationProspectByRef(reference) {
  if (!reference) return null;
  return byApplicationRef.get(reference) || byFidRef.get(reference) || null;
}

export function resolveApplicationProspect(input, { allowRuntimeBaseProfile = true } = {}) {
  if (!input) return null;

  const applicationRef = applicationReferenceFromInput(input);
  if (applicationRef && byApplicationRef.has(applicationRef)) return byApplicationRef.get(applicationRef);

  const fidRef = fidReferenceFromInput(input);
  if (fidRef && byFidRef.has(fidRef)) return byFidRef.get(fidRef);

  const displayName = prospectName(input);
  const draftYear = normalizeDraftYear(input);
  if (displayName && draftYear) {
    const match = byYearAndName.get(`${draftYear}:${normalizeName(displayName)}`);
    if (match) return match;
  }

  return allowRuntimeBaseProfile ? baseRuntimeEntry(input) : null;
}

export function getApplicationProspectCatalogDiagnostics() {
  return deepFreeze({
    contract: APPLICATION_PROSPECT_CATALOG_CONTRACT,
    contractVersion: APPLICATION_PROSPECT_CATALOG_VERSION,
    enrichedCount: enrichedEntries.length,
    draftYears: [...new Set(enrichedEntries.map((entry) => entry.draftYear))].sort(),
    uniqueApplicationReferences: new Set(enrichedEntries.map((entry) => entry.applicationProspectRef)).size,
    uniqueFidReferences: new Set(enrichedEntries.map((entry) => entry.fidProspectRef)).size,
    canonicalIdentifierCount: enrichedEntries.filter((entry) => entry.canonicalIdentifier).length,
    identityAuthority: "APPLICATION_REFERENCE_NON_CANONICAL",
    resolverBoundary: "ApplicationResolverBoundary",
  });
}

export default Object.freeze({
  listApplicationProspects,
  getApplicationProspectByRef,
  resolveApplicationProspect,
  createApplicationProspectRef,
  getApplicationProspectCatalogDiagnostics,
});
