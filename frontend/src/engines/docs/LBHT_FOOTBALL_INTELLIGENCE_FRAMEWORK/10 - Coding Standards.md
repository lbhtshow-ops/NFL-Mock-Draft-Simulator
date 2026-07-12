# LBHT Football Intelligence Framework

# 10 – Coding Standards

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This document establishes the coding standards for the LBHT Football Intelligence Framework.

These standards are intended to keep the framework consistent, maintainable, scalable, and easy to understand as it continues to grow.

These are architectural standards rather than JavaScript style rules.

---

# Core Philosophy

Every line of code should move the framework toward being:

- Reusable
- Modular
- Explainable
- Testable
- Maintainable
- Product Independent

Before writing new code, ask:

> Does this belong somewhere that already exists?

Reuse before creating.

---

# Single Responsibility Principle

Every file should have one primary responsibility.

Good

```text
PlayerContextResolver

Determines player context.
```

Good

```text
ProductionEngine

Evaluates production.
```

Avoid

```text
ProductionEngine

Evaluates production

Calculates trade value

Ranks fantasy players

Determines draft recommendations
```

One responsibility.

One purpose.

---

# Separation of Layers

Every component belongs to one architectural layer.

Database

Stores information.

Resolver

Retrieves information.

Framework Core

Provides shared infrastructure.

Intelligence Engines

Interpret football evidence.

Position Models

Evaluate football ability.

Decision Engines

Solve football problems.

Applications

Display information.

Do not mix responsibilities across layers.

---

# Naming Conventions

File names should clearly describe responsibility.

Examples

```text
PlayerContextResolver.js

ProductionEngine.js

QuarterbackEvaluationModel.js

TradeValueEngine.js

FootballIntelligenceService.js
```

Avoid vague names.

Examples

```text
Helper.js

Utils2.js

Stuff.js

EngineNew.js
```

Names should explain purpose.

---

# Folder Organization

Code should be organized by responsibility.

Example

```text
database/

resolver/

services/

context/

contracts/

playerEvaluation/

decision/

applications/
```

Avoid placing unrelated components in the same folder.

---

# Reuse Existing Components

Before writing new code, check whether the framework already provides the required functionality.

Examples

Reuse:

- PlayerContextResolver
- FootballIntelligenceDatabaseManager
- IntelligenceResultContract
- TeamContextEngine

Avoid duplicate implementations.

---

# No Hidden Knowledge

Avoid hardcoding football knowledge inside unrelated files.

Bad

```javascript
if (player.position === "QB") {
  score += 15;
}
```

Good

```text
QuarterbackEvaluationModel

↓

Handles quarterback logic
```

Football knowledge belongs in football models.

---

# Database Standards

The database should store facts.

Examples

✓ Height

✓ Weight

✓ Awards

✓ Statistics

✓ Injury History

✓ Team

Avoid storing football decisions.

Examples

✗ Draft Recommendation

✗ Fantasy Ranking

✗ Trade Value

Those belong elsewhere.

---

# Resolver Standards

Resolvers should:

- Resolve identity
- Retrieve records
- Assemble data

Resolvers should never:

- Rank players
- Evaluate ability
- Make recommendations

Keep resolvers lightweight.

---

# Framework Core Standards

Framework Core components should:

- Be reusable
- Be product independent
- Avoid football opinions
- Eliminate duplicate logic

Framework Core should never:

- Rank players
- Recommend draft picks
- Calculate fantasy value

---

# Intelligence Engine Standards

Every intelligence engine should:

✓ Consume Player Context

✓ Consume football evidence

✓ Return IntelligenceResultContract

✓ Report confidence

✓ Report evidence level

✓ Explain conclusions

✓ Remain product independent

Intelligence engines should never:

✗ Recommend players

✗ Apply team needs

✗ Calculate trade value

✗ Produce fantasy rankings

---

# Position Model Standards

Position Models should:

