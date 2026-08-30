# IPv4, IPv6, and Windows feasibility

No DNS, TCP, TLS, or endpoint-metadata operation occurred. Direct and pooler A/AAAA records, IPv4 availability, IPv6 availability, region consistency, ports, firewall behavior, ISP routing, and Windows host compatibility are `UNRESOLVED`.

A separately authorized proof must bind exact sanitized host and port first, then capture bounded `Resolve-DnsName` A/AAAA results, address-family classification, one-attempt `Test-NetConnection` results, and verified TLS hostname/chain results. It must compare direct and session-pooler reachability without authentication, redact local/public IP details not needed for the decision, stop on hostname/region mismatch, and perform no retry. Exact commands and captures require independent review. If a TLS probe necessarily crosses a PostgreSQL protocol or authentication boundary, it must be governed as such rather than described as network-only.
