# Runtime Evidence Framework Observation Layer Model

Status: `OBSERVATION_LAYER_MODEL_ESTABLISHED`

Version: `REF-4`

## Layer rule

An observation proves only what its layer directly exposes within authenticated scope. Evidence does not inherit authority from adjacent layers without explicit correlation, boundary, ordering, provenance, fidelity, completeness, and custody support.

| Layer | May prove | Cannot prove alone | Owning trust domain | Adjacent boundaries | Typical remaining gaps |
| --- | --- | --- | --- | --- | --- |
| Operator Observation | What an authenticated operator reports seeing, intending, selecting, or doing | Machine execution, exact bytes, target, completion, or correctness | Operator | Repository, Client, Platform, Review | Human selection, memory, authority, machine correlation |
| Client Observation | Client inputs, UI state, requests, local messages, and received outputs visible to the client | Transport delivery, server interpretation, every server statement, commit, or hidden errors | Runtime and/or External Platform, with Operator mediation | Operator, Transport, Platform | Submitted-byte identity, truncation, retries, client transformation |
| Transport Observation | Messages/events visible at a communication boundary, ordering within its scope, and delivery attempts | Application handling, transaction effect, semantic correctness, or unobserved channels | Runtime or External Platform | Client, Platform, Runtime | Encryption visibility, intermediaries, duplication, delivery vs processing |
| Platform Observation | Authenticated platform account/project events and platform-visible state | Local repository ancestry, hidden internals, exact runtime behavior, or unrelated target state | External Platform | Transport, Runtime, Operator, Review | Vendor semantics, account/project binding, common-mode dependence |
| Runtime or Process Observation | Process/session-visible inputs, stages, outputs, errors, and local state | Database truth beyond access, external effects, repository origin, or absence of hidden behavior | Runtime | Platform, Database, Operator | Host/process identity, instrumentation coverage, subprocesses, interference |
| Database Session Observation | Session identity, principal, settings, visible statements/results/state within database scope | Client intent, exact repository bytes, another session, commit beyond observation, external target authenticity | Database | Runtime, Transaction | Instance/role binding, pooling, session reuse, external project identity |
| Transaction Observation | Transaction-local ordering, state, errors, and outcome visible within the observed transaction | External commit visibility unless observed, client completeness, other transactions, causal explanation | Database | Session, Statement, Catalog/State, Result | Transaction identity, rollback, implicit boundaries, observer participation |
| Statement Observation | A bounded statement's submission, parsing/execution stage, result, or error where directly exposed | Completion of other statements, whole script identity, transaction commit, or causal effect outside scope | Runtime or Database | Transaction, Result, Catalog/State | Statement identity, partial selection, batching, retry, completion boundary |
| Catalog or State Observation | State visible at a defined target and time under an authenticated principal | How state arose, transient history, external target identity, or complete unseen state | Database, Runtime, or External Platform | Transaction, Result, Platform | Snapshot timing, visibility rules, caching, privilege-limited view |
| Result Observation | Returned/displayed output or error as exposed at a result point | Which hidden path produced it, complete execution, correct target, transaction identity, or truth | Source-dependent: Runtime, Database, or Platform | Statement, Client, Review | Correlation, truncation, transformation, suppressed errors |
| External Review Observation | What a reviewer observed in the fixed evidence set and review process | New runtime facts, missing custody, observer independence, or operational correctness | Review Process | Every evidence-source domain through Review Boundary | Set drift, reviewer dependence, interpretation, unavailable originals |

## Governance illustrations

- A pasted script proves repository/client-visible content, not identical server execution.
- A client success message proves a displayed client result within scope, not completion of every server-side statement.
- A returned row does not automatically identify its producing transaction.
- A catalog observation does not independently authenticate the external target.
- A screenshot may exactly represent displayed pixels and still be partial evidence of execution history.

These examples illustrate cross-layer limits and do not define an ACL-specific architecture.

## Cross-layer use

Cross-layer claims enumerate each contributing layer, source, boundary, correlation, ordering basis, completeness dimension, fidelity class, interference assessment, provenance path, and custody path. Missing middle layers cannot be silently bridged by observations at the endpoints.

Multiple layers may complement each other without corroborating the same claim. Multiple artifacts produced from one layer may share a common failure source. Review assigns no automatic priority by layer; proximity, authentication, scope, independence, and claim relevance govern use.

## Model boundary

The layer model selects no product, observer, protocol, log, API, database feature, capture method, storage, or implementation.
