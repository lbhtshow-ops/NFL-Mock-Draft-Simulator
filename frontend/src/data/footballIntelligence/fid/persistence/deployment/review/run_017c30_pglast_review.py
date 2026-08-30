"""Offline parser review for the Sprint 17C.30 read-only mismatch diagnostic."""
from __future__ import annotations
import json
import re
from pathlib import Path
import pglast
from pglast import parser

SQL_PATH=Path(__file__).with_name("017c30_fid_function_owner_capability_mismatch_detail_read_only_diagnostic.sql")
sql=SQL_PATH.read_text(encoding="utf-8")
tree=json.loads(parser.parse_sql_json(sql))
types=set(re.findall(r'"([A-Za-z]+Stmt)"',json.dumps(tree)))
allowed={"SelectStmt","TransactionStmt"}
if not types<=allowed: raise SystemExit(f"non-read-only statements: {sorted(types-allowed)}")
dynamic=re.findall(r"query_to_xml\(pg_catalog\.format\(\s*'((?:''|[^'])*)'",sql,re.I|re.S)
if len(dynamic)!=1: raise SystemExit(f"expected one dynamic aggregate, found {len(dynamic)}")
rendered=dynamic[0].replace("''","'").replace("%L","'014%'",1).replace("%L","'013_record_fid_deployment_metadata'",1).replace("%s","fid.fid_persistence_migrations",1)
dynamic_types=set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(rendered)))
if dynamic_types!={"SelectStmt"}: raise SystemExit(f"unsafe dynamic query: {sorted(dynamic_types)}")
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"completeParsed":True,
  "statementTypes":sorted(types),"dynamicStatementsParsed":1,"dynamicStatementTypes":sorted(dynamic_types),
  "visibleSelectsParsed":1,"sqlExecuted":False},indent=2))
