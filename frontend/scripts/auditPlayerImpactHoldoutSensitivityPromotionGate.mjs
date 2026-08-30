import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "./data/calibration/historical/v1";
const OBS = `${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`;
const EFFECTS = `${ROOT}/historical-availability-matched-att-effects-v1.jsonl`;
const USAGE_DEP = `${ROOT}/historical-observed-usage-dependency-v1.jsonl`;

const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const num = (v) => finite(v) ? Number(v) : null;
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
const readJsonl = (f) => fs.readFileSync(f,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);

function runJsonScript(script){
  const full = path.resolve(script);
  if(!fs.existsSync(full)) throw new Error(`Required prior-sprint audit missing: ${script}`);
  return JSON.parse(execFileSync(process.execPath,[full],{encoding:"utf8"}));
}

function buildRows(){
  const observations = readJsonl(OBS);
  const effects = readJsonl(EFFECTS);
  const usage = readJsonl(USAGE_DEP);

  const obsBy = new Map(), usageBy = new Map();
  for(const o of observations){
    const i=o.identity, k=`${i.gameId}:${i.team}`;
    if(!obsBy.has(k)) obsBy.set(k,[]);
    obsBy.get(k).push(o);
  }
  for(const e of usage){
    const i=e.identity, k=`${i.gameId}:${i.team}`;
    if(!usageBy.has(k)) usageBy.set(k,[]);
    usageBy.get(k).push(e);
  }

  let missingJoin=0;
  const rows=[];
  for(const er of effects){
    const key=er.treated.key;
    const os=obsBy.get(key)||[];
    const us=usageBy.get(key)||[];
    if(!os.length || us.length!==os.length){missingJoin++;continue;}

    const players=os.map((o,idx)=>{
      const id=o.identity;
      const ue=us.find(x=>x.identity.unavailablePlayerId===id.unavailablePlayerId)||us[idx];
      return {
        delta:num(o.pregame.expectedReplacementDelta),
        usage:num(ue?.usageEvidence?.selectedSnapPct),
        dependency:num(ue?.teamDependencyEvidence?.dependencyIndex),
      };
    });
    const usages=players.map(p=>p.usage).filter(finite);
    rows.push({
      season:er.treated.season,
      effect:num(er.effect.treatedMinusControlResidual),
      deltaSum:players.reduce((s,p)=>s+(finite(p.delta)?p.delta:0),0),
      maxUsage:usages.length?Math.max(...usages):null,
      dependencyAvailable:players.some(p=>finite(p.dependency)),
    });
  }
  return {observations,effects,usage,rows,missingJoin};
}

function thresholdGrid(rows){
  const usageThresholds=[0.60,0.70,0.80];
  const deltaThresholds=[5,10,15];
  const seasons=[...new Set(rows.map(r=>r.season))].sort();
  const cells=[];
  for(const u of usageThresholds){
    for(const d of deltaThresholds){
      const bySeason={};
      let eligible=0, expected=0;
      for(const s of seasons){
        const seasonRows=rows.filter(r=>r.season===s && finite(r.maxUsage) && r.maxUsage>=u);
        const large=seasonRows.filter(r=>r.deltaSum>=d).map(r=>r.effect);
        const small=seasonRows.filter(r=>r.deltaSum<d).map(r=>r.effect);
        const ok=large.length>=5 && small.length>=5;
        const direction=ok ? mean(large)<mean(small) : null;
        if(ok){eligible++; if(direction) expected++;}
        bySeason[s]={
          largeN:large.length, smallN:small.length,
          largeMean:mean(large), smallMean:mean(small),
          eligible:ok, expectedDirection:direction,
        };
      }
      const consistency=eligible?expected/eligible:null;
      cells.push({
        usageThreshold:u,deltaThreshold:d,bySeason,
        eligibleSeasonCount:eligible,expectedDirectionCount:expected,
        directionConsistency:consistency,
        allEligibleSeasonsExpected:eligible>=2 && expected===eligible,
      });
    }
  }
  const eligibleCells=cells.filter(c=>c.eligibleSeasonCount>=2);
  const fullyConsistent=eligibleCells.filter(c=>c.allEligibleSeasonsExpected);
  return {
    gridDefinition:{usageThresholds,deltaThresholds,minimumPerGroupPerSeason:5},
    cells,
    eligibleCellCount:eligibleCells.length,
    fullyConsistentCellCount:fullyConsistent.length,
    fullyConsistentShare:eligibleCells.length?fullyConsistent.length/eligibleCells.length:0,
    robustAcrossThresholdGrid:eligibleCells.length>=4 && fullyConsistent.length===eligibleCells.length,
  };
}

