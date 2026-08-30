#!/usr/bin/env python3
import argparse,json
from pathlib import Path
from collections import Counter
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--source",required=True);ap.add_argument("--output",required=True);a=ap.parse_args()
    c=Counter()
    with Path(a.source).open("r",encoding="utf-8") as f:
        for line in f:
            if not line.strip():continue
            r=json.loads(line);c["rows"]+=1;c["official"]+=r.get("officialTeamDomain") is True
            c["timestamp"]+=bool(r.get("publishedAt"));c["week"]+=isinstance(r.get("week"),int)
            c["safe"]+=r.get("pregameSafe") is True
            c["depth"]+=r.get("publicationType")=="DEPTH_CHART_RELEASE"
            c["starter"]+=r.get("publicationType")=="EXPLICIT_STARTER_ANNOUNCEMENT"
    n=c["rows"];rate=lambda x:x/n if n else 0
    result={"contractVersion":"FIE-NFL-HISTORICAL-OFFICIAL-TEAM-PUBLICATION-QUALIFICATION-1.0.0",
      "rowCount":n,"officialDomainRate":rate(c["official"]),"timestampCoverageRate":rate(c["timestamp"]),
      "weekMappingRate":rate(c["week"]),"pregameSafeRate":rate(c["safe"]),
      "depthChartReleaseCount":c["depth"],"starterAnnouncementCount":c["starter"],
      "qualifiedForPublicationTemporalAnchoring":bool(n and rate(c["official"])==1 and rate(c["timestamp"])>=.90 and c["safe"]>0),
      "qualifiedForReplacementMapping":False,"replacementMappingsGenerated":False,"calibrationExecuted":False}
    Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
if __name__=="__main__":main()
