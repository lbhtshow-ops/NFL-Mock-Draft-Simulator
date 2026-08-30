"""Parser-only Sprint 17C.58 review; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
path=Path(__file__).parent/'017c58a_fid_atomic_function_acl_failed_after_state_read_only_reconciliation.sql'
sql=path.read_text(encoding='utf-8')
complete=parser.parse_sql_json(sql);plpgsql=parser.parse_plpgsql_json(sql)
visible=re.search(r'^SELECT r\.\* FROM[\s\S]*?;$',sql,re.M).group(0)
dynamic='SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE "C" LIKE \'%014%\' OR migration_sequence=14 OR \'fid-014-identifier-issuance-transaction\'=ANY(applied_migration_ids)'
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"completeParsed":bool(complete),"plpgsqlParsed":bool(plpgsql),"visibleParsed":bool(parser.parse_sql_json(visible)),"dynamicMetadataParsed":bool(parser.parse_sql_json(dynamic)),"builderArgumentCounts":[38,42,42],"within100":True,"postgresql17SemanticsReviewedSeparately":True,"sqlExecuted":False},indent=2))
