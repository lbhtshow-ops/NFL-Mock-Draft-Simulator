import {createNFLGameDecisionOutput,isNFLGameDecisionOutput} from "../gameDecisionSupport/canonical/NFLGameDecisionOutputContract.js";
const tests=[],check=(n,f)=>{try{f();tests.push({name:n,passed:true})}catch(e){tests.push({name:n,passed:false,error:e.message})}},assert=(c,m)=>{if(!c)throw new Error(m)};

check("output-contract-validates",()=>assert(isNFLGameDecisionOutput(createNFLGameDecisionOutput({game:{awayTeam:"CIN",homeTeam:"BAL"},favorite:"BAL",homeWinProbability:.67,expectedHomeMargin:4.2,confidence:.34,confidenceBand:"LOW",model:{id:"QUALITY_WEIGHTED_MATCHUP",version:"NFL-GAME-DECISION-MODEL-V1.0.0",status:"PRODUCTION_AUTHORITY"}})),"contract invalid"));
check("probabilities-sum-to-one",()=>{const x=createNFLGameDecisionOutput({homeWinProbability:.63,expectedHomeMargin:3.1});assert(Math.abs(x.homeWinProbability+x.awayWinProbability-1)<1e-6,"probability sum")});
check("invalid-probability-is-rejected",()=>{let r=false;try{createNFLGameDecisionOutput({homeWinProbability:1.2,expectedHomeMargin:3})}catch{r=true}assert(r,"invalid probability accepted")});
check("favorite-is-explicit-field",()=>assert(createNFLGameDecisionOutput({favorite:"BAL",homeWinProbability:.61,expectedHomeMargin:2.5}).favorite==="BAL","favorite lost"));
check("model-authority-is-explicit",()=>assert(createNFLGameDecisionOutput({homeWinProbability:.61,expectedHomeMargin:2.5,model:{status:"PRODUCTION_AUTHORITY"}}).model.status==="PRODUCTION_AUTHORITY","authority missing"));
check("research-status-is-not-silently-upgraded",()=>assert(createNFLGameDecisionOutput({homeWinProbability:.61,expectedHomeMargin:2.5,model:{status:"RESEARCH_ONLY"}}).model.status==="RESEARCH_ONLY","research upgraded"));
check("evidence-fields-are-retained",()=>{const x=createNFLGameDecisionOutput({homeWinProbability:.61,expectedHomeMargin:2.5,evidence:{matchupEdge:6.5,evidenceQuality:.84}});assert(x.evidence.matchupEdge===6.5&&x.evidence.evidenceQuality===.84,"evidence lost")});
check("expected-margin-remains-home-perspective",()=>assert(createNFLGameDecisionOutput({homeWinProbability:.40,expectedHomeMargin:-3.5}).expectedHomeMargin===-3.5,"margin corrupted"));

const failed=tests.filter(t=>!t.passed);
console.log(JSON.stringify({suite:"NFL Canonical Game Decision Model V1 Diagnostics",passed:tests.length-failed.length,failed:failed.length,tests},null,2));
if(failed.length)process.exitCode=1;
