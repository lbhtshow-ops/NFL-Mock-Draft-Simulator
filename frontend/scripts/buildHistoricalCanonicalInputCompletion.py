#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import defaultdict,Counter
from pathlib import Path

POS={
 "QB":"QB","RB":"RB","FB":"FB","WR":"WR","TE":"TE",
 "T":"OT","OT":"OT","LT":"OT","RT":"OT","G":"IOL","OG":"IOL","LG":"IOL","RG":"IOL","C":"IOL","IOL":"IOL","OL":"IOL",
 "DE":"EDGE","EDGE":"EDGE","OLB":"LB","ILB":"LB","MLB":"LB","LB":"LB",
 "DT":"DL","NT":"DL","IDL":"DL","DL":"DL",
 "CB":"CB","S":"S","FS":"S","SS":"S","SAF":"S",
 "K":"K","P":"P","LS":"LS",
}
def load(p):
 p=Path(p);return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []
def key(r,pid_field="playerId"):
 try:return (int(r["season"]),int(r["week"]),r["team"],r[pid_field])
 except:return None
def normalize(p):
 if p is None:return None
 return POS.get(str(p).upper())
def snap_values(r):
 off=r.get("offense_snaps") if r.get("offense_snaps") is not None else r.get("offenseSnaps")
 deff=r.get("defense_snaps") if r.get("defense_snaps") is not None else r.get("defenseSnaps")
 st=r.get("st_snaps") if r.get("st_snaps") is not None else r.get("specialTeamsSnaps")
 pcts=[r.get("offense_pct"),r.get("defense_pct"),r.get("st_pct"),r.get("snapShare")]
 nums=[x for x in pcts if isinstance(x,(int,float))]
 return (off or 0),(deff or 0),(st or 0),(max(nums) if nums else 0)
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--targets",required=True);ap.add_argument("--career-baselines",required=True)
 ap.add_argument("--evidence-bundles",required=True);ap.add_argument("--residuals",required=True)
 ap.add_argument("--resolved-snaps",required=True);ap.add_argument("--observations",required=True)
 ap.add_argument("--depth-charts",required=True);ap.add_argument("--output",required=True);ap.add_argument("--report",required=True)
 a=ap.parse_args()

 targets=load(a.targets);bases={key(r):r for r in load(a.career_baselines) if key(r)}
 bundles={key(r):r for r in load(a.evidence_bundles) if key(r)}
 residuals={key(r):r for r in load(a.residuals) if key(r)}
 snaps=load(a.resolved_snaps);observations=load(a.observations);depth=load(a.depth_charts)

 snap_by_player=defaultdict(list)
 for r in snaps:
  pid=r.get("gsis_id") or r.get("playerId")
  if not pid:continue
  try:season=int(r["season"]);week=int(r["week"])
  except:continue
  snap_by_player[pid].append({**r,"season":season,"week":week})
 for rows in snap_by_player.values():rows.sort(key=lambda x:(x["season"],x["week"]))

 roster_status={}
 for obs in observations:
  try:season=int(obs["season"]);week=int(obs["week"]);team=obs["team"]
  except:continue
  players=((obs.get("evidence") or {}).get("rosterDepth") or {}).get("players") or []
  for p in players:
   pid=p.get("playerId")
   status=p.get("status")
   if pid and status:
    roster_status[(season,week,team,pid)]=status

 depth_pos=defaultdict(set)
 for r in depth:
  pid=r.get("gsis_id") or r.get("playerId")
  if not pid:continue
  try:k=(int(r["season"]),int(r["week"]),r["team"],pid)
  except:continue
  for field in ("position","depth_position"):
   val=normalize(r.get(field))
   if val:depth_pos[k].add(val)

 out=[];c=Counter();field=defaultdict(Counter);positions=Counter()
 for t in targets:
  k=key(t);season,week,team,pid=k;b=bases.get(k,{});e=bundles.get(k,{});res=residuals.get(k,{})
  candidates=[]
  for raw in (t.get("position"),b.get("normalizedPosition"),res.get("resolvedPosition")):
   n=normalize(raw)
   if n:candidates.append(n)
  dvals=depth_pos.get(k,set())
  if len(dvals)==1:candidates.append(next(iter(dvals)))
  uniq=[]
  for x in candidates:
   if x not in uniq:uniq.append(x)
  # Prefer the first canonical specific position; DB/UNKNOWN normalize to None and therefore cannot win.
  position=uniq[0] if uniq else None

  earliest=b.get("earliestEvidenceSeason")
  hist_exp=(season-int(earliest)) if isinstance(earliest,int) and earliest<=season else None

  prior=[r for r in snap_by_player.get(pid,[]) if r["season"]<season or (r["season"]==season and r["week"]<week)]
  # If a team field is present, require historical rows for the target team only for same-season evidence.
  safe=[]
  for r in prior:
   rteam=r.get("team")
   if r["season"]==season and rteam and rteam!=team:continue
   safe.append(r)
  if safe:
   games={(r["season"],r["week"],r.get("game_id") or r.get("gameId")) for r in safe}
   off=deff=st=0;shares=[]
   for r in safe:
    a1,a2,a3,pct=snap_values(r);off+=a1;deff+=a2;st+=a3;shares.append(pct)
   usage={"available":True,"gamesTracked":len(games),"offenseSnaps":off,"defenseSnaps":deff,
          "specialTeamsSnaps":st,"totalSnaps":off+deff+st,"maxWeeklySnapShare":max(shares) if shares else 0,
          "matchedBy":"RESOLVED_PRIOR_HISTORICAL_SNAP_EVIDENCE"}
  else:usage=None

  status=roster_status.get(k)

  perf_rows=e.get("priorCurrentSeasonWeeklyStats") or []
  if perf_rows:
   totals={}
   names=["passingYards","passingTDs","interceptions","rushingYards","rushingTDs","receptions",
          "receivingYards","receivingTDs","sacks","tackles","interceptionsDef"]
   for name in names:
    vals=[r.get(name) for r in perf_rows if isinstance(r.get(name),(int,float))]
    totals[name]=sum(vals) if vals else 0
   performance={"available":True,"gamesTracked":len(perf_rows),"totals":totals,
                "matchedBy":"PRIOR_CURRENT_SEASON_WEEKLY_STATS"}
  else:performance=None

  recognition=e.get("historicalRecognitionSummary") if isinstance(e.get("historicalRecognitionSummary"),dict) else None

  statuses={
   "position":"READY" if position else "UNRESOLVED",
   "statusScore":"READY" if status else "MISSING_HISTORICAL_STATUS",
   "experienceScore":"READY" if isinstance(hist_exp,(int,float)) else "MISSING_HISTORICAL_EXPERIENCE",
   "usageScore":"READY" if usage else "MISSING_HISTORICAL_USAGE_PROFILE",
   "productionScore":"READY" if performance and position in {"QB","RB","FB","WR","TE","EDGE","DL","LB","CB","S"} else ("UNSUPPORTED_POSITION" if position in {"OT","IOL","K","P","LS"} else "MISSING_HISTORICAL_PERFORMANCE"),
   "recognitionScore":"READY" if recognition and recognition.get("available") else "OPTIONAL_RECOGNITION_UNAVAILABLE",
  }
  ready=sum(1 for k2,v in statuses.items() if k2!="position" and v=="READY")
  for n,v in statuses.items():field[n][v]+=1
  positions[position or "UNRESOLVED"]+=1;c["targets"]+=1;c["threePlus"]+=ready>=3;c["fourPlus"]+=ready>=4;c["five"]+=ready==5
  out.append({
   **t,"normalizedPosition":position,"historicalRosterStatus":status,"historicalExperience":hist_exp,
   "usageProfile":usage,"performanceProfile":performance,"recognitionSummary":recognition,
   "inputCompletionStatus":statuses,"readyScoreFieldCount":ready,
   "positionModelExecutionAuthorized":False,
   "provenance":{
    "statusSource":"NFLVERSE_WEEKLY_ROSTER_OBSERVATION" if status else None,
    "experienceSource":"EARLIEST_PRIOR_NFL_EVIDENCE_SEASON" if hist_exp is not None else None,
    "usageSource":"RESOLVED_PRIOR_HISTORICAL_SNAP_EVIDENCE" if usage else None,
    "performanceSource":"PRIOR_CURRENT_SEASON_WEEKLY_STATS" if performance else None,
    "positionSource":"CANONICAL_NORMALIZATION_PLUS_EXACT_HISTORICAL_ROLE_EVIDENCE" if position else None,
   }
  })

 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={
  "contractVersion":"FIE-NFL-HISTORICAL-CANONICAL-INPUT-COMPLETION-REPORT-1.0.0","sprint":"9D.1C2B2C9A",
  "targetCount":c["targets"],"targetsWithAllFiveScoreInputsReady":c["five"],
  "targetsWithAtLeastFourReady":c["fourPlus"],"targetsWithAtLeastThreeReady":c["threePlus"],
  "fieldStatuses":{k:dict(v) for k,v in field.items()},"positions":dict(sorted(positions.items())),
  "injuryDesignationUsedAsRosterStatus":False,"targetWeekSnapEvidenceUsed":False,"futureSnapEvidenceUsed":False,
  "currentYearsExpUsed":False,"currentRosterStatusUsed":False,"positionModelExecutionAuthorized":False,
  "full606ScoringAuthorized":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