export function auditPlayerImpactHoldoutSensitivityPromotionGate(){
  const sprint5 = runJsonScript("./scripts/auditHeterogeneousPlayerImpactCalibration.mjs");
  const sprint6 = runJsonScript("./scripts/auditTemporalSeasonEraPlayerImpactValidation.mjs");
  const {observations,effects,usage,rows,missingJoin}=buildRows();
  const sensitivity=thresholdGrid(rows);

  const dependencyMatchedCount = rows.filter(r=>r.dependencyAvailable).length;
  const dependencyCoverage = rows.length ? dependencyMatchedCount/rows.length : 0;

  const hardGates = {
    lineageComplete: observations.length===286 && effects.length===131 && usage.length===286 && rows.length===131 && missingJoin===0,
    sprint5MultivariateSignalSupported: sprint5?.interpretation?.multivariateSignalSupportedForNextTemporalValidation===true,
    chronologicalCoreStable: sprint6?.interpretation?.coreModelChronologicallyStable===true,
    interactionStableAcrossSeasons: sprint6?.interpretation?.highUsageLargeCaliberInteractionStableAcrossAllEligibleSeasons===true,
    eraValidationSatisfied: sprint6?.interpretation?.eraValidationSatisfied===true,
    minimumFiveSeasonCoverage: Number(sprint6?.eraValidation?.seasonCount)>=5,
    dependencyCoverageAtLeastHalf: dependencyCoverage>=0.50,
    thresholdSensitivityRobust: sensitivity.robustAcrossThresholdGrid===true,
  };

  const passedHardGates = Object.values(hardGates).filter(Boolean).length;
  const failedHardGates = Object.keys(hardGates).filter(k=>!hardGates[k]);
  const promotionAuthorized = passedHardGates===Object.keys(hardGates).length;

  const decision = promotionAuthorized
    ? "PROMOTE_TO_SHADOW_TRANSFORMATION"
    : "HOLD_SHADOW_AND_REQUIRE_EVIDENCE_EXPANSION";

  return {
    contractVersion:"FIE-NFL-PLAYER-IMPACT-HOLDOUT-SENSITIVITY-PROMOTION-GATE-1.0.0",
    sprint:"2.24.0-RC1",
    mode:"GOVERNED_PROMOTION_GATE_NO_REFIT_NO_PRODUCTION_MUTATION",
    decision,
    evidence:{
      observations:observations.length,
      matchedEffects:effects.length,
      usageEvidenceRecords:usage.length,
      matchedDependencyCount:dependencyMatchedCount,
      matchedDependencyCoverage:dependencyCoverage,
      sprint5Decision:sprint5?.decision,
      sprint6Decision:sprint6?.decision,
    },
    hardGates,
    gateSummary:{
      hardGateCount:Object.keys(hardGates).length,
      passedHardGates,
      failedHardGates,
      promotionAuthorized,
    },
    sensitivity,
    evidenceExpansionRequirements:[
      {
        id:"EXPAND_SEASON_COVERAGE",
        required:true,
        requirement:"Expand the governed historical matched calibration corpus to at least five seasons while preserving pregame temporal qualification and the existing matched causal estimand."
      },
      {
        id:"IMPROVE_DEPENDENCY_COVERAGE",
        required:true,
        requirement:"Increase historically qualified Team Dependency coverage beyond the current offensive-only/provisional subset before dependency can receive production calibration authority."
      },
      {
        id:"PRESERVE_PREDECLARED_SPECIFICATION",
        required:true,
        requirement:"Predeclare the next Player Impact research specification and thresholds before evaluating newly added seasons; do not tune on the future holdout."
      },
      {
        id:"NEW_OUT_OF_TIME_HOLDOUT",
        required:true,
        requirement:"Run a genuinely untouched chronological holdout after evidence expansion and require the candidate representation to improve out-of-time performance consistently."
      },
      {
        id:"REPEAT_SENSITIVITY_GATE",
        required:true,
        requirement:"Repeat season, position/role, usage, caliber-gap, multi-absence, threshold-grid, and uncertainty sensitivity before reconsidering shadow Team Strength authorization."
      }
    ],
    readiness:{
      promotionGateComplete:true,
      sprint8ShadowTransformationAuthorized:promotionAuthorized,
      calibrationAuthorized:false,
      productionImpactPolicyAuthorized:false,
      recommendedNextProgram:promotionAuthorized ? "SPRINT_8_SHADOW_TEAM_STRENGTH_TRANSFORMATION" : "PLAYER_IMPACT_EVIDENCE_EXPANSION_PROGRAM",
    },
    safeguards:{
      priorSprintThresholdsRefit:false,
      holdoutDataUsedForRefit:false,
      sourceDatasetsMutated:false,
      matchedDesignMutated:false,
      causalEstimandMutated:false,
      learnedProductionWeightCreated:false,
      playerCoefficientAuthorized:false,
      positionCoefficientAuthorized:false,
      dependencyCoefficientAuthorized:false,
      teamStrengthPointValueAuthorized:false,
      teamStrengthMutated:false,
      decisionModelMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false,
      shadowOnlyPreserved:true,
    },
  };
}

console.log(JSON.stringify(auditPlayerImpactHoldoutSensitivityPromotionGate(),null,2));
