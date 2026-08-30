#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import Counter
from pathlib import Path

def load_jsonl(path):
 p=Path(path)
 if not p.exists():return []
 return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]

def anchor_index(rows):
 out={}
 for r in rows:
  week=r.get("resolvedWeek") if r.get("resolvedWeek") is not None else r.get("week")
  safe=r.get("resolvedPregameSafe") if "resolvedPregameSafe" in r else r.get("pregameSafe")
  kickoff=r.get("resolvedKickoffAt") or r.get("kickoffAt")
  published=r.get("publishedAt")
  if safe is True and isinstance(week,int) and r.get("team") and kickoff:
   key=(int(r["season"]),week,r["team"])
   # preserve earliest safe publication as the conservative as-of anchor
   old=out.get(key)
   if old is None or (published and (not old.get("publishedAt") or published < old["publishedAt"])):
    out[key]={"publishedAt":published,"kickoffAt":kickoff,"sourceUrl":r.get("url")}
 return out

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--replacement-identities",required=True)
 ap.add_argument("--anchors",required=True)
 ap.add_argument("--output",required=True)
 ap.add_argument("--report",required=True)
 a=ap.parse_args()

 mappings=load_jsonl(a.replacement_identities)
 anchors=anchor_index(load_jsonl(a.anchors))
 targets={}
 counts=Counter()

 for m in mappings:
  if not m.get("replacementPlayerId"):continue
  key=(int(m["season"]),int(m["week"]),m["team"])
  anchor=anchors.get(key)
  if not anchor:
   counts["missingAnchor"]+=1;continue
  for role,pid in (("UNAVAILABLE_PLAYER",m.get("unavailablePlayerId")),("EXPECTED_REPLACEMENT",m.get("replacementPlayerId"))):
   if not pid:continue
   tkey=(key[0],key[1],key[2],pid)
   if tkey not in targets:
    targets[tkey]={
      "contractVersion":"FIE-NFL-HISTORICAL-PLAYER-CALIBER-TARGET-1.0.0",
      "season":key[0],"week":key[1],"team":key[2],"playerId":pid,
      "roles":[role],
      "asOf":anchor.get("publishedAt"),
      "kickoffAt":anchor.get("kickoffAt"),
      "anchorSourceUrl":anchor.get("sourceUrl"),
      "historicalCaliberStatus":"PENDING_CANONICAL_HISTORICAL_EVALUATION",
      "caliber":None,"confidence":None,"modelVersion":None,"provenance":None
    }
   elif role not in targets[tkey]["roles"]:
    targets[tkey]["roles"].append(role)

 out=list(targets.values())
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")

 report={
  "contractVersion":"FIE-NFL-HISTORICAL-STARTER-REPLACEMENT-CALIBER-TARGET-REPORT-1.0.0",
  "sprint":"9D.1C2B2C2",
  "resolvedReplacementMappingsInput":sum(1 for m in mappings if m.get("replacementPlayerId")),
  "uniquePlayerGameCaliberTargets":len(out),
  "targetsWithAsOf":sum(1 for r in out if r.get("asOf")),
  "targetsWithKickoff":sum(1 for r in out if r.get("kickoffAt")),
  "canonicalHistoricalCaliberSnapshotsAvailable":0,
  "enrichedTargetCount":0,
  "caliberDeltaReadyPairs":0,
  "missingAnchorCount":counts["missingAnchor"],
  "currentRatingBackfillUsed":False,
  "syntheticCaliberUsed":False,
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))

if __name__=="__main__":main()
