#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,re,time,urllib.parse,urllib.request,urllib.error,socket
from collections import Counter,defaultdict
from datetime import datetime
from html import unescape
from pathlib import Path

TEAMS={
"ARI":"azcardinals.com","ATL":"atlantafalcons.com","BAL":"baltimoreravens.com","BUF":"buffalobills.com",
"CAR":"panthers.com","CHI":"chicagobears.com","CIN":"bengals.com","CLE":"clevelandbrowns.com",
"DAL":"dallascowboys.com","DEN":"denverbroncos.com","DET":"detroitlions.com","GB":"packers.com",
"HOU":"houstontexans.com","IND":"colts.com","JAX":"jaguars.com","KC":"chiefs.com","LV":"raiders.com",
"LAC":"chargers.com","LA":"therams.com","MIA":"miamidolphins.com","MIN":"vikings.com","NE":"patriots.com",
"NO":"neworleanssaints.com","NYG":"giants.com","NYJ":"newyorkjets.com","PHI":"philadelphiaeagles.com",
"PIT":"steelers.com","SF":"49ers.com","SEA":"seahawks.com","TB":"buccaneers.com","TEN":"titansonline.com",
"WAS":"commanders.com"}

ALIASES={
"ARI":["cardinals","arizona"],"ATL":["falcons","atlanta"],"BAL":["ravens","baltimore"],"BUF":["bills","buffalo"],
"CAR":["panthers","carolina"],"CHI":["bears","chicago"],"CIN":["bengals","cincinnati"],"CLE":["browns","cleveland"],
"DAL":["cowboys","dallas"],"DEN":["broncos","denver"],"DET":["lions","detroit"],"GB":["packers","green bay"],
"HOU":["texans","houston"],"IND":["colts","indianapolis"],"JAX":["jaguars","jags","jacksonville"],"KC":["chiefs","kansas city"],
"LV":["raiders","las vegas"],"LAC":["chargers","los angeles chargers"],"LA":["rams","los angeles rams"],
"MIA":["dolphins","miami"],"MIN":["vikings","minnesota"],"NE":["patriots","new england"],"NO":["saints","new orleans"],
"NYG":["giants","new york giants"],"NYJ":["jets","new york jets"],"PHI":["eagles","philadelphia"],
"PIT":["steelers","pittsburgh"],"SF":["49ers","san francisco","niners"],"SEA":["seahawks","seattle"],
"TB":["buccaneers","bucs","tampa bay"],"TEN":["titans","tennessee"],"WAS":["commanders","washington"]}

KEYWORDS=("depth chart","depth-chart","game release","weekly release","media guide","starter","starting quarterback",
          "will start","named starter","named starting","unofficial depth chart","game notes")

DATE_PATTERNS=[
 re.compile(r'"datePublished"\s*:\s*"([^"]+)"',re.I),
 re.compile(r'property=["\']article:published_time["\'][^>]*content=["\']([^"\']+)',re.I),
 re.compile(r'name=["\']date["\'][^>]*content=["\']([^"\']+)',re.I)]
TITLE_PATTERNS=[
 re.compile(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)',re.I),
 re.compile(r'<title[^>]*>(.*?)</title>',re.I|re.S)]

def log(msg): print(msg,flush=True)

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(str(v).replace("Z","+00:00"))
    except:return None

def safe_get(url,timeout):
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"LBHT-FIE-OfficialPregameEvidenceExpansion/1.0","Connection":"close"})
        with urllib.request.urlopen(req,timeout=timeout) as r:
            return r.read().decode("utf-8",errors="replace"),None
    except urllib.error.HTTPError as e:return None,f"HTTP_{e.code}"
    except urllib.error.URLError as e:
        reason=getattr(e,"reason",e)
        if isinstance(reason,(socket.timeout,TimeoutError)):return None,"TIMEOUT"
        return None,f"URL_ERROR:{reason}"
    except (socket.timeout,TimeoutError):return None,"TIMEOUT"
    except Exception as e:return None,f"{type(e).__name__}:{e}"

def title_from(html):
    for p in TITLE_PATTERNS:
        m=p.search(html or "")
        if m:return unescape(re.sub(r"\s+"," ",m.group(1))).strip()
    return None

def published_from(html):
    for p in DATE_PATTERNS:
        m=p.search(html or "")
        if m:return m.group(1)
    return None

def classify(text):
    t=(text or "").lower()
    if "depth chart" in t or "depth-chart" in t:return "OFFICIAL_DEPTH_CHART_RELEASE"
    if "game release" in t or "weekly release" in t or "game notes" in t:return "OFFICIAL_WEEKLY_GAME_RELEASE"
    if any(k in t for k in ("will start","named starter","named starting","starting quarterback","starter")):
        return "OFFICIAL_STARTER_ANNOUNCEMENT"
    if "media guide" in t:return "OFFICIAL_TEAM_PDF"
    return "OFFICIAL_TEAM_ARTICLE"

