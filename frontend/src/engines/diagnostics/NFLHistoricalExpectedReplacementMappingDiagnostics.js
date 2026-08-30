import assert from "node:assert/strict";
import {getNFLHistoricalExpectedReplacementMappingGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(), checks={qualifiedAnchorRequired:g.qualifiedAnchorRequired===true,pregameSafeRequired:g.pregameSafeRequired===true,evidenceBacked:g.evidenceBackedMappingRequired===true,noRosterOrder:g.rosterOrderHeuristicAllowed===false,nullUnsupported:g.unsupportedValuesRemainNull===true,noFuture:g.futureLeakageAllowed===false,noCalibration:g.calibrationAuthorized===false,noWeights:g.learnedWeightsAuthorized===false,noDatasetMutation:g.datasetMutationAuthorized===false,noSupabase:g.supabaseMutationAuthorized===false,noPickem:g.pickemMutationAuthorized===false,no17C:g.refSprint17CActionAuthorized===false,fields:g.mappingFields.length===4};
const failed=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Expected Replacement Mapping Governance",contractVersion:g.contractVersion,status:failed.length?"FAIL":"PASS",passed:Object.keys(checks).length-failed.length,failed:failed.length,checks},null,2));
assert.equal(failed.length,0);
