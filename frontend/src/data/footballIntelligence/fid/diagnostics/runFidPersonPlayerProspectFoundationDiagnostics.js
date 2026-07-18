import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import footballEntityConstants from "../constants/footballEntityConstants.js";
import footballEntityContract from "../contracts/FootballEntityContract.js";
import personProfileConstants from "../constants/personProfileConstants.js";
import personProfileContract from "../contracts/PersonProfileContract.js";
import playerProfileConstants from "../constants/playerProfileConstants.js";
import playerProfileContract from "../contracts/PlayerProfileContract.js";
import prospectProfileConstants from "../constants/prospectProfileConstants.js";
import prospectProfileContract from "../contracts/ProspectProfileContract.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runPersonProfileContractDiagnostics } from "./runPersonProfileContractDiagnostics.js";
import { runPlayerProfileContractDiagnostics } from "./runPlayerProfileContractDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "./runProspectProfileContractDiagnostics.js";

const SUITE = "FidPersonPlayerProspectFoundationDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js",
  "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js",
  "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js", "index.js",
].map((file) => resolve(ROOT, file));
const APPROVED_FID_API = Object.freeze({
  ...footballEntityConstants, ...footballEntityContract,
  ...personProfileConstants, ...personProfileContract,
  ...playerProfileConstants, ...playerProfileContract,
  ...prospectProfileConstants, ...prospectProfileContract,
});
const APPROVED_EXPORTS = Object.freeze(Object.keys(APPROVED_FID_API));

function assert(condition, message, details = null) {
  if (!condition) { const error = new Error(message); error.details = details; throw error; }
}
function entityInput(overrides = {}) {
  return { entityId: "entity-1", entityType: "PLAYER", status: "CANDIDATE",
    identity: { canonicalName: "Reference Player" },
    verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" }, ...overrides };
}
function personInput(overrides = {}) {
  return { profileId: "person-profile-1", entityRef: "entity-1", status: "CANDIDATE", personState: "UNKNOWN",
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides };
}
function playerInput(overrides = {}) {
  return { profileId: "player-profile-1", entityRef: "entity-1", personProfileRef: "person-profile-1",
    status: "CANDIDATE", participationState: "UNKNOWN", playingIdentity: { competitionLevel: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides };
}
function prospectInput(overrides = {}) {
  return { profileId: "prospect-profile-1", entityRef: "entity-1", personProfileRef: "person-profile-1",
    playerProfileRef: "player-profile-1", prospectCycleRef: "cycle-1", status: "CANDIDATE",
    cycle: { cycleType: "DRAFT", status: "TRACKED", classYear: 2027 },
    eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, declaration: { state: "NOT_DECLARED" },
    entry: { pathwayType: "STANDARD" }, verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" }, ...overrides };
}
function chain() {
  return {
    entity: fidApi.createFootballEntity(entityInput()), person: fidApi.createPersonProfile(personInput()),
    player: fidApi.createPlayerProfile(playerInput()), prospect: fidApi.createProspectProfile(prospectInput()),
  };
}
function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); });
  return keys;
}
function containsContractObject(value) {
  if (Array.isArray(value)) return value.some(containsContractObject);
  if (!value || typeof value !== "object") return false;
  if (typeof value.contract === "string") return true;
  return Object.values(value).some(containsContractObject);
}
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) {
  const files = new Set(PRODUCTION_FILES);
  return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith("."))
    .map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))]));
}
function hasCycle(value) {
  const visiting = new Set(); const visited = new Set();
  function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node);
    if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; }
  return Object.keys(value).some(visit);
}

