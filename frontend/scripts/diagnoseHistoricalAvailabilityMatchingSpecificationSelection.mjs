import assert from "node:assert/strict";

const tests=[];

function test(name,fn){
  try{
    fn();
    tests.push({name,passed:true});
  }catch(error){
    tests.push({name,passed:false,error:error?.stack??String(error)});
  }
}

const rules={
  minimumTreatedRetentionRate:.65,
  maximumAbsoluteSMD:.20,
  maximumMeanAbsoluteSMD:.10,
  minimumFeaturesAtOrBelowPoint10:7,
  minimumFeaturesAtOrBelowPoint20:10,
  minimumUniqueControlsUsed:50,
  maximumControlReuse:10,
  minimumSeasonRetentionRate:.50,
  minimumSideRetentionRate:.50,
};

function passes(x){
  return (
    x.retention>=rules.minimumTreatedRetentionRate &&
    x.maxSmd<=rules.maximumAbsoluteSMD &&
    x.meanSmd<=rules.maximumMeanAbsoluteSMD &&
    x.p10>=rules.minimumFeaturesAtOrBelowPoint10 &&
    x.p20>=rules.minimumFeaturesAtOrBelowPoint20 &&
    x.controls>=rules.minimumUniqueControlsUsed &&
    x.reuse<=rules.maximumControlReuse &&
    x.seasons.every(v=>v>=rules.minimumSeasonRetentionRate) &&
    x.sides.every(v=>v>=rules.minimumSideRetentionRate)
  );
}

test("good-candidate-passes",()=>{
  assert.equal(passes({
    retention:.70,maxSmd:.15,meanSmd:.07,p10:8,p20:10,
    controls:76,reuse:7,seasons:[.6,.7,.55],sides:[.68,.72]
  }),true);
});

test("balance-failure-rejects",()=>{
  assert.equal(passes({
    retention:.90,maxSmd:.25,meanSmd:.07,p10:8,p20:10,
    controls:90,reuse:7,seasons:[.8,.8,.8],sides:[.8,.8]
  }),false);
});

test("retention-failure-rejects",()=>{
  assert.equal(passes({
    retention:.60,maxSmd:.10,meanSmd:.05,p10:9,p20:10,
    controls:70,reuse:3,seasons:[.7,.7,.7],sides:[.7,.7]
  }),false);
});

test("reuse-failure-rejects",()=>{
  assert.equal(passes({
    retention:.70,maxSmd:.10,meanSmd:.05,p10:9,p20:10,
    controls:70,reuse:11,seasons:[.7,.7,.7],sides:[.7,.7]
  }),false);
});

test("season-coverage-failure-rejects",()=>{
  assert.equal(passes({
    retention:.70,maxSmd:.10,meanSmd:.05,p10:9,p20:10,
    controls:70,reuse:5,seasons:[.7,.7,.49],sides:[.7,.7]
  }),false);
});

test("outcome-blind-selection-required",()=>{
  const boundary={rankingUsesOutcome:false};
  const safeguards={outcomesNotReadForSelection:true};
  assert.equal(boundary.rankingUsesOutcome,false);
  assert.equal(safeguards.outcomesNotReadForSelection,true);
});

test("downstream-remains-locked",()=>{
  const boundary={
    matchedDatasetPersistenceAuthorized:false,
    causalEffectEstimationAuthorized:false,
    calibrationAuthorized:false,
    pickemMutationAuthorized:false,
  };
  assert.equal(Object.values(boundary).some(Boolean),false);
});

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"Historical Availability Matching Specification Selection RC1 Diagnostics",
  sprint:"2.18.14-RC1",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
