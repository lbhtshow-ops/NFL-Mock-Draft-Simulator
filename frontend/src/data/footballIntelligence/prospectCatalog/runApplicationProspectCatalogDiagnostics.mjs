import assert from "node:assert/strict";
import {
  APPLICATION_PROSPECT_CATALOG_VERSION,
  PROSPECT_INTELLIGENCE_COVERAGE,
  createApplicationProspectRef,
  getApplicationProspectCatalogDiagnostics,
  listApplicationProspects,
  resolveApplicationProspect,
} from "./ApplicationProspectCatalog.js";

const diagnostics = getApplicationProspectCatalogDiagnostics();
assert.equal(diagnostics.contractVersion, APPLICATION_PROSPECT_CATALOG_VERSION);
assert.equal(diagnostics.enrichedCount, 16);
assert.equal(diagnostics.uniqueApplicationReferences, 16);
assert.equal(diagnostics.uniqueFidReferences, 16);
assert.equal(diagnostics.canonicalIdentifierCount, 0);
assert.deepEqual(diagnostics.draftYears, [2027]);

const catalog = listApplicationProspects({ draftYear: 2027 });
assert.equal(catalog.length, 16);
assert(catalog.every((entry) => entry.applicationProspectRef.startsWith("app-prospect:2027:")));
assert(catalog.every((entry) => entry.fidProspectRef.startsWith("intake-candidate:2027:")));
assert(catalog.every((entry) => entry.intelligenceCoverage.level === PROSPECT_INTELLIGENCE_COVERAGE.ENRICHED_RESEARCH));
assert(catalog.every((entry) => entry.canonicalIdentifier === null));

const lagway = resolveApplicationProspect({ name: "DJ Lagway", year: 2027, position: "QB", college: "Baylor" });
assert.equal(lagway.applicationProspectRef, "app-prospect:2027:dj-lagway");
assert.equal(lagway.fidProspectRef, "intake-candidate:2027:dj-lagway");
assert.equal(lagway.identity.program.displayName, "Baylor");

const direct = resolveApplicationProspect("intake-candidate:2027:jeremiah-smith");
assert.equal(direct.applicationProspectRef, "app-prospect:2027:jeremiah-smith");

const base = resolveApplicationProspect({ name: "Future Prospect", year: 2027, position: "CB", college: "Example" });
assert.equal(base.applicationProspectRef, createApplicationProspectRef({ draftYear: 2027, displayName: "Future Prospect" }));
assert.equal(base.fidProspectRef, null);
assert.equal(base.intelligenceCoverage.level, PROSPECT_INTELLIGENCE_COVERAGE.BASE_PROFILE);
assert.equal(base.canonicalIdentifier, null);

const unavailable = resolveApplicationProspect({ name: "Future Prospect", year: 2027 }, { allowRuntimeBaseProfile: false });
assert.equal(unavailable, null);

console.log(JSON.stringify({ status: "PASS", diagnostics }, null, 2));
