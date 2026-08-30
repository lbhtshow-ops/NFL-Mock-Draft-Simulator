#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import defaultdict,Counter
from pathlib import Path

POS={
 "QB":"QB","RB":"RB","FB":"RB","WR":"WR","TE":"TE",
 "T":"OT","OT":"OT","LT":"OT","RT":"OT","G":"IOL","OG":"IOL","LG":"IOL","RG":"IOL","C":"IOL","OL":"OL",
 "DE":"EDGE","EDGE":"EDGE","OLB":"LB","ILB":"LB","MLB":"LB","LB":"LB",
 "DT":"IDL","NT":"IDL","DL":"DL","CB":"CB","DB":"DB","S":"S","FS":"S","SS":"S","SAF":"S",
 "K":"K","P":"P","LS":"ST"
}
FAMILIES={
 "QB":["passingAttempts","passingYards","passingTDs","interceptions"],
 "RB":["carries","rushingYards","rushingTDs","targets","receptions","receivingYards"],
 "WR":["targets","receptions","receivingYards","receivingTDs"],
 "TE":["targets","receptions","receivingYards","receivingTDs"],
 "OT":[],"IOL":[],"OL":[],
 "EDGE":["defensiveSnaps","tackles","sacks"],"LB":["defensiveSnaps","tackles","sacks","interceptionsDef"],
 "IDL":["defensiveSnaps","tackles","sacks"],"DL":["defensiveSnaps","tackles","sacks"],
 "CB":["defensiveSnaps","tackles","interceptionsDef"],"DB":["defensiveSnaps","tackles","interceptionsDef"],
 "S":["defensiveSnaps","tackles","interceptionsDef"],"K":[],"P":[],"ST":[]
}
def load(p):
 p=Path(p);return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []
def norm(p):return POS.get(str(p or "").upper(),str(p or "UNKNOWN").upper())
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--targets",required=True);ap.add_argument("--player-stats",required=True)
 ap.add_argument("--lookback-seasons",type=int,default=3);ap.add_argument("--output",required=True);ap.add_argument("--report",required=True);a=ap.parse_args()
 targets=load(a.targets);stats=load(a.player_stats);by=defaultdict(list)
 for r in stats:
  if r.get("playerId") and isinstance(r.get("season"),int) and isinstance(r.get("week"),int):by[r["playerId"]].append(r)
 for rows in by.values():rows.sort(key=lambda x:(x["season"],x["week"]))
 out=[];c=Counter();posc=Counter()
 for t in targets:
  season=int(t["season"]);week=int(t["week"]);pid=t["playerId"];low=season-a.lookback_seasons
  hist=[r for r in by.get(pid,[]) if low<=r["season"]<=season and (r["season"]<season or r["week"]<week) and r.get("seasonType") in (None,"REG")]
  same=[r for r in hist if r["season"]==season];prior=[r for r in hist if r["season"]<season]
  rawpos=t.get("position") or (hist[-1].get("position") if hist else None);p=norm(rawpos);features=FAMILIES.get(p,[])
  agg={}
  for name in features:
   vals=[r.get(name) for r in hist if isinstance(r.get(name),(int,float))]
   agg[name]={"sum":sum(vals),"gamesWithValue":len(vals)} if vals else {"sum":None,"gamesWithValue":0}
  status="EVIDENCE_AVAILABLE" if hist else "NO_PRIOR_NFL_WEEKLY_EVIDENCE"
  out.append({"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-CAREER-BASELINE-BUNDLE-1.0.0",
   "season":season,"week":week,"team":t.get("team"),"playerId":pid,"rawPosition":rawpos,"normalizedPosition":p,
   "asOf":t.get("asOf"),"kickoffAt":t.get("kickoffAt"),"lookbackSeasons":a.lookback_seasons,
   "sameSeasonPriorGames":len(same),"priorSeasonGames":len(prior),"totalPriorNFLGames":len(hist),
   "earliestEvidenceSeason":hist[0]["season"] if hist else None,"latestEvidenceSeason":hist[-1]["season"] if hist else None,
   "latestEvidenceWeek":hist[-1]["week"] if hist else None,"positionFeatureFamily":features,"featureAggregates":agg,
   "evidenceStatus":status,"canonicalHistoricalEvaluatorStatus":"HISTORICAL_INPUT_ADAPTER_REQUIRED",
   "caliber":None,"confidence":None,"modelVersion":None})
  c["targets"]+=1;c["history"]+=bool(hist);c["priorSeason"]+=bool(prior);c["sameSeason"]+=bool(same);c["noHistory"]+=not bool(hist);posc[p]+=1
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-CAREER-BASELINE-REPORT-1.0.0","sprint":"9D.1C2B2C4",
 "targetCount":c["targets"],"targetsWithAnyPriorNFLEvidence":c["history"],"targetsWithSameSeasonEvidence":c["sameSeason"],
 "targetsWithPriorSeasonEvidence":c["priorSeason"],"targetsWithoutPriorNFLEvidence":c["noHistory"],
 "overallEvidenceCoverageRate":c["history"]/c["targets"] if c["targets"] else 0,"targetsByNormalizedPosition":dict(sorted(posc.items())),
 "targetWeekIncluded":False,"futureWeekIncluded":False,"futureSeasonIncluded":False,"currentRatingBackfillUsed":False,
 "syntheticCaliberUsed":False,"collegeFallbackUsed":False,"canonicalHistoricalEvaluatorAdapterPresent":False,
 "availableCaliberSnapshotsGenerated":0,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
