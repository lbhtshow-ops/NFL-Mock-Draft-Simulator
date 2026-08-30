#!/usr/bin/env python3
import argparse,json
from pathlib import Path
from collections import Counter

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True)
    ap.add_argument("--output",required=True)
    a=ap.parse_args()
    c=Counter();by=Counter()
    with Path(a.source).open("r",encoding="utf-8") as f:
        for line in f:
            if not line.strip():continue
            r=json.loads(line);c["rows"]+=1;by[r.get("season")]+=1
            c["gsis"]+=bool(r.get("gsis_id"));c["week"]+=isinstance(r.get("week"),int);c["team"]+=bool(r.get("team"))
            c["rank"]+=isinstance(r.get("depth_rank"),int);c["timestamp"]+=bool(r.get("source_timestamp"))
    n=c["rows"];rate=lambda x:x/n if n else 0
    candidate=bool(n and rate(c["gsis"])>=.95 and rate(c["week"])>=.95 and rate(c["team"])>=.95 and rate(c["rank"])>=.90)
    temporal=bool(n and rate(c["timestamp"])>=.95)
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-DEPTH-CHART-EVIDENCE-QUALIFICATION-1.0.0",
      "rowCount":n,"rowsBySeason":dict(by),
      "canonicalIdentityCoverageRate":rate(c["gsis"]),"weekCoverageRate":rate(c["week"]),
      "teamCoverageRate":rate(c["team"]),"depthRankCoverageRate":rate(c["rank"]),
      "timestampCoverageRate":rate(c["timestamp"]),
      "qualifiedForDepthRoleEvidence":candidate,
      "qualifiedForPregameTemporalEvidence":temporal,
      "qualifiedForPregameReplacementMapping":candidate and temporal,
      "weekScopeWithoutTimestampAcceptedAsPregameProof":False,
      "replacementMappingsGenerated":False,
      "calibrationExecuted":False
    }
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
