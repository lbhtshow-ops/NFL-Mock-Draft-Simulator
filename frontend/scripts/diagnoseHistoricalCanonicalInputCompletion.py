import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("buildHistoricalCanonicalInputCompletion.py")
sp=importlib.util.spec_from_file_location("x",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={
 "idl_to_dl":m.normalize("IDL")=="DL","dt_to_dl":m.normalize("DT")=="DL",
 "fs_to_s":m.normalize("FS")=="S","ss_to_s":m.normalize("SS")=="S",
 "mlb_to_lb":m.normalize("MLB")=="LB","olb_to_lb":m.normalize("OLB")=="LB",
 "t_to_ot":m.normalize("T")=="OT","g_to_iol":m.normalize("G")=="IOL",
 "db_not_guessed":m.normalize("DB") is None,"unknown_not_guessed":m.normalize("UNKNOWN") is None
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Canonical Input Completion Builder","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C9A-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks},indent=2));raise SystemExit(1 if bad else 0)
