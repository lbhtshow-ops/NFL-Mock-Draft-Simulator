"""Offline parser review for Sprint 17C.44; never executes PostgreSQL."""
import json
import re
from pathlib import Path
import pglast
from pglast import parser

root=Path(__file__).parent
files=sorted(root.glob("017c44?_fid_atomic_function_acl_*.sql"))
parsed={}
for path in files:
    sql=path.read_text(encoding="utf-8")
    statement_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql))))
    plpgsql=[]
    if "$fid_acl_remediation$" in sql:
        plpgsql.append(parser.parse_plpgsql_json(sql))
    parsed[path.name]={"statementTypes":statement_types,"plpgsqlBodies":len(plpgsql),"visibleSelects":len(re.findall(r"\bSELECT\b",sql,re.I))}
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"files":parsed,"completeParsed":len(parsed)==4,"sqlExecuted":False},indent=2))
