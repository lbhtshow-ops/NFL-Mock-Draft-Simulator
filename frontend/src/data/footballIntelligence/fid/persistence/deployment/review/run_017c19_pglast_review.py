"""Offline parser review. Reads SQL only; never connects to or executes against PostgreSQL."""
from __future__ import annotations

import json
import re
from pathlib import Path
import pglast
from pglast import parser

ROOT = Path(__file__).resolve().parent
UNITS = {
    "protected_amendment_017c15": ROOT / "017c15a_fid_function_owner_capability_amendment_authority_and_boundary_correction.sql",
    "preflight_017c19": ROOT / "017c19a_fid_function_owner_capability_acl_matrix_preflight.sql",
    "reconciliation_017c19": ROOT / "017c19b_fid_function_owner_capability_acl_matrix_reconciliation.sql",
    "post_verification_017c19": ROOT / "017c19c_fid_function_owner_capability_acl_matrix_post_verification.sql",
}
ALLOWED_TOP_LEVEL = {"DoStmt", "GrantStmt"}
MUTATING = {"InsertStmt", "UpdateStmt", "DeleteStmt", "TruncateStmt", "CreateStmt", "CreateFunctionStmt", "AlterTableStmt", "DropStmt"}


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


def dynamic_statements(sql: str) -> list[str]:
    values = re.findall(r"EXECUTE\s+pg_catalog\.format\(\s*'((?:''|[^'])*)'", sql, re.I | re.S)
    rendered = []
    for value in values:
        value = value.replace("''", "'")
        value = value.replace("%L", "'017c19_literal'", 1).replace("%L", "'013_record_fid_deployment_metadata'", 1)
        value = value.replace("%s", "fid.fid_persistence_migrations")
        rendered.append(value)
    return rendered


report = {
    "tool": f"pglast {pglast.__version__}",
    "grammar": parser.get_postgresql_version(),
    "top_level": {},
    "dynamic": {},
    "plpgsql": {},
    "limitations": [
        "Parser grammar is PostgreSQL 18.4; package version does not establish PostgreSQL 17 equivalence.",
        "Catalog existence, OIDs, ACL semantics, role membership, and target state require controlled PostgreSQL execution.",
    ],
}

for name, path in UNITS.items():
    sql = path.read_text(encoding="utf-8")
    tree = json.loads(parser.parse_sql_json(sql))
    types = statement_types(tree)
    unexpected = types - ALLOWED_TOP_LEVEL
    if name != "protected_amendment_017c15" and (unexpected & MUTATING):
        raise SystemExit(f"hidden mutation in {name}: {sorted(unexpected & MUTATING)}")
    report["top_level"][name] = {"parsed": True, "statement_types": sorted(types)}
    embedded = dynamic_statements(sql)
    parsed_dynamic = []
    for index, statement in enumerate(embedded):
        dynamic_tree = json.loads(parser.parse_sql_json(statement))
        dynamic_types = statement_types(dynamic_tree)
        if dynamic_types & MUTATING:
            raise SystemExit(f"mutating dynamic SQL in {name}#{index + 1}")
        parsed_dynamic.append({"index": index + 1, "parsed": True, "statement_types": sorted(dynamic_types)})
    report["dynamic"][name] = parsed_dynamic
    if "DO $" in sql:
        plpgsql = json.loads(parser.parse_plpgsql_json(sql))
        report["plpgsql"][name] = {"parsed": True, "structural_nodes": len(json.dumps(plpgsql)),
            "reviewed": ["declarations", "IF/ELSIF/ELSE", "loops", "RETURN paths", "EXECUTE paths", "dollar quoting", "RAISE behavior"]}

print(json.dumps(report, indent=2))
