import {
  getApplicationProspectByRef,
  resolveApplicationProspect,
  PROSPECT_INTELLIGENCE_COVERAGE,
} from "./ApplicationProspectCatalog.js";

const enrichedRuntimePlayer = {
  id: 1,
  name: "DJ Lagway",
  position: "QB",
  college: "Baylor",
  rank: 1,
  year: 2027,
  application_prospect_ref: "app-prospect:2027:dj-lagway",
};

const baseRuntimePlayer = {
  id: 999,
  name: "Future Prospect",
  position: "CB",
  college: "Example University",
  rank: 250,
  year: 2027,
  application_prospect_ref: "app-prospect:2027:future-prospect",
};

const enriched = resolveApplicationProspect(enrichedRuntimePlayer);
const byReference = getApplicationProspectByRef(enrichedRuntimePlayer.application_prospect_ref);
const base = resolveApplicationProspect(baseRuntimePlayer);

const checks = {
  runtimeReferencePreserved: enriched?.applicationProspectRef === enrichedRuntimePlayer.application_prospect_ref,
  enrichedReferenceLookup: byReference?.applicationProspectRef === enrichedRuntimePlayer.application_prospect_ref,
  enrichedFidReferenceAvailable: Boolean(enriched?.fidProspectRef),
  enrichedCoverage: enriched?.intelligenceCoverage?.level === PROSPECT_INTELLIGENCE_COVERAGE.ENRICHED_RESEARCH,
  baseReferencePreserved: base?.applicationProspectRef === baseRuntimePlayer.application_prospect_ref,
  baseHasNoFidClaim: base?.fidProspectRef == null,
  baseCoverage: base?.intelligenceCoverage?.level === PROSPECT_INTELLIGENCE_COVERAGE.BASE_PROFILE,
  canonicalIdentifierNotClaimed: enriched?.canonicalIdentifier == null && base?.canonicalIdentifier == null,
};

const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
console.log(JSON.stringify({
  status,
  contract: "RuntimeProspectReferenceBridge",
  contractVersion: "FIP-RUNTIME-PROSPECT-REFERENCE-BRIDGE-1.0.0",
  checks,
  sample: {
    enriched: {
      applicationProspectRef: enriched?.applicationProspectRef || null,
      fidProspectRef: enriched?.fidProspectRef || null,
      coverage: enriched?.intelligenceCoverage?.level || null,
    },
    base: {
      applicationProspectRef: base?.applicationProspectRef || null,
      fidProspectRef: base?.fidProspectRef || null,
      coverage: base?.intelligenceCoverage?.level || null,
    },
  },
}, null, 2));

if (status !== "PASS") process.exitCode = 1;
