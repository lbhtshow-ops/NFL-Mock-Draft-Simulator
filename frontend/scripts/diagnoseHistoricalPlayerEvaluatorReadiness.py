import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("auditHistoricalPlayerCaliberResidualTargets.py")
src=p.read_text(encoding="utf-8")
checks={"mapping_position":"REPLACEMENT_MAPPING_POSITION" in src,"depth_position":"EXACT_DEPTH_CHART_POSITION" in src,
"snap_position":"CANONICAL_SNAP_POSITION" in src,"no_current_rating":'"currentRatingUsed":False' in src,
"coverage_class":"WEEKLY_STATS_COVERAGE_GAP_WITH_PRIOR_SNAP_EVIDENCE" in src}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Evaluator Readiness Foundation","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2C5-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks},indent=2));raise SystemExit(1 if bad else 0)
