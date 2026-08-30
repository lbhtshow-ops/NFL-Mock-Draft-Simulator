# No-live diagnostic plan

v1_10B diagnostics use only the injected fake and instrument globals/modules where feasible to fail on socket, DNS, environment, Supabase, or Pool access. They cover exact package/version/exports; one factory/client/connect/end; connect failure; deadlines; error/end events; no reconnect; one BEGIN; serial stages/observations; rollback and rollback uncertainty; no commit in rollback-required fixtures; exact payload identity/order; no replay/concurrency/extra query; bounded result/error mapping; controller one-attempt/one-witness/package/writer integration; mandatory stop; synthetic classification; and zero live claims.

Negative assertions: zero socket/DNS/environment credentials/database/Supabase/SQL execution/migration/retry/Sprint 17C authority. Package import diagnostics must never instantiate Client or Pool. No fixture can be promoted to database evidence or root-cause proof.
