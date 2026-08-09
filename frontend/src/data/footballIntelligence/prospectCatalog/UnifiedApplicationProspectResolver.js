export const UNIFIED_APPLICATION_PROSPECT_RESOLVER_CONTRACT = "UnifiedApplicationProspectResolver";
export const UNIFIED_APPLICATION_PROSPECT_RESOLVER_VERSION = "FIP-UNIFIED-APPLICATION-PROSPECT-RESOLVER-1.0.0";
export const APPLICATION_PROSPECT_RESOLUTION_STATUS = Object.freeze({ RESOLVED: "RESOLVED", AMBIGUOUS: "AMBIGUOUS", NOT_FOUND: "NOT_FOUND" });

const normalizeName = (value = "") => String(value).trim().toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const normalizePosition = (value = "") => {
  const raw = String(value || "").trim().toUpperCase();
  const aliases = { "DE/ED": "EDGE", "DL/ED": "EDGE", "LB/ED": "EDGE", ED: "EDGE", DE: "EDGE" };
  return aliases[raw] || raw || null;
};
const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const valueFrom = (input, paths) => paths.map((fn) => fn(input)).find((value) => value != null && String(value).trim() !== "");

export function resolveUnifiedApplicationProspect(input, { entries = [], byApplicationRef, byFidRef } = {}) {
  const applicationRef = typeof input === "string" && input.startsWith("app-prospect:") ? input.trim() : valueFrom(input, [
    (v) => v?.application_prospect_ref, (v) => v?.applicationProspectRef, (v) => v?.appProspectRef,
  ]);
  if (applicationRef && byApplicationRef?.has(applicationRef)) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED, prospect: byApplicationRef.get(applicationRef), matchedBy: "APPLICATION_REFERENCE", candidates: [] };

  const fidRef = typeof input === "string" && input.startsWith("intake-candidate:") ? input.trim() : valueFrom(input, [
    (v) => v?.fidProspectRef, (v) => v?.candidateRef, (v) => v?.reference, (v) => v?.prospectRef,
  ]);
  if (fidRef && byFidRef?.has(fidRef)) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED, prospect: byFidRef.get(fidRef), matchedBy: "FID_REFERENCE", candidates: [] };

  const displayName = String(valueFrom(input, [(v) => v?.displayName, (v) => v?.name, (v) => v?.player, (v) => v?.playerName, (v) => v?.identity?.name, (v) => v?.identity?.playerName]) || "").trim();
  const draftYear = Number(valueFrom(input, [(v) => v?.draftYear, (v) => v?.draftClass, (v) => v?.year, (v) => v?.identity?.draftClass, (v) => v?.identity?.year]));
  if (!displayName || !Number.isFinite(draftYear)) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.NOT_FOUND, prospect: null, matchedBy: null, candidates: [] };

  let candidates = entries.filter((entry) => entry.draftYear === draftYear && normalizeName(entry.identity?.displayName) === normalizeName(displayName));
  if (!candidates.length) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.NOT_FOUND, prospect: null, matchedBy: null, candidates: [] };
  if (candidates.length === 1) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED, prospect: candidates[0], matchedBy: "UNIQUE_YEAR_NAME", candidates: [] };

  const requestedPosition = normalizePosition(valueFrom(input, [(v) => v?.position, (v) => v?.officialPosition, (v) => v?.identity?.officialPosition, (v) => v?.bio?.position]));
  const requestedProgram = normalizeText(valueFrom(input, [(v) => v?.program?.displayName, (v) => v?.program, (v) => v?.college, (v) => v?.school, (v) => v?.identity?.program?.displayName]));
  if (requestedPosition) candidates = candidates.filter((entry) => normalizePosition(entry.identity?.officialPosition) === requestedPosition);
  if (requestedProgram && candidates.length > 1) candidates = candidates.filter((entry) => normalizeText(entry.identity?.program?.displayName) === requestedProgram);
  if (candidates.length === 1) return { status: APPLICATION_PROSPECT_RESOLUTION_STATUS.RESOLVED, prospect: candidates[0], matchedBy: "STRUCTURED_IDENTITY", candidates: [] };

  return {
    status: APPLICATION_PROSPECT_RESOLUTION_STATUS.AMBIGUOUS,
    prospect: null,
    matchedBy: null,
    candidates: candidates.map((entry) => ({ applicationProspectRef: entry.applicationProspectRef, displayName: entry.identity?.displayName, officialPosition: entry.identity?.officialPosition, program: entry.identity?.program?.displayName })),
  };
}

export default resolveUnifiedApplicationProspect;
