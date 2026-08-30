#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,urllib.request,hashlib
from pathlib import Path
from collections import defaultdict,Counter

PLAYERS_URL="https://github.com/nflverse/nflverse-data/releases/download/players/players.csv"

def clean(v):
    if v is None:return None
    s=str(v).strip()
    return s or None

def download(url,path,force=False):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and not force:return path
    req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-HistoricalIdentityResolution/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r,path.open("wb") as f:
        while True:
            c=r.read(1024*1024)
            if not c:break
            f.write(c)
    return path

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for c in iter(lambda:f.read(1024*1024),b""):h.update(c)
    return h.hexdigest()

def load_players(path):
    by_pfr=defaultdict(list)
    total=0
    with path.open("r",encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            total+=1
            pfr=clean(r.get("pfr_id")); gsis=clean(r.get("gsis_id"))
            if pfr:
                by_pfr[pfr].append({
                  "gsis_id":gsis,
                  "display_name":clean(r.get("display_name")),
                  "position":clean(r.get("position")),
                  "last_season":clean(r.get("last_season")),
                })
    return by_pfr,total

def classify_mapping(rows):
    if not rows:return ("UNRESOLVED_MISSING",None)
    gsis=sorted({r["gsis_id"] for r in rows if r.get("gsis_id")})
    if len(gsis)==1:return ("RESOLVED",gsis[0])
    if len(gsis)==0:return ("UNRESOLVED_NO_GSIS",None)
    return ("UNRESOLVED_AMBIGUOUS",None)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--snap-source",required=True)
    ap.add_argument("--players-cache",default="data/calibration/historical/v1/raw/players/players.csv")
    ap.add_argument("--output",required=True)
    ap.add_argument("--report",required=True)
    ap.add_argument("--force-refresh",action="store_true")
    a=ap.parse_args()

    players_path=download(PLAYERS_URL,Path(a.players_cache),a.force_refresh)
    by_pfr,players_rows=load_players(players_path)

    source=Path(a.snap_source);out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    counts=Counter();seasons=defaultdict(Counter);unique_source=set();unique_resolved=set()
    with source.open("r",encoding="utf-8") as inp,out.open("w",encoding="utf-8") as dst:
        for line in inp:
            if not line.strip():continue
            r=json.loads(line);counts["rows"]+=1
            pfr=clean(r.get("pfr_player_id"));unique_source.add(pfr)
            status,gsis=classify_mapping(by_pfr.get(pfr,[]))
            counts[status]+=1
            season=str(r.get("season"));seasons[season]["rows"]+=1;seasons[season][status]+=1
            r["gsis_id"]=gsis
            r["canonical_identity_resolved"]=status=="RESOLVED"
            r["identity_resolution_status"]=status
            r["identity_resolution_provider"]="nflverse/players"
            r["identity_resolution_method"]="EXACT_PFR_ID"
            if gsis:unique_resolved.add(gsis)
            dst.write(json.dumps(r,separators=(",",":"))+"\n")

    n=counts["rows"]
    resolved=counts["RESOLVED"]
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-PLAYER-IDENTITY-RESOLUTION-REPORT-1.0.0",
      "sourceRowCount":n,"outputRowCount":n,
      "resolvedRowCount":resolved,
      "missingMappingRowCount":counts["UNRESOLVED_MISSING"],
      "noGsisRowCount":counts["UNRESOLVED_NO_GSIS"],
      "ambiguousMappingRowCount":counts["UNRESOLVED_AMBIGUOUS"],
      "canonicalIdentityCoverageRate":resolved/n if n else 0,
      "uniquePfrIds":len([x for x in unique_source if x]),
      "uniqueResolvedGsisIds":len(unique_resolved),
      "rowsBySeason":{k:dict(v) for k,v in sorted(seasons.items())},
      "mappingSource":{"url":PLAYERS_URL,"path":str(players_path),"sha256":sha(players_path),"playerRows":players_rows},
      "exactPfrOnly":True,
      "nameFallbackUsed":False,
      "fuzzyMatchingUsed":False,
      "canonicalPlayerJoinQualified":bool(n and resolved/n>=.95 and counts["UNRESOLVED_AMBIGUOUS"]==0),
      "pregameReplacementDeterminationQualified":False,
      "replacementMappingsGenerated":False,
      "caliberGenerated":False,
      "sourceDatasetMutated":False,
      "calibrationExecuted":False,
      "learnedWeights":None
    }
    Path(a.report).parent.mkdir(parents=True,exist_ok=True)
    Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
