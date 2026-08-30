import importlib.util,json,pathlib,tempfile,csv
p=pathlib.Path(__file__).with_name("qualifyNFLHistoricalAvailabilitySource.py")
sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
checks={}
def ck(n,v):checks[n]=bool(v)
ck("required_columns",len(m.REQUIRED)>=11)
ck("csv_url",m.CSV_URL.endswith("injuries_{season}.csv"))
ck("parquet_url",m.PARQUET_URL.endswith("injuries_{season}.parquet"))
rows=[{"season":"2024","team":"BAL","week":"1","gsis_id":"00-1","position":"QB","full_name":"A","report_primary_injury":"ankle","report_status":"Questionable","practice_primary_injury":"ankle","practice_status":"Full","date_modified":"2024-09-01T10:00:00"}]
buf=",".join(m.REQUIRED)+"\n"+",".join(rows[0].get(c,"") for c in m.REQUIRED)+"\n"
cols,parsed=m.parse_csv_bytes(buf.encode())
ck("csv_parse",cols==m.REQUIRED and len(parsed)==1)
r=m.qualify(2024,{"available":True,"format":"CSV","url":"x","data":buf.encode(),"attempts":[]},{(2024,1,"BAL"):m.datetime.fromisoformat("2024-09-01T13:00:00")})
ck("synthetic_join_qualified",r["qualifiedForJoin"] is True)
ck("pregame_rate",r["pregameSafeRate"]==1.0)
bad=[k for k,v in checks.items() if not v]
print(json.dumps({"suite":"NFL Historical Availability Qualification Runner","status":"FAIL" if bad else "PASS","passed":len(checks)-len(bad),"failed":len(bad),"checks":checks,"failures":bad},indent=2))
raise SystemExit(1 if bad else 0)
