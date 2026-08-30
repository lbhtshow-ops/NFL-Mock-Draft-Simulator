import importlib.util,pathlib,json,tempfile
p=pathlib.Path(__file__).with_name("resolveHistoricalSnapPlayerIdentities.py")
sp=importlib.util.spec_from_file_location("r",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={}
def ck(n,v):checks[n]=bool(v)
ck("missing",m.classify_mapping([])==("UNRESOLVED_MISSING",None))
ck("single",m.classify_mapping([{"gsis_id":"00-1"}])==("RESOLVED","00-1"))
ck("duplicate_same",m.classify_mapping([{"gsis_id":"00-1"},{"gsis_id":"00-1"}])==("RESOLVED","00-1"))
ck("no_gsis",m.classify_mapping([{"gsis_id":None}])==("UNRESOLVED_NO_GSIS",None))
ck("ambiguous",m.classify_mapping([{"gsis_id":"00-1"},{"gsis_id":"00-2"}])==("UNRESOLVED_AMBIGUOUS",None))
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"Historical Player Identity Resolution Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
