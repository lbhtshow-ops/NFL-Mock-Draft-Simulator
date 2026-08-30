"""Offline parser review for Sprint 17C.46; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
root=Path(__file__).parent
files=sorted(root.glob("017c46?_fid_atomic_function_acl_corrected_*.sql")); report={}
for path in files:
    sql=path.read_text(encoding="utf-8")
    types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql))))
    plpgsql=json.loads(parser.parse_plpgsql_json(sql))
    dynamic_count=len(re.findall(r"EXECUTE pg_catalog\.format\('SELECT count\(\*\) FROM %s",sql))
    dynamic_sql="SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE \"C\" LIKE '%014%' OR migration_sequence=14 OR 'fid-014-identifier-issuance-transaction'=ANY(applied_migration_ids)"
    dynamic_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(dynamic_sql)))) if dynamic_count==1 else []
    report[path.name]={"statementTypes":types,"plpgsqlParsed":bool(plpgsql),"dynamicStatements":dynamic_count,"dynamicStatementTypes":dynamic_types,"finalVisibleSelects":len(re.findall(r"^SELECT r\.\* FROM",sql,re.M))}
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"files":report,"completeParsed":len(report)==3,"sqlExecuted":False},indent=2))
