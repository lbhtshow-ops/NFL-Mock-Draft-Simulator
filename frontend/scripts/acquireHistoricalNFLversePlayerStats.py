#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,urllib.request,hashlib
from pathlib import Path
from collections import Counter

URL="https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{season}.csv"

def download(url,path,force=False):
 path.parent.mkdir(parents=True,exist_ok=True)
 if path.exists() and not force:return path
 req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-HistoricalPlayerStats/1.0"})
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

def clean(v):
 if v is None:return None
 s=str(v).strip()
 return s or None

def integer(v):
 try:return int(float(v))
 except:return None

def number(v):
 try:
  if v in (None,"","NA","NaN","nan"):return None
  return float(v)
 except:return None

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--seasons",default="2022,2023,2024")
 ap.add_argument("--raw-dir",default="data/calibration/historical/v1/raw/player-stats")
 ap.add_argument("--output",default="data/calibration/historical/v1/historical-player-stats.jsonl")
 ap.add_argument("--manifest",default="data/calibration/historical/v1/historical-player-stats-manifest.json")
 ap.add_argument("--force-refresh",action="store_true")
 a=ap.parse_args()
 seasons=sorted({int(x) for x in a.seasons.split(",") if x.strip()})
 raw=Path(a.raw_dir);out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
 counts=Counter();files={};idc=weekc=teamc=gamec=0;columns={}
 with out.open("w",encoding="utf-8") as dst:
  for season in seasons:
   url=URL.format(season=season);path=download(url,raw/f"stats_player_week_{season}.csv",a.force_refresh)
   files[str(season)]={"url":url,"path":str(path),"sha256":sha(path)}
   with path.open("r",encoding="utf-8-sig",newline="") as f:
    reader=csv.DictReader(f);columns[str(season)]=reader.fieldnames or []
    for r in reader:
     if integer(r.get("season"))!=season:continue
     row={
      "playerId":clean(r.get("player_id")),"playerName":clean(r.get("player_display_name") or r.get("player_name")),
      "position":clean(r.get("position")),"positionGroup":clean(r.get("position_group")),
      "season":season,"week":integer(r.get("week")),"seasonType":clean(r.get("season_type")),
      "gameId":clean(r.get("game_id")),"team":clean(r.get("team")),"opponent":clean(r.get("opponent_team")),
      "passingAttempts":number(r.get("attempts")),"passingYards":number(r.get("passing_yards")),
      "passingTDs":number(r.get("passing_tds")),"interceptions":number(r.get("passing_interceptions")),
      "carries":number(r.get("carries")),"rushingYards":number(r.get("rushing_yards")),
      "rushingTDs":number(r.get("rushing_tds")),"targets":number(r.get("targets")),
      "receptions":number(r.get("receptions")),"receivingYards":number(r.get("receiving_yards")),
      "receivingTDs":number(r.get("receiving_tds")),"defensiveSnaps":number(r.get("def_snp") or r.get("defense_snaps")),
      "tackles":number(r.get("tackles")),"sacks":number(r.get("sacks")),"interceptionsDef":number(r.get("def_interceptions") or r.get("interceptions_defense")),
      "sourceProvider":"nflverse/nflverse-data","sourceRelease":"stats_player","sourceSummaryLevel":"week"
     }
     counts[season]+=1;idc+=bool(row["playerId"]);weekc+=isinstance(row["week"],int);teamc+=bool(row["team"]);gamec+=bool(row["gameId"])
     dst.write(json.dumps(row,separators=(",",":"))+"\n")
 n=sum(counts.values());rate=lambda x:x/n if n else 0
 report={"contractVersion":"FIE-NFL-HISTORICAL-PLAYER-STATS-ACQUISITION-MANIFEST-1.0.0",
  "seasons":seasons,"rowCount":n,"rowsBySeason":dict(counts),"columnsBySeason":columns,
  "canonicalIdentityCoverageRate":rate(idc),"weekCoverageRate":rate(weekc),"teamCoverageRate":rate(teamc),"gameIdCoverageRate":rate(gamec),
  "sourceFiles":files,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.manifest).parent.mkdir(parents=True,exist_ok=True);Path(a.manifest).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))
if __name__=="__main__":main()
