#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path
from collections import Counter,defaultdict

def load(p):
 p=Path(p); return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []

def key(r): return (int(r["season"]),int(r["week"]),r["team"],r["playerId"])

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--targets",required=True);ap.add_argument("--career-baselines",required=True)
 ap.add_argument("--replacement-identities",required=True);ap.add_argument("--depth-charts",required=True)
 ap.add_argument("--snap-counts-resolved",required=True);ap.add_argument("--output",required=True);ap.add_argument("--report",required=True)
 a=ap.parse_args()
 targets=load(a.targets);bases={key(r):r for r in load(a.career_baselines)}
 reps=load(a.replacement_identities);depth=load(a.depth_charts);snaps=load(a.snap_counts_resolved)
 rep_pos=defaultdict(set)
 for r in reps:
  if r.get("position"):
   k=(int(r["season"]),int(r["week"]),r["team"])
   if r.get("unavailablePlayerId"):rep_pos[(*k,r["unavailablePlayerId"])].add(r["position"])
   if r.get("replacementPlayerId"):rep_pos[(*k,r["replacementPlayerId"])].add(r["position"])
 dep_pos=defaultdict(set)
 for r in depth:
  try:k=(int(r["season"]),int(r["week"]),r["team"],r["gsis_id"])
  except:continue
  for p in (r.get("position"),r.get("depth_position")):
   if p:dep_pos[k].add(p)
 snap_pos=defaultdict(set); snap_prior=defaultdict(int); snap_any=defaultdict(int)
 for r in snaps:
  pid=r.get("gsis_id")
  if not pid:continue
  try:season=int(r["season"]);week=int(r["week"]);team=r["team"]
  except:continue
  if r.get("position"):snap_pos[(season,week,team,pid)].add(r["position"])
  snap_any[pid]+=1
  # prior-target counts evaluated below across all player rows
 snap_by_player=defaultdict(list)
 for r in snaps:
  if r.get("gsis_id"):snap_by_player[r["gsis_id"]].append(r)

 out=[];c=Counter();classes=Counter()
 for t in targets:
  k=key(t);b=bases.get(k,{})
  if (b.get("totalPriorNFLGames") or 0)>0:continue
  c["residual"]+=1;position=None;source=None
  vals=rep_pos.get(k,set())
  if len(vals)==1:position=next(iter(vals));source="REPLACEMENT_MAPPING_POSITION"
  if not position:
   vals=dep_pos.get(k,set())
   if len(vals)==1:position=next(iter(vals));source="EXACT_DEPTH_CHART_POSITION"
  if not position:
   vals=snap_pos.get(k,set())
   if len(vals)==1:position=next(iter(vals));source="CANONICAL_SNAP_POSITION"
  prior_snaps=0;later_target_season=0
  for r in snap_by_player.get(t["playerId"],[]):
   rs=int(r["season"]);rw=int(r["week"])
   if rs<t["season"] or (rs==t["season"] and rw<t["week"]):prior_snaps+=1
   if rs==t["season"] and rw>=t["week"]:later_target_season+=1
  if prior_snaps>0:
   cls="WEEKLY_STATS_COVERAGE_GAP_WITH_PRIOR_SNAP_EVIDENCE"
  elif later_target_season>0:
   cls="NO_PRIOR_NFL_EVIDENCE_WITH_TARGET_SEASON_PARTICIPATION"
  elif t.get("playerId"):
   cls="NO_PRIOR_EVIDENCE_IN_ACQUIRED_WINDOW"
  else:
   cls="CANONICAL_IDENTITY_GAP"
  if not position:cls += "_POSITION_UNRESOLVED"
  classes[cls]+=1;c["positionResolved"]+=bool(position)
  out.append({**t,"resolvedPosition":position,"positionResolutionSource":source,
   "priorCanonicalSnapObservations":prior_snaps,"targetSeasonSnapObservationsAtOrAfterTarget":later_target_season,
   "residualClassification":cls,"caliberStatus":"UNAVAILABLE_PENDING_HISTORICAL_EVALUATOR_OR_EVIDENCE"})
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-CALIBER-RESIDUAL-AUDIT-1.0.0","sprint":"9D.1C2B2C5",
 "residualTargetCount":c["residual"],"positionsResolved":c["positionResolved"],"positionsStillUnresolved":c["residual"]-c["positionResolved"],
 "classifications":dict(sorted(classes.items())),"nameGuessUsed":False,"currentRosterLookupUsed":False,
 "currentRatingUsed":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
