#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync(new URL("./auditFIEDecisionIntegrationPickemHandoffGate.mjs",import.meta.url),"utf8");
const defs=[
 ["audit-script",/READ_ONLY_REPOSITORY_AUDIT/],
 ["rc3-resolver-required",/resolveBoundedAvailabilityImpactV1\.mjs/],
 ["decision-api-pattern",/Decision API/],
 ["decision-model-pattern",/decision\[-_ \]\?model/],
 ["matchup-intelligence-pattern",/matchup\[-_ \]\?intelligence/],
 ["canonical-model-token",/NFL-GAME-DECISION-MODEL-V1\\\.0\\\.0/],
 ["team-intelligence-pattern",/team\[-_ \]\?intelligence/],
 ["canonical-fie-owns-reasoning",/canonicalFIEOwnsAvailabilityReasoning: true/],
 ["pickem-consumer-contract",/pickemConsumesStableDecisionContract: true/],
 ["pickem-reimplementation-prohibited",/pickemReimplementationProhibited: true/],
 ["double-counting-prohibited",/availabilityMustNotDoubleCountTeamOrRosterSignals: true/],
 ["neutral-preserves-baseline",/neutralFallbackMustPreserveBaselineDecision: true/],
 ["missing-availability-fail-safe",/missingAvailabilityMustNotFailDecisionRequest: true/],
 ["provenance-inspectable",/provenanceMustRemainInspectable: true/],
 ["adapter-mutation-locked",/productionAdapterMutationAuthorized: false/],
 ["matchup-mutation-locked",/matchupScoringMutationAuthorized: false/],
 ["decision-mutation-locked",/decisionModelScoringMutationAuthorized: false/],
 ["pickem-repo-locked",/pickemRepositoryMutationAuthorized: false/],
 ["database-locked",/databaseMutationAuthorized: false/],
 ["read-only-safeguard",/repositoryFilesMutated: false/],
 ["fail-closed-decision",/INTEGRATION_SURFACE_NOT_YET_IDENTIFIED_FAIL_CLOSED/]
];
const tests=defs.map(([name,re])=>({name,passed:re.test(src)}));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
 suite:"FIE Decision Integration & Pick'em Handoff Gate RC4 Diagnostics",
 sprint:"2.18.24-RC4",passed,failed,tests
},null,2));
if(failed) process.exitCode=1;
