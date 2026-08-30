#!/usr/bin/env python3
import argparse,json
from pathlib import Path
from collections import Counter

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True)
    ap.add_argument("--output",required=True)
    a=ap.parse_args()
    c=Counter()
    with Path(a.source).open("r",encoding="utf-8") as f:
        for line in f:
            if not line.strip():continue
            r=json.loads(line);c["rows"]+=1
            c["source_id"]+=bool(r.get("pfr_player_id"))
            c["canonical_id"]+=bool(r.get("gsis_id"))
            c["exact"]+=r.get("identity_resolution_method")=="EXACT_PFR_ID"
            c["resolved"]+=r.get("canonical_identity_resolved") is True
            c["ambiguous"]+=r.get("identity_resolution_status")=="UNRESOLVED_AMBIGUOUS"
    n=c["rows"]; rate=lambda x:x/n if n else 0
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-RESOLVED-SNAP-IDENTITY-QUALIFICATION-1.0.0",
      "rowCount":n,"sourceIdentityCoverageRate":rate(c["source_id"]),
      "canonicalIdentityCoverageRate":rate(c["canonical_id"]),
      "exactMappingMethodRate":rate(c["exact"]),
      "resolvedRate":rate(c["resolved"]),
      "ambiguousRowCount":c["ambiguous"],
      "qualifiedForCanonicalPlayerJoin":bool(n and rate(c["canonical_id"])>=.95 and c["ambiguous"]==0),
      "qualifiedForPregameReplacementDetermination":False,
      "calibrationExecuted":False
    }
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
