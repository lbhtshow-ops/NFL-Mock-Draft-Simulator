#!/usr/bin/env node
import fs from "node:fs";

const src=fs.readFileSync(
  new URL("./auditMDSFIEConsumerRepositoryIntegrationMap.mjs",import.meta.url),
  "utf8"
);

const defs=[
 ["read-only",/READ_ONLY_MDS_CONSUMER_ARCHITECTURE_AUDIT/],
 ["draft-operations-anchor",/DraftOperationsCenter\.jsx/],
 ["draft-wire-anchor",/DraftWire\.jsx/],
 ["prospect-intelligence-anchor",/ProspectIntelligenceCenter\.jsx/],
 ["sports-intelligence-anchor",/SportsIntelligenceEngine\.js/],
 ["canonical-runtime-token",/CanonicalNFLMatchupIntelligenceRuntimeV1/],
 ["canonical-assessment-token",/CanonicalNFLMatchupDirectionalAssessmentEngineV1/],
 ["canonical-boundary",/CANONICAL_FIE_MATCHUP_INTELLIGENCE_OUTPUT/],
 ["cpu-draft-token",/"cpu draft"/],
 ["team-needs-token",/"team needs"/],
 ["scheme-fit-token",/"scheme fit"/],
 ["decision-support-token",/"decision support"/],
 ["duplicate-team-strength-token",/"teamStrength"/],
 ["duplicate-availability-token",/"availabilityImpact"/],
 ["duplicate-matchup-token",/"matchupScore"/],
 ["candidate-classification",/potentialDuplicateReasoning/],
 ["ui-consumer-classification",/likelyUIConsumer/],
 ["service-engine-classification",/likelyServiceOrEngine/],
 ["adapter-layer",/MDS_FIE_CONSUMER_ADAPTER/],
 ["application-service-layer",/MDS_INTELLIGENCE_APPLICATION_SERVICE/],
 ["presentation-layer",/MDS_PRESENTATION_AND_DRAFT_DECISION_CONSUMERS/],
 ["no-react-scoring",/DIRECT_FIE_SCORING_LOGIC_IN_REACT_COMPONENTS/],
 ["no-team-recompute",/MDS_RECOMPUTES_TEAM_STRENGTH/],
 ["no-availability-recompute",/MDS_RECOMPUTES_AVAILABILITY/],
 ["no-matchup-recompute",/MDS_RECOMPUTES_MATCHUP_DIRECTION/],
 ["no-pickem-import",/MDS_IMPORTS_PICKEM_SPECIFIC_LOGIC/],
 ["audit-ready-decision",/MDS_FIE_CONSUMER_ARCHITECTURE_AUDITED_INTEGRATION_MAP_READY/],
 ["audit-blocked-decision",/MDS_FIE_CONSUMER_ARCHITECTURE_AUDIT_BLOCKED/],
 ["adapter-not-authorized",/consumerAdapterImplementationAuthorized: false/],
 ["draft-room-locked",/draftRoomMutationAuthorized: false/],
 ["cpu-locked",/cpuDraftDecisionMutationAuthorized: false/],
 ["draft-wire-locked",/draftWireRuntimeMutationAuthorized: false/],
 ["probability-locked",/productionDecisionProbabilityMutationAuthorized: false/],
 ["pickem-locked",/pickemRepositoryMutationAuthorized: false/],
 ["db-locked",/databaseMutationAuthorized: false/],
 ["next-adapter-contract",/DEFINE_MDS_FIE_CONSUMER_ADAPTER_CONTRACT_AGAINST_IDENTIFIED_REPOSITORY_SURFACES/]
];

const tests=defs.map(([name,re])=>({name,passed:re.test(src)}));
const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"MDS/FIE Consumer Repository Audit & Integration Map RC1 Diagnostics",
  sprint:"MDS-FIE-INTEGRATION-1-RC1",
  passed,failed,tests
},null,2));

if(failed) process.exitCode=1;
