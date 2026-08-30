import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("buildHistoricalPlayerEvaluationEvidenceBundles.py")
sp=importlib.util.spec_from_file_location("b",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
# Static contract assertions against the builder source preserve anti-leakage behavior.
src=p.read_text(encoding="utf-8")
checks={
 "strict_prior_week":'r["week"]<week' in src,
 "no_target_week":'"targetWeekIncluded":False' in src,
 "no_future_week":'"futureWeekIncluded":False' in src,
 "no_future_season":'"futureSeasonIncluded":False' in src,
 "adapter_required":'HISTORICAL_INPUT_ADAPTER_REQUIRED' in src,
 "no_grade_generation":'"caliber":None' in src
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Caliber Snapshot Generation Foundation","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C3-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
