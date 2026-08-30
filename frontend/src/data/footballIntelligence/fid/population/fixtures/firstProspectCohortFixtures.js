const TARGET_CYCLE_REF = "draft-cycle:2027";
const TARGET_DRAFT_CLASS = 2027;

const SHARED_SOURCE_PATHS = Object.freeze({
  registry: "src/data/footballIntelligence/registry/prospects.js",
  prospectIds: "src/data/footballIntelligence/registry/prospectIds.js",
  athletics: "src/data/footballIntelligence/athletics/athleticProfiles.js",
  production: "src/data/footballIntelligence/production/productionProfiles.js",
  footballIQ: "src/data/footballIntelligence/footballIQ/footballIQProfiles.js",
  scouting: "src/data/footballIntelligence/scouting/scoutingProfiles.js",
  schemeFit: "src/data/footballIntelligence/schemes/schemeFitProfiles.js",
  traits: "src/data/footballIntelligence/scouting/playerTraitProfiles.js",
  legacyResearch: "src/data/footballIntelligence/metadata/researchRecords.js",
});

const cohort = [
  { slug: "arch-manning", name: "Arch Manning", position: "QB", school: "Texas", registryKey: "ARCH_MANNING", legacyProspectId: "2026-arch-manning", playerFile: "archManning.js", legacyResearchAvailable: false },
  { slug: "caleb-downs", name: "Caleb Downs", position: "S", school: "Ohio State", registryKey: "CALEB_DOWNS", legacyProspectId: "2026-caleb-downs", playerFile: "calebDowns.js", legacyResearchAvailable: false },
  { slug: "francis-mauigoa", name: "Francis Mauigoa", position: "OT", school: "Miami", registryKey: "FRANCIS_MAUIGOA", legacyProspectId: "2026-francis-mauigoa", playerFile: "francisMauigoa.js", legacyResearchAvailable: false },
  { slug: "peter-woods", name: "Peter Woods", position: "DL", school: "Clemson", registryKey: "PETER_WOODS", legacyProspectId: "2026-peter-woods", playerFile: "peterWoods.js", legacyResearchAvailable: true },
];

function source(subject, key, sourceType = "INTERNAL_RECORD", status = "DECLARED") {
  const path = key === "playerDatabase" ? `src/data/footballIntelligence/database/players/${subject.playerFile}` : SHARED_SOURCE_PATHS[key];
  const anchor = key === "legacyResearch" ? `prospectIds.${subject.registryKey}` : subject.legacyProspectId;
  return { sourceId: `population-source:${subject.slug}:${key}`, sourceType, sourceRef: `${path}#${anchor}`, label: `${subject.name} ${key} repository record`, status, evidenceRefs: [`population-source-evidence-ref:${subject.slug}:${key}`], notes: "Existing repository reference; content is not copied into this fixture." };
}

function evidence(subject, category, keys, status = "DECLARED", limitations = []) {
  return { evidenceId: `population-evidence:${subject.slug}:${category.toLowerCase()}`, category, status, sourceRefs: keys.map((key) => source(subject, key).sourceRef), evidenceRefs: keys.map((key) => `population-evidence-ref:${subject.slug}:${category.toLowerCase()}:${key}`), subjectRef: subject.legacyProspectId, limitations };
}

function fiisInput(subject, sourceRefs, evidenceRefs) {
  const candidateRef = `intake-candidate:${subject.slug}`;
  return {
    requestId: `fiis-request:first-cohort:${subject.slug}`, requestRevision: 1, intakeType: "PROSPECT", domain: "FOOTBALL_INTELLIGENCE", sport: "FOOTBALL",
    cycleRef: TARGET_CYCLE_REF, candidateRef, initiatingActorRef: "sprint-35-validation", requestedOperations: ["REVIEW"], targetDeclarations: [],
    identityInputs: [{ identityInputId: `fiis-identity:${subject.slug}`, identityType: "PROSPECT", suppliedName: subject.name, suppliedExternalIds: { legacyProspectId: subject.legacyProspectId }, candidateEntityRef: subject.legacyProspectId, externalExistingRecord: true, notes: "Legacy identity reference only; no canonical identity is created." }],
    researchRefs: subject.legacyResearchAvailable ? [`${SHARED_SOURCE_PATHS.legacyResearch}#prospectIds.${subject.registryKey}`] : [], sourceRefs, evidenceRefs, observationRefs: [], claimRefs: [],
    reviewRequirements: [{ requirementId: `fiis-review:${subject.slug}:cycle`, requirementType: "HUMAN_REVIEW", targetRefs: [candidateRef], required: true, notes: "Resolve legacy 2026 registry classification against the governed 2027 target cycle." }, { requirementId: `fiis-review:${subject.slug}:evidence`, requirementType: "EVIDENCE_REVIEW", targetRefs: [candidateRef], required: true, notes: "Eligibility and declaration evidence remain unavailable." }],
    authorizationRequirements: [], status: "DRAFT", verification: { state: "UNVERIFIED", notes: "Validation-only FIIS declaration." }, provenance: { suppliedBy: "sprint-35-validation", suppliedBySystem: "FID_POPULATION_DIAGNOSTICS", accompanyingRefs: sourceRefs }, lifecycle: { state: "OPEN" }, notes: "No persistence, promotion, or canonical record creation is authorized.",
  };
}

