#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import Counter,defaultdict
from pathlib import Path

UNAVAILABLE={"OUT","DOUBTFUL"}

def load_jsonl(path):
 p=Path(path)
 if not p.exists():return []
 with p.open("r",encoding="utf-8") as f:
  return [json.loads(x) for x in f if x.strip()]

def anchor_key(r):
 week=r.get("resolvedWeek") if r.get("resolvedWeek") is not None else r.get("week")
 safe=r.get("resolvedPregameSafe") if "resolvedPregameSafe" in r else r.get("pregameSafe")
 if safe is True and isinstance(week,int) and r.get("team") and r.get("season") is not None:
  return (int(r["season"]),week,r["team"])
 return None

def availability_players(obs):
 impact=(obs.get("evidence") or {}).get("availabilityImpact") or {}
 players=impact.get("players") or []
 out=[]
 for p in players:
  status=str(p.get("reportStatus") or p.get("gameStatus") or "").upper()
  pid=p.get("playerId") or p.get("gsis_id") or p.get("gsisId")
  if status in UNAVAILABLE and pid:
   out.append({"playerId":pid,"position":p.get("position"),"status":status,"name":p.get("name") or p.get("fullName")})
 return out

def observation_key(obs):
 try:
  season=int(obs.get("season"))
  week=int(obs.get("week"))
 except:return None
 team=obs.get("team")
 return (season,week,team) if team else None

def depth_index(rows):
 by=defaultdict(list)
 for r in rows:
  try:key=(int(r["season"]),int(r["week"]),r["team"])
  except:continue
  if not r.get("gsis_id"):continue
  by[key].append(r)
 return by

def find_replacement(player_id,depth_rows):
 player_rows=[r for r in depth_rows if r.get("gsis_id")==player_id]
 if len(player_rows)!=1:
  return None,"UNAVAILABLE_DEPTH_SLOT_MISSING_OR_AMBIGUOUS",None
 cur=player_rows[0]
 slot=cur.get("depth_position")
 rank=cur.get("depth_rank")
 if not slot or not isinstance(rank,int):
  return None,"UNAVAILABLE_DEPTH_SLOT_INCOMPLETE",cur
 candidates=[r for r in depth_rows if r.get("depth_position")==slot and isinstance(r.get("depth_rank"),int) and r["depth_rank"]>rank and r.get("gsis_id")!=player_id]
 if not candidates:
  return None,"NO_LOWER_RANKED_SAME_SLOT_PLAYER",cur
 minrank=min(r["depth_rank"] for r in candidates)
 next_rows=[r for r in candidates if r["depth_rank"]==minrank]
 ids=sorted({r.get("gsis_id") for r in next_rows if r.get("gsis_id")})
 if len(ids)!=1:
  return None,"NEXT_DEPTH_RANK_AMBIGUOUS",cur
 return ids[0],"RESOLVED_EXPLICIT_DEPTH_CHART",cur

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--anchors",required=True)
 ap.add_argument("--availability-observations",required=True)
 ap.add_argument("--depth-charts",required=True)
 ap.add_argument("--output",required=True)
 ap.add_argument("--report",required=True)
 a=ap.parse_args()
 anchors=load_jsonl(a.anchors); observations=load_jsonl(a.availability_observations); depth=load_jsonl(a.depth_charts)
 safe_keys={k for r in anchors if (k:=anchor_key(r))}
 dep=depth_index(depth); counts=Counter(); by_team=Counter(); by_pos=Counter(); results=[]
 for obs in observations:
  key=observation_key(obs)
  if key not in safe_keys:continue
  counts["anchoredObservations"]+=1
  for p in availability_players(obs):
   counts["unavailablePlayers"]+=1
   replacement,status,slot=find_replacement(p["playerId"],dep.get(key,[]))
   if replacement: counts["resolved"]+=1;by_team[key[2]]+=1;by_pos[p.get("position") or "UNKNOWN"]+=1
   else: counts[status]+=1
   results.append({
    "contractVersion":"FIE-NFL-HISTORICAL-REPLACEMENT-IDENTITY-MAPPING-1.0.0",
    "season":key[0],"week":key[1],"team":key[2],
    "unavailablePlayerId":p["playerId"],"unavailableStatus":p["status"],"position":p.get("position"),
    "replacementPlayerId":replacement,
    "mappingStatus":status,
    "evidenceType":"EXPLICIT_DEPTH_CHART" if replacement else None,
    "unavailableDepthPosition":slot.get("depth_position") if slot else None,
    "unavailableDepthRank":slot.get("depth_rank") if slot else None,
    "pregameOfficialAnchorQualified":True,
    "inferredFromRosterOrder":False,
    "postgameSnapDefinedReplacement":False
   })
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in results:f.write(json.dumps(r,separators=(",",":"))+"\n")
 total=counts["unavailablePlayers"];resolved=counts["resolved"]
 report={
  "contractVersion":"FIE-NFL-HISTORICAL-REPLACEMENT-IDENTITY-RESOLUTION-REPORT-1.0.0",
  "sprint":"9D.1C2B2C1","qualifiedAnchorTeamWeeks":len(safe_keys),
  "anchoredAvailabilityObservations":counts["anchoredObservations"],
  "unavailablePlayerCandidates":total,"resolvedReplacementIdentities":resolved,
  "resolutionRate":resolved/total if total else 0,
  "unresolvedReplacementIdentities":total-resolved,
  "unresolvedReasons":{k:v for k,v in counts.items() if k not in {"anchoredObservations","unavailablePlayers","resolved"}},
  "resolvedByTeam":dict(sorted(by_team.items())),"resolvedByPosition":dict(sorted(by_pos.items())),
  "rosterOrderHeuristicUsed":False,"nameGuessUsed":False,"positionOnlyFallbackUsed":False,
  "postgameSnapDefinedReplacement":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))

if __name__=="__main__":main()
