# Runtime Evidence Framework Execution Outcome and Uncertainty Model

## 1. Separation of records

Raw result, client-visible result, platform result, runtime result, database result, operation outcome, evidence assessment, review decision, and final conclusion are separate records. Transformations, omissions, truncation, provenance, and correlation are preserved. A successful response does not establish operation success; zero visible rows does not establish non-execution.

## 2. Outcome vocabulary

An operation may be succeeded, failed before execution, failed during execution, partially executed, rolled back, committed, cancelled, timed out, disconnected, interrupted, rejected, blocked, uncertain, inconsistent, not observed, or not attributable. Multiple compatible facets may coexist, such as consumed, partially executed, rolled back, and observation-incomplete.

Rolled back does not prove every preceding statement executed. Committed does not prove the intended artifact ran. An error does not prove absence of persistent effects. Rejected and blocked identify different authorities or gates and do not imply runtime entry. Not observed means required observation is absent; not attributable means evidence exists but cannot be sufficiently bound to the governed execution.

## 3. Failure, interruption, and completion

Failure records where it was observed, the failing stage, raw error, possible effects, and limits. Interruption records operator abort, cancellation, timeout, disconnect, runtime termination, or platform interruption without inferring the last completed server stage. Completion records only supported completion of the selected stage profile. Termination records the known or last-observed end state; none of these alone establishes success or persistence.

## 4. Uncertainty taxonomy

| Uncertainty | Required representation |
| --- | --- |
| Submission | Whether the intended complete artifact or operation left the initiating boundary. |
| Server receipt | Whether the receiving service accepted the complete submission. |
| Execution start | Whether governed execution began and where. |
| Stage completion | Which statements or stages completed, partially completed, or remain unknown. |
| Transaction outcome | Whether relevant changes committed, rolled back, or escaped the expected boundary. |
| Result attribution | Whether a result belongs to the exact authorization and execution. |
| Target identity | Whether the observed runtime destination equals the authorized target. |
| Artifact identity | Whether executed content equals the authorized immutable representation. |
| Observation | Whether observation occurred with sufficient fidelity, completeness, and non-interference. |
| Persistence | Whether effects survived at the authoritative state boundary. |
| Review | Whether evidence permits a stable assessment or competing interpretations remain. |

Uncertainty states its question, plausible alternatives, evidence for and against each, affected claims, owner, and possible resolution. It remains present until resolved by governed evidence or explicitly carried into conclusion.

## 5. Governance effects

Uncertainty is evaluated against the authorization's consumption boundary; it cannot make consumed authority reusable. Retry eligibility is suspended when duplicate effect is plausible unless existing authority explicitly and safely covers it. Successor authorization must carry the uncertainty and may authorize only the minimum diagnostic, reconciliation, remediation, repair, cleanup, or post-verification action justified.

Remediation and cleanup are prohibited when unknown state could make them unsafe. Reconciliation observes authoritative state but cannot retroactively prove unobserved execution steps. Review must distinguish unresolved, contradictory, missing, and merely low-confidence evidence. Permissible conclusions are bounded to what evidence supports; operational convenience cannot convert uncertainty to failure, success, rollback, or non-execution.

## 6. Stop and preservation rule

Authorization mismatch, artifact or target mismatch, failed preconditions, warnings, unexpected counts, incomplete evidence, timeout, disconnect, partial execution, contradiction, unplanned mutation, transaction deviation, retry prompts, missing results, and truncation require stopping at the next safe boundary. All available raw and visible results, errors, warnings, context, and uncertainty are preserved before any successor decision.

## 7. Model boundary

This document classifies evidence and uncertainty; it performs no execution, observation, retry, reconciliation, or remediation.
