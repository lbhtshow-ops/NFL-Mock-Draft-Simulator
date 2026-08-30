#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import Counter
from pathlib import Path

def load(p):
 p=Path(p);return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []

def k(r):return (int(r["season"]),int(r["week"]),r["team"],r["playerId"])

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--targets",required=True)
 ap.add_argument("--career-baselines",required=True)
 ap.add_argument("--evidence-bundles",required=True)
 ap.add_argument("--residuals",required=False)
 ap.add_argument("--output",required=True);ap.add_argument("--report",required=True)
 a=ap.parse_args()
 targets=load(a.targets);base={k(r):r for r in load(a.career_baselines)}
 bundles={k(r):r for r in load(a.evidence_bundles)}
 residual={k(r):r for r in load(a.residuals)} if a.residuals else {}
 out=[];c=Counter();positions=Counter()
 for t in targets:
  key=k(t);b=base.get(key,{});e=bundles.get(key,{})
  position=t.get("position") or b.get("normalizedPosition") or residual.get(key,{}).get("resolvedPosition")
  # C9 does not fabricate historical roster status or experience.
  historicalStatus=t.get("historicalStatus")
  historicalExperience=t.get("historicalExperience")
  usageAvailable=bool(e.get("priorSnapEvidence") or e.get("priorWeeklySnaps"))
  perfRows=e.get("priorCurrentSeasonWeeklyStats") or []
  performanceAvailable=bool(perfRows or (b.get("totalPriorNFLGames") or 0)>0)
  recognitionAvailable=bool(e.get("historicalRecognitionSummary",{}).get("available")) if isinstance(e.get("historicalRecognitionSummary"),dict) else False
  status={
   "statusScore":"READY" if historicalStatus else "MISSING_HISTORICAL_STATUS",
   "experienceScore":"READY" if isinstance(historicalExperience,(int,float)) else "MISSING_HISTORICAL_EXPERIENCE",
   "usageScore":"READY" if usageAvailable else "MISSING_HISTORICAL_USAGE_PROFILE",
   "productionScore":"READY" if performanceAvailable and position in {"QB","RB","FB","WR","TE","EDGE","DL","LB","CB","S"} else ("UNSUPPORTED_POSITION" if position in {"OT","IOL","K","P","LS"} else "MISSING_HISTORICAL_PERFORMANCE"),
   "recognitionScore":"READY" if recognitionAvailable else "OPTIONAL_RECOGNITION_UNAVAILABLE",
  }
  ready=sum(v=="READY" for v in status.values())
  c["targets"]+=1;c["fiveReady"]+=ready==5;c["fourPlus"]+=ready>=4;c["threePlus"]+=ready>=3
  for field,val in status.items():c[f"{field}:{val}"]+=1
  positions[position or "UNKNOWN"]+=1
  out.append({**t,"resolvedPosition":position,"scoreProjectionReadiness":status,"readyScoreFieldCount":ready,
   "controlledModelExecutionAuthorized":False})
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={"contractVersion":"FIE-NFL-HISTORICAL-CANONICAL-SCORE-PROJECTION-READINESS-REPORT-1.0.0","sprint":"9D.1C2B2C9",
 "targetCount":c["targets"],"targetsWithAllFiveScoreInputsReady":c["fiveReady"],
 "targetsWithAtLeastFourReady":c["fourPlus"],"targetsWithAtLeastThreeReady":c["threePlus"],
 "fieldStatuses":{x.split(":",1)[0]:{} for x in c if ":" in x},
 "positions":dict(sorted(positions.items())),"controlledModelExecutionAuthorized":False,
 "full606ScoringAuthorized":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 for key,count in c.items():
  if ":" in key:
   field,status=key.split(":",1);report["fieldStatuses"][field][status]=count
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
