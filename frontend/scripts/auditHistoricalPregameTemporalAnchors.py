#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path
from collections import Counter,defaultdict
from datetime import datetime

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except:return None

def load_jsonl(path):
    p=Path(path)
    if not p.exists(): return []
    with p.open("r",encoding="utf-8") as f:
        return [json.loads(x) for x in f if x.strip()]

def read_json(path):
    p=Path(path)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

def audit(depth_rows,availability_qualification):
    d=Counter();by=defaultdict(Counter)
    for r in depth_rows:
        season=r.get("season"); by[str(season)]["rows"]+=1; d["rows"]+=1
        if r.get("source_timestamp"): d["timestamped"]+=1; by[str(season)]["timestamped"]+=1
        if r.get("week") is not None: d["week"]+=1; by[str(season)]["week"]+=1
        if r.get("gsis_id"): d["gsis"]+=1; by[str(season)]["gsis"]+=1
        if r.get("depth_rank") is not None: d["rank"]+=1; by[str(season)]["rank"]+=1

    injury={}
    for result in availability_qualification.get("results",[]):
        season=str(result.get("season"))
        injury[season]={
          "sourceAvailable":result.get("sourceAvailable"),
          "dateModifiedCoverageRate":result.get("dateModifiedCoverageRate"),
          "pregameSafeRate":result.get("pregameSafeRate"),
          "qualifiedForAvailabilityJoin":result.get("qualifiedForJoin"),
          "qualifiesDepthChartPublicationTime":False,
        }

    n=d["rows"]
    rate=lambda x:x/n if n else 0
    direct_depth_temporal = bool(n and rate(d["timestamped"])>=.95)

    result={
      "contractVersion":"FIE-NFL-HISTORICAL-PREGAME-TEMPORAL-ANCHOR-AUDIT-1.0.0",
      "depthChart":{
        "rowCount":n,
        "timestampCoverageRate":rate(d["timestamped"]),
        "weekCoverageRate":rate(d["week"]),
        "canonicalIdentityCoverageRate":rate(d["gsis"]),
        "depthRankCoverageRate":rate(d["rank"]),
        "bySeason":{k:dict(v) for k,v in sorted(by.items())},
        "directTemporalAnchorQualified":direct_depth_temporal,
      },
      "injuryPracticeReportContext":injury,
      "candidateAnchorClasses":{
        "DIRECT_DEPTH_CHART_TIMESTAMP":{"available":direct_depth_temporal,"qualified":direct_depth_temporal},
        "INJURY_REPORT_TIMESTAMP":{"available":bool(injury),"qualifiedForAvailability":any(v.get("qualifiedForAvailabilityJoin") for v in injury.values()),"qualifiedForDepthChartPublication":False},
        "SOURCE_PUBLICATION_METADATA":{"available":False,"qualified":False},
        "EXPLICIT_STARTER_ANNOUNCEMENT":{"available":False,"qualified":False},
        "TRANSACTION_TIMESTAMP":{"available":False,"qualifiedForDepthChartPublication":False},
        "SNAP_COUNT":{"available":True,"qualifiedForPregameReplacement":False},
      },
      "qualifiedForPregameDepthChartTemporalEvidence":direct_depth_temporal,
      "qualifiedForPregameReplacementMapping":False,
      "requiredNextEvidence":["SOURCE_PUBLICATION_METADATA","EXPLICIT_STARTER_ANNOUNCEMENT"],
      "weekScopeAcceptedAsTemporalProof":False,
      "injuryTimestampReusedAsDepthTimestamp":False,
      "replacementMappingsGenerated":False,
      "datasetMutated":False,
      "calibrationExecuted":False,
      "learnedWeights":None,
    }
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--depth-charts",required=True)
    ap.add_argument("--availability-qualification",required=True)
    ap.add_argument("--output",required=True)
    a=ap.parse_args()
    result=audit(load_jsonl(a.depth_charts),read_json(a.availability_qualification))
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))

if __name__=="__main__":main()
