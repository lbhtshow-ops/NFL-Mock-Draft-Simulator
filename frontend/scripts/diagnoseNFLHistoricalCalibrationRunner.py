import importlib.util,json,pathlib
p=pathlib.Path(__file__).with_name("runNFLHistoricalCalibrationDatasetV1.py")
s=importlib.util.spec_from_file_location("r",p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
c={"hhmm":m.kickoff_iso({"gameday":"2025-09-07","gametime":"13:00"})=="2025-09-07T13:00:00","hhmmss":m.kickoff_iso({"gameday":"2025-09-07","gametime":"20:20:00"})=="2025-09-07T20:20:00","default_time":m.kickoff_iso({"gameday":"2025-09-07","gametime":""})=="2025-09-07T12:00:00","builtin_utc":bool(m.datetime.now(m.timezone.utc).isoformat()),"zoneinfo_removed":"from zoneinfo import" not in p.read_text()}
b=[k for k,v in c.items() if not v]
print(json.dumps({"suite":"NFL Historical Calibration Runner Portability","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D-RC2-1.0.0","status":"FAIL" if b else "PASS","passed":len(c)-len(b),"failed":len(b),"checks":c,"failures":b},indent=2))
raise SystemExit(1 if b else 0)
