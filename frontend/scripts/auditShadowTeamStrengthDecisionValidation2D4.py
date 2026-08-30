#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

CONTRACT_VERSION = "FIE-NFL-PLAYER-IMPACT-SHADOW-DECISION-VALIDATION-2D4-R2-1.0.0"
TARGET_SEASONS = [2020, 2021, 2022, 2023, 2024]

def load_jsonl(path):
    p = Path(path)
    if not p.exists():
        return []
    return [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]

def finite(v):
    return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

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

def mae(errors):
    return mean([abs(x) for x in errors])

def rmse(errors):
    xs=[float(x) for x in errors if finite(x)]
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

def team_game_key(season,week,game_id,team):
    return (
        int(season) if season is not None else None,
        int(week) if week is not None else None,
        str(game_id) if game_id is not None else None,
        str(team) if team is not None else None,
    )

def effect_value(row):
    v=(row.get("effect") or {}).get("treatedMinusControlResidual")
    return float(v) if finite(v) else None

def treated_key(row):
    t=row.get("treated") or {}
    return team_game_key(t.get("season"),t.get("week"),t.get("gameId"),t.get("team"))

def obs_key(row):
    i=row.get("identity") or {}
    return team_game_key(i.get("season"),i.get("week"),i.get("gameId"),i.get("team"))

def loss_gap(obs):
    p=obs.get("pregame") or {}
    pc=p.get("playerCaliber")
    rc=p.get("replacementCaliber")
    if finite(pc) and finite(rc):
        return max(0.0,float(pc)-float(rc))
    d=p.get("expectedReplacementDelta")
    if finite(d):
        return max(0.0,float(d))
    return None

def severity_bucket(max_loss_gap):
    if not finite(max_loss_gap): return "UNKNOWN"
    x=float(max_loss_gap)
    if x >= 15: return "VERY_HIGH"
    if x >= 8: return "HIGH"
    if x >= 3: return "MODERATE"
    return "LOW"

def count_bucket(n):
    if n >= 3: return "THREE_PLUS"
    if n == 2: return "TWO"
    return "ONE"

def team_game_features(observations):
    positions=sorted({pos_group((o.get("identity") or {}).get("position")) for o in observations})
    gaps=[loss_gap(o) for o in observations]
    gaps=[g for g in gaps if finite(g)]
    qb_present="QB" in positions
    max_gap=max(gaps) if gaps else None
    return {
        "unavailableCount":len(observations),
        "countBucket":count_bucket(len(observations)),
        "positionGroups":positions,
        "primaryPositionGroup":"QB" if qb_present else (positions[0] if len(positions)==1 else "MULTI"),
        "qbPresent":qb_present,
        "maxLossGap":max_gap,
        "severityBucket":severity_bucket(max_gap),
    }

def stratum_keys(f):
    return [
        ("EXACT", f["primaryPositionGroup"], f["severityBucket"], f["countBucket"]),
        ("POSITION_SEVERITY", f["primaryPositionGroup"], f["severityBucket"]),
        ("SEVERITY", f["severityBucket"]),
        ("POSITION", f["primaryPositionGroup"]),
        ("GLOBAL",),
    ]

def fit_lookup(train_rows):
    maps=defaultdict(lambda: defaultdict(list))
    effects=[r["effect"] for r in train_rows]
    lo=percentile(effects,.05)
    hi=percentile(effects,.95)
    for r in train_rows:
        for key in stratum_keys(r["features"]):
            maps[len(key)][key].append(r["effect"])
    return maps,lo,hi

def predict_lookup(f,maps,lo,hi):
    minimums={4:12,3:15,2:25,1:1}
    for key in stratum_keys(f):
        vals=maps[len(key)].get(key,[])
        if len(vals) >= minimums[len(key)]:
            est=mean(vals)
            est=max(lo,min(hi,est))
            return est,key[0],len(vals)
    return None,"NONE",0

