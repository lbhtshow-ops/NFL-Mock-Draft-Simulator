# Existing adapter reuse decision

Decision: `postgresTransactionWitnessAdapter.js` remains authoritative. v1_10B may implement a thin Node-only driver translating its existing port operations to one injected `pg.Client`: acquire, begin, execute governed stage, rollback, and release/end. No second transaction adapter, lifecycle, result model, atomic profile, or evidence model is permitted.

The only required bridge work is beneath the driver port. Any discovered incompatibility must stop v1_10B and return for review rather than modify the protected adapter silently. The existing adapter already serializes awaited stages, enforces identity bindings/output bytes/rows, records transaction requests and acknowledgements, preserves uncertainty, releases once, and reports zero retry.
