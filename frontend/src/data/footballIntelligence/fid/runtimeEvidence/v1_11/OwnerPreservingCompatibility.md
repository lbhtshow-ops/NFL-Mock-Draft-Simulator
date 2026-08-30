# Owner-preserving compatibility

The governed eight-argument `fid.fid_execute_atomic_persistence_batch` policy remains unchanged: `fid_function_owner` owns it and retains explicit/effective ownership authority; `service_role` receives direct EXECUTE; PUBLIC, anon, and authenticated receive no prohibited direct/effective EXECUTE; no grant options, definition/property changes, migration changes, or unrelated privilege changes occur.

The diagnostic connection role, ACL-administration actor, final application ACL target, and function owner are distinct identities. A dedicated REF login must not receive lasting function EXECUTE merely to observe ACLs, must not join the owner role, and must not alter effective EXECUTE through membership. Owner-preserving mutation authority remains unresolved and requires governance proof. Migration 014 and forced-RLS invariants stay protected.
