import assert from "node:assert/strict";
import { TEAM_DEPENDENCY_LEVELS } from "../src/engines/playerAvailability/contracts/PlayerAvailabilityImpactContextContract.js";
import {
  createNFLTeamDependencyEvidence,
  NFL_TEAM_DEPENDENCY_STATES,
} from "../src/engines/playerAvailability/integration/NFLTeamDependencyEvidenceContract.js";
import {
  resolveNFLPlayerImpactIntegratedInputs,
} from "../src/engines/playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js";

const tests=[];
const test=(name,fn)=>{try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.message||String(e)});}};

const lamar={player:{playerId:"e06a9c07-453a-4bb0-a7e9-2c3a64166dad",playerName:"Lamar Jackson",position:"QB"},canonicalAvailabilityStatus:"AVAILABLE",role:{depthPosition:"QB",depthRank:1,starter:true},evidenceRefs:["obs:lamar"]};
const huntley={player:{playerId:"7c226f73-a59f-4db6-ad98-2766d05d4d5a",playerName:"Tyler Huntley",position:"QB"},canonicalAvailabilityStatus:"AVAILABLE",role:{depthPosition:"QB",depthRank:2,starter:false},evidenceRefs:["obs:huntley"]};

const integrated=resolveNFLPlayerImpactIntegratedInputs({
  canonicalAvailabilityPlayer:lamar,
  canonicalAvailabilityRoster:[lamar,huntley],
  season:2026,
  week:1,
  team:"BAL"
});

test("canonical-lamar-caliber-resolved",()=>assert.equal(typeof integrated.canonicalCaliber?.caliberGrade,"number"));
test("canonical-huntley-caliber-resolved",()=>assert.equal(typeof integrated.replacementCaliber?.caliberGrade,"number"));
test("lamar-caliber-exceeds-replacement",()=>assert.ok(integrated.canonicalCaliber.caliberGrade>integrated.replacementCaliber.caliberGrade));
test("replacement-is-live-qb2",()=>assert.equal(integrated.replacement?.playerName,"Tyler Huntley"));
test("replacement-quality-resolved-from-caliber-gap",()=>assert.notEqual(integrated.contextResolution.context.replacementQuality,"UNKNOWN"));
test("usage-evidence-resolved",()=>assert.ok(integrated.usageEvidence?.gamesTracked>0));
test("usage-is-prior-evidence-not-starter-inference",()=>assert.equal(integrated.usageEvidence?.provenance?.source,"generatedNFLVerseSnapCountsSource"));
test("offense-snap-share-numeric",()=>assert.equal(typeof integrated.contextResolution.context.offensiveSnapShare,"number"));
test("team-dependency-now-resolves-through-team-intelligence",()=>assert.notEqual(integrated.teamDependencyEvidence.dependency,"UNKNOWN"));
test("team-dependency-provenance-explicit",()=>assert.equal(integrated.teamDependencyEvidence.provenance.source,"NFLPlayerTeamDependencyIntelligence"));
test("integrated-context-now-ready",()=>assert.equal(integrated.readiness,"READY"));
test("integrated-context-has-no-missing-dimensions",()=>assert.equal(integrated.missingDimensions.length,0));
test("no-direct-impact-score",()=>assert.equal("overallImpact" in integrated,false));
test("no-prediction-score",()=>assert.equal("winProbability" in integrated,false));

const dependency=createNFLTeamDependencyEvidence({
  season:2026,week:1,team:"BAL",playerName:"Lamar Jackson",
  dependency:NFL_TEAM_DEPENDENCY_STATES.HIGH,
  confidence:.9,
  source:"diagnostic-team-dependency",
  evidenceRefs:["team-dependency:fixture"]
});

const override=resolveNFLPlayerImpactIntegratedInputs({
  canonicalAvailabilityPlayer:lamar,
  canonicalAvailabilityRoster:[lamar,huntley],
  season:2026,
  week:1,
  team:"BAL",
  teamDependencyEvidence:dependency
});

test("authorized-team-dependency-override-preserved",()=>assert.equal(override.contextResolution.context.teamDependency,TEAM_DEPENDENCY_LEVELS.HIGH));
test("authorized-override-remains-ready",()=>assert.equal(override.readiness,"READY"));
test("caliber-provenance-not-invented",()=>assert.equal(integrated.safeguards.caliberInvented,false));
test("usage-provenance-not-invented",()=>assert.equal(integrated.safeguards.usageInvented,false));
test("team-dependency-provenance-not-invented",()=>assert.equal(integrated.safeguards.teamDependencyInvented,false));

const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"Canonical Caliber + Usage + Team Dependency Integration V1 Diagnostics",
  passed,failed,
  samples:{
    integrated:{
      lamarCaliber:integrated.canonicalCaliber?.caliberGrade,
      huntleyCaliber:integrated.replacementCaliber?.caliberGrade,
      replacementQuality:integrated.contextResolution?.context?.replacementQuality,
      offenseSnapShare:integrated.contextResolution?.context?.offensiveSnapShare,
      usageSeason:integrated.usageEvidence?.season,
      teamDependency:integrated.teamDependencyEvidence?.dependency,
      dependencyIndex:integrated.teamDependencyEvidence?.dependencyIndex,
      missingDimensions:integrated.missingDimensions,
      readiness:integrated.readiness
    }
  },
  tests
},null,2));
if(failed)process.exitCode=1;
