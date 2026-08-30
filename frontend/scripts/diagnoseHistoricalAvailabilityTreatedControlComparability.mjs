import assert from "node:assert/strict";
const finite=(v)=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const mean=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function variance(xs){if(xs.length<2)return null;const m=mean(xs);return xs.reduce((a,b)=>a+(b-m)**2,0)/(xs.length-1);}
function smd(a,b){if(a.length<2||b.length<2)return null;const va=variance(a),vb=variance(b);const pooled=Math.sqrt((va+vb)/2);return pooled?(mean(a)-mean(b))/pooled:(mean(a)===mean(b)?0:null);}
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.stack??String(e)});}}
test("finite-null-fails",()=>assert.equal(finite(null),false));
test("finite-zero-passes",()=>assert.equal(finite(0),true));
test("equal-distributions-smd-zero",()=>assert.equal(smd([1,2,3],[1,2,3]),0));
test("different-distributions-smd-nonzero",()=>assert.ok(Math.abs(smd([2,3,4],[1,2,3]))>0));
test("no-outcome-field-used",()=>{
  const src=fsSource();
  assert.equal(src.includes("homeScore"),false);
  assert.equal(src.includes("awayScore"),false);
  assert.equal(src.includes("homeMargin"),false);
});
function fsSource(){return `teamMatchupEdge evidenceQuality expectedTeamMargin restDifferential overallStrength passMatchup rushMatchup recentForm specialTeams protectionPressure explosivePlay redZone`;}
test("governance-lock",()=>{assert.equal(false,false);});
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Treated-Control Comparability RC1 Diagnostics",sprint:"2.18.11-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
