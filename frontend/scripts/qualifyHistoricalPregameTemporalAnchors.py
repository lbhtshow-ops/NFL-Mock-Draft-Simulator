#!/usr/bin/env python3
import argparse,json
from pathlib import Path

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--audit",required=True)
    ap.add_argument("--output",required=True)
    a=ap.parse_args()
    audit=json.loads(Path(a.audit).read_text(encoding="utf-8"))
    depth=audit.get("depthChart",{})
    candidates=audit.get("candidateAnchorClasses",{})
    direct=bool(depth.get("directTemporalAnchorQualified"))
    publication=bool(candidates.get("SOURCE_PUBLICATION_METADATA",{}).get("qualified"))
    starter=bool(candidates.get("EXPLICIT_STARTER_ANNOUNCEMENT",{}).get("qualified"))
    qualified=direct or publication or starter
    result={
      "contractVersion":"FIE-NFL-HISTORICAL-PREGAME-TEMPORAL-ANCHOR-QUALIFICATION-1.0.0",
      "directDepthTimestampQualified":direct,
      "sourcePublicationMetadataQualified":publication,
      "explicitStarterAnnouncementQualified":starter,
      "injuryTimestampAcceptedAsDepthTimestamp":False,
      "weekScopeAcceptedAsPregameProof":False,
      "qualifiedForPregameDepthChartTemporalEvidence":qualified,
      "qualifiedForPregameReplacementMapping":False,
      "replacementMappingsGenerated":False,
      "calibrationExecuted":False
    }
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
if __name__=="__main__":main()
