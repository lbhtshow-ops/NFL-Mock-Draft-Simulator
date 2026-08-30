#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,re,urllib.request,urllib.parse,urllib.error,socket,time
from datetime import datetime
from html import unescape
from pathlib import Path
from collections import Counter,defaultdict

TEAMS={
"ARI":"azcardinals.com","ATL":"atlantafalcons.com","BAL":"baltimoreravens.com","BUF":"buffalobills.com",
"CAR":"panthers.com","CHI":"chicagobears.com","CIN":"bengals.com","CLE":"clevelandbrowns.com",
"DAL":"dallascowboys.com","DEN":"denverbroncos.com","DET":"detroitlions.com","GB":"packers.com",
"HOU":"houstontexans.com","IND":"colts.com","JAX":"jaguars.com","KC":"chiefs.com","LV":"raiders.com",
"LAC":"chargers.com","LA":"therams.com","MIA":"miamidolphins.com","MIN":"vikings.com","NE":"patriots.com",
"NO":"neworleanssaints.com","NYG":"giants.com","NYJ":"newyorkjets.com","PHI":"philadelphiaeagles.com",
"PIT":"steelers.com","SF":"49ers.com","SEA":"seahawks.com","TB":"buccaneers.com","TEN":"titansonline.com",
"WAS":"commanders.com"}

DEPTH_RE=re.compile(r"depth[\s-]?chart",re.I)
STARTER_RE=re.compile(r"\b(starting|starter|named.*starter|will start)\b",re.I)
WEEK_RE=re.compile(r"\bweek\s*(\d{1,2})\b",re.I)
DATE_META_PATTERNS=[
 re.compile(r'"datePublished"\s*:\s*"([^"]+)"',re.I),
 re.compile(r'property=["\']article:published_time["\'][^>]*content=["\']([^"\']+)',re.I),
 re.compile(r'name=["\']date["\'][^>]*content=["\']([^"\']+)',re.I)]
TITLE_PATTERNS=[
 re.compile(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)',re.I),
 re.compile(r'<title[^>]*>(.*?)</title>',re.I|re.S)]

def log(msg):
    print(msg, flush=True)

def get(url, timeout):
    req=urllib.request.Request(url,headers={
        "User-Agent":"LBHT-FIE-OfficialTeamPublicationDiscovery/1.1",
        "Connection":"close",
        "Accept":"text/html,application/xhtml+xml"
    })
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return r.read().decode("utf-8",errors="replace")

def safe_get(url, timeout):
    started=time.monotonic()
    try:
        return get(url,timeout),None
    except urllib.error.HTTPError as e:
        return None,f"HTTP_{e.code}"
    except urllib.error.URLError as e:
        reason=getattr(e,"reason",e)
        if isinstance(reason,(socket.timeout,TimeoutError)):
            return None,"TIMEOUT"
        return None,f"URL_ERROR:{reason}"
    except (socket.timeout,TimeoutError):
        return None,"TIMEOUT"
    except Exception as e:
        return None,f"{type(e).__name__}:{e}"
    finally:
        elapsed=time.monotonic()-started
        if elapsed > max(timeout*1.5, 8):
            log(f"    [slow request] {elapsed:.1f}s {url}")

def parse_dt(v):
    if not v:return None
    try:return datetime.fromisoformat(v.replace("Z","+00:00"))
    except:return None

def title_from(html):
    for p in TITLE_PATTERNS:
        m=p.search(html)
        if m:return unescape(re.sub(r"\s+"," ",m.group(1))).strip()
    return None

def published_from(html):
    for p in DATE_META_PATTERNS:
        m=p.search(html)
        if m:return m.group(1)
    return None

def article_urls_from_sitemap(html,domain):
    found=set()
    for href in re.findall(r'href=["\']([^"\']+)["\']',html,re.I):
        u=urllib.parse.urljoin("https://"+domain,unescape(href))
        if domain in urllib.parse.urlparse(u).netloc and "/news/" in u:found.add(u)
    for raw in re.findall(r'https?://[^<"\']+',html):
        u=unescape(raw).strip()
        if domain in urllib.parse.urlparse(u).netloc and "/news/" in u:found.add(u)
    return sorted(found)