export function createFirstProspectCohortFixture(subjectInput) {
  const subject = { ...subjectInput, targetCycleRef: TARGET_CYCLE_REF, targetDraftClass: TARGET_DRAFT_CLASS, legacyDraftClass: 2026 };
  const sources = [source(subject, "registry"), source(subject, "prospectIds"), source(subject, "playerDatabase"), source(subject, "athletics"), source(subject, "production"), source(subject, "footballIQ"), source(subject, "scouting"), source(subject, "schemeFit"), source(subject, "traits")];
  if (subject.legacyResearchAvailable) sources.push(source(subject, "legacyResearch", "RESEARCH", "REVIEWED"));
  const evidenceDeclarations = [
    evidence(subject, "IDENTITY", ["registry", "prospectIds", "playerDatabase"], "SUFFICIENT"),
    evidence(subject, "POSITION", ["registry", "playerDatabase"], "SUFFICIENT"),
    evidence(subject, "CLASS_YEAR", ["registry", "playerDatabase"], "PARTIAL", ["Legacy registry declares draftClass 2026 while the governed target cycle is 2027."]),
    evidence(subject, "MEASUREMENTS", ["playerDatabase", "athletics"], "DECLARED"),
    evidence(subject, "PRODUCTION", ["playerDatabase", "production"], "DECLARED"),
    evidence(subject, "SCOUTING", ["footballIQ", "scouting", "schemeFit", "traits"], "DECLARED"),
    evidence(subject, "ELIGIBILITY", ["registry", "playerDatabase"], "INSUFFICIENT", ["No governed eligibility evidence exists in the referenced repository data."]),
    evidence(subject, "DECLARATION", ["registry", "playerDatabase"], "INSUFFICIENT", ["No governed declaration evidence exists in the referenced repository data."]),
  ];
  const sourceRefs = sources.map((entry) => entry.sourceRef); const evidenceRefs = evidenceDeclarations.flatMap((entry) => entry.evidenceRefs);
  return Object.freeze({
    subject: Object.freeze(subject), sourceDeclarations: Object.freeze(sources), evidenceDeclarations: Object.freeze(evidenceDeclarations),
    workflowInput: Object.freeze({
      workflowId: `population-workflow:first-cohort:${subject.slug}`, workflowRevision: 1, workflowType: "PROSPECT", status: "VALIDATING", cycleRef: TARGET_CYCLE_REF,
      candidateRef: `intake-candidate:${subject.slug}`, subjectRefs: [subject.legacyProspectId], sourceMetadata: sources, evidenceDeclarations,
      populationRecords: [{ populationRecordId: `population-record:first-cohort:${subject.slug}`, recordType: "LEGACY_PROSPECT_REFERENCE_SET", recordRef: subject.legacyProspectId, candidateRef: `intake-candidate:${subject.slug}`, payload: { recordKind: "REFERENCE_ONLY", legacyProspectId: subject.legacyProspectId, sourceRefs, unknownValues: ["eligibility", "declaration"], canonicalRecordCreated: false }, sourceRefs, evidenceRefs, notes: "References existing repository data without duplicating football content." }],
      requiredEvidenceCategories: ["IDENTITY", "POSITION", "CLASS_YEAR", "MEASUREMENTS", "PRODUCTION", "SCOUTING", "ELIGIBILITY", "DECLARATION"],
      fiisIntakeRequestInput: fiisInput(subject, sourceRefs, evidenceRefs), reviewRefs: [`fiis-review:${subject.slug}:cycle`, `fiis-review:${subject.slug}:evidence`], blockerRefs: [`population-blocker:${subject.slug}:cycle`, `population-blocker:${subject.slug}:eligibility`, `population-blocker:${subject.slug}:declaration`],
      verification: { state: "REVIEWED", reviewedBy: "sprint-35-validation", reviewedAt: "2026-07-18", notes: "Repository-reference validation only." }, provenance: { createdBy: "sprint-35-validation", createdAt: "2026-07-18", sourceRefs }, lifecycle: { state: "OPEN", openedAt: "2026-07-18" }, notes: "First governed population cohort fixture; no canonical FID output.",
    }),
  });
}

export const firstProspectCohortFixtures = Object.freeze(cohort.map(createFirstProspectCohortFixture));
export const firstProspectCohortSourcePaths = SHARED_SOURCE_PATHS;
export const firstProspectCohortTargetCycle = Object.freeze({ cycleRef: TARGET_CYCLE_REF, draftClass: TARGET_DRAFT_CLASS });

export default firstProspectCohortFixtures;
