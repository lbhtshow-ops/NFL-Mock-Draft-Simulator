#!/usr/bin/env python3
"""
LBHT FIE Sprint 9D — Real Historical Acquisition & Calibration Dataset V1

Downloads real nflverse/nfldata schedules, nflverse play-by-play, and nflverse
weekly rosters for requested seasons. Builds pregame-only team-game observations.

Important governance:
- Current-game and future-game PBP are never used as pregame features.
- No Supabase/database write occurs.
- No learned weights or team-strength scores are produced.
- Missing injury, player-caliber, coaching, scheme, and replacement evidence remain null.
"""
from __future__ import annotations
import argparse, csv, gzip, hashlib, io, json, os, sys, urllib.request
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCHEDULES_URL = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
PBP_URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.csv.gz"
ROSTER_URL = "https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{season}.csv"

def download(url: str, path: Path, force: bool=False) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not force:
        return path
    req = urllib.request.Request(url, headers={"User-Agent":"LBHT-FIE-HistoricalCalibration/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, path.open("wb") as f:
        while True:
            chunk = r.read(1024*1024)
            if not chunk: break
            f.write(chunk)
    return path

def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def read_csv(path: Path, gz: bool=False):
    opener = gzip.open if gz else open
    with opener(path, "rt", encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)

def fnum(v):
    try:
        if v in (None,"","NA","NaN","nan"): return None
        return float(v)
    except: return None

def inum(v):
    try: return int(float(v))
    except: return None

def clean(v):
    if v is None: return None
    s=str(v).strip()
    return s or None

def kickoff_iso(row):
    # nflverse gametime is a U.S. Eastern local clock value. Preserve that
    # source-local timestamp for chronological leakage ordering so Windows
    # does not require the optional tzdata package.
    date = clean(row.get("gameday") or row.get("game_date"))
    game_time = clean(row.get("gametime")) or "12:00"
    if not date: return None
    try:
        value = f"{date}T{game_time}:00" if len(game_time) == 5 else f"{date}T{game_time}"
        return datetime.fromisoformat(value).isoformat()
    except Exception:
        return None

def schedule_rows(schedule_path, seasons):
    out=[]
    for r in read_csv(schedule_path):
        season=inum(r.get("season"))
        week=inum(r.get("week"))
        if season not in seasons or week is None: continue
        game_type=clean(r.get("game_type"))
        if game_type not in ("REG","POST"): continue
        gid=clean(r.get("game_id"))
        home=clean(r.get("home_team"))
        away=clean(r.get("away_team"))
        kick=kickoff_iso(r)
        if not gid or not home or not away or not kick: continue
        hs=fnum(r.get("home_score")); aw=fnum(r.get("away_score"))
        out.append(dict(gameId=gid,season=season,week=week,gameType=game_type,home=home,away=away,
                        kickoffAt=kick,homeScore=hs,awayScore=aw))
    return out

def roster_index(path, season):
    idx=defaultdict(list)
    for r in read_csv(path):
        team=clean(r.get("team") or r.get("team_abbr"))
        week=inum(r.get("week"))
        if not team or week is None: continue
        idx[(season,week,team)].append({
            "playerId":clean(r.get("gsis_id") or r.get("player_id") or r.get("esb_id")),
            "name":clean(r.get("full_name") or r.get("player_name")),
            "position":clean(r.get("position")),
            "status":clean(r.get("status")),
        })
    return idx

def aggregate_pbp(path):
    """
    Returns per-game team metrics. These are later exposed to a target game only
    if the source game is chronologically earlier than the target game.
    """
    games=defaultdict(lambda:defaultdict(lambda:{"off_epa":[],"off_success":[],"def_epa":[],"def_success":[]}))
    for r in read_csv(path, gz=True):
        gid=clean(r.get("game_id")); week=inum(r.get("week"))
        if not gid or week is None: continue
        posteam=clean(r.get("posteam")); defteam=clean(r.get("defteam"))
        epa=fnum(r.get("epa")); success=fnum(r.get("success"))
        no_play=clean(r.get("no_play"))
        qb_kneel=clean(r.get("qb_kneel"))
        if no_play in ("1","TRUE","true") or qb_kneel in ("1","TRUE","true"): continue
        if posteam and epa is not None:
            games[gid][posteam]["off_epa"].append(epa)
            if success is not None: games[gid][posteam]["off_success"].append(success)
        if defteam and epa is not None:
            games[gid][defteam]["def_epa"].append(epa)
            if success is not None: games[gid][defteam]["def_success"].append(success)
    result={}
    for gid,teams in games.items():
        result[gid]={}
        for team,m in teams.items():
            avg=lambda xs: sum(xs)/len(xs) if xs else None
            result[gid][team]={
                "offenseEPAperPlay":avg(m["off_epa"]),
                "offenseSuccessRate":avg(m["off_success"]),
                "defenseEPAperPlayAllowed":avg(m["def_epa"]),
                "defenseSuccessRateAllowed":avg(m["def_success"]),
            }
    return result

def avg(vals):
    vals=[v for v in vals if v is not None]
    return sum(vals)/len(vals) if vals else None

def prior_performance(team, target, team_history, pbp_by_game, recent=4):
    prior=[g for g in team_history[team] if g["kickoffAt"] < target["kickoffAt"]]
    full=[]
    for g in prior:
        m=pbp_by_game.get(g["gameId"],{}).get(team)
        if m: full.append(m)
    recent_rows=full[-recent:]
    def metric(rows,k): return avg([r.get(k) for r in rows])
    return {
        "offenseEPAperPlay":metric(full,"offenseEPAperPlay"),
        "offenseSuccessRate":metric(full,"offenseSuccessRate"),
        "defenseEPAperPlayAllowed":metric(full,"defenseEPAperPlayAllowed"),
        "defenseSuccessRateAllowed":metric(full,"defenseSuccessRateAllowed"),
        "recentOffenseEPAperPlay":metric(recent_rows,"offenseEPAperPlay"),
        "recentDefenseEPAperPlayAllowed":metric(recent_rows,"defenseEPAperPlayAllowed"),
        "sampleGames":len(full),
        "recentWindowGames":len(recent_rows),
    }

def build_observations(schedules, roster_indexes, pbp_indexes):
    team_history=defaultdict(list)
    for g in sorted(schedules,key=lambda x:x["kickoffAt"]):
        team_history[g["home"]].append(g); team_history[g["away"]].append(g)

    observations=[]
    evidence_records=[]
    for g in sorted(schedules,key=lambda x:x["kickoffAt"]):
        pbp=pbp_indexes[g["season"]]
        for team,opp,is_home in ((g["home"],g["away"],True),(g["away"],g["home"],False)):
            roster=roster_indexes[g["season"]].get((g["season"],g["week"],team),[])
            perf=prior_performance(team,g,team_history,pbp)
            kickoff=datetime.fromisoformat(g["kickoffAt"])
            evidence_asof=(kickoff-timedelta(minutes=1)).isoformat()
            team_score=g["homeScore"] if is_home else g["awayScore"]
            opp_score=g["awayScore"] if is_home else g["homeScore"]
            final=team_score is not None and opp_score is not None

            obs={
              "contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-OBSERVATION-1.0.0",
              "observationId":f'{g["gameId"]}-{team}',
              "gameId":g["gameId"],"team":team,"opponent":opp,"season":g["season"],"week":g["week"],
              "kickoffAt":g["kickoffAt"],"evidenceAsOf":evidence_asof,"leakageSafe":True,"split":None,
              "evidence":{
                "playerCaliber":None,
                "rosterDepth":{"playerCount":len(roster),"players":roster},
                "availabilityImpact":None,
                "unitState":None,
                "performance":perf,
                "recentForm":{"recentOffenseEPAperPlay":perf["recentOffenseEPAperPlay"],
                              "recentDefenseEPAperPlayAllowed":perf["recentDefenseEPAperPlayAllowed"],
                              "recentWindowGames":perf["recentWindowGames"]},
                "coaching":None,"scheme":None
              },
              "outcome":{
                "status":"FINAL" if final else "UNAVAILABLE",
                "teamPoints":team_score if final else None,"opponentPoints":opp_score if final else None,
                "pointDifferential":team_score-opp_score if final else None,
                "won":team_score>opp_score if final else None
              },
              "provenance":{"evidenceSourceIds":["NFLVERSE_PBP","NFLVERSE_WEEKLY_ROSTERS"],
                            "outcomeSourceIds":["NFLVERSE_SCHEDULES"]},
              "datasetGovernance":{
                "performanceUsesPriorGamesOnly":True,
                "currentGamePbpExcluded":True,
                "futureGamePbpExcluded":True,
                "missingAvailabilityPreservedAsNull":True,
                "missingPlayerCaliberPreservedAsNull":True
              }
            }
            observations.append(obs)
    return observations

def chronological_split(observations, train_end, validation_end):
    for o in observations:
        season=o["season"]
        if season <= train_end: o["split"]="TRAIN"
        elif season <= validation_end: o["split"]="VALIDATION"
        else: o["split"]="HOLDOUT"

def quality(observations):
    total=len(observations)
    final=sum(1 for o in observations if o["outcome"]["status"]=="FINAL")
    roster=sum(1 for o in observations if o["evidence"]["rosterDepth"]["playerCount"]>0)
    perf=sum(1 for o in observations if o["evidence"]["performance"]["sampleGames"]>0)
    by_season=defaultdict(lambda:{"observations":0,"final":0,"roster":0,"performance":0})
    for o in observations:
        s=by_season[str(o["season"])]
        s["observations"]+=1
        s["final"]+=o["outcome"]["status"]=="FINAL"
        s["roster"]+=o["evidence"]["rosterDepth"]["playerCount"]>0
        s["performance"]+=o["evidence"]["performance"]["sampleGames"]>0
    return {
      "contractVersion":"FIE-NFL-HISTORICAL-REAL-DATASET-QUALITY-1.0.0",
      "observationCount":total,"finalOutcomeCount":final,
      "rosterCoverageRate":roster/total if total else None,
      "performanceCoverageRate":perf/total if total else None,
      "availabilityCoverageRate":0.0,
      "playerCaliberCoverageRate":0.0,
      "coachingCoverageRate":0.0,
      "schemeCoverageRate":0.0,
      "bySeason":dict(by_season),
      "calibrationExecutionAuthorized":False,
      "learnedWeights":None,"teamStrengthScores":None
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024,2025")
    ap.add_argument("--output",default="data/calibration/historical/v1")
    ap.add_argument("--force-refresh",action="store_true")
    ap.add_argument("--train-end",type=int,default=2023)
    ap.add_argument("--validation-end",type=int,default=2024)
    args=ap.parse_args()
    seasons=sorted(set(int(x) for x in args.seasons.split(",") if x.strip()))
    out=Path(args.output); raw=out/"raw"; out.mkdir(parents=True,exist_ok=True); raw.mkdir(parents=True,exist_ok=True)

    print(f"[9D] Seasons: {seasons}")
    schedule_path=download(SCHEDULES_URL,raw/"games.csv",args.force_refresh)
    roster_paths={}; pbp_paths={}
    for season in seasons:
        print(f"[9D] Downloading/using {season} PBP...")
        pbp_paths[season]=download(PBP_URL.format(season=season),raw/f"play_by_play_{season}.csv.gz",args.force_refresh)
        print(f"[9D] Downloading/using {season} weekly rosters...")
        roster_paths[season]=download(ROSTER_URL.format(season=season),raw/f"roster_weekly_{season}.csv",args.force_refresh)

    print("[9D] Parsing schedules...")
    schedules=schedule_rows(schedule_path,set(seasons))
    print(f"[9D] Games found: {len(schedules)}")
    roster_indexes={s:roster_index(roster_paths[s],s) for s in seasons}
    pbp_indexes={}
    for s in seasons:
        print(f"[9D] Aggregating {s} PBP...")
        pbp_indexes[s]=aggregate_pbp(pbp_paths[s])

    observations=build_observations(schedules,roster_indexes,pbp_indexes)
    chronological_split(observations,args.train_end,args.validation_end)
    q=quality(observations)

    obs_path=out/"observations.jsonl"
    with obs_path.open("w",encoding="utf-8") as f:
        for o in observations: f.write(json.dumps(o,separators=(",",":"))+"\n")
    (out/"quality-report.json").write_text(json.dumps(q,indent=2),encoding="utf-8")
    manifest={
      "datasetId":"LBHT-NFL-HISTORICAL-CALIBRATION-V1",
      "generatedAt":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
      "seasons":seasons,
      "splitPolicy":{"trainEnd":args.train_end,"validationEnd":args.validation_end,"holdoutAfter":args.validation_end},
      "observationCount":len(observations),
      "sources":{
        "schedules":{"url":SCHEDULES_URL,"sha256":sha256(schedule_path)},
        "pbp":{str(s):{"url":PBP_URL.format(season=s),"sha256":sha256(pbp_paths[s])} for s in seasons},
        "weeklyRosters":{str(s):{"url":ROSTER_URL.format(season=s),"sha256":sha256(roster_paths[s])} for s in seasons},
      },
      "outputs":{"observations":str(obs_path),"qualityReport":str(out/"quality-report.json")},
      "governance":{"databaseWrite":False,"learnedWeights":False,"teamStrengthScores":False}
    }
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
    print(json.dumps({"status":"PASS","datasetId":manifest["datasetId"],"observations":len(observations),
                      "quality":q,"output":str(out)},indent=2))

if __name__=="__main__":
    main()