def load_schedule(path,seasons):
    games=[]; by_key={}
    with open(path,"r",encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            try:season=int(float(r.get("season","")));week=int(float(r.get("week","")))
            except:continue
            if season not in seasons:continue
            gt=(r.get("game_type") or r.get("season_type") or "REG").upper()
            if gt!="REG":continue
            home=r.get("home_team");away=r.get("away_team");date=r.get("gameday");tm=r.get("gametime") or "12:00"
            if not home or not away or not date:continue
            try:k=datetime.fromisoformat(f"{date}T{tm}:00" if len(tm)==5 else f"{date}T{tm}")
            except:continue
            for team,opp in ((home,away),(away,home)):
                g={"season":season,"week":week,"team":team,"opponent":opp,"kickoff":k}
                games.append(g);by_key[(season,week,team)]=g
    return games,by_key

def load_existing(path):
    rows=[]
    if Path(path).exists():
        for line in Path(path).read_text(encoding="utf-8").splitlines():
            if line.strip():rows.append(json.loads(line))
    return rows

def existing_safe_keys(rows):
    out=set()
    for r in rows:
        week=r.get("resolvedWeek") if r.get("resolvedWeek") is not None else r.get("week")
        safe=r.get("resolvedPregameSafe") if "resolvedPregameSafe" in r else r.get("pregameSafe")
        if safe is True and isinstance(week,int):
            out.add((int(r["season"]),week,r["team"]))
    return out

def sitemap_entries(html,domain):
    entries=[]
    for m in re.finditer(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',html or "",re.I|re.S):
        href=unescape(m.group(1));text=unescape(re.sub(r"<[^>]+>"," ",m.group(2)))
        text=re.sub(r"\s+"," ",text).strip()
        url=urllib.parse.urljoin("https://"+domain,href)
        if domain in urllib.parse.urlparse(url).netloc and "/news/" in url:
            entries.append((url,text))
    # fallback absolute urls
    for raw in re.findall(r'https?://[^<"\']+',html or ""):
        url=unescape(raw).strip()
        if domain in urllib.parse.urlparse(url).netloc and "/news/" in url:
            entries.append((url,""))
    seen=set();out=[]
    for u,t in entries:
        if u not in seen:seen.add(u);out.append((u,t))
    return out

def relevant_for_game(text,game):
    t=(text or "").lower()
    week_hit=f"week {game['week']}" in t or f"week-{game['week']}" in t
    opp_hit=any(a in t for a in ALIASES.get(game["opponent"],[]))
    kw_hit=any(k in t for k in KEYWORDS)
    return kw_hit and (week_hit or opp_hit)

def pdf_links(html,base_url,domain):
    out=[]
    for href in re.findall(r'href=["\']([^"\']+\.pdf(?:\?[^"\']*)?)["\']',html or "",re.I):
        u=urllib.parse.urljoin(base_url,unescape(href))
        host=urllib.parse.urlparse(u).netloc.lower()
        if domain in host or host.endswith("clubs.nfl.com"):
            out.append(u)
    return sorted(set(out))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--schedules",required=True)
    ap.add_argument("--existing-r2",required=True)
    ap.add_argument("--output",required=True)
    ap.add_argument("--report",required=True)
    ap.add_argument("--checkpoint")
    ap.add_argument("--request-timeout",type=float,default=5)
    ap.add_argument("--months",default="8,9,10,11,12,1")
    ap.add_argument("--max-targets",type=int,default=0)
    a=ap.parse_args()

    seasons={int(x) for x in a.seasons.split(",") if x.strip()}
    months={int(x) for x in a.months.split(",") if x.strip()}
    games,_=load_schedule(a.schedules,seasons)
    existing=load_existing(a.existing_r2)
    existing_keys=existing_safe_keys(existing)
    targets=[g for g in games if (g["season"],g["week"],g["team"]) not in existing_keys]
    if a.max_targets>0:targets=targets[:a.max_targets]

    out_rows=list(existing)
    discovered=[]
    failures=Counter();by_team=defaultdict(Counter);stats=Counter()
    checkpoint=Path(a.checkpoint) if a.checkpoint else Path(a.report).with_name(Path(a.report).stem+"-checkpoint.json")
    log(f"[9D.1C2B2B-R3] gap targets={len(targets)} existingSafeTeamWeeks={len(existing_keys)}")

    # Cache sitemap entries by team-season-month to avoid repeated requests per week.
    cache={}
    processed=0
    for game in targets:
        processed+=1
        team=game["team"];domain=TEAMS[team];season=game["season"];week=game["week"]
        log(f"[{processed}/{len(targets)}] {team} {season} Week {week} vs {game['opponent']}")
        entries=[]
        for month in sorted(months):
            key=(team,season,month)
            if key not in cache:
                # January belongs to following calendar year for late season.
                year=season+1 if month==1 else season
                html=None
                for page in (f"https://www.{domain}/sitemap/html/articles/{year}/{month}",f"https://{domain}/sitemap/html/articles/{year}/{month}"):
                    html,err=safe_get(page,a.request_timeout)
                    if html is not None:break
                    failures[err]+=1;by_team[team]["requestFailures"]+=1
                cache[key]=sitemap_entries(html or "",domain)
            entries.extend(cache[key])

        candidates=[]
        for url,text in entries:
            blob=(text+" "+url.replace("-"," ")).lower()
            if relevant_for_game(blob,game):
                candidates.append((url,text))
        # bounded to highly targeted candidates only
        candidates=candidates[:20]
        log(f"    targetedCandidates={len(candidates)}")
        for url,anchor in candidates:
            html,err=safe_get(url,a.request_timeout)
            if html is None:
                failures[err]+=1;by_team[team]["requestFailures"]+=1;continue
            title=title_from(html) or anchor
            pub=published_from(html);pdt=parse_dt(pub);kickoff=game["kickoff"]
            if pdt and pdt.tzinfo is not None:kickoff=kickoff.replace(tzinfo=pdt.tzinfo)
            safe=(pdt<kickoff) if pdt else None
            row={"season":season,"week":week,"team":team,"opponent":game["opponent"],"publicationType":classify(title),
                 "title":title,"url":url,"publishedAt":pub,"kickoffAt":kickoff.isoformat(),
                 "pregameSafe":safe,"officialTeamDomain":True,"resolutionMethod":"SCHEDULE_TARGETED_OFFICIAL_PUBLICATION",
                 "sourceClass":"OFFICIAL_TEAM_ARTICLE"}
            discovered.append(row);out_rows.append(row);stats["articles"]+=1;by_team[team]["articles"]+=1
            if safe is True:stats["safe"]+=1;by_team[team]["safe"]+=1
            for pdf in pdf_links(html,url,domain):
                prow={"season":season,"week":week,"team":team,"opponent":game["opponent"],"publicationType":"OFFICIAL_TEAM_PDF",
                      "title":title+" [linked official PDF]","url":pdf,"publishedAt":pub,"kickoffAt":kickoff.isoformat(),
                      "pregameSafe":safe,"officialTeamDomain":True,"resolutionMethod":"PARENT_OFFICIAL_ARTICLE_TIMESTAMP",
                      "sourceClass":"OFFICIAL_TEAM_PDF","parentArticleUrl":url}
                discovered.append(prow);out_rows.append(prow);stats["pdfs"]+=1;by_team[team]["pdfs"]+=1
                if safe is True:stats["safe"]+=1;by_team[team]["safe"]+=1

        checkpoint.parent.mkdir(parents=True,exist_ok=True)
        checkpoint.write_text(json.dumps({
          "runnerRevision":"9D.1C2B2B-R3","processedTargets":processed,"targetCount":len(targets),
          "newEvidenceCount":len(discovered),"safeNewEvidenceCount":stats["safe"],
          "failureClasses":dict(failures),"byTeam":{k:dict(v) for k,v in sorted(by_team.items())}
        },indent=2),encoding="utf-8")

    # Deduplicate final evidence by URL + team/week.
    unique={}
    for r in out_rows:
        wk=r.get("resolvedWeek") if r.get("resolvedWeek") is not None else r.get("week")
        key=(r.get("team"),r.get("season"),wk,r.get("url"))
        unique[key]=r
    final=list(unique.values())
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    with open(a.output,"w",encoding="utf-8") as f:
        for r in final:f.write(json.dumps(r,separators=(",",":"))+"\n")

    safe_rows=[]
    for r in final:
        wk=r.get("resolvedWeek") if r.get("resolvedWeek") is not None else r.get("week")
        sf=r.get("resolvedPregameSafe") if "resolvedPregameSafe" in r else r.get("pregameSafe")
        if sf is True and isinstance(wk,int):
            safe_rows.append((r["team"],int(r["season"]),wk))
    safe_unique=set(safe_rows)
    teams={x[0] for x in safe_unique};season_set={x[1] for x in safe_unique}

    report={
      "contractVersion":"FIE-NFL-HISTORICAL-OFFICIAL-PREGAME-EVIDENCE-EXPANSION-REPORT-1.0.0",
      "runnerRevision":"9D.1C2B2B-R3",
      "existingInputCount":len(existing),"gapTargetCount":len(targets),
      "newEvidenceCount":len(discovered),"newPregameSafeEvidenceCount":stats["safe"],
      "newArticleCount":stats["articles"],"newPdfCount":stats["pdfs"],
      "totalUniqueEvidenceCount":len(final),"totalUniquePregameSafeTeamWeeks":len(safe_unique),
      "teamsWithPregameSafeEvidence":len(teams),"seasonsWithPregameSafeEvidence":len(season_set),
      "pregameSafeTeams":sorted(teams),"pregameSafeSeasons":sorted(season_set),
      "requestFailureCount":sum(failures.values()),"failureClasses":dict(failures),
      "byTeam":{k:dict(v) for k,v in sorted(by_team.items())},
      "qualificationThresholds":{"minPregameSafe":100,"minTeamBreadth":16,"minSeasonBreadth":3},
      "qualifiedAsScalableAnchorCandidate":bool(len(safe_unique)>=100 and len(teams)>=16 and len(season_set)>=3),
      "replacementMappingsGenerated":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
    }
    Path(a.report).parent.mkdir(parents=True,exist_ok=True)
    Path(a.report).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
