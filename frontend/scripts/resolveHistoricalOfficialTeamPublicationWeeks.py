#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,re
from collections import Counter,defaultdict
from datetime import datetime
from pathlib import Path

WEEK_RE=re.compile(r"\bweek\s*(\d{1,2})\b",re.I)
NEGATIVE_STARTER=[
 re.compile(r"\bstarting to\b",re.I),
 re.compile(r"\bstarting fast\b",re.I),
 re.compile(r"\bstarting nod\b",re.I),
 re.compile(r"\bstarting job\b",re.I),
 re.compile(r"\bstarting jobs\b",re.I),
 re.compile(r"\bstarting lineup\b.*\bjourney\b",re.I),
 re.compile(r"\bfirst-round pick\b.*\bstarter\b",re.I),
]
POSITIVE_STARTER=[
 re.compile(r"\bnamed\b.{0,45}\bstarting (?:quarterback|qb|running back|rb|wide receiver|wr|tight end|te|tackle|guard|center|edge|linebacker|lb|cornerback|corner|cb|safety)\b",re.I),
 re.compile(r"\bwill (?:remain )?start\b",re.I),
 re.compile(r"\bwill be the starter\b",re.I),
 re.compile(r"\bstarting quarterback\b",re.I),
 re.compile(r"\bstarting qb\b",re.I),
 re.compile(r"\btakes over as starter\b",re.I),
]
TEAM_ALIASES={
"ARI":["Cardinals","Arizona"],"ATL":["Falcons","Atlanta"],"BAL":["Ravens","Baltimore"],
"BUF":["Bills","Buffalo"],"CAR":["Panthers","Carolina"],"CHI":["Bears","Chicago"],
"CIN":["Bengals","Cincinnati"],"CLE":["Browns","Cleveland"],"DAL":["Cowboys","Dallas"],
"DEN":["Broncos","Denver"],"DET":["Lions","Detroit"],"GB":["Packers","Green Bay"],
"HOU":["Texans","Houston"],"IND":["Colts","Indianapolis"],"JAX":["Jaguars","Jacksonville","Jags"],
"KC":["Chiefs","Kansas City"],"LV":["Raiders","Las Vegas"],"LAC":["Chargers","Los Angeles Chargers"],
"LA":["Rams","Los Angeles Rams"],"MIA":["Dolphins","Miami"],"MIN":["Vikings","Minnesota"],
"NE":["Patriots","New England"],"NO":["Saints","New Orleans"],"NYG":["Giants","New York Giants"],
"NYJ":["Jets","New York Jets"],"PHI":["Eagles","Philadelphia"],"PIT":["Steelers","Pittsburgh"],
"SF":["49ers","San Francisco","Niners"],"SEA":["Seahawks","Seattle"],"TB":["Buccaneers","Bucs","Tampa Bay"],
"TEN":["Titans","Tennessee"],"WAS":["Commanders","Washington"]
}

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except:return None

