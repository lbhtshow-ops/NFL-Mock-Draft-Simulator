"""Offline parser review for Sprint 17C.47; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
root=Path(__file__).parent
files=[root/'017c47a_fid_atomic_function_acl_owner_preserving_remediation.sql',root/'017c46a_fid_atomic_function_acl_corrected_preflight.sql',root/'017c47b_fid_atomic_function_acl_owner_preserving_reconciliation.sql',root/'017c47c_fid_atomic_function_acl_owner_preserving_post_verification.sql'];report={}
for path in files:
 sql=path.read_text(encoding='utf-8');types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql))));plpgsql=json.loads(parser.parse_plpgsql_json(sql));dynamic=len(re.findall(r"EXECUTE pg_catalog\.format\('SELECT count\(\*\) FROM %s",sql));dynamic_sql="SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE \"C\" LIKE '%014%' OR migration_sequence=14 OR 'fid-014-identifier-issuance-transaction'=ANY(applied_migration_ids)";dynamic_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(dynamic_sql)))) if dynamic else []
 report[path.name]={"statementTypes":types,"plpgsqlParsed":bool(plpgsql),"dynamicStatements":dynamic,"dynamicStatementTypes":dynamic_types,"visibleSelects":len(re.findall(r'^SELECT r\.\* FROM',sql,re.M))}
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"files":report,"completeParsed":len(report)==4,"sqlExecuted":False},indent=2))
