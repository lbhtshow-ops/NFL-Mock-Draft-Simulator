#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("./auditNFLMatchupIntelligenceCanonicalRepository.mjs", import.meta.url),
  "utf8"
);

const defs = [
  ["read-only-audit", /READ_ONLY_CANONICAL_REPOSITORY_AUDIT/],
  ["team-intelligence-group", /teamIntelligence:/],
  ["matchup-group", /matchup:/],
  ["performance-group", /performance:/],
  ["offense-defense-group", /offenseDefense:/],
  ["qb-dependency-group", /qbDependency:/],
  ["availability-group", /availability:/],
  ["decision-support-group", /decisionSupport:/],
  ["provenance-confidence-group", /provenanceConfidence:/],
  ["epa-token", /"epa"/],
  ["success-rate-token", /"success rate"/],
  ["opponent-adjusted-token", /"opponent-adjusted"/],
  ["qb-state-token", /"qb state"/],
  ["availability-resolver-token", /resolveBoundedAvailabilityImpact/],
  ["canonical-model-token", /NFL-GAME-DECISION-MODEL-V1\.0\.0/],
  ["repository-scan", /filesInspected/],
  ["contract-candidate-classification", /likelyContract/],
  ["runtime-candidate-classification", /likelyRuntimeSurface/],
  ["generated-data-classification", /likelyGeneratedData/],
  ["canonical-fie-matchup-owner", /canonicalFIEOwnsMatchupReasoning: true/],
  ["mds-consumer-boundary", /mdsConsumesMatchupAndDraftDecisionSupport: true/],
  ["pickem-decision-only", /pickemConsumesDecisionOutputOnly: true/],
  ["no-duplicate-matchup", /duplicateMatchupEngineInApplicationsProhibited: true/],
  ["team-foundation-reusable", /teamIntelligenceMustRemainReusableFoundation: true/],
  ["availability-foundation-reusable", /playerAvailabilityMustRemainReusableFoundation: true/],
  ["provenance-first-class", /provenanceAndConfidenceMustRemainFirstClass: true/],
  ["scoring-locked", /matchupScoringImplementationAuthorized: false/],
  ["decision-model-locked", /productionDecisionModelMutationAuthorized: false/],
  ["pickem-locked", /pickemRepositoryMutationAuthorized: false/],
  ["db-locked", /databaseMutationAuthorized: false/],
  ["ref-17c-locked", /refSprint17CResumptionAuthorized: false/],
  ["surface-found-decision", /MATCHUP_INTELLIGENCE_EXISTING_SURFACES_IDENTIFIED_FOR_CANONICAL_CONTRACT_AUDIT/],
  ["surface-missing-decision", /MATCHUP_INTELLIGENCE_FOUNDATION_PRESENT_BUT_EXPLICIT_MATCHUP_SURFACE_MISSING/],
  ["foundation-incomplete-decision", /MATCHUP_INTELLIGENCE_FOUNDATION_INCOMPLETE_REQUIRES_RECONCILIATION/]
];

const tests = defs.map(([name,re]) => ({ name, passed: re.test(src) }));
const passed = tests.filter(x => x.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "NFL Matchup Intelligence Canonical Repository Audit RC1 Diagnostics",
  sprint: "2.19-RC1",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
