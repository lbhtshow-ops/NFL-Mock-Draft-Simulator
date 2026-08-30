# Runtime Evidence Framework Governance Ownership Matrix

## 1. Ownership rule

FID governance owns REF governance. The operation-owning domain remains accountable for the operation. REF owns only evidence-specific governance and references authoritative operation artifacts.

| Responsibility | Authoritative owner | REF role | REF owns or references | Prohibited transfer |
| --- | --- | --- | --- | --- |
| Governed operation proposal | Application, persistence, deployment, migration, or investigation domain | Requires proposal context | References | REF does not create business purpose. |
| Operation scope | Operation owner | Tests evidence requirements against scope | References | Evidence scope cannot enlarge operation scope. |
| Artifact creation | Operation owner | Requires stable representation | References | REF does not author executable artifacts. |
| Artifact identity | Operation owner establishes; REF assesses binding evidence | Correlates identity across boundaries | Shared: references authority, owns evidence assessment | REF cannot replace canonical artifact identity. |
| Authorization creation | Authorization governance | Requires explicit reference | References | REF invents no authority. |
| Authorization consumption | Authorization governance defines rule; execution record supplies facts | Records and assesses consumption evidence | References lifecycle, owns evidence claim | REF cannot restore or alter status. |
| Execution | Operator, automated executor, and operation owner | Maintains separation from observation | References | REF does not silently execute. |
| Observation | REF-governed observer role | Defines points, fidelity, completeness, and interference | Owns governance | Observation does not confer execution authority. |
| Evidence authentication | REF governance under REF-3 | Assesses authenticity and integrity support | Owns assessment | Cannot certify unsupported source facts. |
| Evidence preservation | FID protected-history governance with custodians | Defines evidence preservation obligations | Owns evidence rules; references storage | REF does not create a second storage system. |
| Claim construction | Investigation or reviewer, using REF vocabulary | Bounds evidence claims | Owns evidence-claim governance | Claim cannot become business fact automatically. |
| Claim classification | REF evidence reviewer | Applies evidence classifications | Owns | Cannot decide unrelated operational policy. |
| Evidence sufficiency | REF evidence reviewer for each claim | Assesses sufficiency | Owns | Sufficiency is not authorization or outcome. |
| Review | Established review governance | Supplies evidence review record | References overall review; owns evidence findings | REF cannot presume independence. |
| Decision | Investigation or operational decision authority | Supplies bounded evidence input | References | Evidence does not automatically decide. |
| Conclusion | Investigation governance | Links support and limitations | References final conclusion; owns evidence limits | REF cannot exceed delegated authority. |
| Successor authorization | Authorization governance | Carries predecessor evidence and uncertainty | References | REF cannot authorize retry, remediation, or cleanup. |
| Protected history | FID governance and designated custodians | Defines immutable REF lineage | Shared governance, no duplicate mechanism | Later success cannot overwrite prior failure. |
| Retirement or supersession | Owner of the authoritative artifact under provenance governance | Preserves evidence lineage and effective order | References decision; owns REF lineage rules | Retirement is not erasure. |

## 2. Mandatory non-ownership boundaries

REF does not own the business semantics of persistence operations, migration schema intent, application runtime behavior, authorization authority for unrelated operations, or final operational decision unless established governance explicitly delegates that decision. It also does not own migration ordering, database invariants, deployment execution, credentials, or platform behavior.

## 3. History and trust

Every owner preserves its authoritative source record. REF links rather than copies authoritative meaning. Cross-boundary claims declare source, custodian, transformation, identity continuity, correlation, and unresolved gaps. Responsibility cannot be transferred merely by sending data to REF.