def load_kickoffs(path):
    idx={}
    with open(path,"r",encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            try: season=int(float(r.get("season",""))); week=int(float(r.get("week","")))
            except: continue
            date=r.get("gameday"); tm=r.get("gametime") or "12:00"
            if not date: continue
            try:k=datetime.fromisoformat(f"{date}T{tm}:00" if len(tm)==5 else f"{date}T{tm}")
            except:continue
            for key in ("home_team","away_team"):
                team=r.get(key)
                if team:idx[(season,week,team)]=k
    return idx

def classify(title):
    if DEPTH_RE.search(title or ""):return "DEPTH_CHART_RELEASE"
    if STARTER_RE.search(title or ""):return "EXPLICIT_STARTER_ANNOUNCEMENT"
    if "game release" in (title or "").lower():return "WEEKLY_GAME_RELEASE"
    return None

def write_checkpoint(path,evidence,stats,by_team,failures,processed):
    payload={
      "contractVersion":"FIE-NFL-HISTORICAL-OFFICIAL-TEAM-PUBLICATION-DISCOVERY-CHECKPOINT-1.0.0",
      "processedTeamSeasons":processed,
      "candidatePublicationCount":stats["found"],
      "requestFailureCount":sum(failures.values()),
      "failureClasses":dict(failures),
      "byTeam":{k:dict(v) for k,v in sorted(by_team.items())},
      "evidence":evidence
    }
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(payload,indent=2),encoding="utf-8")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--seasons",default="2022,2023,2024")
    ap.add_argument("--schedules",required=True)
    ap.add_argument("--output",required=True)
    ap.add_argument("--report",required=True)
    ap.add_argument("--checkpoint")
    ap.add_argument("--request-timeout",type=float,default=5.0)
    ap.add_argument("--max-articles-per-team-season",type=int,default=120)
    ap.add_argument("--months",default="8,9,10,11,12")
    a=ap.parse_args()

    seasons=sorted({int(x) for x in a.seasons.split(",") if x.strip()})
    months=sorted({int(x) for x in a.months.split(",") if x.strip()})
    kickoffs=load_kickoffs(a.schedules)
    output=Path(a.output)
    report_path=Path(a.report)
    checkpoint=Path(a.checkpoint) if a.checkpoint else report_path.with_name(report_path.stem+"-checkpoint.json")

    evidence=[]; stats=Counter(); by_team=defaultdict(Counter); failures=Counter()
    processed=0; total=len(TEAMS)*len(seasons)

    log(f"[9D.1C2B2B-R1] Starting official publication discovery: {len(TEAMS)} teams x {len(seasons)} seasons = {total} team-seasons")
    log(f"[config] timeout={a.request_timeout:.1f}s maxArticles/team-season={a.max_articles_per_team_season} months={months}")
    log(f"[checkpoint] {checkpoint}")

    try:
        for team,domain in TEAMS.items():
            for season in seasons:
                processed+=1
                log(f"[{processed}/{total}] {team} {season}: scanning official sitemaps...")
                urls=set(); sitemap_ok=0
                for month in months:
                    candidates=[
                      f"https://www.{domain}/sitemap/html/articles/{season}/{month}",
                      f"https://{domain}/sitemap/html/articles/{season}/{month}"
                    ]
                    html=None
                    for page in candidates:
                        html,err=safe_get(page,a.request_timeout)
                        if html is not None:
                            sitemap_ok+=1; break
                        failures[err]+=1; by_team[team]["requestFailures"]+=1
                    if html:
                        urls.update(article_urls_from_sitemap(html,domain))

                urls=sorted(urls)[:a.max_articles_per_team_season]
                log(f"    {team} {season}: sitemapMonths={sitemap_ok}/{len(months)}, candidateNewsUrls={len(urls)}")
                season_found=0
                for i,url in enumerate(urls,1):
                    html,err=safe_get(url,a.request_timeout)
                    if html is None:
                        failures[err]+=1;by_team[team]["requestFailures"]+=1
                        continue
                    title=title_from(html); typ=classify(title)
                    if not typ:continue
                    wm=WEEK_RE.search(title or ""); week=int(wm.group(1)) if wm else None
                    published=published_from(html); pdt=parse_dt(published)
                    kickoff=kickoffs.get((season,week,team)) if week else None
                    safe=None
                    if pdt and kickoff:
                        if pdt.tzinfo is not None:kickoff=kickoff.replace(tzinfo=pdt.tzinfo)
                        safe=pdt<kickoff
                    row={"season":season,"team":team,"domain":domain,"publicationType":typ,"title":title,"url":url,
                         "week":week,"publishedAt":published,"kickoffAt":kickoff.isoformat() if kickoff else None,
                         "pregameSafe":safe,"officialTeamDomain":True}
                    evidence.append(row);stats["found"]+=1;by_team[team]["found"]+=1;season_found+=1
                    if published:stats["timestamped"]+=1;by_team[team]["timestamped"]+=1
                    if week:stats["weekMapped"]+=1;by_team[team]["weekMapped"]+=1
                    if safe is True:stats["pregameSafe"]+=1;by_team[team]["pregameSafe"]+=1
                    log(f"      FOUND {typ}: week={week} pregameSafe={safe} | {title[:100]}")

                log(f"    {team} {season}: done; matchedPublications={season_found}")
                write_checkpoint(checkpoint,evidence,stats,by_team,failures,processed)

    except KeyboardInterrupt:
        log("\n[INTERRUPTED] Saving partial results before exit...")
        write_checkpoint(checkpoint,evidence,stats,by_team,failures,processed)
        output.parent.mkdir(parents=True,exist_ok=True)
        with output.open("w",encoding="utf-8") as f:
            for r in evidence:f.write(json.dumps(r,separators=(",",":"))+"\n")
        log(f"[INTERRUPTED] Checkpoint saved: {checkpoint}")
        log(f"[INTERRUPTED] Partial evidence saved: {output}")
        raise SystemExit(130)

    output.parent.mkdir(parents=True,exist_ok=True)
    with output.open("w",encoding="utf-8") as f:
        for r in evidence:f.write(json.dumps(r,separators=(",",":"))+"\n")

    n=stats["found"]
    report={"contractVersion":"FIE-NFL-HISTORICAL-OFFICIAL-TEAM-PUBLICATION-DISCOVERY-REPORT-1.1.0",
      "runnerRevision":"9D.1C2B2B-R1","seasons":seasons,"teamCount":len(TEAMS),
      "processedTeamSeasons":processed,"candidatePublicationCount":n,
      "timestampCoverageRate":stats["timestamped"]/n if n else 0,
      "teamWeekMappingRate":stats["weekMapped"]/n if n else 0,
      "pregameSafeCount":stats["pregameSafe"],
      "pregameSafeRateAmongCandidates":stats["pregameSafe"]/n if n else 0,
      "teamsWithAnyCandidate":sum(1 for v in by_team.values() if v["found"]),
      "teamsWithPregameSafeCandidate":sum(1 for v in by_team.values() if v["pregameSafe"]),
      "requestFailureCount":sum(failures.values()),"failureClasses":dict(failures),
      "byTeam":{k:dict(v) for k,v in sorted(by_team.items())},
      "qualifiedAsScalableAnchorCandidate":bool(n and stats["timestamped"]/n>=.90 and stats["pregameSafe"]>0),
      "replacementMappingsGenerated":False,"datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(report,indent=2),encoding="utf-8")
    write_checkpoint(checkpoint,evidence,stats,by_team,failures,processed)
    log(f"[COMPLETE] candidates={n} pregameSafe={stats['pregameSafe']} failures={sum(failures.values())}")
    log(f"[COMPLETE] report={report_path}")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