def load_schedule(path):
    rows=[]; by_team=defaultdict(list)
    with open(path,"r",encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            try: season=int(float(r.get("season",""))); week=int(float(r.get("week","")))
            except: continue
            gt=(r.get("game_type") or r.get("season_type") or "REG").upper()
            home=r.get("home_team"); away=r.get("away_team")
            date=r.get("gameday"); tm=r.get("gametime") or "12:00"
            if not home or not away or not date:continue
            try:k=datetime.fromisoformat(f"{date}T{tm}:00" if len(tm)==5 else f"{date}T{tm}")
            except:continue
            g={"season":season,"week":week,"gameType":gt,"home":home,"away":away,"kickoff":k}
            rows.append(g);by_team[(season,home)].append(g);by_team[(season,away)].append(g)
    return rows,by_team

def explicit_week(title):
    m=WEEK_RE.search(title or "")
    return int(m.group(1)) if m else None

def opponent_mentions(title, own_team):
    t=(title or "").lower()
    hits=[]
    for team,aliases in TEAM_ALIASES.items():
        if team==own_team:continue
        if any(re.search(r"(?<![a-z])"+re.escape(a.lower())+r"(?![a-z])",t) for a in aliases):
            hits.append(team)
    return sorted(set(hits))

def starter_semantics(title, publication_type):
    if publication_type!="EXPLICIT_STARTER_ANNOUNCEMENT":
        return {"eligible":True,"reason":"NOT_STARTER_CLASS"}
    for p in NEGATIVE_STARTER:
        if p.search(title or ""):
            return {"eligible":False,"reason":"NEGATIVE_STARTER_SEMANTICS"}
    if any(p.search(title or "") for p in POSITIVE_STARTER):
        return {"eligible":True,"reason":"POSITIVE_STARTER_SEMANTICS"}
    return {"eligible":False,"reason":"STARTER_SEMANTICS_NOT_EXPLICIT"}

def resolve(row,by_team):
    title=row.get("title") or ""; team=row.get("team"); season=int(row.get("season"))
    semantic=starter_semantics(title,row.get("publicationType"))
    if not semantic["eligible"]:
        return None,"REJECTED_"+semantic["reason"],semantic

    games=by_team.get((season,team),[])
    ew=explicit_week(title)
    if ew is not None:
        matches=[g for g in games if g["week"]==ew and g["gameType"]=="REG"]
        if len(matches)==1:return matches[0],"EXPLICIT_WEEK",semantic
        return None,"EXPLICIT_WEEK_NOT_UNIQUE_REGULAR_SEASON",semantic

    opponents=opponent_mentions(title,team)
    if len(opponents)==1:
        opp=opponents[0]
        matches=[g for g in games if g["gameType"]=="REG" and opp in (g["home"],g["away"])]
        if len(matches)==1:return matches[0],"UNIQUE_REGULAR_SEASON_OPPONENT",semantic
        return None,"OPPONENT_MATCH_NOT_UNIQUE",semantic

    return None,"UNRESOLVED_NO_UNIQUE_WEEK_OR_OPPONENT",semantic

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True)
    ap.add_argument("--schedules",required=True)
    ap.add_argument("--output",required=True)
    ap.add_argument("--report",required=True)
    ap.add_argument("--min-team-breadth",type=int,default=16)
    ap.add_argument("--min-season-breadth",type=int,default=3)
    ap.add_argument("--min-pregame-safe",type=int,default=100)
    a=ap.parse_args()
    _,by_team=load_schedule(a.schedules)
    rows=[json.loads(x) for x in Path(a.source).read_text(encoding="utf-8").splitlines() if x.strip()]
    out=[]; counts=Counter(); team_safe=Counter(); season_safe=Counter(); methods=Counter(); rejects=Counter()

    for row in rows:
        g,method,semantic=resolve(row,by_team)
        new=dict(row)
        new["starterSemanticEligible"]=semantic["eligible"]
        new["starterSemanticReason"]=semantic["reason"]
        new["resolutionMethod"]=method
        if g:
            pdt=parse_dt(row.get("publishedAt")); kickoff=g["kickoff"]
            if pdt and pdt.tzinfo is not None:kickoff=kickoff.replace(tzinfo=pdt.tzinfo)
            safe=(pdt < kickoff) if pdt else None
            new.update({"resolvedWeek":g["week"],"resolvedOpponent":g["away"] if g["home"]==row["team"] else g["home"],
                        "resolvedKickoffAt":kickoff.isoformat(),"resolvedPregameSafe":safe})
            counts["resolved"]+=1;methods[method]+=1
            if safe is True:
                counts["pregameSafe"]+=1;team_safe[row["team"]]+=1;season_safe[str(row["season"])]+=1
        else:
            new.update({"resolvedWeek":None,"resolvedOpponent":None,"resolvedKickoffAt":None,"resolvedPregameSafe":None})
            rejects[method]+=1
        out.append(new)

    teams=len(team_safe); seasons=len(season_safe)
    qualified=(counts["pregameSafe"]>=a.min_pregame_safe and teams>=a.min_team_breadth and seasons>=a.min_season_breadth)
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    with open(a.output,"w",encoding="utf-8") as f:
        for r in out:f.write(json.dumps(r,separators=(",",":"))+"\n")
    report={
      "contractVersion":"FIE-NFL-HISTORICAL-OFFICIAL-TEAM-PUBLICATION-SEMANTIC-WEEK-RESOLUTION-REPORT-1.0.0",
      "runnerRevision":"9D.1C2B2B-R2","inputCandidateCount":len(rows),
      "resolvedCount":counts["resolved"],"pregameSafeCount":counts["pregameSafe"],
      "teamsWithPregameSafeEvidence":teams,"seasonsWithPregameSafeEvidence":seasons,
      "resolutionMethods":dict(methods),"rejectionReasons":dict(rejects),
      "pregameSafeByTeam":dict(sorted(team_safe.items())),"pregameSafeBySeason":dict(sorted(season_safe.items())),
      "qualificationThresholds":{"minPregameSafe":a.min_pregame_safe,"minTeamBreadth":a.min_team_breadth,"minSeasonBreadth":a.min_season_breadth},
      "qualifiedAsScalableAnchorCandidate":qualified,
      "replacementMappingsGenerated":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
    Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
