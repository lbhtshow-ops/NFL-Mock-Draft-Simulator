"""Offline parser review for Sprint 17C.32; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
sql=Path(__file__).with_name("017c32_fid_function_owner_capability_mismatch_detail_correction.sql").read_text(encoding="utf-8")
types=set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql)))
if not types<={"SelectStmt","TransactionStmt"}:raise SystemExit(f"unsafe statements: {types}")
dynamic=re.findall(r"query_to_xml\(pg_catalog\.format\(\s*'((?:''|[^'])*)'",sql,re.I|re.S)
if len(dynamic)!=1:raise SystemExit(f"dynamic count {len(dynamic)}")
rendered=dynamic[0].replace("''","'").replace("%L","'014%'",1).replace("%L","'013_record_fid_deployment_metadata'",1).replace("%s","fid.fid_persistence_migrations",1)
dynamic_types=set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(rendered)))
if dynamic_types!={"SelectStmt"}:raise SystemExit(f"unsafe dynamic {dynamic_types}")
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"completeParsed":True,"statementTypes":sorted(types),"dynamicStatementsParsed":1,"dynamicStatementTypes":sorted(dynamic_types),"visibleSelectsParsed":1,"sqlExecuted":False},indent=2))
