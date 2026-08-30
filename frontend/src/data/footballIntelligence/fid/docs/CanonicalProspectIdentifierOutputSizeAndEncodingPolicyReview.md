# Canonical Prospect Identifier Output Size and Encoding Policy Review

Sprint 12 closes the Sprint 10–11 output-size and encoding review gates through immutable `1.1.0` decisions. The historical `1.0.0` review-required policies remain unchanged and are referenced as superseded declarations. No provider, source, encoder, adapter, or runtime capability is implemented.

## Repository findings

Canonical identifiers use `<namespace>:<opaque-component>`. The colon delimiter is outside every reviewed Base64URL alphabet. Current canonical persistence contracts accept text and JSON without a conflicting length or alphabet constraint. URL paths and query strings can carry the selected ASCII alphabet, provided case is preserved. No canonical route or policy authorizes lowercasing opaque components. Existing Base64 persistence serialization and diagnostic hexadecimal hashing are unrelated implementation precedents and do not own identifier policy.

## Scale and collision analysis

The approved target is one billion generated identifiers within any single governed namespace, with approximate birthday-bound collision probability below `1 × 10^-18` before recovery:

`p ≈ n(n - 1) / (2 × 2^b)`

At `n = 1,000,000,000`:

| Entropy | Approximate probability | Decision |
|---|---:|---|
| 64 bits | 2.7105054285519762 × 10^-2 | Reject |
| 96 bits | 6.310887235457207 × 10^-12 | Reject |
| 128 bits | 1.4693679370584914 × 10^-21 | Approve |
| 160 bits | 3.4211388254968716 × 10^-31 | Satisfies, no material approved-scale need |
| 192 bits | 7.96545954776147 × 10^-41 | Satisfies, no material approved-scale need |
| 256 bits | 4.318084273209075 × 10^-60 | Satisfies, no material approved-scale need |

For 128 bits, approximate probabilities at one million, ten million, one hundred million, and one billion identifiers are respectively `1.4693664691599209 × 10^-27`, `1.469367791373231 × 10^-25`, `1.469367924358844 × 10^-23`, and `1.4693679370584914 × 10^-21`.

These values use deterministic IEEE-754 evaluation of the approved approximation. Namespace separation means the target applies independently to each namespace; it does not excuse insufficient entropy. Bounded retries are excluded from primary safety. Collision probability does not establish cryptographic security: the source must remain platform-backed, unpredictable, nonsemantic, and cryptographically secure.

## Approved output-size policy

`CANONICAL_PROSPECT_IDENTIFIER_ENTROPY_OUTPUT_SIZE_POLICY` version `1.1.0` approves 16 bytes / 128 bits before encoding. It applies consistently to `person`, `player`, `prospect`, and `prospect-profile`; future namespaces require compatibility review. Non-production and future production share this policy. The encoded component and full candidate lengths are separately governed.

## Approved encoding policy

`CANONICAL_PROSPECT_IDENTIFIER_ENCODING_POLICY` version `1.1.0` approves RFC 4648 unpadded Base64URL. Sixteen input bytes produce a canonical 22-character opaque component. The exact alphabet is `A–Z`, `a–z`, `0–9`, `-`, and `_`. Padding is prohibited. Case is significant and preserved.

Canonicalization prohibits case folding, padding insertion, standard Base64 `+` and `/`, whitespace, alternate encodings, Unicode normalization transformations, and multiple textual representations. Hexadecimal would require 32 characters; Base32 would require 26 and introduces variant/case governance; unpadded Base64URL is the most compact reviewed URL-safe canonical representation. No encoded example was produced.

Full candidate length is namespace length plus one colon plus 22 characters:

| Namespace | Full length |
|---|---:|
| `person` | 29 |
| `player` | 29 |
| `prospect` | 31 |
| `prospect-profile` | 39 |

The entropy provider returns bytes only. The generator adapter’s approved encoder capability owns encoding and candidate assembly. The issuer remains the authoritative structural validator. Collision detection, reservation, and issuance remain external.

## Lifecycle and next boundary

Both decisions are active policy decisions and supersede their respective `1.0.0` review-required declarations without modifying history. Review triggers include larger scale, changed risk ceiling or threat model, human entry, route/storage changes, incompatible runtimes, namespace or delimiter changes, federation, regulatory requirements, new-domain incompatibility, or source/encoder weakness.

The policies are implementation-neutral across conforming trusted server runtimes. The concrete trusted server host and platform secure-source boundary remain unresolved. Production and every execution permission remain false. The next boundary is a narrow trusted-server runtime-host review.
