# Error sanitization design

Allowed after syntax/length validation: `code`, normalized severity, and a repository-owned bounded message code. Conditionally allowed and redacted: position/internalPosition and schema/table/column/dataType/constraint/routine only for a pre-approved diagnostic stage and non-sensitive identifiers. `message`, `detail`, and `hint` are excessive-detail/application-data risks and become owned codes, never verbatim evidence. Password, connection string, host/endpoint secret, connection metadata, full SQL, stack, cause chains, and arbitrary properties are prohibited.

Raw errors may exist transiently inside local Node control flow but must not be logged, returned in portable evidence, or attached as `cause`. Mapping failures fail closed to `PG_ERROR_UNCLASSIFIED`. Target identifiers remain references, never observed truth.
