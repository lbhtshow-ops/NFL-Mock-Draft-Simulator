#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import defaultdict,Counter
from pathlib import Path

def load(path):
 p=Path(path)
 return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--targets",required=True);ap.add_argument("--player-stats",required=True)
 ap.add_argument("--output",required=True);ap.add_argument("--report",required=True)
 a=ap.parse_args()
 targets=load(a.targets);stats=load(a.player_stats)
 by=defaultdict(list)
 for r in stats:
  if r.get("playerId") and isinstance(r.get("season"),int) and isinstance(r.get("week"),int):
   by[(r["playerId"],r["season"])].append(r)
 for rows in by.values():rows.sort(key=lambda x:x["week"])
 out=[];c=Counter();positions=Counter()
 for t in targets:
  pid=t.get("playerId");season=t.get("season");week=t.get("week")
  history=[r for r in by.get((pid,season),[]) if r["week"]<week and (r.get("seasonType") in (None,"REG"))]
  # Previous seasons are deliberately not pulled into this first evidence bundle.
  # Career-baseline evidence requires a separately governed historical career adapter.
  position=t.get("position") or (history[-1].get("position") if history else None)
  bundle={
   "contractVersion":"FIE-NFL-HISTORICAL-PLAYER-EVALUATION-EVIDENCE-BUNDLE-1.0.0",
   "season":season,"week":week,"team":t.get("team"),"playerId":pid,"position":position,
   "asOf":t.get("asOf"),"kickoffAt":t.get("kickoffAt"),
   "priorCurrentSeasonGameCount":len(history),
   "priorCurrentSeasonWeeklyStats":history,
   "targetWeekIncluded":False,
   "futureWeekIncluded":False,
   "futureSeasonIncluded":False,
   "canonicalHistoricalEvaluatorStatus":"HISTORICAL_INPUT_ADAPTER_REQUIRED",
   "caliber":None,"confidence":None,"modelVersion":None,"provenance":None
  }
  out.append(bundle);c["targets"]+=1
  if history:c["withHistory"]+=1
  else:c["withoutHistory"]+=1
  if position:positions[position]+=1
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-EVALUATION-EVIDENCE-BUNDLE-REPORT-1.0.0","sprint":"9D.1C2B2C3",
  "targetCount":c["targets"],"targetsWithPriorCurrentSeasonStats":c["withHistory"],"targetsWithoutPriorCurrentSeasonStats":c["withoutHistory"],
  "priorCurrentSeasonEvidenceCoverageRate":c["withHistory"]/c["targets"] if c["targets"] else 0,
  "targetsByPosition":dict(sorted(positions.items())),
  "targetWeekPerformanceIncluded":False,"futureWeekEvidenceIncluded":False,"futureSeasonEvidenceIncluded":False,
  "canonicalHistoricalInputAdapterPresent":False,"availableCaliberSnapshotsGenerated":0,
  "unavailableSnapshotsRequiredUntilAdapterExists":c["targets"],
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
