import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("resolveHistoricalOfficialTeamPublicationWeeks.py")
s=importlib.util.spec_from_file_location("r2",p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
checks={}
checks["explicit_week"]=m.explicit_week("Browns depth chart for Week 10 vs. Ravens")==10
checks["opponent_alias"]=m.opponent_mentions("Falcons depth chart released for Minnesota Vikings game","ATL")==["MIN"]
checks["starting_to_rejected"]=m.starter_semantics("Offense starting to come together","EXPLICIT_STARTER_ANNOUNCEMENT")["eligible"] is False
checks["named_qb_accepted"]=m.starter_semantics("Bo Nix named Broncos starting quarterback","EXPLICIT_STARTER_ANNOUNCEMENT")["eligible"] is True
checks["depth_chart_eligible"]=m.starter_semantics("Falcons depth chart released for Vikings game","DEPTH_CHART_RELEASE")["eligible"] is True
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Official Team Publication Semantic Week Resolution","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2B-R2-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks},indent=2))
raise SystemExit(1 if bad else 0)
