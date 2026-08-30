# Supabase function-owner capability preflight static review

The protected `017c6_supabase_function_owner_deployment_capability_read_only_preflight.sql`, SHA-256 `3D42FF4F38C7A3C3D7275F461E24BB55AB6B41DA8B6977537E67B3ADF695786B`, is read-only, sanitized, and uses valid PostgreSQL 17 role catalogs and membership modes. It contains neither the earlier UNION ordering defect nor the reserved `constraint` alias defect.

The review nevertheless found a coverage defect. Block E reports effective MEMBER, USAGE, SET, ADMIN, and target-owner schema CREATE, but does not report deployment-role schema USAGE/CREATE or target-owner schema USAGE. Its transfer boolean is also calculated for the named `postgres` role without requiring `CURRENT_USER` and `SESSION_USER` to equal that authorized identity. Therefore 017c6 does not satisfy the Sprint 17C.8 execution-authorization standard and remains unexecuted.

The additive `017c7_supabase_function_owner_deployment_capability_read_only_preflight_correction.sql`, SHA-256 `BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57`, preserves blocks A–D except its version header and narrowly extends block E. It reports both identities, schema existence, deployment-role USAGE/CREATE, target-owner USAGE/CREATE, and requires the exact identities, SET capability, and all governed schema capabilities before returning `FUNCTION_OWNER_TRANSFER_CAPABILITY_CONFIRMED`.

Both files remain read-only and unexecuted. The selected outcome is `SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_CORRECTION_REQUIRED`. A separate sprint must statically review 017c7 before any execution authorization can be considered. Migration 014, role changes, grants, RPC calls, and database operations remain prohibited.
