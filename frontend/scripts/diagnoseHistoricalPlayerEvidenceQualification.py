import importlib.util,json,pathlib
p=pathlib.Path(__file__).with_name("qualifyHistoricalPlayerEvidence.py")
sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={}
def ck(n,v):checks[n]=bool(v)
good={"playerId":"P1","team":"BAL","position":"QB","season":2024,"week":5,"gameId":"g","asOf":"2024-10-01T12:00:00+00:00","kickoffAt":"2024-10-01T20:00:00+00:00","status":"AVAILABLE","caliber":92,"confidence":.8,"modelVersion":"M","provenance":{"source":"canonical"}}
ck("good_caliber",not m.qcal(good))
ck("late_blocked","HISTORICAL_CALIBER_FUTURE_LEAKAGE" in m.qcal({**good,"asOf":"2024-10-02T12:00:00+00:00"}))
ck("missing_model_blocked","MODELVERSION_REQUIRED" in m.qcal({**good,"modelVersion":None}))
mp={"unavailablePlayerId":"P1","replacementPlayerId":"P2","team":"BAL","position":"QB","season":2024,"week":5,"gameId":"g","asOf":"2024-10-01T12:00:00+00:00","evidenceType":"EXPLICIT_DEPTH_CHART","confidence":.9,"provenance":{"source":"depth"}}
ck("good_mapping",not m.qmap(mp))
ck("bad_evidence_blocked","EXPLICIT_REPLACEMENT_EVIDENCE_REQUIRED" in m.qmap({**mp,"evidenceType":"ROSTER_ORDER"}))
ck("same_player_blocked","REPLACEMENT_MUST_DIFFER" in m.qmap({**mp,"replacementPlayerId":"P1"}))
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Evidence Qualification Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