function contractChecks() {
  const names = [fidApi.FOOTBALL_ENTITY_CONTRACT_NAME, fidApi.PERSON_PROFILE_CONTRACT_NAME, fidApi.PLAYER_PROFILE_CONTRACT_NAME, fidApi.PROSPECT_PROFILE_CONTRACT_NAME];
  const versions = [fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, fidApi.PERSON_PROFILE_CONTRACT_VERSION, fidApi.PLAYER_PROFILE_CONTRACT_VERSION, fidApi.PROSPECT_PROFILE_CONTRACT_VERSION];
  const schemas = [fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, fidApi.PERSON_PROFILE_SCHEMA_VERSION, fidApi.PLAYER_PROFILE_SCHEMA_VERSION, fidApi.PROSPECT_PROFILE_SCHEMA_VERSION];
  assert(new Set(names).size === 4 && versions.every(Boolean) && schemas.every(Boolean), "Contract identities are not unique and complete.");
  const values = Object.values(chain());
  values.forEach((value) => assert(typeof value.validation.valid === "boolean" && Array.isArray(value.validation.errors) && Array.isArray(value.validation.warnings) && value.contract && value.contractVersion && value.schemaVersion, "Contract or validation shape inconsistent."));
  const unavailable = [
    fidApi.createUnavailableFootballEntity({ reason: "Unavailable" }),
    fidApi.createUnavailablePersonProfile({ reason: "Unavailable" }),
    fidApi.createUnavailablePlayerProfile({ reason: "Unavailable" }),
    fidApi.createUnavailableProspectProfile({ reason: "Unavailable" }),
  ];
  unavailable.forEach((value, index) => assert(Object.keys(values[index]).every((key) => Object.hasOwn(value, key)), "Unavailable factory shape incomplete."));
  const validators = [fidApi.validateFootballEntity, fidApi.validatePersonProfile, fidApi.validatePlayerProfile, fidApi.validateProspectProfile];
  validators.forEach((validate) => [null, [], "invalid", 7].forEach((value) => assert(validate(value).valid === false, "Validator did not tolerate invalid input.")));
  const guards = [fidApi.isFootballEntity, fidApi.isVerifiedFootballEntity, fidApi.isPersonProfile, fidApi.isVerifiedPersonProfile, fidApi.isPlayerProfile, fidApi.isVerifiedPlayerProfile, fidApi.isProspectProfile, fidApi.isVerifiedProspectProfile];
  guards.forEach((guard) => assert(typeof guard(null) === "boolean", "Guard did not return boolean."));
}

function chainChecks() {
  const values = chain();
  assert(fidApi.isFootballEntity(values.entity) && fidApi.isPersonProfile(values.person) && fidApi.isPlayerProfile(values.player) && fidApi.isProspectProfile(values.prospect), "Reference chain does not validate independently.");
  assert(values.person.entityRef === values.entity.entityId && values.player.entityRef === values.entity.entityId
    && values.player.personProfileRef === values.person.profileId && values.prospect.entityRef === values.entity.entityId
    && values.prospect.personProfileRef === values.person.profileId && values.prospect.playerProfileRef === values.player.profileId, "Reference chain mismatch.");
  [values.person, values.player, values.prospect].forEach((value) => assert(!Object.values(value).some(containsContractObject), "Downstream profile embeds a contract object."));
  const unresolved = fidApi.createProspectProfile(prospectInput({ entityRef: "does-not-exist", personProfileRef: "missing-person", playerProfileRef: "missing-player", prospectCycleRef: "missing-cycle" }));
  assert(unresolved.validation.valid, "Reference existence or entity-type compatibility was resolved.");
  assert(values.person.verification.state === "UNVERIFIED" && values.player.verification.state === "UNVERIFIED" && values.prospect.verification.state === "UNVERIFIED", "Verification propagated between layers.");
}

function ownershipChecks() {
  const values = chain();
  const personKeys = keysDeep(values.person); const playerKeys = keysDeep(values.player); const prospectKeys = keysDeep(values.prospect);
  ["canonicalName", "aliases", "externalIdentifiers", "entityType"].forEach((key) => assert(!personKeys.has(key), `Person Profile duplicates entity ownership: ${key}.`));
  ["canonicalName", "aliases", "externalIdentifiers", "entityType", "biography", "nameUsage", "citizenship", "languages", "education"].forEach((key) => assert(!playerKeys.has(key), `Player Profile duplicates upstream ownership: ${key}.`));
  ["canonicalName", "aliases", "externalIdentifiers", "entityType", "biography", "nameUsage", "citizenship", "languages", "education", "playingIdentity", "positionHistory", "teamAssignments", "rosterHistory", "eligibilityHistory"].forEach((key) => assert(!prospectKeys.has(key), `Prospect Profile duplicates upstream ownership: ${key}.`));
  const entity = fidApi.createFootballEntity(entityInput({ aliases: [{ name: "Entity Alias", aliasType: "KNOWN_AS" }] }));
  const person = fidApi.createPersonProfile(personInput({ nameUsage: [{ name: "Usage Name", usageCategory: "PREFERRED" }] }));
  assert(entity.aliases.length === 1 && person.nameUsage.length === 1 && entity.aliases[0].name !== person.nameUsage[0].name, "Name usage altered entity aliases.");
  const player = fidApi.createPlayerProfile(playerInput({ playingIdentity: { preferredPositionCode: "QB", competitionLevel: "COLLEGE" }, positionHistory: [{ positionCode: "WR", assignmentType: "HISTORICAL", status: "FORMER", competitionLevel: "COLLEGE" }] }));
  assert(player.playingIdentity.preferredPositionCode === "QB", "Position history changed preferred position.");
  const prospect = fidApi.createProspectProfile(prospectInput({ cycle: { cycleType: "DRAFT", status: "TRACKED", classYear: 2030 } }));
  assert(prospect.cycle.classYear === 2030 && !keysDeep(player).has("classYear"), "Prospect class altered player career data.");
}

