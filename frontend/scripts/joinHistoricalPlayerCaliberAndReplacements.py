#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except:return None

def load_jsonl(path):
    if not Path(path).exists(): return []
    rows=[]
    with open(path,"r",encoding="utf-8") as f:
        for line in f:
            if line.strip():rows.append(json.loads(line))
    return rows

def caliber_key(r):
    return (r.get("gameId"),r.get("team"),r.get("playerId"))

def mapping_key(r):
    return (r.get("gameId"),r.get("team"),r.get("unavailablePlayerId"))

def valid_caliber(r,kickoff):
    if r.get("status")!="AVAILABLE":return False
    if not isinstance(r.get("caliber"),(int,float)):return False
    a=parse_dt(r.get("asOf"));k=parse_dt(kickoff)
    if not a or not k:return False
    if a.tzinfo is not None and k.tzinfo is None:k=k.replace(tzinfo=a.tzinfo)
    if a.tzinfo is None and k.tzinfo is not None:a=a.replace(tzinfo=k.tzinfo)
    return a<k

def valid_mapping(r):
    return bool(r.get("unavailablePlayerId") and r.get("replacementPlayerId") and
                r.get("unavailablePlayerId")!=r.get("replacementPlayerId") and
                r.get("evidenceType") in {"EXPLICIT_DEPTH_CHART","EXPLICIT_STARTER_ANNOUNCEMENT","PREGAME_ROLE_EVIDENCE","PRIOR_USAGE"})

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--observations",default="data/calibration/historical/v1/observations-availability.jsonl")
    ap.add_argument("--caliber-snapshots",required=True)
    ap.add_argument("--replacement-mappings",required=True)
    ap.add_argument("--output",default="data/calibration/historical/v1/observations-availability-caliber.jsonl")
    ap.add_argument("--report",default="data/calibration/historical/v1/caliber-replacement-join-report.json")
    args=ap.parse_args()

    caliber=load_jsonl(args.caliber_snapshots)
    mappings=load_jsonl(args.replacement_mappings)
    cidx={caliber_key(r):r for r in caliber}
    midx={mapping_key(r):r for r in mappings if valid_mapping(r)}

    source=Path(args.observations);out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    total=avail_obs=players=player_cal=rep_map=rep_cal=delta=0
    by_season=defaultdict(lambda:{"observations":0,"availabilityObservations":0,"reportedPlayers":0,"playerCaliber":0,"replacementMapped":0,"replacementCaliber":0,"caliberDelta":0})

    with source.open("r",encoding="utf-8") as inp,out.open("w",encoding="utf-8") as dst:
        for line in inp:
            if not line.strip():continue
            obs=json.loads(line);total+=1
            season=str(obs.get("season"));stats=by_season[season];stats["observations"]+=1
            impact=obs.get("evidence",{}).get("availabilityImpact")
            if impact and isinstance(impact.get("players"),list):
                avail_obs+=1;stats["availabilityObservations"]+=1
                for p in impact["players"]:
                    players+=1;stats["reportedPlayers"]+=1
                    key=(obs.get("gameId"),obs.get("team"),p.get("playerId"))
                    cs=cidx.get(key)
                    if cs and valid_caliber(cs,obs.get("kickoffAt")):
                        p["playerCaliber"]=cs.get("caliber");p["playerCaliberConfidence"]=cs.get("confidence");p["playerCaliberModelVersion"]=cs.get("modelVersion")
                        player_cal+=1;stats["playerCaliber"]+=1
                    else:
                        p["playerCaliber"]=None;p["playerCaliberConfidence"]=None;p["playerCaliberModelVersion"]=None
                    mp=midx.get(key)
                    if mp:
                        rep_map+=1;stats["replacementMapped"]+=1
                        rkey=(obs.get("gameId"),obs.get("team"),mp.get("replacementPlayerId"))
                        rc=cidx.get(rkey)
                        replacement={"playerId":mp.get("replacementPlayerId"),"evidenceType":mp.get("evidenceType"),"mappingConfidence":mp.get("confidence"),"caliber":None,"caliberConfidence":None,"caliberDelta":None}
                        if rc and valid_caliber(rc,obs.get("kickoffAt")):
                            replacement["caliber"]=rc.get("caliber");replacement["caliberConfidence"]=rc.get("confidence")
                            rep_cal+=1;stats["replacementCaliber"]+=1
                            if isinstance(p.get("playerCaliber"),(int,float)):
                                replacement["caliberDelta"]=p["playerCaliber"]-replacement["caliber"]
                                delta+=1;stats["caliberDelta"]+=1
                        p["replacement"]=replacement
                    else:p["replacement"]=None
                impact["caliberCoverage"]={"reportedPlayers":len(impact["players"]),
                  "playerCaliberCount":sum(isinstance(p.get("playerCaliber"),(int,float)) for p in impact["players"]),
                  "replacementMappedCount":sum(bool(p.get("replacement")) for p in impact["players"]),
                  "replacementCaliberCount":sum(isinstance((p.get("replacement")or{}).get("caliber"),(int,float)) for p in impact["players"]),
                  "caliberDeltaCount":sum(isinstance((p.get("replacement")or{}).get("caliberDelta"),(int,float)) for p in impact["players"])}
            obs.setdefault("datasetGovernance",{})["historicalCaliberJoin"]="AS_OF_CANONICAL_EVALUATION_ONLY"
            obs["datasetGovernance"]["replacementMapping"]="EXPLICIT_EVIDENCE_ONLY"
            dst.write(json.dumps(obs,separators=(",",":"))+"\n")

    report={"contractVersion":"FIE-NFL-HISTORICAL-CALIBER-REPLACEMENT-JOIN-REPORT-1.0.0",
      "sourceObservationCount":total,"outputObservationCount":total,"availabilityObservationCount":avail_obs,
      "reportedPlayerCount":players,"playerCaliberJoinedCount":player_cal,"replacementMappedCount":rep_map,
      "replacementCaliberJoinedCount":rep_cal,"caliberDeltaCount":delta,"bySeason":dict(by_season),
      "sourceDatasetMutated":False,"calibrationExecuted":False,"learnedWeights":None,"teamStrengthScores":None}
    Path(args.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":main()
