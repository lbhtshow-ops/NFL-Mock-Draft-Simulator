import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("qualifyHistoricalSnapCountEvidence.py")
sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
rows=[
 {"season":2022,"week":1,"team":"BAL","player_id":"00-1","offense_snaps":10},
 {"season":2023,"week":2,"team":"CAR","gsis_id":"00-2","defense_snaps":22},
 {"season":2024,"week":3,"recent_team":"KC","playerId":"00-3","st_snaps":8},
]
r=m.audit(rows,{2022,2023,2024})
checks={
 "three_rows":r["rowCount"]==3,
 "all_seasons":len(r["rowsBySeason"])==3,
 "identity_full":r["identityCoverageRate"]==1,
 "team_full":r["teamCoverageRate"]==1,
 "week_full":r["weekCoverageRate"]==1,
 "postgame_qualified":r["qualifiedForPostgameParticipationCorroboration"] is True,
 "pregame_blocked":r["qualifiedForPregameReplacementDetermination"] is False,
 "no_mapping":r["replacementMappingsGenerated"] is False,
 "no_caliber":r["caliberGenerated"] is False,
 "no_mutation":r["datasetMutated"] is False,
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Snap Count Evidence Qualification Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