function stateChecks() {
  const entity = fidApi.createFootballEntity(entityInput({ status: "ACTIVE" }));
  const person = fidApi.createPersonProfile(personInput({ status: "ACTIVE", personState: "UNKNOWN" }));
  const deceased = fidApi.createPersonProfile(personInput({ personState: "DECEASED" }));
  const player = fidApi.createPlayerProfile(playerInput({ status: "ACTIVE", participationState: "UNKNOWN" }));
  const retired = fidApi.createPlayerProfile(playerInput({ status: "ACTIVE", participationState: "RETIRED" }));
  const prospect = fidApi.createProspectProfile(prospectInput({ status: "ACTIVE", cycle: { cycleType: "DRAFT", status: "TRACKED" }, eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" }, declaration: { state: "NOT_DECLARED" } }));
  assert(entity.status === "ACTIVE" && person.status === "ACTIVE" && person.personState === "UNKNOWN", "Entity/person state coupled.");
  assert(deceased.personState === "DECEASED" && player.participationState === "UNKNOWN", "Person state altered player participation.");
  assert(player.status === "ACTIVE" && player.participationState === "UNKNOWN", "Player lifecycle implied participation.");
  assert(retired.participationState === "RETIRED" && retired.status === "ACTIVE", "Retirement archived profile.");
  assert(prospect.status === "ACTIVE" && prospect.cycle.status === "TRACKED" && prospect.eligibility.state === "UNKNOWN" && prospect.declaration.state === "NOT_DECLARED", "Prospect lifecycle implied cycle state.");
  const selected = fidApi.createProspectProfile(prospectInput({ cycle: { cycleType: "DRAFT", status: "SELECTED" }, entry: { pathwayType: "STANDARD", selectionRef: "selection-1" } }));
  const signed = fidApi.createProspectProfile(prospectInput({ cycle: { cycleType: "DRAFT", status: "SIGNED" } }));
  const returning = fidApi.createProspectProfile(prospectInput({ declaration: { state: "RETURNING" } }));
  assert(!keysDeep(selected).has("teamAssignments") && !keysDeep(signed).has("transaction") && returning.declaration.state === "RETURNING" && retired.participationState === "RETIRED", "Prospect state changed upstream or external state.");
}

function timelineChecks() {
  const person = fidApi.createPersonProfile(personInput({ careerTimeline: [
    { eventId: "p-1", eventType: "EMPLOYMENT", title: "Reported role" },
    { eventId: "p-2", eventType: "RETIREMENT", title: "Conflicting report" },
  ] }));
  const player = fidApi.createPlayerProfile(playerInput({ participationState: "ACTIVE", careerTimeline: [
    { eventId: "pl-1", eventType: "POSITION_CHANGE", title: "Reported position change" },
    { eventId: "pl-2", eventType: "RETIREMENT", title: "Conflicting report" },
  ] }));
  const prospect = fidApi.createProspectProfile(prospectInput({ prospectTimeline: [
    { eventId: "pr-1", eventType: "DECLARATION_CONFIRMED", title: "Declaration report" },
    { eventId: "pr-2", eventType: "WITHDRAWAL", title: "Withdrawal report" },
  ] }));
  assert(person.validation.valid && person.careerTimeline.length === 2 && !keysDeep(person).has("employment"), "Person timeline created employment.");
  assert(player.validation.valid && player.careerTimeline.length === 2 && player.positionHistory.length === 0 && player.rosterHistory.length === 0 && player.participationState === "ACTIVE", "Player timeline mutated current state.");
  assert(prospect.validation.valid && prospect.prospectTimeline.length === 2 && prospect.cycle.status === "TRACKED" && prospect.eligibility.state === "UNKNOWN" && prospect.declaration.state === "NOT_DECLARED" && prospect.entry.pathwayType === "STANDARD", "Prospect timeline mutated structured state.");
  const keys = new Set([...keysDeep(person), ...keysDeep(player), ...keysDeep(prospect)]);
  ["age", "tenure", "experience", "careerLength", "currentState"].forEach((key) => assert(!keys.has(key), `Timeline calculated ${key}.`));
}

function referenceChecks() {
  const prospect = fidApi.createProspectProfile(prospectInput({ references: {
    researchSourceRefs: ["research-1"], evidenceArtifactRefs: ["evidence-1"], relationshipRefs: ["relationship-1"],
    selectionRefs: ["selection-1"], transactionRefs: ["transaction-1"], measurementProfileRefs: ["measurement-1"],
    athleticProfileRefs: ["athletic-1"], productionProfileRefs: ["production-1"], statisticsDatasetRefs: ["stats-1"],
    medicalRecordRefs: ["medical-1"], injuryRecordRefs: ["injury-1"], consensusRecordRefs: ["consensus-1"], scoutingReportRefs: ["scouting-1"],
  } }));
  assert(prospect.validation.valid && Object.values(prospect.references).flat().every((ref) => typeof ref === "string"), "References are not stable strings.");
  const keys = keysDeep(prospect);
  ["relationship", "selectionResult", "transaction", "measurement", "athleticProfile", "production", "statistics", "medicalData", "injuryData", "consensusRanking", "scoutingReport"].forEach((key) => assert(!keys.has(key), `Reference hydrated data: ${key}.`));
  assert(prospect.verification.state === "UNVERIFIED", "Research references propagated verification.");
}

function evaluationChecks() {
  const values = Object.values(chain()); const keys = new Set(); values.forEach((value) => keysDeep(value, keys));
  const prohibited = ["traits", "components", "score", "grade", "ranking", "rank", "tier", "projection", "draftRange", "playerEvaluation", "evaluationResult", "teamFit", "schemeFit", "draftValue", "archetype", "comparison", "strengths", "concerns", "developmentPriorities", "readiness", "modelConfidence", "recommendation", "probability", "decision"];
  prohibited.forEach((key) => assert(!keys.has(key), `Evaluation field owned by FID foundation: ${key}.`));
}

function exportChecks() {
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi);
  assert(APPROVED_EXPORTS.length === 89, "Approved foundation export baseline changed.");
  assert(new Set(named).size === named.length && new Set(defaults).size === defaults.length, "Duplicate export identifier found.");
  assert(APPROVED_EXPORTS.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name)
    && namedApi[name] === APPROVED_FID_API[name] && fidApi[name] === APPROVED_FID_API[name]
    && namedApi[name] === fidApi[name]), "Approved export missing, overwritten, or mismatched.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner entered production exports.");
  assert(named.length >= APPROVED_EXPORTS.length && defaults.length >= APPROVED_EXPORTS.length, "Additive exports are not permitted.");
}

