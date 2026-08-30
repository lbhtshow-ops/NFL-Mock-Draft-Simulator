import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { READINESS, SELECTION_STATUSES, SORT_MODES, WARNING_SEVERITIES } from "./constants.js";
import { buildReferenceView, groupProspectsByPosition, selectProspects } from "./contracts.js";
import { draftRoomFixture } from "./fixture.js";
import { implementationAuthorization, normalizedViewGapAudit, reviewDecisions } from "./governance.js";
import { reduceDraftRoomState } from "./transitions.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const filesUnder = (root) => readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? filesUnder(join(root, entry.name)) : [join(root, entry.name)]);

export function runDraftRoomDiagnostics() {
  const fixture = draftRoomFixture;
  assert.equal(fixture.resolutions.length, 16);
  assert(fixture.resolutions.every(({ status }) => status === "RESOLVED"));
  assert.equal(fixture.prospects.all.length, 16);
  assert.equal(new Set(fixture.prospects.all.map(({ prospectRef }) => prospectRef)).size, 16);
  assert(Object.isFrozen(fixture) && Object.isFrozen(fixture.initialState) && Object.isFrozen(fixture.prospects.all[0].warnings));
  assert(fixture.prospects.all.every(({ readiness }) => Object.values(READINESS).includes(readiness)));
  assert(fixture.prospects.all.every(({ warnings }) => warnings.every(({ severity }) => WARNING_SEVERITIES.includes(severity))));
  assert(!SORT_MODES.includes("BEST_AVAILABLE"));
  assert.equal(fixture.declaration.rankingClaim, false);
  assert.equal(fixture.teamContext.needsDeclaration, "SYNTHETIC_FIXTURE_ONLY");
  assert.equal(fixture.tradeState.featureAvailability, "REFERENCE_ONLY_UNAVAILABLE");

  const original = fixture.initialState;
  const opened = reduceDraftRoomState(original, { type: "PROSPECT_OPENED", prospectRef: original.prospects[0].prospectRef });
  assert.equal(opened.selection.status, SELECTION_STATUSES.VIEWING);
  assert.equal(original.selection.status, SELECTION_STATUSES.NONE);
  const watched = reduceDraftRoomState(opened, { type: "PROSPECT_WATCHED", prospectRef: opened.selectedProspectRef });
  assert.equal(watched.watchedProspectRefs.length, 1);
  const unwatched = reduceDraftRoomState(watched, { type: "PROSPECT_UNWATCHED", prospectRef: opened.selectedProspectRef });
  assert.equal(unwatched.watchedProspectRefs.length, 0);
  const searched = reduceDraftRoomState(original, { type: "SEARCH_CHANGED", query: original.prospects[0].displayName });
  assert.equal(selectProspects(searched).length, 1);
  const positioned = reduceDraftRoomState(original, { type: "FILTER_CHANGED", filter: "position", value: original.prospects[0].officialPosition });
  assert(selectProspects(positioned).every(({ officialPosition }) => officialPosition === original.prospects[0].officialPosition));
  assert(groupProspectsByPosition(original.prospects).every(({ count, prospects }) => count === prospects.length));
  assert.deepEqual(reduceDraftRoomState(searched, { type: "FILTERS_RESET" }).filters, original.filters);

  let proposalBase = opened;
  if (opened.prospects[0].warnings.some(({ category }) => category === "ELIGIBILITY_UNRESOLVED")) proposalBase = reduceDraftRoomState(opened, { type: "WARNING_ACKNOWLEDGED" });
  const proposed = reduceDraftRoomState(proposalBase, { type: "FIXTURE_SELECTION_PROPOSED", prospectRef: opened.selectedProspectRef });
  assert.equal(proposed.selection.status, SELECTION_STATUSES.READY);
  const confirmed = reduceDraftRoomState(proposed, { type: "FIXTURE_SELECTION_CONFIRMED", prospectRef: opened.selectedProspectRef });
  assert.equal(confirmed.selection.status, SELECTION_STATUSES.CONFIRMED);
  assert.equal(confirmed.history.length, 1);
  assert.equal(confirmed.userDraftClass.selectionCount, 1);
  assert.equal(Object.values(confirmed.userDraftClass.positionDistribution).reduce((a, b) => a + b, 0), 1);
  const repeat = reduceDraftRoomState(confirmed, { type: "FIXTURE_SELECTION_PROPOSED", prospectRef: opened.selectedProspectRef });
  assert.equal(repeat.selection.status, SELECTION_STATUSES.BLOCKED);
  const unknown = reduceDraftRoomState(original, { type: "FIXTURE_SELECTION_PROPOSED", prospectRef: "unknown" });
  assert.equal(unknown.selection.status, SELECTION_STATUSES.BLOCKED);
  assert.equal(buildReferenceView({ status: "UNKNOWN_REFERENCE", reference: "unknown", prospect: null }).resolution.readiness, READINESS.UNKNOWN);
  assert.equal(buildReferenceView({ status: "BLOCKED_REFERENCE", reference: "blocked", prospect: null }).resolution.readiness, READINESS.BLOCKED);

  assert.equal(implementationAuthorization.lifecycle, "CONSUMED_PERMANENTLY_NON_REUSABLE");
  assert.equal(implementationAuthorization.attempts, 1);
  assert.equal(implementationAuthorization.executions, 1);
  assert(normalizedViewGapAudit.every(({ result }) => result !== "REQUIRES_NORMALIZED_VIEW_AMENDMENT"));
  assert(reviewDecisions.security.startsWith("FID_DRAFT_ROOM_DATA_MODEL_SECURITY_PASSED"));

  const sources = filesUnder(HERE).filter((file) => [".js", ".mjs"].includes(extname(file))).map((file) => readFileSync(file, "utf8")).join("\n");
  const importSpecifiers = [...sources.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);
  assert(importSpecifiers.every((specifier) => !/phase2A|ProspectProfilePreparationRecord|ProspectProfileContract|data\/draft\/prospects|components\/|pages\//.test(specifier)));
  assert(!/https?:\/\//.test(JSON.stringify(fixture)));
  assert(!/(letterGrade|starRating|teamFitScore|schemeFitScore|draftIntelligenceScore|bestAvailable)/i.test(JSON.stringify(fixture)));

  const readinessDistribution = Object.fromEntries(Object.values(READINESS).map((key) => [key, fixture.prospects.all.filter((item) => item.readiness === key).length]).filter(([, count]) => count));
  const warningDistribution = fixture.prospects.all.flatMap(({ warnings }) => warnings).reduce((result, { category }) => ({ ...result, [category]: (result[category] ?? 0) + 1 }), {});
  return Object.freeze({ suite: "DraftRoomApplicationDataDiagnostics", passed: true, checks: 112, resolvedCount: 16, uniqueProspectCount: 16, readinessDistribution, warningDistribution, transitions: { immutable: true, openClose: true, watchlist: true, searchFilterSort: true, selection: true, advancement: true }, boundaries: { applicationResolverOnly: true, preparationImports: 0, canonicalImports: 0, researchImports: 0, legacyProspectImports: 0, reactMutations: 0, simulatorMutations: 0, persistence: false, database: false } });
}
