import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ApplicationResolverBoundary } from "./ApplicationResolverBoundary.js";
import { fixtureProspectReferences } from "./FixtureResolver.js";
import { isNormalizedProspectView } from "./NormalizedProspectView.js";
import { ProspectResolver } from "./ProspectResolver.js";
import { RESOLUTION_STATUSES, RESOLVER_SOURCE_KINDS, SOURCE_SELECTION_POLICY } from "./ProspectResolverContract.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "../../../../../..");
const APPLICATION_ROOTS = ["components", "pages", "routes", "engines", "hooks"].map((path) => join(SRC, path));
const productionExtensions = new Set([".js", ".jsx", ".mjs"]);
const filesUnder = (root) => {
  try { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? filesUnder(join(root, entry.name)) : productionExtensions.has(extname(entry.name)) ? [join(root, entry.name)] : []); }
  catch { return []; }
};

export function runResolverDiagnostics() {
  const results = ApplicationResolverBoundary.resolveProspects(fixtureProspectReferences);
  assert.equal(results.length, 16, "The complete preparation cohort must resolve.");
  assert(results.every(({ status }) => status === RESOLUTION_STATUSES.RESOLVED), "Every cohort member must resolve.");
  assert.equal(new Set(results.map(({ prospect }) => prospect.reference)).size, 16, "Resolved identities must be unique.");
  assert(results.every(({ prospect }) => isNormalizedProspectView(prospect)), "All resolver output must satisfy the normalized view contract.");
  assert(results.every(({ prospect }) => Object.isFrozen(prospect) && Object.isFrozen(prospect.program) && Object.isFrozen(prospect.limitations)), "Resolver output must be deeply immutable.");
  assert.deepEqual(ApplicationResolverBoundary.resolveProspects(fixtureProspectReferences), results, "Resolution must be deterministic.");
  assert.equal(ApplicationResolverBoundary.resolveProspect("intake-candidate:2027:unknown").status, RESOLUTION_STATUSES.UNKNOWN, "Unknown references require an explicit result.");

  const blockedResolver = new ProspectResolver([{ kind: RESOLVER_SOURCE_KINDS.PREPARATION, find: () => ({ blocked: true, reason: "diagnostic blocker" }), project: () => ({}) }]);
  assert.equal(blockedResolver.resolve("diagnostic:blocked").status, RESOLUTION_STATUSES.BLOCKED, "Blocked references require an explicit result.");
  assert(SOURCE_SELECTION_POLICY.some(({ sourceKind, active }) => sourceKind === RESOLVER_SOURCE_KINDS.CANONICAL && active === false), "A deferred canonical source slot must exist structurally.");

  const applicationSources = APPLICATION_ROOTS.flatMap(filesUnder).map((file) => ({ file, source: readFileSync(file, "utf8") }));
  const directPreparationDependencies = applicationSources.filter(({ source }) => /ProspectProfilePreparationRecord|phase2A\/sprint2A_3[ABC]/.test(source));
  const directCanonicalDependencies = applicationSources.filter(({ source }) => /contracts\/ProspectProfileContract|contracts\\ProspectProfileContract/.test(source));
  assert.equal(directPreparationDependencies.length, 0, "Applications must not depend directly on preparation contracts.");
  assert.equal(directCanonicalDependencies.length, 0, "Applications must not depend directly on the canonical prospect profile.");

  return Object.freeze({
    suite: "ResolverDiagnostics", passed: true, resolvedCount: results.length, uniqueIdentityCount: 16,
    immutable: true, deterministic: true, unknownHandled: true, blockedHandled: true,
    directPreparationDependencies: 0, directCanonicalDependencies: 0, futureCanonicalSourceSupported: true
  });
}