function dependencyChecks(context) {
  const approvedArchitectureImports = new Set([
    "./persistence/index.js",
    "../persistence/index.js",
    "./persistence/FidPersistenceArchitectureSpecification.js",
    "../persistence/FidPersistenceArchitectureSpecification.js",
    "./persistence/FidPersistenceRepositoryContract.js",
    "../persistence/FidPersistenceRepositoryContract.js",
    "./persistence/InMemoryFidPersistenceRepository.js",
    "../persistence/InMemoryFidPersistenceRepository.js",
  ]);
  const persistenceImports = context.productionImports.filter((entry) => /persistence/i.test(entry));
  const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|filesystem\s+storage|browser\s+storage|localStorage|IndexedDB|network\s+persistence|hydration|synchronization|registry|resolver|identity\s+resolution|runtime\s+(?:persistence|database)\s+integration/i;
  const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|EntityRepository|PersonRepository|PlayerRepository|ProspectRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+runtime|migration\s+runtime|application\s+persistence\s+singleton|runtime\s+hydration|runtime\s+synchronization|identity\s+resolution|runtime\s+database\s+integration/i;
  assert(persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) && context.contractSources.every((source) => !prohibitedContractDependency.test(source)) && !prohibitedRuntime.test(context.productionSource), "Prohibited production dependency: persistence.");
  ["diagnostics", "researchrepository", "supabase", "registry", "resolver", "ontology", "relationshipservice", "engines", "quarterback", "draftv3", "components", "pages", "router", "routes"].forEach((term) => assert(context.productionImports.every((entry) => !entry.toLowerCase().replaceAll("/", "").includes(term)), `Prohibited production dependency: ${term}.`));
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
}