- Consume intelligence
- Evaluate football ability
- Produce explainable outputs
- Report confidence

Position Models should never:

- Apply team needs
- Build draft boards
- Rank fantasy players

---

# Decision Engine Standards

Decision Engines should:

- Consume player evaluations
- Apply organizational context
- Produce recommendations
- Explain recommendations

Decision Engines should never:

- Create football intelligence
- Modify player quality
- Retrieve raw statistics

---

# Application Standards

Applications should:

- Display information
- Collect user input
- Present recommendations

Applications should avoid football evaluation whenever possible.

Business logic belongs inside the framework.

---

# Standard Function Design

Functions should do one thing.

Good

```javascript
getPlayerContext()
```

Good

```javascript
calculateProductionScore()
```

Avoid

```javascript
calculateEverything()
```

Small functions are easier to understand and test.

---

# Standard Return Values

Public framework functions should return predictable objects.

Avoid

```javascript
return null;
```

when richer information is available.

Prefer

```javascript
{
    available: false,
    reason: "INSUFFICIENT_DATA"
}
```

Predictable outputs simplify downstream code.

---

# Error Handling

Framework components should fail gracefully.

Examples

Missing player

↓

Return structured result

Missing evidence

↓

Report missing evidence

Unknown data

↓

Mark as UNKNOWN

Avoid unexpected crashes whenever possible.

---

# Explainability

Every major calculation should be explainable.

Future developers should be able to understand:

- What happened
- Why it happened
- Which evidence mattered

If an explanation cannot be written,

the calculation is probably too complex.

---

# Confidence Standards

Confidence should be reported separately from evaluation.

Example

```text
Player Quality

91

Confidence

0.94
```

Never combine confidence into player quality.

---

# Versioning

Major framework components should support versioning.

Examples

```text
Framework Version

Engine Version

Model Version

Contract Version

Record Version
```

Versioning simplifies long-term maintenance.

---

# Comments

Write comments that explain **why**, not **what**.

Good

```javascript
// Prospect evidence remains relevant during a player's
// first NFL seasons to prevent overreacting to small samples.
```

Avoid

```javascript
// Add 1 to score.
score += 1;
```

The code already explains that.

---

# Magic Numbers

Avoid unexplained numeric values.

Bad

```javascript
score *= 0.83;
```

Good

```javascript
const ROOKIE_EVIDENCE_WEIGHT = 0.83;
```

Named constants improve readability.

---

# Configuration

Framework constants should be centralized whenever practical.

Examples

- Position values
- Thresholds
- Evidence levels
- Confidence ranges
- Aging curves

Avoid scattering constants across multiple files.

---

# Testing Standards

Every major component should eventually support:

- Unit Tests
- Regression Tests
- Historical Validation
- Benchmark Testing

Changes should improve the framework without introducing unexpected behavior.

---

# Documentation Standards

Every major framework component should have documentation.

Documentation should answer:

- Purpose
- Responsibilities
- Inputs
- Outputs
- Dependencies
- Future plans

Documentation should evolve alongside the code.

---

# Code Review Checklist

Before adding a new component, ask:

✓ Does this already exist?

✓ Does it belong in the correct layer?

✓ Is it reusable?

✓ Does it have one responsibility?

✓ Is it explainable?

✓ Is it documented?

✓ Can another developer understand it?

If any answer is "No," reconsider the implementation.

---

# Continuous Refactoring

The framework should improve continuously.

When duplicate logic appears:

Refactor.

When responsibilities become unclear:

Refactor.

When components grow too large:

Split them.

Small improvements made consistently prevent large rewrites later.

---

# Definition of Framework Quality

High-quality framework code is:

- Easy to read
- Easy to test
- Easy to explain
- Easy to reuse
- Easy to extend
- Difficult to misuse

Every new contribution should improve the framework rather than simply add functionality.

---

# Guiding Standard

> **Write code that future versions of the framework can build upon, not code that future developers must work around.**