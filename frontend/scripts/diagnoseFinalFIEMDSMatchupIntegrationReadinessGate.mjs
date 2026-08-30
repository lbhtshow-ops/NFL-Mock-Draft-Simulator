#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("./runFinalFIEMDSMatchupIntegrationReadinessGate.mjs", import.meta.url),
  "utf8"
);

const defs = [
  ["runtime-file-required", /CanonicalNFLMatchupIntelligenceRuntimeV1\.js/],
  ["assessment-file-required", /CanonicalNFLMatchupDirectionalAssessmentEngineV1\.js/],
  ["runtime-diagnostics", /diagnoseCanonicalNFLMatchupIntelligenceRuntimeV1\.mjs/],
  ["runtime-fixtures", /validateCanonicalNFLMatchupIntelligenceRuntimeV1\.mjs/],
  ["assessment-diagnostics", /diagnoseCanonicalNFLMatchupDirectionalAssessmentEngineV1\.mjs/],
  ["assessment-fixtures", /validateCanonicalNFLMatchupDirectionalAssessmentEngineV1\.mjs/],
  ["policy-required", /defineGovernedNFLMatchupDirectionalAssessmentScoringPolicyV1\.mjs/],
  ["draft-operations-anchor", /DraftOperationsCenter\.jsx/],
  ["draft-wire-anchor", /DraftWire/],
  ["prospect-intelligence-anchor", /ProspectIntelligenceCenter/],
  ["sports-intelligence-anchor", /SportsIntelligenceEngine/],
  ["canonical-team-owner", /canonicalFIEOwnsTeamIntelligence: true/],
  ["canonical-availability-owner", /canonicalFIEOwnsAvailabilityIntelligence: true/],
  ["canonical-matchup-owner", /canonicalFIEOwnsMatchupIntelligence: true/],
  ["canonical-assessment-owner", /canonicalFIEOwnsDirectionalAssessment: true/],
  ["mds-draft-owner", /mdsOwnsDraftSimulation: true/],
  ["mds-presentation-owner", /mdsOwnsDraftRoomPresentation: true/],
  ["mds-consume-fie", /mdsMayConsumeCanonicalFIEContracts: true/],
  ["no-mds-duplicate-reasoning", /mdsMayDuplicateFIEReasoning: false/],
  ["producer-fie", /producer: "CANONICAL_FIE"/],
  ["consumer-mds", /consumer: "LBHT_MOCK_DRAFT_SIMULATOR"/],
  ["boundary-matchup-output", /CANONICAL_FIE_MATCHUP_INTELLIGENCE_OUTPUT/],
  ["draft-room-use", /DRAFT_ROOM_INTELLIGENCE_PRESENTATION/],
  ["draft-wire-use", /DRAFT_WIRE_INTELLIGENCE_EVENT_INPUT/],
  ["draft-decision-use", /DRAFT_DECISION_SUPPORT_CONTEXT/],
  ["cpu-use", /CPU_DRAFT_DECISION_SUPPORT_INPUT/],
  ["no-team-recompute", /RECOMPUTE_TEAM_STRENGTH_IN_MDS/],
  ["no-availability-recompute", /RECOMPUTE_AVAILABILITY_IN_MDS/],
  ["no-matchup-recompute", /RECOMPUTE_MATCHUP_SCORING_IN_MDS/],
  ["no-probability-mutation", /MUTATE_FIE_DECISION_PROBABILITY/],
  ["no-pickem-import", /IMPORT_PICKEM_SPECIFIC_LOGIC/],
  ["safe-fallback", /missingMatchupIntelligenceMustNotBreakDraftRoom: true/],
  ["neutral-safe", /neutralOrInsufficientEvidenceMustRemainPresentationallySafe: true/],
  ["provenance-inspectable", /provenanceShouldRemainInspectable: true/],
  ["confidence-inspectable", /confidenceShouldRemainInspectable: true/],
  ["completeness-inspectable", /evidenceCompletenessShouldRemainInspectable: true/],
  ["duplicate-reasoning-prohibited", /duplicateReasoningProhibited: true/],
  ["ready-decision", /FIE_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_READY/],
  ["blocked-decision", /FIE_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_BLOCKED/],
  ["mds-integration-gated", /mdsConsumerIntegrationMayAdvance: ready/],
  ["canonical-remains-owner", /canonicalFIERemainsReasoningOwner: true/],
  ["decision-probability-locked", /productionDecisionProbabilityMutationAuthorized: false/],
  ["winner-locked", /productionWinnerMutationAuthorized: false/],
  ["pickem-locked", /pickemRepositoryMutationAuthorized: false/],
  ["db-locked", /databaseMutationAuthorized: false/],
  ["ref-locked", /refSprint17CResumptionAuthorized: false/],
  ["next-step-audit", /BEGIN_MDS_FIE_CONSUMER_INTEGRATION_WITH_REPOSITORY_AUDIT/]
];

const tests = defs.map(([name,re]) => ({name, passed: re.test(src)}));
const passed = tests.filter(x => x.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Final FIE → MDS Matchup Integration Readiness Gate RC7 Diagnostics",
  sprint: "2.19-RC7",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