function stabilityChecks() {
  const inputs = [entityInput(), personInput(), playerInput(), prospectInput()];
  const factories = [fidApi.createFootballEntity, fidApi.createPersonProfile, fidApi.createPlayerProfile, fidApi.createProspectProfile];
  const validators = [fidApi.validateFootballEntity, fidApi.validatePersonProfile, fidApi.validatePlayerProfile, fidApi.validateProspectProfile];
  inputs.forEach((input, index) => {
    const snapshot = JSON.stringify(input); const first = factories[index](input);
    assert(JSON.stringify(input) === snapshot, "Factory mutated input."); validators[index](first);
    assert(JSON.stringify(input) === snapshot, "Validator mutated input.");
    assert(JSON.stringify(first) === JSON.stringify(factories[index](input)), "Repeated normalization is unstable.");
  });
  const unavailable = [fidApi.createUnavailableFootballEntity(), fidApi.createUnavailablePersonProfile(), fidApi.createUnavailablePlayerProfile(), fidApi.createUnavailableProspectProfile()];
  unavailable.forEach((value) => {
    const keys = keysDeep(value);
    ["generatedId", "generatedAt", "resolvedReference", "evaluation", "score", "grade"].forEach((key) => assert(!keys.has(key), `Unavailable factory invented ${key}.`));
  });
}

async function suiteChecks(context) {
  assert(context.suiteSummaries.footballEntity.total === 120 && context.suiteSummaries.footballEntity.failed === 0, "Football Entity diagnostics failed.");
  assert(context.suiteSummaries.personProfile.total === 148 && context.suiteSummaries.personProfile.failed === 0, "Person Profile diagnostics failed.");
  assert(context.suiteSummaries.playerProfile.total === 209 && context.suiteSummaries.playerProfile.failed === 0, "Player Profile diagnostics failed.");
  assert(context.suiteSummaries.prospectProfile.total === 230 && context.suiteSummaries.prospectProfile.failed === 0, "Prospect Profile diagnostics failed.");
  assert(context.suiteSummaries.researchRepository.total === 616 && context.suiteSummaries.researchRepository.failed === 0, "Research Repository diagnostics failed.");
}

