#!/usr/bin/env python3
import argparse,json
from pathlib import Path

def load_jsonl(p):
 return [json.loads(x) for x in Path(p).read_text(encoding="utf-8").splitlines() if x.strip()]

def safe(r):
 return r.get("resolvedPregameSafe") is True or r.get("pregameSafe") is True

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--evidence",required=True);ap.add_argument("--output",required=True);ap.add_argument("--report",required=True)
 a=ap.parse_args(); rows=load_jsonl(a.evidence)
 mappings=[]; unsupported=0
 for r in rows:
  if not safe(r): continue
  week=r.get("resolvedWeek",r.get("week"))
  # Foundation only: preserve qualified evidence anchors. No roster-order inference.
  m={"season":r.get("season"),"week":week,"team":r.get("team"),"sourceUrl":r.get("url"),
     "pregameSafe":True,"playerCaliber":None,"expectedReplacementPlayerId":None,
     "expectedReplacementCaliber":None,"expectedReplacementDelta":None,
     "mappingStatus":"EVIDENCE_ANCHORED_MAPPING_PENDING_PLAYER_IDENTITY_AND_CALIBER"}
  mappings.append(m);unsupported+=1
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 with open(a.output,"w",encoding="utf-8") as f:
  for m in mappings:f.write(json.dumps(m,separators=(",",":"))+"\n")
 report={"contractVersion":"FIE-NFL-HISTORICAL-EXPECTED-REPLACEMENT-MAPPING-REPORT-1.0.0","sprint":"9D.1C2B2C",
 "inputEvidenceCount":len(rows),"pregameSafeAnchors":len(mappings),"fullyMappedCount":0,"pendingEvidenceBackedMappingCount":unsupported,
 "rosterOrderHeuristicUsed":False,"futureLeakageDetected":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
