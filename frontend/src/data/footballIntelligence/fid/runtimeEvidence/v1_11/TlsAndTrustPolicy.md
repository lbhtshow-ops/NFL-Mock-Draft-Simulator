# TLS and trust policy

Future connections require encryption, certificate-chain verification, and hostname validation. Silent downgrade and blanket `rejectUnauthorized: false` are prohibited. The configured hostname must equal the attested endpoint hostname. TLS failures are reduced to bounded phase/category fields; certificates, raw CA bodies, private keys, connection strings, and TLS internals are excluded from portable evidence.

The trust source must be selected explicitly from official Supabase evidence: system trust only if officially supported for the exact endpoint, otherwise a separately governed public CA reference/fingerprint mechanism. Repository evidence does not establish which applies. Channel binding is a separate compatibility assessment.

Readiness: `TLS_POLICY_REQUIRES_OFFICIAL_SUPABASE_CA_REVIEW`. Policy shape is ready; CA source and endpoint certificate behavior are blockers.
