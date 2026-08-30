# Athletic Intelligence Phase 2

Status: `PHASE_2_COMPLETE_WITH_TRANSITIONAL_SCORE`

## Canonical evidence path

```text
Athletic facts
  -> AthleticInputProjection
  -> CanonicalAthleticEvidenceEngine
  -> Scoreless governed evidence
```

This path reports supplied and unresolved facts. It produces no Athletic score and no governed Athletic confidence.

## Compatibility path

```text
Legacy profile
  -> AthleticModeledOutputDeclaration
  -> AthleticIntelligenceEngine compatibility facade
  -> Temporarily authorized consumers
```

Current scores and stored confidence are legacy modeled-output declarations. They are not canonical, calibrated, verified, reproducible, or analytically production-approved. Canonical evidence does not establish how those scores were derived.

Phase 2 includes governed input, scoreless canonical evidence reporting, an explicit compatibility facade, consumer-boundary diagnostics, and bounded Decision Support policy. It does not include a canonical Athletic scoring model or consumer migration.

Player Evaluation may eventually own broader player-quality scoring. Any future canonical Athletic scoring engine requires governed inputs, documented position/population semantics, versioned logic and weights, calibration, reproducibility, confidence methodology, migration diagnostics, production approval, and a new model identity. It cannot claim automatic historical continuity with `ATHLETIC-1.0.0`.
