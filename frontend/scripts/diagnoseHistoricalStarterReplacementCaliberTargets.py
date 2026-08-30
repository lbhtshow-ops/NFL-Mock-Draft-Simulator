import importlib.util,pathlib,json,tempfile
p=pathlib.Path(__file__).with_name("enrichHistoricalReplacementPairsWithCaliber.py")
sp=importlib.util.spec_from_file_location("e",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={
 "valid_available":m.valid_snapshot({"status":"AVAILABLE","temporallySafe":True,"caliber":88}) is True,
 "reject_unsafe":m.valid_snapshot({"status":"AVAILABLE","temporallySafe":False,"caliber":88}) is False,
 "reject_missing":m.valid_snapshot({"status":"UNAVAILABLE","temporallySafe":True,"caliber":None}) is False,
 "snapshot_key":m.snapshot_key({"season":2024,"week":2,"team":"BAL","playerId":"P1"})==(2024,2,"BAL","P1"),
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Starter/Replacement Caliber Target & Enrichment Runner","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C2-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
