#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from collections import Counter
from pathlib import Path

def load_jsonl(path):
 p=Path(path)
 if not p.exists():return []
 return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]

def snapshot_key(r):
 try:return (int(r["season"]),int(r["week"]),r["team"],r["playerId"])
 except:return None

def valid_snapshot(r):
 return r.get("status")=="AVAILABLE" and r.get("temporallySafe") is True and isinstance(r.get("caliber"),(int,float))

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--replacement-identities",required=True)
 ap.add_argument("--caliber-snapshots",required=True)
 ap.add_argument("--output",required=True)
 ap.add_argument("--report",required=True)
 a=ap.parse_args()

 mappings=load_jsonl(a.replacement_identities)
 snaps=[r for r in load_jsonl(a.caliber_snapshots) if valid_snapshot(r)]
 idx={snapshot_key(r):r for r in snaps if snapshot_key(r)}
 out=[];c=Counter()

 for m in mappings:
  rep=m.get("replacementPlayerId")
  if not rep:continue
  key=(int(m["season"]),int(m["week"]),m["team"])
  ps=idx.get((*key,m.get("unavailablePlayerId")))
  rs=idx.get((*key,rep))
  pc=ps.get("caliber") if ps else None
  rc=rs.get("caliber") if rs else None
  delta=(pc-rc) if isinstance(pc,(int,float)) and isinstance(rc,(int,float)) else None
  c["pairs"]+=1;c["playerCaliber"]+=pc is not None;c["replacementCaliber"]+=rc is not None;c["delta"]+=delta is not None
  out.append({**m,
   "playerCaliber":pc,"playerCaliberConfidence":ps.get("confidence") if ps else None,
   "playerCaliberModelVersion":ps.get("modelVersion") if ps else None,
   "replacementCaliber":rc,"replacementCaliberConfidence":rs.get("confidence") if rs else None,
   "replacementCaliberModelVersion":rs.get("modelVersion") if rs else None,
   "expectedReplacementDelta":delta,
   "caliberEnrichmentStatus":"COMPLETE" if delta is not None else ("PARTIAL" if pc is not None or rc is not None else "UNAVAILABLE")
  })

 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
 report={
  "contractVersion":"FIE-NFL-HISTORICAL-STARTER-REPLACEMENT-CALIBER-ENRICHMENT-REPORT-1.0.0",
  "sprint":"9D.1C2B2C2","replacementPairs":c["pairs"],
  "playerCaliberAvailable":c["playerCaliber"],"replacementCaliberAvailable":c["replacementCaliber"],
  "caliberDeltaReadyPairs":c["delta"],
  "completeRate":c["delta"]/c["pairs"] if c["pairs"] else 0,
  "currentRatingBackfillUsed":False,"syntheticCaliberUsed":False,
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))

if __name__=="__main__":main()
