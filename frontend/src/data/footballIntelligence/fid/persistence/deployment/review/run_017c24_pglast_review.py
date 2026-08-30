"""Offline Sprint 17C.24 parser review; never connects to or executes PostgreSQL."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pglast
from pglast import parser

SQL_PATH = Path(__file__).with_name(
    "017c24_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight.sql"
)
MUTATING = {
    "InsertStmt", "UpdateStmt", "DeleteStmt", "MergeStmt", "TruncateStmt",
    "CreateStmt", "CreateFunctionStmt", "AlterTableStmt", "DropStmt", "GrantStmt",
}


def statement_types(tree: object) -> set[str]:
    found: set[str] = set()
    if isinstance(tree, dict):
        for key, value in tree.items():
            if key.endswith("Stmt") or key == "DoStmt":
                found.add(key)
            found.update(statement_types(value))
    elif isinstance(tree, list):
        for value in tree:
            found.update(statement_types(value))
    return found


sql = SQL_PATH.read_text(encoding="utf-8")
tree = json.loads(parser.parse_sql_json(sql))
types = statement_types(tree)
if types & MUTATING:
    raise SystemExit(f"mutating statement found: {sorted(types & MUTATING)}")

dynamic = re.findall(r"EXECUTE\s+pg_catalog\.format\(\s*'((?:''|[^'])*)'", sql, re.I | re.S)
if len(dynamic) != 1:
    raise SystemExit(f"expected one dynamic SQL statement, found {len(dynamic)}")
rendered = dynamic[0].replace("''", "'")
rendered = rendered.replace("%L", "'014%'", 1).replace("%L", "'013_record_fid_deployment_metadata'", 1)
rendered = rendered.replace("%s", "fid.fid_persistence_migrations")
dynamic_types = statement_types(json.loads(parser.parse_sql_json(rendered)))
if dynamic_types & MUTATING or dynamic_types != {"SelectStmt"}:
    raise SystemExit(f"unsafe dynamic SQL: {sorted(dynamic_types)}")

plpgsql = json.loads(parser.parse_plpgsql_json(sql))
final_select = re.search(r"(WITH payload AS \([\s\S]*?\nCOMMIT;)", sql, re.I)
if final_select is None:
    raise SystemExit("final visible SELECT not found")
select_sql = final_select.group(1).rsplit("COMMIT;", 1)[0]
select_types = statement_types(json.loads(parser.parse_sql_json(select_sql)))
if select_types != {"SelectStmt"}:
    raise SystemExit(f"unexpected final result statements: {sorted(select_types)}")

print(json.dumps({
    "tool": f"pglast {pglast.__version__}",
    "grammar": parser.get_postgresql_version(),
    "completeSuccessorParsed": True,
    "topLevelStatementTypes": sorted(types),
    "dynamicStatementsParsed": 1,
    "dynamicStatementTypes": sorted(dynamic_types),
    "plpgsqlBodyParsed": bool(plpgsql),
    "finalVisibleSelectParsed": True,
    "finalVisibleSelectTypes": sorted(select_types),
    "sqlExecuted": False,
}, indent=2))
