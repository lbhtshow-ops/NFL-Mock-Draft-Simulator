#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, json, urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

INJURY_URL = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.csv"

def clean(v):
    if v is None: return None
    s=str(v).strip()
    return s or None

def parse_dt(v):
    v=clean(v)
    if not v: return None
    v=v.replace("Z","+00:00")
    for candidate in (v,v.replace(" ","T")):
        try: return datetime.fromisoformat(candidate)
        except: pass
    return None

def download(url,path,force=False):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and not force:
        return path
    req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-AvailabilityJoin/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r, path.open("wb") as f:
        while True:
            chunk=r.read(1024*1024)
            if not chunk: break
            f.write(chunk)
    return path

def read_csv(path):
    with path.open("r",encoding="utf-8-sig",newline="") as f:
        yield from csv.DictReader(f)

def load_qualification(path):
    report=json.loads(Path(path).read_text(encoding="utf-8"))
    return set(report.get("qualifiedSeasons",[])), set(report.get("unqualifiedSeasons",[])), report

def build_injury_index(csv_paths):
    idx=defaultdict(list)
    for season,path in csv_paths.items():
        for r in read_csv(path):
            try: week=int(float(r.get("week","")))
            except: continue
            team=clean(r.get("team")); pid=clean(r.get("gsis_id"))
            modified=clean(r.get("date_modified"))
            if not team or not pid or not modified: continue
            idx[(season,week,team)].append({
              "playerId":pid,
              "name":clean(r.get("full_name")),
              "position":clean(r.get("position")),
              "reportPrimaryInjury":clean(r.get("report_primary_injury")),
              "reportSecondaryInjury":clean(r.get("report_secondary_injury")),
              "reportStatus":clean(r.get("report_status")),
              "practicePrimaryInjury":clean(r.get("practice_primary_injury")),
              "practiceSecondaryInjury":clean(r.get("practice_secondary_injury")),
              "practiceStatus":clean(r.get("practice_status")),
              "dateModified":modified,
            })
    return idx

def latest_safe(records,kickoff_at):
    kickoff=parse_dt(kickoff_at)
    if kickoff is None:return []
    by_player={}
    for r in records:
        dt=parse_dt(r.get("dateModified"))
        if dt is None: continue
        if dt.tzinfo is not None and kickoff.tzinfo is None:
            kickoff_cmp=kickoff.replace(tzinfo=dt.tzinfo)
        elif dt.tzinfo is None and kickoff.tzinfo is not None:
            dt=dt.replace(tzinfo=kickoff.tzinfo);kickoff_cmp=kickoff
        else:
            kickoff_cmp=kickoff
        if dt>=kickoff_cmp: continue
        current=by_player.get(r["playerId"])
        if current is None:
            by_player[r["playerId"]]=r
        else:
            c=parse_dt(current["dateModified"])
            if c is None or dt>c:
                by_player[r["playerId"]]=r
    return list(by_player.values())

def summarize(players):
    def status(p): return (clean(p.get("reportStatus")) or "").upper()
    enriched=[]
    for p in players:
        st=status(p)
        x=dict(p)
        x["isOut"]=st=="OUT"
        x["isDoubtful"]=st=="DOUBTFUL"
        x["isQuestionable"]=st=="QUESTIONABLE"
        enriched.append(x)
    return {
      "status":"AVAILABLE" if enriched else "NO_REPORT_EVIDENCE",
      "playerCount":len(enriched),
      "outCount":sum(p["isOut"] for p in enriched),
      "doubtfulCount":sum(p["isDoubtful"] for p in enriched),
      "questionableCount":sum(p["isQuestionable"] for p in enriched),
      "players":enriched,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--observations",default="data/calibration/historical/v1/observations.jsonl")
    ap.add_argument("--qualification",default="data/calibration/historical/v1/availability-qualification.json")
    ap.add_argument("--raw-dir",default="data/calibration/historical/v1/raw")
    ap.add_argument("--output",default="data/calibration/historical/v1/observations-availability.jsonl")
    ap.add_argument("--report",default="data/calibration/historical/v1/availability-join-report.json")
    ap.add_argument("--force-refresh",action="store_true")
    args=ap.parse_args()

    qualified,unqualified,qreport=load_qualification(args.qualification)
    raw=Path(args.raw_dir)
    csv_paths={}
    for season in sorted(qualified):
        path=raw/f"injuries_{season}.csv"
        print(f"[9D.1B2] Downloading/using qualified injury data for {season}...")
        csv_paths[season]=download(INJURY_URL.format(season=season),path,args.force_refresh)

    index=build_injury_index(csv_paths)
    source=Path(args.observations)
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    total=joined=null_season=no_report=0
    by_season=defaultdict(lambda:{"observations":0,"availabilityJoined":0,"availabilityNullUnqualified":0,"noReportEvidence":0,"reportedPlayers":0})

    with source.open("r",encoding="utf-8") as inp, output.open("w",encoding="utf-8") as out:
        for line in inp:
            if not line.strip(): continue
            obs=json.loads(line);total+=1
            season=obs.get("season");week=obs.get("week");team=obs.get("team");kickoff=obs.get("kickoffAt")
            stats=by_season[str(season)];stats["observations"]+=1
            if season not in qualified:
                obs["evidence"]["availabilityImpact"]=None
                obs.setdefault("datasetGovernance",{})["availabilityJoin"]="UNQUALIFIED_SEASON_PRESERVED_NULL"
                null_season+=1;stats["availabilityNullUnqualified"]+=1
            else:
                players=latest_safe(index.get((season,week,team),[]),kickoff)
                summary=summarize(players)
                obs["evidence"]["availabilityImpact"]=summary
                obs.setdefault("datasetGovernance",{})["availabilityJoin"]="LATEST_SAFE_PLAYER_WEEK_REPORT"
                obs["datasetGovernance"]["availabilitySource"]="NFLVERSE_INJURIES"
                joined+=1;stats["availabilityJoined"]+=1;stats["reportedPlayers"]+=summary["playerCount"]
                if summary["status"]=="NO_REPORT_EVIDENCE":
                    no_report+=1;stats["noReportEvidence"]+=1
            out.write(json.dumps(obs,separators=(",",":"))+"\n")

    report={
      "contractVersion":"FIE-NFL-HISTORICAL-AVAILABILITY-JOIN-REPORT-1.0.0",
      "sourceObservationCount":total,
      "outputObservationCount":total,
      "qualifiedSeasons":sorted(qualified),
      "unqualifiedSeasons":sorted(unqualified),
      "joinedObservationCount":joined,
      "unqualifiedSeasonNullObservationCount":null_season,
      "qualifiedNoReportEvidenceCount":no_report,
      "bySeason":dict(by_season),
      "sourceDatasetMutated":False,
      "outputWrittenToNewDataset":True,
      "calibrationExecuted":False,
      "learnedWeights":None,
      "teamStrengthScores":None
    }
    Path(args.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":main()
