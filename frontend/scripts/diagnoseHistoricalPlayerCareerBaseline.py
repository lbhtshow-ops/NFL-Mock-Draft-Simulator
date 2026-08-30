import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("buildHistoricalPlayerCareerBaselineBundles.py")
sp=importlib.util.spec_from_file_location("c",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={"fs_to_s":m.norm("FS")=="S","ss_to_s":m.norm("SS")=="S","mlb_to_lb":m.norm("MLB")=="LB","olb_to_lb":m.norm("OLB")=="LB",
"t_to_ot":m.norm("T")=="OT","g_to_iol":m.norm("G")=="IOL","de_to_edge":m.norm("DE")=="EDGE",
"qb_features":"passingYards" in m.FAMILIES["QB"],"rb_features":"rushingYards" in m.FAMILIES["RB"],"cb_features":"interceptionsDef" in m.FAMILIES["CB"]}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Career Baseline Foundation","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C4-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2));raise SystemExit(1 if bad else 0)
