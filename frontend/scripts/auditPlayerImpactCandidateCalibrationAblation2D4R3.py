#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-PLAYER-IMPACT-CANDIDATE-CALIBRATION-ABLATION-2D4-R3-1.0.0"
SEASONS = [2020, 2021, 2022, 2023, 2024]
VARIANTS = [
    "R2_FULL",
    "NO_COUNT",
    "SEVERITY_ONLY",
    "POSITION_ONLY",
    "HIGH_PLUS_ONLY",
    "VERY_HIGH_ONLY",
]
SCALES = [0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00]

def load_jsonl(path):
    p = Path(path)
    if not p.exists():
        return []
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]

def finite(v):
    return isinstance(v, (int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

def mean(xs):
    xs=[float(x) for x in xs if finite(x)]
    return statistics.mean(xs) if xs else None

def percentile(xs,p):
    xs=sorted(float(x) for x in xs if finite(x))
    if not xs: return None
    i=(len(xs)-1)*p
    lo=int(math.floor(i)); hi=int(math.ceil(i))
    if lo==hi: return xs[lo]
    return xs[lo]+(xs[hi]-xs[lo])*(i-lo)

def mae(xs): return mean([abs(x) for x in xs])
def rmse(xs):
    xs=[float(x) for x in xs if finite(x)]
    return math.sqrt(mean([x*x for x in xs])) if xs else None

def pos_group(pos):
    p=str(pos or "UNKNOWN").upper()
    if p in {"C","G","OG","T","OT","OL","IOL"}: return "OL"
    if p in {"CB","S","FS","SS","DB","SAF"}: return "SECONDARY"
    if p in {"DE","DT","NT","DL","EDGE"}: return "DL_EDGE"
    if p in {"LB","ILB","OLB","MLB"}: return "LB"
    if p in {"RB","HB","FB"}: return "RB"
    if p in {"K","P","LS","ST"}: return "SPECIALISTS"
    return p

def key_effect(row):
    t=row.get("treated") or {}
    return (t.get("season"),t.get("week"),t.get("gameId"),t.get("team"))

def key_obs(row):
    i=row.get("identity") or {}
    return (i.get("season"),i.get("week"),i.get("gameId"),i.get("team"))

def effect_value(row):
    v=(row.get("effect") or {}).get("treatedMinusControlResidual")
    return float(v) if finite(v) else None

def loss_gap(obs):
    p=obs.get("pregame") or {}
    pc=p.get("playerCaliber"); rc=p.get("replacementCaliber")
    if finite(pc) and finite(rc):
        return max(0.0,float(pc)-float(rc))
    d=p.get("expectedReplacementDelta")
    return max(0.0,float(d)) if finite(d) else None

def severity(x):
    if not finite(x): return "UNKNOWN"
    if x >= 15: return "VERY_HIGH"
    if x >= 8: return "HIGH"
    if x >= 3: return "MODERATE"
    return "LOW"

def count_bucket(n):
    if n >= 3: return "THREE_PLUS"
    if n == 2: return "TWO"
    return "ONE"

def features(observations):
    positions=sorted({pos_group((o.get("identity") or {}).get("position")) for o in observations})
    gaps=[loss_gap(o) for o in observations]
    gaps=[g for g in gaps if finite(g)]
    qb="QB" in positions
    return {
        "countBucket":count_bucket(len(observations)),
        "primaryPositionGroup":"QB" if qb else (positions[0] if len(positions)==1 else "MULTI"),
        "severityBucket":severity(max(gaps) if gaps else None),
        "qbPresent":qb,
    }

def keys(f,variant):
    p=f["primaryPositionGroup"]; s=f["severityBucket"]; c=f["countBucket"]
    if variant=="R2_FULL":
        return [("EXACT",p,s,c),("POSITION_SEVERITY",p,s),("SEVERITY",s),("POSITION",p),("GLOBAL",)]
    if variant=="NO_COUNT":
        return [("POSITION_SEVERITY",p,s),("SEVERITY",s),("POSITION",p),("GLOBAL",)]
    if variant=="SEVERITY_ONLY":
        return [("SEVERITY",s),("GLOBAL",)]
    if variant=="POSITION_ONLY":
        return [("POSITION",p),("GLOBAL",)]
    if variant=="HIGH_PLUS_ONLY":
        return [("SEVERITY",s),("GLOBAL",)] if s in {"HIGH","VERY_HIGH"} else [("ZERO",)]
    if variant=="VERY_HIGH_ONLY":
        return [("SEVERITY","VERY_HIGH"),("GLOBAL",)] if s=="VERY_HIGH" else [("ZERO",)]
    raise ValueError(variant)

MIN_N={"EXACT":12,"POSITION_SEVERITY":15,"SEVERITY":25,"POSITION":25,"GLOBAL":1}

def fit(train,variant):
    lookup=defaultdict(list)
    effects=[r["effect"] for r in train]
    lo=percentile(effects,.05); hi=percentile(effects,.95)
    for r in train:
        for k in keys(r["features"],variant):
            if k[0]!="ZERO":
                lookup[k].append(r["effect"])
    return lookup,lo,hi

def predict(row,lookup,lo,hi,variant):
    for k in keys(row["features"],variant):
        if k[0]=="ZERO": return 0.0,k[0],0
        vals=lookup.get(k,[])
        if len(vals)>=MIN_N[k[0]]:
            pred=mean(vals)
            return max(lo,min(hi,pred)),k[0],len(vals)
    return None,"NONE",0

def winner_correct(pred,actual):
    if pred==0 or actual==0: return None
    return (pred>0)==(actual>0)

def metrics(records):
    be=[r["baselineError"] for r in records]
    se=[r["candidateError"] for r in records]
    bw=[r["baselineWinnerCorrect"] for r in records if r["baselineWinnerCorrect"] is not None]
    cw=[r["candidateWinnerCorrect"] for r in records if r["candidateWinnerCorrect"] is not None]
    return {
        "rows":len(records),
        "baselineMAE":mae(be),
        "candidateMAE":mae(se),
        "maeDelta":mae(se)-mae(be),
        "baselineRMSE":rmse(be),
        "candidateRMSE":rmse(se),
        "rmseDelta":rmse(se)-rmse(be),
        "baselineWinnerAccuracy":sum(bw)/len(bw) if bw else None,
        "candidateWinnerAccuracy":sum(cw)/len(cw) if cw else None,
        "winnerAccuracyDelta":(sum(cw)/len(cw) - sum(bw)/len(bw)) if bw and cw else None,
        "baselineLargeErrors14Plus":sum(abs(x)>=14 for x in be),
        "candidateLargeErrors14Plus":sum(abs(x)>=14 for x in se),
        "largeErrorDelta":sum(abs(x)>=14 for x in se)-sum(abs(x)>=14 for x in be),
        "favoriteFlips":sum(r["favoriteFlip"] for r in records),
        "meanAppliedDelta":mean([r["appliedDelta"] for r in records]),
        "meanAbsoluteAppliedDelta":mean([abs(r["appliedDelta"]) for r in records]),
    }

def gate(m):
    return (
        m["candidateMAE"] <= m["baselineMAE"] and
        m["candidateRMSE"] <= m["baselineRMSE"] and
        m["candidateWinnerAccuracy"] >= m["baselineWinnerAccuracy"] - 0.005 and
        m["candidateLargeErrors14Plus"] <= m["baselineLargeErrors14Plus"]
    )

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--legacy-effects",default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")
    ap.add_argument("--expansion-effects",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl")
    ap.add_argument("--legacy-observations",default="data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl")
    ap.add_argument("--expansion-observations",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl")
    ap.add_argument("--legacy-outcomes",default="data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl")
    ap.add_argument("--expansion-outcomes",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl")
    ap.add_argument("--report",default="data/calibration/historical/expansion-2020-2021/player-impact/player-impact-candidate-ablation-2d4-r3-v1.json")
    ap.add_argument("--selected-candidate",default="data/calibration/historical/expansion-2020-2021/player-impact/player-impact-candidate-2d4-r3-selected-v1.json")
    args=ap.parse_args()

    effects=load_jsonl(args.legacy_effects)+load_jsonl(args.expansion_effects)
    observations=load_jsonl(args.legacy_observations)+load_jsonl(args.expansion_observations)
    outcomes=load_jsonl(args.legacy_outcomes)+load_jsonl(args.expansion_outcomes)

    if len(effects)!=720 or len(outcomes)!=720:
        print(json.dumps({"contractVersion":CONTRACT_VERSION,"decision":"BLOCKED_R2_CORPUS_NOT_RECONCILED","effects":len(effects),"outcomes":len(outcomes)},indent=2))
        raise SystemExit(2)

    obs_map=defaultdict(list)
    for o in observations:
        obs_map[key_obs(o)].append(o)
    out_map={r.get("pairId"):r for r in outcomes if r.get("pairId")}

    rows=[]
    for e in effects:
        ev=effect_value(e)
        os=obs_map.get(key_effect(e),[])
        out=out_map.get(e.get("pairId"))
        if ev is None or not os or not out: continue
        tout=(out.get("treated") or {}).get("outcome") or {}
        base=tout.get("expectedTeamMargin"); actual=tout.get("actualTeamMargin")
        if not finite(base) or not finite(actual): continue
        t=e.get("treated") or {}
        rows.append({
            "pairId":e.get("pairId"),
            "season":t.get("season"),
            "effect":ev,
            "baselineExpectedTeamMargin":float(base),
            "actualTeamMargin":float(actual),
            "features":features(os),
        })

    if len(rows)!=720:
        print(json.dumps({"contractVersion":CONTRACT_VERSION,"decision":"BLOCKED_R3_JOIN_NOT_720","joinedRows":len(rows)},indent=2))
        raise SystemExit(3)

    candidates=[]
    for variant in VARIANTS:
        for scale in SCALES:
            predictions=[]
            folds={}
            for holdout in SEASONS:
                train=[r for r in rows if r["season"]!=holdout]
                test=[r for r in rows if r["season"]==holdout]
                lookup,lo,hi=fit(train,variant)
                fold=[]
                for r in test:
                    raw,mode,n=predict(r,lookup,lo,hi,variant)
                    if raw is None: continue
                    applied=raw*scale
                    candidate_margin=r["baselineExpectedTeamMargin"]+applied
                    rec={**r,
                         "rawCandidateImpact":raw,
                         "scale":scale,
                         "appliedDelta":applied,
                         "resolutionMode":mode,
                         "trainingStratumN":n,
                         "candidateExpectedTeamMargin":candidate_margin,
                         "baselineError":r["actualTeamMargin"]-r["baselineExpectedTeamMargin"],
                         "candidateError":r["actualTeamMargin"]-candidate_margin,
                         "baselineWinnerCorrect":winner_correct(r["baselineExpectedTeamMargin"],r["actualTeamMargin"]),
                         "candidateWinnerCorrect":winner_correct(candidate_margin,r["actualTeamMargin"]),
                         "favoriteFlip":(r["baselineExpectedTeamMargin"]>0)!=(candidate_margin>0)}
                    fold.append(rec); predictions.append(rec)
                folds[str(holdout)]=metrics(fold)

            m=metrics(predictions)
            fold_mae_nonworse=sum(
                1 for f in folds.values()
                if f["candidateMAE"] <= f["baselineMAE"] + 0.15
            )
            fold_rmse_nonworse=sum(
                1 for f in folds.values()
                if f["candidateRMSE"] <= f["baselineRMSE"] + 0.20
            )
            passes=gate(m) and fold_mae_nonworse>=4 and fold_rmse_nonworse>=4
            candidates.append({
                "variant":variant,
                "scale":scale,
                "metrics":m,
                "folds":folds,
                "seasonStability":{
                    "maeNonWorseWithin015":fold_mae_nonworse,
                    "rmseNonWorseWithin020":fold_rmse_nonworse,
                },
                "passesPromotionCandidateGate":passes,
            })

    passing=[c for c in candidates if c["passesPromotionCandidateGate"]]

    # Prefer the simplest formulation within 0.02 MAE of the best passing candidate.
    complexity={
        "SEVERITY_ONLY":1,
        "VERY_HIGH_ONLY":1,
        "POSITION_ONLY":2,
        "HIGH_PLUS_ONLY":2,
        "NO_COUNT":3,
        "R2_FULL":4,
    }

    selected=None
    if passing:
        best_mae=min(c["metrics"]["candidateMAE"] for c in passing)
        near=[c for c in passing if c["metrics"]["candidateMAE"] <= best_mae+0.02]
        near.sort(key=lambda c:(
            complexity[c["variant"]],
            c["metrics"]["candidateMAE"],
            c["scale"],
        ))
        selected=near[0]

    decision=(
        "PLAYER_IMPACT_R3_CANDIDATE_IDENTIFIED_CONFIRMATION_REQUIRED"
        if selected else
        "PLAYER_IMPACT_R3_NO_BOUNDED_CANDIDATE_PASSED_REMAIN_SHADOW_ONLY"
    )

    selected_artifact={
        "contractVersion":"FIE-NFL-PLAYER-IMPACT-CANDIDATE-2D4-R3-SELECTED-1.0.0",
        "decision":decision,
        "selected":selected,
        "selectionPolicy":{
            "candidateFamilyPredeclared":True,
            "variants":VARIANTS,
            "scales":SCALES,
            "leaveOneSeasonOut":True,
            "targetSeasonOutcomeTuning":False,
            "aggregateGate":{
                "mae":"MUST_NOT_EXCEED_BASELINE",
                "rmse":"MUST_NOT_EXCEED_BASELINE",
                "winnerAccuracy":"MAY_NOT_DROP_MORE_THAN_0.005",
                "largeErrors14Plus":"MAY_NOT_INCREASE",
            },
            "seasonStability":"AT_LEAST_4_OF_5_SEASONS_WITHIN_MAE_0.15_AND_RMSE_0.20_OF_BASELINE",
            "simplicityTieBreak":"WITHIN_0.02_MAE_OF_BEST_PASSING_CANDIDATE_PREFER_LOWER_COMPLEXITY",
        },
        "productionAuthorized":False,
        "pickemHandoffAuthorized":False,
        "confirmationRequired":selected is not None,
    }

    report={
        "contractVersion":CONTRACT_VERSION,
        "sprint":"2D.4-R3",
        "mode":"READ_ONLY_PREDECLARED_CANDIDATE_ABLATION",
        "decision":decision,
        "scope":{
            "joinedRows":len(rows),
            "seasons":SEASONS,
            "variants":VARIANTS,
            "scales":SCALES,
            "candidateCount":len(candidates),
            "passingCandidateCount":len(passing),
        },
        "r2Reference":{
            "variant":"R2_FULL",
            "scale":1.0,
            "result":next(c for c in candidates if c["variant"]=="R2_FULL" and c["scale"]==1.0),
        },
        "selectedCandidate":selected,
        "topCandidates":sorted(
            candidates,
            key=lambda c:(
                not c["passesPromotionCandidateGate"],
                c["metrics"]["candidateMAE"],
                c["metrics"]["candidateRMSE"],
            )
        )[:12],
        "nextAction":{
            "reopenHistoricalConstruction":False,
            "candidateConfirmationRequired":selected is not None,
            "proceedToConfirmationGate":selected is not None,
            "remainShadowOnly":True,
            "productionPlayerImpactAuthorized":False,
            "productionTeamStrengthAuthorized":False,
            "pickemHandoffAuthorized":False,
        },
        "safeguards":{
            "historicalArtifactsMutated":False,
            "canonicalShadowIntegrationMutated":False,
            "teamStrengthMutated":False,
            "matchupIntelligenceMutated":False,
            "decisionModelMutated":False,
            "pickemMutated":False,
            "syntheticInjuryWeightsCreated":False,
            "targetSeasonOutcomeTuningUsed":False,
        },
    }

    Path(args.selected_candidate).parent.mkdir(parents=True,exist_ok=True)
    Path(args.selected_candidate).write_text(json.dumps(selected_artifact,indent=2)+"\n",encoding="utf-8")
    Path(args.report).parent.mkdir(parents=True,exist_ok=True)
    Path(args.report).write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
