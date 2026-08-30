import importlib.util,pathlib,json,urllib.error,socket
p=pathlib.Path(__file__).with_name("discoverHistoricalOfficialTeamPregamePublications.py")
sp=importlib.util.spec_from_file_location("d",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={
 "all_32_teams":len(m.TEAMS)==32,
 "depth_classification":m.classify("Ravens release depth chart ahead of Week 4")=="DEPTH_CHART_RELEASE",
 "starter_classification":m.classify("Coach names Jones starting quarterback")=="EXPLICIT_STARTER_ANNOUNCEMENT",
 "checkpoint_function":callable(m.write_checkpoint),
 "safe_get_function":callable(m.safe_get),
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Official Team Publication Discovery R1","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2B-R1-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
