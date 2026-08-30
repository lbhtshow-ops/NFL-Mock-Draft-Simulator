# Runtime Evidence Framework Charter

Status: `GOVERNANCE_CHARTER_ESTABLISHED`

Version: `REF-1`

Authority: Football Intelligence Platform runtime-governance policy

## 1. Mission

The Runtime Evidence Framework (REF) governs how evidence about governed runtime operations is defined, authenticated, preserved, classified, reviewed, and trusted. It makes runtime observations first-class governed artifacts while keeping observation, interpretation, and repository claims distinct.

REF exists so persistence deployments, schema migrations, RPC deployments, deployment investigations, runtime diagnostics, capability amendments, production releases, and other controlled operations can be assessed from evidence whose origin, scope, limitations, and review history are explicit.

## 2. Scope

REF applies to governance of evidence produced by or about a governed operation after repository intent meets a runtime boundary. It covers evidence classification, provenance, trust boundaries, preservation, review, investigation, uncertainty, and the relationship between repository and runtime responsibilities.

This charter is implementation-independent. A future binding may define concrete records or controls only if it preserves this charter's semantics and receives separate governance approval.

## 3. Non-goals

REF does not:

- collect telemetry or prescribe a collector;
- replace logging, monitoring, observability platforms, deployment tooling, or audit logging;
- execute, authorize, or validate a deployment or other runtime operation;
- guarantee that an operation, observation, interpretation, system, or conclusion is correct;
- prove facts outside the authenticated scope and time of an observation;
- replace repository governance, source control, code review, migration governance, or domain evidence governance;
- convert the presence of data into proof of authenticity, completeness, causality, or correctness;
- define a product-specific storage format, vendor, transport, cryptographic mechanism, or retention period.

## 4. Guiding Principles

1. **Never invent evidence.** Missing evidence remains missing.
2. **Prefer observation over assumption.** A scoped observation outranks an unsupported expectation about runtime state.
3. **Preserve provenance.** Evidence retains its source, producer, target, time, method, and chain of custody to the degree available.
4. **Preserve reproducibility.** A reviewer must be able to understand what was observed and under what governed conditions; reproducibility does not itself prove correctness.
5. **Separate repository truth from runtime truth.** Repository contents prove governed intent and artifact identity, not deployment or runtime state.
6. **Separate observation from interpretation.** Captured facts, reviewer conclusions, and unresolved hypotheses remain distinguishable.
7. **Preserve investigation history.** Supersession adds history; it does not erase prior evidence or conclusions.
8. **Avoid evidence contamination.** Originals are preserved, transformations are declared, and test, inferred, synthetic, or unrelated material is not presented as an original observation.
9. **Make uncertainty explicit.** Unknown target, scope, completeness, authenticity, or correlation lowers the claim, not the documentation standard.
10. **Treat runtime observations as governed artifacts.** Convenience output becomes governed evidence only through applicable provenance, authentication, preservation, and review controls.
11. **Use the narrowest defensible claim.** Evidence proves no more than its authenticated content and boundaries.
12. **Do not confuse repetition with independence.** Repeated observations from one compromised or dependent path do not establish independent corroboration.

## 5. Trust Model

Trust is scoped, conditional, and compositional. No domain is universally authoritative.

| Trust domain | Can prove, when governed | Cannot prove by itself | Principal trust boundary |
| --- | --- | --- | --- |
| Repository | Versioned artifact content, history, review state, declared intent, and identifiers at a repository revision | Execution, deployment, target selection, runtime state, database state, or external-platform behavior | Repository artifact to submitted/executed artifact |
| Runtime | Process/session observations, inputs and outputs visible within its authenticated scope, and temporal ordering it directly records | Repository ancestry, database truth beyond its access, external effects, or absence of unobserved behavior | Runtime identity/session to target resource and observer |
| Database | State and transaction behavior exposed by an authenticated database observation | Client behavior, exact submitted bytes, repository identity, or external-platform state | Client/runtime session to database instance, role, and transaction |
| External Platform | Platform events or state within the platform's authenticated account/project and published semantics | Local repository state, operator intent, hidden internals, or unrelated systems | Platform identity/API/event to local correlation and retained capture |
| Operator | Declared intent, actions personally performed, context, and attestations | Machine execution, target state, completeness, or correctness without corroboration | Human identity and authority to action and record |
| Runtime Artifact | The observation content it carries plus authenticated metadata and integrity properties | Truth beyond captured scope; authenticity if provenance or integrity is absent; correctness of interpretation | Producer/capture path to preserved artifact and reviewer |
| Review Process | Application of declared criteria, classification, limitations, conflicts, and disposition | New runtime facts, operational correctness, or independence absent independent evidence | Evidence set to reviewer identity, method, and decision |

