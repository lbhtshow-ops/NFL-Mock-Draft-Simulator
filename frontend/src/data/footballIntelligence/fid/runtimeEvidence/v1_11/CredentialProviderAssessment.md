# Credential-provider assessment

Decision: `CREDENTIAL_PROVIDER_WINDOWS_SECURE_STORE_PREFERRED`. A secure operator prompt with temporary in-memory injection is the fallback. A process environment variable containing only the password is conditionally acceptable after security review; repository `.env`, command-line password, full URI, browser delivery, evidence storage, anon key, and service-role API key are rejected.

`CredentialProvider.getCredential(request)` remains Node-only, accepts a bounded provider/role/target reference, returns exactly one bounded secret value or sanitized cancellation/failure, exposes no environment object, logs and persists nothing, supports rotation, minimizes lifetime, and allows best-effort overwrite of mutable buffers while acknowledging JavaScript string zeroization limits. It never returns evidence. No credential was requested or loaded in this sprint.
