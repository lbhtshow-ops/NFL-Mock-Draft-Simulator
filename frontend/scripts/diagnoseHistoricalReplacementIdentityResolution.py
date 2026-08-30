import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("resolveHistoricalExpectedReplacementIdentities.py")
sp=importlib.util.spec_from_file_location("r",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
rows=[
 {"gsis_id":"P1","depth_position":"QB","depth_rank":1},
 {"gsis_id":"P2","depth_position":"QB","depth_rank":2},
 {"gsis_id":"P3","depth_position":"QB","depth_rank":3},
 {"gsis_id":"W1","depth_position":"WR-X","depth_rank":1},
]
a=m.find_replacement("P1",rows);b=m.find_replacement("P2",rows);c=m.find_replacement("W1",rows);d=m.find_replacement("X",rows)
checks={
 "qb1_to_qb2":a[0]=="P2" and a[1]=="RESOLVED_EXPLICIT_DEPTH_CHART",
 "qb2_to_qb3":b[0]=="P3",
 "no_next_null":c[0] is None,
 "missing_null":d[0] is None,
 "availability_out":len(m.availability_players({"evidence":{"availabilityImpact":{"players":[{"playerId":"A","reportStatus":"OUT"},{"playerId":"B","reportStatus":"QUESTIONABLE"}]}}}))==1
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Replacement Identity Resolution Runner","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C1-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
