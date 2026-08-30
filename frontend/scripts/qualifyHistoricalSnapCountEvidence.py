#!/usr/bin/env python3
import argparse,json
from pathlib import Path
from collections import Counter,defaultdict

def load(path):
    p=Path(path)
    if p.suffix.lower()==".jsonl":
        return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    obj=json.loads(p.read_text(encoding="utf-8"))
    if isinstance(obj,list): return obj
    for k in ("rows","data","records","snapCounts","players"):
        if isinstance(obj.get(k),list): return obj[k]
    return []

def first(row,*keys):
    for k in keys:
        if row.get(k) not in (None,""): return row.get(k)
    return None

def audit(rows,seasons):
    season_counts=Counter(); identity=0; team=0; week=0; offense=0; defense=0; special=0
    cols=set()
    for r in rows:
        cols.update(r.keys())
        season=first(r,"season","seasonYear")
        try: season=int(season)
        except: continue
        if season not in seasons: continue
        season_counts[season]+=1
        if first(r,"player_id","playerId","gsis_id","gsisId"): identity+=1
        if first(r,"team","team_abbr","teamAbbr","recent_team"): team+=1
        if first(r,"week"): week+=1
        if first(r,"offense_snaps","offenseSnaps","offense_pct","offensePct") is not None: offense+=1
        if first(r,"defense_snaps","defenseSnaps","defense_pct","defensePct") is not None: defense+=1
        if first(r,"special_teams_snaps","specialTeamsSnaps","st_snaps","stSnaps") is not None: special+=1
    n=sum(season_counts.values())
    cov=lambda x: (x/n if n else 0)
    return {
      "contractVersion":"FIE-NFL-HISTORICAL-SNAP-EVIDENCE-QUALIFICATION-REPORT-1.0.0",
      "requestedSeasons":sorted(seasons),
      "rowCount":n,
      "rowsBySeason":dict(sorted(season_counts.items())),
      "columns":sorted(cols),
      "identityCoverageRate":cov(identity),
      "teamCoverageRate":cov(team),
      "weekCoverageRate":cov(week),
      "offenseSnapFieldCoverageRate":cov(offense),
      "defenseSnapFieldCoverageRate":cov(defense),
      "specialTeamsSnapFieldCoverageRate":cov(special),
      "qualifiedForPostgameParticipationCorroboration": bool(n and cov(identity)>=.95 and cov(team)>=.95 and cov(week)>=.95),
      "qualifiedForPregameReplacementDetermination":False,
      "temporalReason":"Snap participation is postgame evidence and cannot by itself establish a pregame expected replacement.",
      "replacementMappingsGenerated":False,
      "caliberGenerated":False,
      "datasetMutated":False,
      "calibrationExecuted":False,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True)
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--output",required=True)
    a=ap.parse_args()
    seasons={int(x.strip()) for x in a.seasons.split(",") if x.strip()}
    rows=load(a.source)
    report=audit(rows,seasons)
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
