import assert from "node:assert/strict";
import {getNFLHistoricalStarterReplacementCaliberEnrichmentGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(),checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-STARTER-REPLACEMENT-CALIBER-ENRICHMENT-GOVERNANCE-1.0.0",
 replacementIdentity:g.resolvedReplacementIdentityRequired===true,
 snapshot:g.canonicalHistoricalCaliberSnapshotRequired===true,
 both:g.playerAndReplacementBothRequireSnapshotsForDelta===true,
 asOf:g.asOfRequired===true,
 kickoff:g.kickoffRequired===true,
 temporal:g.asOfMustPrecedeKickoff===true,
 exactJoin:g.exactPlayerTeamWeekJoinRequired===true,
 noCurrent:g.currentRatingBackfillAllowed===false,
 noRank:g.rankProxyAllowed===false,
 noRosterValue:g.rosterValueProxyAllowed===false,
 noSynthetic:g.syntheticCaliberAllowed===false,
 missingNull:g.missingCaliberRemainsNull===true,
 partial:g.partialEnrichmentAllowed===true,
 deltaBoth:g.replacementDeltaRequiresBothCalibers===true,
 model:g.modelVersionPreserved===true,
 provenance:g.provenancePreserved===true,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false
};
const failed=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Starter/Replacement Caliber Enrichment Governance",contractVersion:g.contractVersion,status:failed.length?"FAIL":"PASS",passed:Object.keys(checks).length-failed.length,failed:failed.length,checks},null,2));
assert.equal(failed.length,0);
