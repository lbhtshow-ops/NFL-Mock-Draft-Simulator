import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("auditHistoricalPregameTemporalAnchors.py")
sp=importlib.util.spec_from_file_location("a",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
depth=[{"season":2024,"week":1,"gsis_id":"00-1","depth_rank":1,"source_timestamp":None}]
availability={"results":[{"season":2024,"sourceAvailable":True,"dateModifiedCoverageRate":1.0,"pregameSafeRate":.99,"qualifiedForJoin":True}]}
r=m.audit(depth,availability)
checks={
 "depth_not_temporal":r["qualifiedForPregameDepthChartTemporalEvidence"] is False,
 "injury_available":r["candidateAnchorClasses"]["INJURY_REPORT_TIMESTAMP"]["available"] is True,
 "injury_not_depth":r["candidateAnchorClasses"]["INJURY_REPORT_TIMESTAMP"]["qualifiedForDepthChartPublication"] is False,
 "week_not_proof":r["weekScopeAcceptedAsTemporalProof"] is False,
 "injury_not_reused":r["injuryTimestampReusedAsDepthTimestamp"] is False,
 "replacement_blocked":r["qualifiedForPregameReplacementMapping"] is False,
 "publication_needed":"SOURCE_PUBLICATION_METADATA" in r["requiredNextEvidence"],
 "starter_needed":"EXPLICIT_STARTER_ANNOUNCEMENT" in r["requiredNextEvidence"],
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Pregame Temporal Anchor Audit Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
