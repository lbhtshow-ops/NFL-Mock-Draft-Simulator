export const NFL_HISTORICAL_CANONICAL_SCORE_PROJECTION_VERSION =
 "FIE-NFL-HISTORICAL-CANONICAL-SCORE-PROJECTION-1.0.0";

const finite=(v)=>typeof v==="number" && Number.isFinite(v);
const value=(v,fallback=0)=>finite(v)?v:fallback;

export function projectHistoricalStatusScore({status=null}={}){
 if(typeof status!=="string" || !status.trim()) return null;
 const normalized=status.trim();
 if(normalized==="ACT" || normalized==="Active") return 72;
 if(normalized.includes("RES")) return 55;
 if(normalized.includes("PRACTICE")) return 48;
 // Canonical formula gives 50 for a known status outside the listed buckets.
 return 50;
}

export function projectHistoricalExperienceScore({experience=null}={}){
 if(!finite(experience)) return null;
 if(experience<=1) return 58;
 if(experience<=3) return 64;
 if(experience<=8) return 70;
 if(experience<=12) return 64;
 return 56;
}

export function projectHistoricalUsageScore({usageProfile=null}={}){
 if(!usageProfile || usageProfile.available===false) return null;
 const totalSnaps=value(usageProfile.totalSnaps,0);
 const gamesTracked=value(usageProfile.gamesTracked,0);
 const maxWeeklySnapShare=value(usageProfile.maxWeeklySnapShare,0);
 if(totalSnaps>=900) return 92;
 if(totalSnaps>=700) return 86;
 if(totalSnaps>=500) return 80;
 if(totalSnaps>=300) return 72;
 if(totalSnaps>=150) return 64;
 if(gamesTracked>=8 && maxWeeklySnapShare>=0.5) return 60;
 if(totalSnaps>0) return 55;
 return 48;
}

function flatPerformance(profile={}){
 // C7 historical provider exposes totals. Accept an already-flat profile too.
 const t=profile?.totals || profile || {};
 return {
  passingYards:value(t.passingYards,0),
  passingTDs:value(t.passingTDs,0),
  interceptions:value(t.interceptions,0),
  rushingYards:value(t.rushingYards,0),
  rushingTDs:value(t.rushingTDs,0),
  receptions:value(t.receptions,0),
  receivingYards:value(t.receivingYards,0),
  receivingTDs:value(t.receivingTDs,0),
  sacks:value(t.sacks,0),
  tackles:value(t.tackles,0),
  defensiveInterceptions:value(
   t.defensiveInterceptions,
   value(t.interceptionsDef,0)
  ),
 };
}

export function projectHistoricalProductionScore({
 position=null,
 performanceProfile=null,
}={}){
 if(!performanceProfile || performanceProfile.available===false) return null;
 const p=flatPerformance(performanceProfile);
 if(position==="QB"){
  return Math.min(95,Math.round(
   55+p.passingYards/120+p.passingTDs*1.8-p.interceptions*1.2
  ));
 }
 if(["RB","FB"].includes(position)){
  return Math.min(92,Math.round(
   52+p.rushingYards/80+p.rushingTDs*2+p.receptions/8
  ));
 }
 if(["WR","TE"].includes(position)){
  return Math.min(92,Math.round(
   52+p.receivingYards/90+p.receivingTDs*2+p.receptions/10
  ));
 }
 if(["EDGE","DL","LB","CB","S"].includes(position)){
  return Math.min(90,Math.round(
   52+p.sacks*3+p.tackles/15+p.defensiveInterceptions*3
  ));
 }
 return null;
}

export function projectHistoricalRecognitionScore({
 recognitionSummary=null,
}={}){
 if(!recognitionSummary?.available) return null;
 return finite(recognitionSummary.score) ? recognitionSummary.score : null;
}

export function projectHistoricalCanonicalContextScores({
 position=null,
 historicalStatus=null,
 historicalExperience=null,
 usageProfile=null,
 performanceProfile=null,
 recognitionSummary=null,
}={}){
 return Object.freeze({
  statusScore:projectHistoricalStatusScore({status:historicalStatus}),
  experienceScore:projectHistoricalExperienceScore({experience:historicalExperience}),
  usageScore:projectHistoricalUsageScore({usageProfile}),
  productionScore:projectHistoricalProductionScore({position,performanceProfile}),
  recognitionScore:projectHistoricalRecognitionScore({recognitionSummary}),
 });
}

export function flattenHistoricalPerformanceProfile(performanceProfile=null){
 if(!performanceProfile || performanceProfile.available===false) return null;
 const p=flatPerformance(performanceProfile);
 return Object.freeze({
  available:true,
  gamesTracked:value(performanceProfile.gamesTracked,0),
  matchedBy:performanceProfile.matchedBy || "HISTORICAL_EVIDENCE_BUNDLE",
  ...p,
 });
}

export default {
 projectHistoricalStatusScore,
 projectHistoricalExperienceScore,
 projectHistoricalUsageScore,
 projectHistoricalProductionScore,
 projectHistoricalRecognitionScore,
 projectHistoricalCanonicalContextScores,
 flattenHistoricalPerformanceProfile,
};
