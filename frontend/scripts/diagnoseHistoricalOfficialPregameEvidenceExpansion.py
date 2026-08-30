import importlib.util,pathlib,json
p=pathlib.Path(__file__).with_name("expandHistoricalOfficialPregameEvidence.py")
s=importlib.util.spec_from_file_location("r3",p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
game={"season":2024,"week":10,"team":"ATL","opponent":"NO"}
checks={
 "teams_32":len(m.TEAMS)==32,
 "week_relevant":m.relevant_for_game("falcons depth chart for week 10",game),
 "opponent_relevant":m.relevant_for_game("falcons depth chart released for new orleans saints game",game),
 "generic_not_relevant":not m.relevant_for_game("falcons training camp notebook",game),
 "depth_class":m.classify("Falcons release depth chart")=="OFFICIAL_DEPTH_CHART_RELEASE",
 "game_release_class":m.classify("Falcons weekly game release")=="OFFICIAL_WEEKLY_GAME_RELEASE",
}
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Official Pregame Evidence Expansion Runner","contractVersion":"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9D1C2B2B-R3-1.0.0","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