Crossing a boundary requires an explicit binding. Examples include binding repository bytes to submitted bytes, a session to a target, a database result to a transaction, an operator to an authorized action, or an external event to a local operation. A correlation identifier is useful but is not sufficient unless its issuer, uniqueness, propagation, and scope are governed.

Compromise, ambiguity, or absence in one domain must not be concealed by authority in another. Trust claims are reduced to the weakest unresolved boundary relevant to the conclusion.

## 6. Evidence Hierarchy

The classes describe governance confidence in a particular claim, not inherent value, implementation, or permanence. Classification is claim-specific; one artifact may support different classes for different claims.

| Class | Governance meaning |
| --- | --- |
| `CANONICAL` | The controlling evidence for a precisely bounded claim under an approved authority, with authenticated provenance, integrity, scope, and required review. Canonical does not mean infallible. |
| `VERIFIED` | Evidence whose stated origin, integrity, scope, and relevant correlation have been checked under an approved review method, but which is not the controlling authority. |
| `OBSERVED` | A preserved direct observation with identified source and scope; authentication, completeness, correlation, or independent review may remain incomplete. |
| `DECLARED` | A named source's assertion or attestation, preserved as that source's statement without independent confirmation. |
| `INFERRED` | A reasoned conclusion derived from identified evidence and explicit assumptions; it is not a direct observation. |
| `UNKNOWN` | The claim is unsupported, unresolved, conflicting beyond disposition, or outside available evidence. |

Promotion never occurs by convenience, repetition, confidence language, or reviewer seniority. It requires the criteria defined by the applicable governed binding. Conflicting evidence is retained and may lower a claim's classification. `UNKNOWN` is a valid, required outcome.

## 7. Evidence Sources

Potential sources include repository records, runtime output, database observations, external-platform records, operator attestations, runtime artifacts, and review records. Logs, screenshots, command output, platform events, transaction results, manifests, hashes, timestamps, and correlation identifiers are potential source material, not automatically trusted evidence.

Every source is assessed for identity, authority, proximity to the claimed fact, scope, time, integrity, completeness, independence, transformations, limitations, and relevant trust-boundary crossings. Synthetic and test evidence must be unambiguously labeled and cannot prove a production fact.

## 8. Runtime Evidence Lifecycle

1. **Plan:** state the governed question, required claims, expected trust boundaries, and acceptable uncertainty before collection is authorized elsewhere.
2. **Observe:** record only what the authorized source directly exposes; do not silently enrich or interpret it.
3. **Capture:** bind the observation to available producer, target, operation, session/transaction, time, method, and correlation context.
4. **Authenticate:** assess identity, authority, integrity, scope, and boundary bindings using approved controls.
5. **Preserve:** retain the original, record transformations, protect integrity, and maintain custody and access history.
6. **Classify:** assign a claim-specific evidence class and document limitations, conflicts, and unknowns.
7. **Review:** apply declared criteria with identifiable reviewers and preserve decisions, dissent, and dependencies.
8. **Use:** cite evidence without exceeding its scope or class; keep observation separate from interpretation.
9. **Supersede or correct:** append a linked correction or successor without overwriting protected history.
10. **Retain or dispose:** follow separately approved retention, legal, security, and privacy rules while preserving required governance history.

REF defines lifecycle governance, not authorization to perform any lifecycle operation.

## 9. Authentication Principles

Authentication must be proportional to the claim and risk. It should establish, where relevant: producer identity and authority; target identity and environment; operation and artifact identity; session or transaction binding; capture time and ordering; integrity from production through preservation; completeness boundaries; and reviewer independence.

Authentication is not a binary label for an entire file. Each material claim names what was authenticated, how, by which authority, and what remains unauthenticated. Hashes can support byte integrity but do not alone prove origin, execution, target, completion, or correctness. Timestamps can support sequence but do not alone prove causality or clock accuracy. Screenshots can preserve visible state but do not alone prove underlying system identity or completeness.

## 10. Evidence Preservation Principles

- Preserve original bytes or the closest available original representation.
- Make normalization, redaction, extraction, conversion, and annotation explicit and reversible when feasible.
- Maintain stable identity, provenance, integrity metadata, custody, access constraints, and links to successors.
- Never overwrite an original to correct it; preserve a correction record and relationship.
- Retain conflicts, failed attempts, negative results, and uncertainty when material to review.
- Apply least privilege, confidentiality, privacy, and secret-handling controls without disguising evidentiary gaps created by redaction.
- Keep evidence retention distinct from operational logs' ordinary rotation and from source-control history.

