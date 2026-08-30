import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("discoverHistoricalOfficialTeamPregamePublications.py")
sp=importlib.util.spec_from_file_location("d",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
html='<html><head><meta property="og:title" content="Panthers release depth chart ahead of Week 2"><meta property="article:published_time" content="2024-09-10T17:00:00-04:00"></head></html>'
checks={"team_count":len(m.TEAMS)==32,"title":m.title_from(html)=="Panthers release depth chart ahead of Week 2",
"published":m.published_from(html)=="2024-09-10T17:00:00-04:00",
"class_depth":m.classify("Panthers release depth chart ahead of Week 2")=="DEPTH_CHART_RELEASE",
"class_starter":m.classify("Coach names Smith starting quarterback")=="EXPLICIT_STARTER_ANNOUNCEMENT",
"week_parse":int(m.WEEK_RE.search("ahead of Week 12").group(1))==12}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Official Team Publication Discovery Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
