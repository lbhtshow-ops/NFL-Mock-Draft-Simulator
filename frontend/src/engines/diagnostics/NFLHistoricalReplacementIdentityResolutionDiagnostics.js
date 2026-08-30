import assert from "node:assert/strict";
import {getNFLHistoricalReplacementIdentityResolutionGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(),checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-REPLACEMENT-IDENTITY-RESOLUTION-GOVERNANCE-1.0.0",
 anchor:g.pregameOfficialAnchorRequired===true,
 out:g.unavailableStatusRequired.includes("OUT"),
 doubtful:g.unavailableStatusRequired.includes("DOUBTFUL"),
 canonical:g.canonicalUnavailablePlayerIdRequired===true,
 teamWeek:g.exactTeamWeekDepthChartRequired===true,
 slot:g.unavailableDepthSlotRequired===true,
 nextRank:g.uniqueNextDepthRankRequired===true,
 sameSlot:g.sameDepthPositionRequired===true,
 explicit:g.explicitDepthChartEvidenceType==="EXPLICIT_DEPTH_CHART",
 noRoster:g.rosterOrderHeuristicAllowed===false,
 noName:g.nameGuessAllowed===false,
 noPositionFallback:g.positionOnlyFallbackAllowed===false,
 snapCorroborates:g.postgameSnapCountsMayCorroborate===true,
 snapDoesNotDefine:g.postgameSnapCountsMayDefineExpectedReplacement===false,
 ambiguousNull:g.ambiguousReplacementRemainsNull===true,
 missingNull:g.missingReplacementRemainsNull===true,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false
};
const failed=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Replacement Identity Resolution Governance",contractVersion:g.contractVersion,status:failed.length?"FAIL":"PASS",passed:Object.keys(checks).length-failed.length,failed:failed.length,checks},null,2));
assert.equal(failed.length,0);