## 11. Investigation Principles

Investigations begin with a bounded question, an evidence inventory, and explicit hypotheses. Reviewers distinguish observed facts, declarations, inferences, and unknowns; test alternative explanations; identify dependent evidence paths; document excluded claims and stopping conditions; and preserve the complete reasoning history.

Absence of evidence is not evidence of absence unless the observation method is governed to be complete for that claim. Failed, partial, anomalous, and contradictory observations remain evidence of what was observed, not proof of a preferred explanation. An investigation may conclude that the evidence boundary has been reached and name the smallest additional evidence category needed without designing or authorizing its collection.

## 12. Governance Principles

This charter is the canonical cross-domain authority for runtime-evidence semantics. Domain governance may narrow requirements or add controls but must not weaken classifications, provenance, history, uncertainty, or trust-boundary rules. Conflicts are escalated to the applicable Football Intelligence Platform governance authority and remain explicit until resolved.

Collection, execution, deployment, remediation, access, retention, and disposal require their own authority. Evidence does not create operational authority. Reviewers disclose conflicts and preserve dissent. Material amendments to REF are versioned, reviewed, additive to protected history, and accompanied by migration guidance for affected governance records.

## 13. Repository vs Runtime Responsibilities

| Repository responsibilities | Runtime responsibilities |
| --- | --- |
| Preserve governed intent, artifact identity, version history, static review, approved declarations, and evidence requirements | Produce or expose observations within an authenticated execution context and target scope |
| Define what an artifact is expected to do | Establish what was observed to occur, without claiming more than captured |
| Retain bindings, reviews, and references that are appropriate for source control | Supply identity, timing, session/transaction, result, and correlation context when governed and available |
| Never claim deployment or state solely from repository presence | Never claim repository ancestry or exact artifact identity without an authenticated binding |

Repository evidence and runtime evidence may corroborate each other only through governed bindings. Neither silently inherits the other's authority.

## 14. Definitions

- **Runtime evidence:** Governed material that records or supports a claim about a runtime operation, state, event, or effect, together with its provenance, scope, limitations, and classification.
- **Repository evidence:** Versioned repository material proving repository content, history, review, or declared intent at a specified revision.
- **Observation:** A source-scoped record of directly exposed information, kept distinct from interpretation.
- **Interpretation:** A reasoned statement about what one or more observations mean.
- **Provenance:** The recorded origin, producer, method, target, time, transformations, custody, and relationships of evidence to the degree available.
- **Authentication:** The governed assessment of identity, authority, integrity, scope, completeness, and correlations relevant to a claim.
- **Integrity:** Assurance that protected evidence has not changed outside declared transformations; integrity alone does not establish truth.
- **Trust boundary:** A point where a claim crosses identities, systems, authorities, sessions, targets, or custody and requires an explicit binding.
- **Runtime artifact:** A preservable object containing a runtime observation or associated authentication context.
- **Evidence contamination:** Undeclared alteration, mixing, enrichment, inference, loss of scope, or dependency that can misrepresent an observation.
- **Chain of custody:** The preserved history of evidence possession, access, transfer, and transformation.
- **Corroboration:** Support from another relevant evidence path whose dependence and scope are understood.
- **Canonical authority:** The approved controlling source for a bounded claim; not a guarantee of correctness.
- **Protected history:** Prior evidence, review, classification, and correction records that remain available and linked rather than overwritten.

## 15. Future Extension Points

Future separately governed work may define evidence-envelope contracts, source registries, authentication profiles, integrity and signature profiles, custody records, correlation semantics, redaction policies, retention schedules, review workflows, independence criteria, machine-readable classifications, and domain-specific evidence requirements. None is selected or authorized by REF-1.

At governance level, future integrations will:

- require **Persistence Governance** to identify the runtime evidence necessary to support persistence claims without making persistence records self-authenticating;
- require **Deployment Governance** to bind approved repository artifacts, authorized targets, execution context, completion, and captured results;
- require **Migration Governance** to distinguish migration definition and history from target-state and transaction observations;
- require **Investigation Governance** to use REF classifications, provenance, preservation, alternative-hypothesis, and stopping-condition rules;
- allow broader **Football Intelligence Platform governance** to adopt REF as the common runtime-evidence vocabulary while preserving domain-specific evidence and repository authorities.

These are governance interfaces only. They do not design collectors, schemas, execution workflows, deployment artifacts, or authorizations.

## Charter boundary

REF-1 establishes governance only. It creates no runtime collector, diagnostic executor, migration, SQL, deployment artifact, capability amendment, execution authorization, database connection, or runtime action.