const CASE_NAMES = Object.freeze(`
four-contract-names-unique|four-contract-versions-exist|four-schema-versions-exist|four-validation-shapes-consistent|four-factories-expose-contract-identity|four-unavailable-factories-full-shape|four-validators-tolerate-null|four-validators-tolerate-arrays|four-validators-tolerate-primitives|four-guard-groups-return-booleans|
full-chain-validates|chain-string-references-only|chain-embeds-no-contract-objects|entity-reference-compatibility|person-profile-reference-compatibility|player-profile-reference-compatibility|prospect-profile-reference-compatibility|entity-type-not-resolved|reference-existence-not-resolved|identity-verification-not-propagated|person-verification-not-propagated|player-verification-not-propagated|research-verification-not-propagated|
football-entity-owns-canonical-identity|person-duplicates-no-canonical-identity|player-duplicates-no-canonical-identity|player-duplicates-no-biography|prospect-duplicates-no-canonical-identity|prospect-duplicates-no-biography|prospect-duplicates-no-playing-history|name-usage-does-not-create-aliases|position-history-does-not-change-preferred-position|prospect-class-does-not-change-player-career|
football-entity-status-independent|person-profile-status-independent|person-state-independent|player-profile-status-independent|participation-state-independent|prospect-profile-status-independent|prospect-cycle-state-independent|prospect-eligibility-independent|declaration-independent|active-entity-does-not-activate-profiles|active-person-does-not-imply-living|deceased-person-does-not-alter-player|active-player-does-not-imply-participation|retired-participation-does-not-archive|active-prospect-does-not-imply-eligible|active-prospect-does-not-imply-declared|selected-cycle-does-not-create-assignment|returning-does-not-alter-player|signed-does-not-create-transaction|
person-timeline-creates-no-employment|player-timeline-does-not-update-positions|player-timeline-does-not-update-roster|player-timeline-does-not-update-participation|prospect-timeline-does-not-update-cycle|prospect-timeline-does-not-update-eligibility|prospect-timeline-does-not-update-declaration|prospect-timeline-does-not-update-entry|conflicting-timelines-coexist|current-state-not-inferred|age-not-calculated|tenure-not-calculated|experience-not-calculated|career-length-not-calculated|
relationship-refs-create-no-relationships|selection-refs-create-no-results|transaction-refs-create-no-assignment|measurement-refs-embed-no-measurement|athletic-refs-embed-no-profile|production-refs-embed-no-production|statistics-refs-embed-no-statistics|medical-refs-embed-no-medical|injury-refs-embed-no-injury|consensus-refs-embed-no-ranking|scouting-refs-embed-no-report|
no-trait-fields|no-component-fields|no-score-fields|no-grade-fields|no-ranking-fields|no-tier-fields|no-projection-fields|no-draft-range-fields|no-evaluation-result-fields|no-team-fit-fields|no-scheme-fit-fields|no-draft-value-fields|no-archetype-fields|no-comparison-fields|no-strengths-fields|no-concerns-fields|no-development-priority-fields|no-readiness-output-fields|no-model-confidence-fields|no-recommendation-fields|no-probability-fields|no-decision-fields|
all-89-exports-preserved|named-default-reference-agreement|named-keys-unique|default-keys-unique|additive-exports-permitted|diagnostics-excluded|no-exact-export-count-ceiling|
football-entity-diagnostics-pass|person-profile-diagnostics-pass|player-profile-diagnostics-pass|prospect-profile-diagnostics-pass|research-repository-diagnostics-pass|
no-research-production-dependency|no-persistence-dependency|no-supabase-dependency|no-registry-dependency|no-resolver-dependency|no-ontology-dependency|no-relationship-dependency|no-engine-dependency|no-qb-dependency|no-draft-v3-dependency|no-ui-dependency|no-routing-dependency|no-circular-production-dependency|
factories-do-not-mutate|validators-do-not-mutate|stable-repeated-normalization|unavailable-factories-invent-no-facts|foundation-runs-independently|structured-diagnostic-summary
`.trim().split(/\s*\|\s*/));

async function checkForIndex(index, context) {
  if (index < 10) return contractChecks();
  if (index < 23) return chainChecks();
  if (index < 33) return ownershipChecks();
  if (index < 52) return stateChecks();
  if (index < 66) return timelineChecks();
  if (index < 77) return referenceChecks();
  if (index < 99) return evaluationChecks();
  if (index < 106) return exportChecks();
  if (index < 111) return suiteChecks(context);
  if (index < 124) return dependencyChecks(context);
  return stabilityChecks();
}

async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  const footballEntity = runFootballEntityContractDiagnostics();
  const personProfile = await runPersonProfileContractDiagnostics();
  const playerProfile = await runPlayerProfileContractDiagnostics();
  const prospectProfile = await runProspectProfileContractDiagnostics();
  const researchRepository = prospectProfile.existingSuiteSummaries.researchRepository;
  const contractSources = Object.entries(sources).filter(([file]) => /contracts[/\\](?:FootballEntity|PersonProfile|PlayerProfile|ProspectProfile)Contract\.js$/.test(file)).map(([, source]) => source);
  return { productionImports: Object.values(sources).flatMap(imports), productionSource: Object.values(sources).join("\n"), contractSources, dependencyGraph: graph(sources),
    suiteSummaries: { footballEntity, personProfile, playerProfile, prospectProfile, researchRepository } };
}

export async function runFidPersonPlayerProspectFoundationDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) {
    const id = CASE_NAMES[index];
    try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (error) { cases.push({ id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }); }
  }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE,
    contractVersions: { footballEntity: fidApi.FOOTBALL_ENTITY_CONTRACT_VERSION, personProfile: fidApi.PERSON_PROFILE_CONTRACT_VERSION, playerProfile: fidApi.PLAYER_PROFILE_CONTRACT_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_CONTRACT_VERSION },
    schemaVersions: { footballEntity: fidApi.FOOTBALL_ENTITY_SCHEMA_VERSION, personProfile: fidApi.PERSON_PROFILE_SCHEMA_VERSION, playerProfile: fidApi.PLAYER_PROFILE_SCHEMA_VERSION, prospectProfile: fidApi.PROSPECT_PROFILE_SCHEMA_VERSION },
    total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFidPersonPlayerProspectFoundationDiagnostics });
