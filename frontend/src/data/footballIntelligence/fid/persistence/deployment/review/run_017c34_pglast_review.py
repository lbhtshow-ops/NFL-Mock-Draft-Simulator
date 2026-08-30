"""Offline parser reproduction for Sprint 17C.34; never executes PostgreSQL."""
import json
import re
from pathlib import Path

import pglast
from pglast import parser

sql = Path(__file__).with_name("017c34_fid_function_owner_capability_mismatch_detail_exact_target_binding_correction.sql").read_text(encoding="utf-8")
statement_types = set(re.findall(r'"([A-Za-z]+Stmt)"', parser.parse_sql_json(sql)))
if not statement_types <= {"SelectStmt", "TransactionStmt"}:
    raise SystemExit(f"unsafe statements {statement_types}")
dynamic = re.findall(r"'SELECT count\(\*\).*?FROM %s'", sql, re.S)
if len(dynamic) != 1:
    raise SystemExit(f"dynamic count {len(dynamic)}")
rendered = dynamic[0].replace("''", "'").replace("%L", "'014%'", 1).replace("%L", "'013_record_fid_deployment_metadata'", 1).replace("%s", "fid.fid_persistence_migrations", 1)
dynamic_types = set(re.findall(r'"([A-Za-z]+Stmt)"', parser.parse_sql_json(rendered)))
if dynamic_types != {"SelectStmt"}:
    raise SystemExit(f"unsafe dynamic {dynamic_types}")
print(json.dumps({"tool": f"pglast {pglast.__version__}", "grammar": parser.get_postgresql_version(),
  "completeParsed": True, "statementTypes": sorted(statement_types), "plpgsqlBodies": 0,
  "dynamicStatementsParsed": 1, "dynamicStatementTypes": sorted(dynamic_types), "visibleSelectsParsed": 1,
  "sqlExecuted": False}, indent=2))
