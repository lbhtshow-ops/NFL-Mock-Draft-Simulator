import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("acquireHistoricalNFLverseDepthCharts.py")
sp=importlib.util.spec_from_file_location("a",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
old={"season":"2024","week":"5","club_code":"BAL","gsis_id":"00-1","full_name":"A","position":"QB","formation":"Offense","depth_position":"QB","depth_team":"1"}
new={"season":"2025","team":"BAL","gsis_id":"00-2","player_name":"B","pos_abb":"QB","pos_grp":"Offense","pos_slot":"1","pos_rank":"2","dt":"2025-09-01T10:00:00Z"}
o=m.normalize(old,2024);n=m.normalize(new,2025)
checks={
 "old_team":o["team"]=="BAL","old_gsis":o["gsis_id"]=="00-1","old_week":o["week"]==5,
 "old_rank":o["depth_rank"]==1,"new_timestamp":n["source_timestamp"]=="2025-09-01T10:00:00Z",
 "new_rank":n["depth_rank"]==2,"default_temporal_false":o["pregame_temporal_safety_verified"] is False
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Depth Chart Acquisition Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
