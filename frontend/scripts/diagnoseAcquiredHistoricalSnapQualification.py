import importlib.util,pathlib,json,tempfile
p=pathlib.Path(__file__).with_name("qualifyAcquiredHistoricalSnapCounts.py")
sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
with tempfile.TemporaryDirectory() as d:
    f=pathlib.Path(d)/"x.jsonl"
    rows=[
      {"season":2022,"pfr_player_id":"P1","gsis_id":None,"team":"BAL","week":1,"game_id":"g1"},
      {"season":2023,"pfr_player_id":"P2","gsis_id":None,"team":"CAR","week":1,"game_id":"g2"},
      {"season":2024,"pfr_player_id":"P3","gsis_id":None,"team":"KC","week":1,"game_id":"g3"},
    ]
    f.write_text("\n".join(json.dumps(x) for x in rows)+"\n")
    r=m.audit(f,{2022,2023,2024})
checks={
 "three":r["rowCount"]==3,
 "source_full":r["sourceIdentityCoverageRate"]==1,
 "canonical_zero":r["canonicalIdentityCoverageRate"]==0,
 "source_postgame_yes":r["qualifiedForSourceLevelPostgameParticipation"] is True,
 "canonical_join_no":r["qualifiedForCanonicalPlayerJoin"] is False,
 "identity_resolution_required":r["canonicalIdentityResolutionRequired"] is True,
 "pregame_no":r["qualifiedForPregameReplacementDetermination"] is False,
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Acquired Historical Snap Qualification Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
