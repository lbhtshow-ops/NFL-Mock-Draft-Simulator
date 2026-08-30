#!/usr/bin/env python3
import argparse,json
from pathlib import Path
from collections import Counter

def rows(path):
    with Path(path).open("r",encoding="utf-8") as f:
        for line in f:
            if line.strip():yield json.loads(line)

def audit(path,seasons):
    n=0;by=Counter();source=canonical=team=week=game=0
    for r in rows(path):
        if r.get("season") not in seasons:continue
        n+=1;by[r.get("season")]+=1
        source+=bool(r.get("pfr_player_id"))
        canonical+=bool(r.get("gsis_id"))
        team+=bool(r.get("team"))
        week+=isinstance(r.get("week"),int)
        game+=bool(r.get("game_id"))
    rate=lambda x:x/n if n else 0
    return {
      "contractVersion":"FIE-NFL-HISTORICAL-ACQUIRED-SNAP-QUALIFICATION-1.0.0",
      "rowCount":n,"rowsBySeason":dict(by),
      "sourceIdentityCoverageRate":rate(source),
      "canonicalIdentityCoverageRate":rate(canonical),
      "teamCoverageRate":rate(team),"weekCoverageRate":rate(week),"gameIdCoverageRate":rate(game),
      "qualifiedForSourceLevelPostgameParticipation":bool(n and rate(source)>=.95 and rate(team)>=.95 and rate(week)>=.95),
      "qualifiedForCanonicalPlayerJoin":bool(n and rate(canonical)>=.95),
      "qualifiedForPregameReplacementDetermination":False,
      "canonicalIdentityResolutionRequired":rate(canonical)<.95,
      "replacementMappingsGenerated":False,
      "calibrationExecuted":False
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True)
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--output",required=True)
    a=ap.parse_args(); seasons={int(x) for x in a.seasons.split(",") if x.strip()}
    r=audit(a.source,seasons)
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    Path(a.output).write_text(json.dumps(r,indent=2),encoding="utf-8")
    print(json.dumps(r,indent=2))
if __name__=="__main__":main()
