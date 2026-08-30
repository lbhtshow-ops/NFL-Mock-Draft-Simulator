import importlib.util,pathlib,json,tempfile
p=pathlib.Path(__file__).with_name("acquireHistoricalNFLverseSnapCounts.py")
sp=importlib.util.spec_from_file_location("a",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
row={"season":"2024","game_id":"g","pfr_game_id":"p","game_type":"REG","week":"2","player":"A","pfr_player_id":"AbcdJo00","position":"QB","team":"BAL","opponent":"CIN","offense_snaps":"60","offense_pct":"1","defense_snaps":"0","defense_pct":"0","st_snaps":"0","st_pct":"0"}
n=m.normalize_row(row,2024)
checks={
 "season":n["season"]==2024,
 "pfr_identity":n["pfr_player_id"]=="AbcdJo00",
 "gsis_null":n["gsis_id"] is None,
 "identity_not_resolved":n["canonical_identity_resolved"] is False,
 "postgame":n["evidence_timing"]=="POSTGAME_PARTICIPATION",
 "offense_numeric":n["offense_snaps"]==60,
 "provider":n["source_provider"]=="nflverse/nflverse-data",
 "release":n["source_release"]=="snap_counts",
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Snap Evidence Acquisition Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