def winner_correct(predicted,actual):
    if predicted == 0 or actual == 0:
        return None
    return (predicted > 0) == (actual > 0)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--legacy-effects",default="data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")
    ap.add_argument("--expansion-effects",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl")
    ap.add_argument("--legacy-observations",default="data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl")
    ap.add_argument("--expansion-observations",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl")
    ap.add_argument("--legacy-outcomes",default="data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl")
    ap.add_argument("--expansion-outcomes",default="data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl")
    ap.add_argument("--report",default="data/calibration/historical/expansion-2020-2021/player-impact/shadow-decision-validation-2d4-r2-v1.json")
    ap.add_argument("--candidate",default="data/calibration/historical/expansion-2020-2021/player-impact/shadow-player-impact-candidate-2d4-r2-v1.json")
    args=ap.parse_args()

    effects=load_jsonl(args.legacy_effects)+load_jsonl(args.expansion_effects)
    observations=load_jsonl(args.legacy_observations)+load_jsonl(args.expansion_observations)
    outcomes=load_jsonl(args.legacy_outcomes)+load_jsonl(args.expansion_outcomes)

    if len(effects) < 700:
        print(json.dumps({
            "contractVersion":CONTRACT_VERSION,
            "decision":"BLOCKED_CORE_EFFECT_CORPUS_MISSING",
            "effectRows":len(effects),
        },indent=2))
        raise SystemExit(2)

    obs_map=defaultdict(list)
    for o in observations:
        k=obs_key(o)
        if k[0] in TARGET_SEASONS:
            obs_map[k].append(o)

    outcome_map={r.get("pairId"):r for r in outcomes if r.get("pairId")}

    effect_keys_by_season=defaultdict(set)
    obs_keys_by_season=defaultdict(set)
    outcome_pairs_by_season=defaultdict(set)

    for e in effects:
        k=treated_key(e)
        effect_keys_by_season[k[0]].add(k)

    for k in obs_map:
        obs_keys_by_season[k[0]].add(k)

    for r in outcomes:
        t=r.get("treated") or {}
        s=t.get("season")
        if s in TARGET_SEASONS and r.get("pairId"):
            outcome_pairs_by_season[s].add(r.get("pairId"))

    join_audit={}
    for season in TARGET_SEASONS:
        effect_keys=effect_keys_by_season[season]
        obs_keys=obs_keys_by_season[season]
        join_audit[str(season)]={
            "effectTeamGameKeys":len(effect_keys),
            "observationTeamGameKeys":len(obs_keys),
            "effectKeysWithObservation":len(effect_keys & obs_keys),
            "effectKeysMissingObservation":len(effect_keys - obs_keys),
            "outcomePairIds":len(outcome_pairs_by_season[season]),
        }

    rows=[]
    join_failures=[]
    for e in effects:
        ev=effect_value(e)
        t=e.get("treated") or {}
        season=t.get("season")
        if season not in TARGET_SEASONS or ev is None:
            continue

        k=treated_key(e)
        obs=obs_map.get(k,[])
        out=outcome_map.get(e.get("pairId"))

        if not obs or not out:
            join_failures.append({
                "pairId":e.get("pairId"),
                "season":season,
                "week":t.get("week"),
                "gameId":t.get("gameId"),
                "team":t.get("team"),
                "missingObservation":not bool(obs),
                "missingOutcome":out is None,
            })
            continue

        tout=(out.get("treated") or {}).get("outcome") or {}
        expected=tout.get("expectedTeamMargin")
        actual=tout.get("actualTeamMargin")

        if not finite(expected) or not finite(actual):
            join_failures.append({
                "pairId":e.get("pairId"),
                "season":season,
                "week":t.get("week"),
                "gameId":t.get("gameId"),
                "team":t.get("team"),
                "missingExpectedOrActualMargin":True,
            })
            continue

        rows.append({
            "pairId":e.get("pairId"),
            "season":season,
            "week":t.get("week"),
            "gameId":t.get("gameId"),
            "team":t.get("team"),
            "effect":ev,
            "baselineExpectedTeamMargin":float(expected),
            "actualTeamMargin":float(actual),
            "features":team_game_features(obs),
        })

    predictions=[]
    fold_reports={}
    for holdout in TARGET_SEASONS:
        train=[r for r in rows if r["season"] != holdout]
        test=[r for r in rows if r["season"] == holdout]
        maps,lo,hi=fit_lookup(train)

        fold=[]
        for r in test:
            pred,mode,n=predict_lookup(r["features"],maps,lo,hi)
            if pred is None:
                continue
            rr={**r}
            rr["predictedPlayerImpactMargin"]=pred
            rr["resolutionMode"]=mode
            rr["trainingStratumN"]=n
            rr["shadowExpectedTeamMargin"]=rr["baselineExpectedTeamMargin"]+pred
            rr["baselineError"]=rr["actualTeamMargin"]-rr["baselineExpectedTeamMargin"]
            rr["shadowError"]=rr["actualTeamMargin"]-rr["shadowExpectedTeamMargin"]
            rr["baselineWinnerCorrect"]=winner_correct(rr["baselineExpectedTeamMargin"],rr["actualTeamMargin"])
            rr["shadowWinnerCorrect"]=winner_correct(rr["shadowExpectedTeamMargin"],rr["actualTeamMargin"])
            rr["favoriteFlip"]=(rr["baselineExpectedTeamMargin"]>0)!=(rr["shadowExpectedTeamMargin"]>0)
            fold.append(rr)
            predictions.append(rr)

        fold_reports[str(holdout)]={
            "trainRows":len(train),
            "testRows":len(test),
            "predictedRows":len(fold),
            "baselineMAE":mae([x["baselineError"] for x in fold]),
            "shadowMAE":mae([x["shadowError"] for x in fold]),
            "baselineRMSE":rmse([x["baselineError"] for x in fold]),
            "shadowRMSE":rmse([x["shadowError"] for x in fold]),
        }

    baseline_errors=[r["baselineError"] for r in predictions]
    shadow_errors=[r["shadowError"] for r in predictions]
    base_wc=[r["baselineWinnerCorrect"] for r in predictions if r["baselineWinnerCorrect"] is not None]
    shad_wc=[r["shadowWinnerCorrect"] for r in predictions if r["shadowWinnerCorrect"] is not None]

    baseline_mae=mae(baseline_errors)
    shadow_mae=mae(shadow_errors)
    baseline_rmse=rmse(baseline_errors)
    shadow_rmse=rmse(shadow_errors)
    mae_delta=shadow_mae-baseline_mae if finite(shadow_mae) and finite(baseline_mae) else None
    rmse_delta=shadow_rmse-baseline_rmse if finite(shadow_rmse) and finite(baseline_rmse) else None
    base_acc=sum(base_wc)/len(base_wc) if base_wc else None
    shadow_acc=sum(shad_wc)/len(shad_wc) if shad_wc else None

    large_threshold=14.0
    baseline_large=sum(abs(x)>=large_threshold for x in baseline_errors)
    shadow_large=sum(abs(x)>=large_threshold for x in shadow_errors)

    by_severity={}
    for sev in ["LOW","MODERATE","HIGH","VERY_HIGH","UNKNOWN"]:
        ss=[r for r in predictions if r["features"]["severityBucket"]==sev]
        if not ss:
            continue
        by_severity[sev]={
            "rows":len(ss),
            "meanPredictedImpact":mean([r["predictedPlayerImpactMargin"] for r in ss]),
            "meanObservedATT":mean([r["effect"] for r in ss]),
            "baselineMAE":mae([r["baselineError"] for r in ss]),
            "shadowMAE":mae([r["shadowError"] for r in ss]),
        }

    qb=[r for r in predictions if r["features"]["qbPresent"]]
    nonqb=[r for r in predictions if not r["features"]["qbPresent"]]

    checks={
        "all720RowsJoined":len(rows)==len(effects)==720,
        "zeroJoinFailures":len(join_failures)==0,
        "allFiveSeasonsHoldoutEvaluated":all(fold_reports[str(s)]["predictedRows"]>0 for s in TARGET_SEASONS),
        "noTargetSeasonLeakage":True,
        "shadowMAENotMateriallyWorse":finite(mae_delta) and mae_delta <= 0.10,
        "shadowRMSENotMateriallyWorse":finite(rmse_delta) and rmse_delta <= 0.15,
        "winnerAccuracyNotMateriallyWorse":finite(base_acc) and finite(shadow_acc) and shadow_acc >= base_acc - 0.005,
        "largeErrorCountNotWorse":shadow_large <= baseline_large,
        "qbEvidenceRepresented":len(qb)>=10,
        "severityDifferentiationPresent":len(by_severity)>=3,
    }

    failures=[k for k,v in checks.items() if not v]

    if failures:
        decision="PLAYER_IMPACT_SHADOW_DECISION_VALIDATION_HOLD"
    else:
        decision="PLAYER_IMPACT_SHADOW_DECISION_VALIDATION_PASSED_PICKEM_HANDOFF_READY"

    candidate={
        "contractVersion":"FIE-NFL-PLAYER-IMPACT-SHADOW-CANDIDATE-2D4-R2-1.0.0",
        "mode":"RESEARCH_ONLY_OUT_OF_SEASON_LOOKUP_CANDIDATE",
        "method":{
            "validation":"LEAVE_ONE_SEASON_OUT",
            "target":"MATCHED_ATT_TREATED_MINUS_CONTROL_RESIDUAL",
            "features":["primaryPositionGroup","severityBucket","unavailableCount"],
            "severitySource":"MAX_PRE_GAME_PLAYER_CALIBER_MINUS_REPLACEMENT_CALIBER_CLAMPED_AT_ZERO",
            "hierarchicalFallback":["EXACT","POSITION_SEVERITY","SEVERITY","POSITION","GLOBAL"],
            "bounds":"TRAINING_FOLD_5TH_TO_95TH_PERCENTILE",
            "noTargetSeasonOutcomeTuning":True,
            "candidateMethodChangedFrom2D4R1":False,
        },
        "productionAuthorized":False,
        "teamStrengthMutationAuthorized":False,
        "decisionModelMutationAuthorized":False,
        "pickemMutationAuthorized":False,
    }

    report={
        "contractVersion":CONTRACT_VERSION,
        "sprint":"2D.4-R2",
        "mode":"READ_ONLY_JOIN_RECOVERY_AND_SAME_CANDIDATE_REVALIDATION",
        "decision":decision,
        "joinRecovery":{
            "correctedExpansionObservationPath":args.expansion_observations,
            "effectRows":len(effects),
            "observationRows":len(observations),
            "outcomeRows":len(outcomes),
            "joinedValidationRows":len(rows),
            "joinFailures":len(join_failures),
            "sampleJoinFailures":join_failures[:20],
            "bySeason":join_audit,
        },
        "candidate":candidate,
        "decisionQuality":{
            "baselineMAE":baseline_mae,
            "shadowMAE":shadow_mae,
            "shadowMinusBaselineMAE":mae_delta,
            "baselineRMSE":baseline_rmse,
            "shadowRMSE":shadow_rmse,
            "shadowMinusBaselineRMSE":rmse_delta,
            "baselineWinnerAccuracy":base_acc,
            "shadowWinnerAccuracy":shadow_acc,
            "favoriteFlips":sum(r["favoriteFlip"] for r in predictions),
            "baselineLargeErrors14Plus":baseline_large,
            "shadowLargeErrors14Plus":shadow_large,
        },
        "folds":fold_reports,
        "behavior":{
            "bySeverity":by_severity,
            "qb":{
                "rows":len(qb),
                "meanPredictedImpact":mean([r["predictedPlayerImpactMargin"] for r in qb]),
                "meanObservedATT":mean([r["effect"] for r in qb]),
                "baselineMAE":mae([r["baselineError"] for r in qb]),
                "shadowMAE":mae([r["shadowError"] for r in qb]),
            },
            "nonQB":{
                "rows":len(nonqb),
                "meanPredictedImpact":mean([r["predictedPlayerImpactMargin"] for r in nonqb]),
                "meanObservedATT":mean([r["effect"] for r in nonqb]),
            },
        },
        "checks":checks,
        "failures":failures,
        "nextAction":{
            "reopenHistoricalConstruction":False,
            "candidateRetuningAuthorized":False if not checks["all720RowsJoined"] else bool(failures),
            "pickemCoordinationHandoffAuthorized":decision=="PLAYER_IMPACT_SHADOW_DECISION_VALIDATION_PASSED_PICKEM_HANDOFF_READY",
            "productionPlayerImpactAuthorized":False,
            "productionTeamStrengthAuthorized":False,
        },
        "safeguards":{
            "historicalArtifactsMutated":False,
            "candidateMethodChanged":False,
            "productionWeightsWritten":False,
            "canonicalShadowIntegrationMutated":False,
            "teamStrengthMutated":False,
            "matchupIntelligenceMutated":False,
            "decisionModelMutated":False,
            "pickemMutated":False,
        },
    }

    Path(args.candidate).parent.mkdir(parents=True,exist_ok=True)
    Path(args.candidate).write_text(json.dumps(candidate,indent=2)+"\n",encoding="utf-8")
    Path(args.report).parent.mkdir(parents=True,exist_ok=True)
    Path(args.report).write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
