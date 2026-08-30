# Result boundary design

Reuse the atomic profile maxima: at most 64 rows and 8192 serialized UTF-8 bytes, with fixture defaults of 8 rows/1024 bytes. Add mapper maxima of 32 columns, 256 UTF-8 bytes per string, nesting depth 2, and 4096 bytes per value. Permit null, boolean, safe finite number, bounded string, and bounded arrays/plain objects composed solely of permitted scalars. Reject bigint, symbol, function, cycles, Buffer/typed arrays, Date, custom prototypes, non-finite numbers, excessive nesting, columns, strings, rows, or bytes.

Portable observations may include sanitized command, nonnegative rowCount, bounded rows, and bounded field name/type identifiers only when required. Raw Client/connection/parser objects, unrestricted catalogs, application data, and raw query text are prohibited. Unsupported or oversized data fails closed; it is never truncated into a misleading success observation.
