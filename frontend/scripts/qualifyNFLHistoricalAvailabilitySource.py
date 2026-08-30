#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, gzip, io, json, urllib.request, urllib.error
from collections import defaultdict
from datetime import datetime
from pathlib import Path

CSV_URL="https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.csv"
CSV_GZ_URL="https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.csv.gz"
PARQUET_URL="https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.parquet"
REQUIRED=["season","team","week","gsis_id","position","full_name","report_primary_injury","report_status","practice_primary_injury","practice_status","date_modified"]

def clean(v):
    if v is None: return None
    s=str(v).strip()
    return s or None

def request_bytes(url):
    req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-AvailabilityQualification/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r:
        return r.read()

def try_source(season):
    attempts=[]
    for fmt,url in [("CSV",CSV_URL.format(season=season)),("CSV_GZIP",CSV_GZ_URL.format(season=season)),("PARQUET",PARQUET_URL.format(season=season))]:
        try:
            data=request_bytes(url)
            return {"available":True,"format":fmt,"url":url,"data":data,"attempts":attempts}
        except Exception as e:
            attempts.append({"format":fmt,"url":url,"error":str(e)})
    return {"available":False,"format":None,"url":None,"data":None,"attempts":attempts}

def parse_csv_bytes(data,gz=False):
    if gz: data=gzip.decompress(data)
    text=data.decode("utf-8-sig",errors="replace")
    reader=csv.DictReader(io.StringIO(text))
    rows=list(reader)
    return reader.fieldnames or [],rows

def parse_dt(value):
    v=clean(value)
    if not v:return None
    v=v.replace("Z","+00:00")
    for candidate in (v,v.replace(" ","T")):
        try:return datetime.fromisoformat(candidate)
        except:pass
    return None

def load_kickoffs(path):
    if not path or not Path(path).exists(): return {}
    idx={}
    with open(path,"r",encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            try:season=int(float(r.get("season","")))
            except:continue
            team_home=clean(r.get("home_team"));team_away=clean(r.get("away_team"))
            try:week=int(float(r.get("week","")))
            except:continue
            gameday=clean(r.get("gameday"));gametime=clean(r.get("gametime")) or "12:00"
            if not gameday:continue
            try:k=datetime.fromisoformat(f"{gameday}T{gametime}:00" if len(gametime)==5 else f"{gameday}T{gametime}")
            except:continue
            if team_home:idx[(season,week,team_home)]=k
            if team_away:idx[(season,week,team_away)]=k
    return idx

def qualify(season,source,kickoffs):
    base={"season":season,"sourceAvailable":source["available"],"sourceFormat":source["format"],"sourceUrl":source["url"],"attempts":source["attempts"]}
    if not source["available"]:
        return {**base,"rowCount":0,"columns":[],"missingColumns":REQUIRED,"gsisCoverageRate":None,"dateModifiedCoverageRate":None,"pregameSafeRate":None,"duplicateRate":None,"schemaQualified":False,"identityQualified":False,"temporalQualified":False,"qualifiedForJoin":False}
    if source["format"]=="PARQUET":
        return {**base,"rowCount":None,"columns":[],"missingColumns":REQUIRED,"gsisCoverageRate":None,"dateModifiedCoverageRate":None,"pregameSafeRate":None,"duplicateRate":None,"schemaQualified":False,"identityQualified":False,"temporalQualified":False,"qualifiedForJoin":False,"note":"PARQUET_EXISTS_BUT_STANDARD_LIBRARY_RUNNER_DOES_NOT_PARSE_PARQUET"}
    columns,rows=parse_csv_bytes(source["data"],source["format"]=="CSV_GZIP")
    n=len(rows); missing=[c for c in REQUIRED if c not in columns]
    gsis=sum(bool(clean(r.get("gsis_id"))) for r in rows)
    modified=sum(parse_dt(r.get("date_modified")) is not None for r in rows)
    temporal_candidates=0;safe=0
    seen=set();dupes=0
    for r in rows:
        try:week=int(float(r.get("week","")))
        except:continue
        team=clean(r.get("team"));dt=parse_dt(r.get("date_modified"))
        if team and dt and (season,week,team) in kickoffs:
            k=kickoffs[(season,week,team)]
            if dt.tzinfo is not None:k=k.replace(tzinfo=dt.tzinfo)
            temporal_candidates+=1
            if dt<k:safe+=1
        key=(clean(r.get("gsis_id")),week,team,clean(r.get("report_status")),clean(r.get("practice_status")),clean(r.get("date_modified")))
        if key in seen:dupes+=1
        else:seen.add(key)
    gsis_rate=gsis/n if n else None
    date_rate=modified/n if n else None
    pregame_rate=safe/temporal_candidates if temporal_candidates else None
    dup_rate=dupes/n if n else None
    schema=n>0 and not missing
    identity=schema and gsis_rate is not None and gsis_rate>=.95
    temporal=schema and pregame_rate is not None and pregame_rate>=.95
    return {**base,"rowCount":n,"columns":columns,"missingColumns":missing,"gsisCoverageRate":gsis_rate,"dateModifiedCoverageRate":date_rate,"pregameSafeRate":pregame_rate,"temporalComparableRows":temporal_candidates,"duplicateRate":dup_rate,"schemaQualified":schema,"identityQualified":identity,"temporalQualified":temporal,"qualifiedForJoin":schema and identity and temporal}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024,2025")
    ap.add_argument("--schedules",default="data/calibration/historical/v1/raw/games.csv")
    ap.add_argument("--output",default="data/calibration/historical/v1/availability-qualification.json")
    args=ap.parse_args()
    seasons=sorted(set(int(x) for x in args.seasons.split(",") if x.strip()))
    kickoffs=load_kickoffs(args.schedules)
    results=[]
    for season in seasons:
        print(f"[9D.1B] Qualifying injury/practice-report source for {season}...")
        src=try_source(season)
        result=qualify(season,src,kickoffs)
        results.append(result)
        print(f"[9D.1B] {season}: available={result['sourceAvailable']} rows={result.get('rowCount')} join={result['qualifiedForJoin']}")
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-AVAILABILITY-SOURCE-QUALIFICATION-REPORT-1.0.0",
      "seasons":seasons,"results":results,
      "qualifiedSeasons":[r["season"] for r in results if r["qualifiedForJoin"]],
      "unqualifiedSeasons":[r["season"] for r in results if not r["qualifiedForJoin"]],
      "joinExecuted":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
    }
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":main()
