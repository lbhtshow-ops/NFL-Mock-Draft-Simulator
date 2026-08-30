#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,urllib.request,hashlib
from pathlib import Path
from collections import Counter

URL="https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_{season}.csv"

def clean(v):
    if v is None:return None
    s=str(v).strip()
    return s or None

def integer(v):
    try:return int(float(v))
    except:return None

def download(url,path,force=False):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and not force:return path
    req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-HistoricalDepthChartAcquisition/1.0"})
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

def pick(r,*keys):
    for k in keys:
        if clean(r.get(k)) is not None:return clean(r.get(k))
    return None

def normalize(r,season):
    return {
      "season":integer(r.get("season")) or season,
      "week":integer(r.get("week")),
      "team":pick(r,"team","club_code","team_abbr"),
      "gsis_id":pick(r,"gsis_id","player_id"),
      "player_name":pick(r,"player_name","full_name","football_name"),
      "position":pick(r,"position","position_name","pos_abb"),
      "formation":pick(r,"formation","pos_grp"),
      "depth_position":pick(r,"depth_position","position_group","pos_name","pos_slot"),
      "depth_rank":integer(pick(r,"depth_team","depth_rank","pos_rank")),
      "source_timestamp":pick(r,"dt","date_modified","timestamp","updated_at"),
      "source_provider":"nflverse/nflverse-data",
      "source_release":"depth_charts",
      "evidence_scope":"WEEK_SCOPED_DEPTH_CHART",
      "pregame_temporal_safety_verified":False
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--raw-dir",default="data/calibration/historical/v1/raw/depth-charts")
    ap.add_argument("--output",default="data/calibration/historical/v1/historical-depth-charts.jsonl")
    ap.add_argument("--manifest",default="data/calibration/historical/v1/historical-depth-charts-manifest.json")
    ap.add_argument("--force-refresh",action="store_true")
    a=ap.parse_args()
    seasons=sorted({int(x.strip()) for x in a.seasons.split(",") if x.strip()})
    raw=Path(a.raw_dir);out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    counts=Counter();columns={};files={};gsis=week=team=rank=timestamp=0
    with out.open("w",encoding="utf-8") as dst:
        for season in seasons:
            path=download(URL.format(season=season),raw/f"depth_charts_{season}.csv",a.force_refresh)
            files[str(season)]={"url":URL.format(season=season),"path":str(path),"sha256":sha(path)}
            with path.open("r",encoding="utf-8-sig",newline="") as f:
                reader=csv.DictReader(f); columns[str(season)]=reader.fieldnames or []
                for r in reader:
                    nr=normalize(r,season)
                    if nr["season"]!=season:continue
                    counts[season]+=1
                    gsis+=bool(nr["gsis_id"]);week+=isinstance(nr["week"],int);team+=bool(nr["team"])
                    rank+=isinstance(nr["depth_rank"],int);timestamp+=bool(nr["source_timestamp"])
                    dst.write(json.dumps(nr,separators=(",",":"))+"\n")
    total=sum(counts.values());rate=lambda x:x/total if total else 0
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-DEPTH-CHART-ACQUISITION-MANIFEST-1.0.0",
      "rowCount":total,"rowsBySeason":dict(counts),"columnsBySeason":columns,
      "canonicalIdentityCoverageRate":rate(gsis),"weekCoverageRate":rate(week),"teamCoverageRate":rate(team),
      "depthRankCoverageRate":rate(rank),"timestampCoverageRate":rate(timestamp),
      "sourceFiles":files,
      "candidateForDepthRoleEvidence":bool(total and rate(gsis)>=.95 and rate(week)>=.95 and rate(team)>=.95 and rate(rank)>=.90),
      "pregameTemporalSafetyVerified":False,
      "replacementMappingsGenerated":False,
      "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
    }
    Path(a.manifest).parent.mkdir(parents=True,exist_ok=True)
    Path(a.manifest).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
