import importlib.util,json,pathlib
p=pathlib.Path(__file__).with_name("joinHistoricalPlayerCaliberAndReplacements.py")
sp=importlib.util.spec_from_file_location("j",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={}
def ck(n,v):checks[n]=bool(v)
cal={"gameId":"g","team":"BAL","playerId":"P1","status":"AVAILABLE","caliber":92,"asOf":"2024-10-01T12:00:00","modelVersion":"M"}
ck("cal_key",m.caliber_key(cal)==("g","BAL","P1"))
ck("cal_safe",m.valid_caliber(cal,"2024-10-01T20:00:00"))
late=dict(cal,asOf="2024-10-02T12:00:00")
ck("late_blocked",not m.valid_caliber(late,"2024-10-01T20:00:00"))
mp={"gameId":"g","team":"BAL","unavailablePlayerId":"P1","replacementPlayerId":"P2","evidenceType":"EXPLICIT_DEPTH_CHART"}
ck("mapping_valid",m.valid_mapping(mp))
badmp=dict(mp,evidenceType=None)
ck("mapping_requires_evidence",not m.valid_mapping(badmp))
same=dict(mp,replacementPlayerId="P1")
ck("same_player_blocked",not m.valid_mapping(same))
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Caliber & Replacement Join Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
