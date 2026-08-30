#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,urllib.request,hashlib
from pathlib import Path
from collections import Counter

URL="https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_{season}.csv"

def download(url,path,force=False):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and not force:return path
    req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-HistoricalSnapAcquisition/1.0"})
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

def num(v):
    try:
        if v in (None,"","NA","NaN","nan"):return None
        return float(v)
    except:return None

def integer(v):
    try:return int(float(v))
    except:return None

def normalize_row(r,season):
    return {
      "season":integer(r.get("season")) or season,
      "game_id":clean(r.get("game_id")),
      "pfr_game_id":clean(r.get("pfr_game_id")),
      "game_type":clean(r.get("game_type")),
      "week":integer(r.get("week")),
      "player_name":clean(r.get("player")),
      "pfr_player_id":clean(r.get("pfr_player_id")),
      "gsis_id":None,
      "position":clean(r.get("position")),
      "team":clean(r.get("team")),
      "opponent":clean(r.get("opponent")),
      "offense_snaps":num(r.get("offense_snaps")),
      "offense_pct":num(r.get("offense_pct")),
      "defense_snaps":num(r.get("defense_snaps")),
      "defense_pct":num(r.get("defense_pct")),
      "st_snaps":num(r.get("st_snaps")),
      "st_pct":num(r.get("st_pct")),
      "source_provider":"nflverse/nflverse-data",
      "source_release":"snap_counts",
      "source_identity_type":"PFR_PLAYER_ID",
      "canonical_identity_resolved":False,
      "evidence_timing":"POSTGAME_PARTICIPATION"
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--raw-dir",default="data/calibration/historical/v1/raw/snap-counts")
    ap.add_argument("--output",default="data/calibration/historical/v1/historical-snap-counts.jsonl")
    ap.add_argument("--manifest",default="data/calibration/historical/v1/historical-snap-counts-manifest.json")
    ap.add_argument("--force-refresh",action="store_true")
    a=ap.parse_args()
    seasons=sorted({int(x.strip()) for x in a.seasons.split(",") if x.strip()})
    raw=Path(a.raw_dir);out=Path(a.output);manifest_path=Path(a.manifest)
    out.parent.mkdir(parents=True,exist_ok=True)
    counts=Counter(); source_id=0; canonical_id=0; files={}
    with out.open("w",encoding="utf-8") as dst:
        for season in seasons:
            url=URL.format(season=season)
            path=download(url,raw/f"snap_counts_{season}.csv",a.force_refresh)
            files[str(season)]={"url":url,"path":str(path),"sha256":sha(path)}
            with path.open("r",encoding="utf-8-sig",newline="") as f:
                reader=csv.DictReader(f)
                for r in reader:
                    nr=normalize_row(r,season)
                    if nr["season"]!=season:continue
                    counts[season]+=1
                    source_id+=bool(nr["pfr_player_id"])
                    canonical_id+=bool(nr["gsis_id"])
                    dst.write(json.dumps(nr,separators=(",",":"))+"\n")
    total=sum(counts.values())
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-SNAP-EVIDENCE-ACQUISITION-MANIFEST-1.0.0",
      "seasons":seasons,"rowCount":total,"rowsBySeason":dict(counts),
      "sourceIdentityCoverageRate":source_id/total if total else 0,
      "canonicalIdentityCoverageRate":canonical_id/total if total else 0,
      "sourceIdentityType":"PFR_PLAYER_ID",
      "canonicalIdentityType":"GSIS_ID",
      "canonicalIdentityResolutionRequired":True,
      "qualifiedForPostgameParticipationCandidate":bool(total and source_id/total>=.95),
      "qualifiedForPregameReplacementDetermination":False,
      "replacementMappingsGenerated":False,
      "caliberGenerated":False,
      "sourceFiles":files,
      "datasetMutated":False,
      "calibrationExecuted":False,
      "learnedWeights":None
    }
    manifest_path.parent.mkdir(parents=True,exist_ok=True)
    manifest_path.write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
