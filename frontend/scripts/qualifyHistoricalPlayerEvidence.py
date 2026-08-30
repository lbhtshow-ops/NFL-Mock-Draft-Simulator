#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from datetime import datetime
from pathlib import Path
from collections import Counter

ALLOWED={"EXPLICIT_DEPTH_CHART","EXPLICIT_STARTER_ANNOUNCEMENT","PREGAME_ROLE_EVIDENCE","PRIOR_USAGE"}

def rows(path):
    p=Path(path)
    if not p.exists(): return []
    with p.open("r",encoding="utf-8") as f:
        return [json.loads(x) for x in f if x.strip()]

def dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except:return None

def qcal(r):
    e=[]
    for k in ("playerId","team","position","season","week","gameId","asOf","kickoffAt","modelVersion","provenance"):
        if r.get(k) in (None,""):e.append(k.upper()+"_REQUIRED")
    a,k=dt(r.get("asOf")),dt(r.get("kickoffAt"))
    if not a or not k:e.append("TEMPORAL_BOUNDARY_REQUIRED")
    elif a>=k:e.append("HISTORICAL_CALIBER_FUTURE_LEAKAGE")
    if r.get("status")=="AVAILABLE":
        if not isinstance(r.get("caliber"),(int,float)):e.append("AVAILABLE_CALIBER_REQUIRED")
        if not isinstance(r.get("confidence"),(int,float)):e.append("CONFIDENCE_REQUIRED")
    return e

def qmap(r):
    e=[]
    for k in ("unavailablePlayerId","replacementPlayerId","team","position","season","week","gameId","asOf","provenance"):
        if r.get(k) in (None,""):e.append(k.upper()+"_REQUIRED")
    if r.get("unavailablePlayerId")==r.get("replacementPlayerId"):e.append("REPLACEMENT_MUST_DIFFER")
    if r.get("evidenceType") not in ALLOWED:e.append("EXPLICIT_REPLACEMENT_EVIDENCE_REQUIRED")
    if not isinstance(r.get("confidence"),(int,float)):e.append("CONFIDENCE_REQUIRED")
    return e

def summarize(items,fn):
    rejected=[];reasons=Counter()
    for i,r in enumerate(items,1):
        errs=fn(r)
        if errs:
            rejected.append({"line":i,"errors":errs})
            reasons.update(errs)
    return {"total":len(items),"qualified":len(items)-len(rejected),"rejected":len(rejected),
            "rejectionReasons":dict(reasons),"rejectedRows":rejected[:100]}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--caliber-snapshots",required=True)
    ap.add_argument("--replacement-mappings",required=True)
    ap.add_argument("--output",default="data/calibration/historical/v1/player-evidence-qualification.json")
    a=ap.parse_args()
    c=rows(a.caliber_snapshots);m=rows(a.replacement_mappings)
    report={"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-QUALIFICATION-REPORT-1.0.0",
            "caliber":summarize(c,qcal),"replacements":summarize(m,qmap),
            "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":main()
