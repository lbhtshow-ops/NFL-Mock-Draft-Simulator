import fs from "node:fs";
const FILE="./data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl";
const rows=fs.existsSync(FILE)?fs.readFileSync(FILE,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const violations={
  missingPairEffect:rows.filter(r=>!finite(r?.effect?.treatedMinusControlResidual)).length,
  wrongOrientation:rows.filter(r=>r?.effect?.orientation!=="TREATED_MINUS_MATCHED_CONTROL").length,
  nonUnitPairWeight:rows.filter(r=>r?.pairWeight!==1).length,
  uncertaintyEstimated:rows.filter(r=>r?.safeguards?.uncertaintyEstimated!==false).length,
  inferentialClaimCreated:rows.filter(r=>r?.safeguards?.inferentialClaimCreated!==false).length
};
console.log(JSON.stringify({
  audit:"HISTORICAL_AVAILABILITY_MATCHED_ATT_EFFECT",mode:"READ_ONLY",records:rows.length,
  uniquePairs:new Set(rows.map(r=>r?.pairId)).size,violations,
  boundary:{pairEffectsComputed:rows.length>0,descriptiveATTConstructed:rows.length===131,uncertaintyEstimated:false,inferentialClaimsAuthorized:false,calibrationAuthorized:false,productionImpactPolicyAuthorized:false},
  safeguards:{datasetMutated:false,learnedWeightsCreated:false,calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false}
},null,2));
