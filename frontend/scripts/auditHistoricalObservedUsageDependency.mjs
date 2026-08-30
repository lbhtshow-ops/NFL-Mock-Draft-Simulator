import fs from "node:fs";

const ROOT = "./data/calibration/historical/v1";
const MATERIALIZED = `${ROOT}/historical-observed-usage-dependency-v1.jsonl`;
const EFFECTS = `${ROOT}/historical-availability-matched-att-effects-v1.jsonl`;

const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const n = (v) => Number(v);
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
const readJsonl = (file) => fs.existsSync(file)
  ? fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  : [];
const summarize = (rows) => {
  const ys=rows.map(r=>r.effect).filter(finite).map(n);
  return { count: ys.length, meanEffect: mean(ys), negativeEffectShare: ys.length ? ys.filter(v=>v<0).length/ys.length : null };
};

const evidence = readJsonl(MATERIALIZED);
const effects = readJsonl(EFFECTS);
const byTreatmentKey = new Map();
for (const row of evidence) {
  const i=row?.identity||{};
  const key=`${i.gameId}:${i.team}`;
  if(!byTreatmentKey.has(key)) byTreatmentKey.set(key,[]);
  byTreatmentKey.get(key).push(row);
}
let missingTreatmentEvidence=0;
const matched=[];
for(const effect of effects){
  const key=effect?.treated?.key;
  const rows=byTreatmentKey.get(key)||[];
  if(!rows.length){missingTreatmentEvidence++;continue;}
  const usage=rows.map(r=>r?.usageEvidence?.selectedSnapPct).filter(finite).map(n);
  const dependency=rows.map(r=>r?.teamDependencyEvidence?.dependencyIndex).filter(finite).map(n);
  matched.push({
    pairId:effect.pairId,
    season:effect?.treated?.season,
    effect:n(effect?.effect?.treatedMinusControlResidual),
    playerCount:rows.length,
    maxUsage:usage.length?Math.max(...usage):null,
    meanUsage:usage.length?mean(usage):null,
    maxDependency:dependency.length?Math.max(...dependency):null,
    meanDependency:dependency.length?mean(dependency):null,
  });
}
const usageRows=matched.filter(r=>finite(r.maxUsage));
const dependencyRows=matched.filter(r=>finite(r.maxDependency));
const usageBands={
  LOW:summarize(usageRows.filter(r=>r.maxUsage<0.35)),
  ROTATION:summarize(usageRows.filter(r=>r.maxUsage>=0.35&&r.maxUsage<0.70)),
  HIGH:summarize(usageRows.filter(r=>r.maxUsage>=0.70)),
};
const dependencyBands={
  LOW:summarize(dependencyRows.filter(r=>r.maxDependency<40)),
  MODERATE:summarize(dependencyRows.filter(r=>r.maxDependency>=40&&r.maxDependency<60)),
  HIGH:summarize(dependencyRows.filter(r=>r.maxDependency>=60)),
};
const report={
  contractVersion:"FIE-NFL-HISTORICAL-OBSERVED-USAGE-DEPENDENCY-AUDIT-1.0.0",
  sprint:"2.21.0-RC1",
  mode:"READ_ONLY_POST_MATERIALIZATION_SENSITIVITY_READINESS_AUDIT",
  source:{materializedEvidenceCount:evidence.length,matchedEffectCount:effects.length,matchedEvidenceCount:matched.length},
  reconciliation:{missingTreatmentEvidence,allMatchedEffectsReconciled:matched.length===effects.length&&missingTreatmentEvidence===0},
  evidenceCoverage:{
    matchedWithUsage:usageRows.length,
    matchedUsageCoverage:matched.length?usageRows.length/matched.length:0,
    matchedWithDependency:dependencyRows.length,
    matchedDependencyCoverage:matched.length?dependencyRows.length/matched.length:0,
  },
  descriptive:{usageBands,dependencyBands},
  interpretation:{
    usageSensitivityNowTestable:usageRows.length>0,
    dependencySensitivityNowTestable:dependencyRows.length>0,
    usageResultsRemainDescriptiveOnly:true,
    dependencyResultsRemainDescriptiveOnly:true,
    noCoefficientAuthorized:true,
    reason:"Historical prior-game usage and provisional dependency evidence are materialized without target-week or future evidence. Results remain descriptive research evidence only."
  },
  readiness:{
    historicalUsageEvidenceCompletionAchieved:usageRows.length>0,
    historicalDependencyEvidenceCompletionPartial:dependencyRows.length>0,
    fullPlayerImpactTransformationReadyForHoldout:false,
    calibrationAuthorized:false,
    productionImpactPolicyAuthorized:false,
  },
  safeguards:{
    learnedProductionWeightCreated:false,playerCoefficientAuthorized:false,positionCoefficientAuthorized:false,
    dependencyCoefficientAuthorized:false,teamStrengthPointValueAuthorized:false,teamStrengthMutated:false,
    decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false,shadowOnlyPreserved:true
  }
};
console.log(JSON.stringify(report,null,2));
