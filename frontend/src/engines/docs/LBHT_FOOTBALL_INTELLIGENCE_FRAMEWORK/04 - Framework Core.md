# LBHT Football Intelligence Framework

# 04 – Framework Core

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

The Framework Core is the foundation of the LBHT Football Intelligence Framework.

It provides the shared infrastructure used by every intelligence engine, position model, decision engine, and application.

Unlike intelligence engines, the Framework Core does **not** evaluate football players.

Instead, it provides the common services that allow every evaluation to remain consistent throughout the platform.

Every future football product should depend on the Framework Core.

---

# Philosophy

The Framework Core exists to answer questions that every intelligence engine needs before football evaluation begins.

Examples include:

- Who is this player?
- What stage of his career is he in?
- What competition level is he playing?
- Which evaluation path should be used?
- How much evidence is available?
- How should evidence be interpreted?
- What format should every engine return?

Rather than solving these problems repeatedly inside each engine, they are solved once within the Framework Core.

---

# Current Components

Current Framework Core components include:

```text
PlayerContextResolver

IntelligenceResultContract
```

Recently integrated into the framework:

- Canonical Career Context
- Shared Career Context access
- Standardized intelligence structure

Future additions include:

```text
EvidenceTransitionEngine

CompetitionContextResolver

SeasonContextResolver

ConfidenceUtilities

PositionNormalization

IdentityUtilities

Diagnostics

Validation

Benchmarking
```

---

# PlayerContextResolver

Primary File

```text
src/engines/context/PlayerContextResolver.js
```

Purpose

Determines the football context of a player before any intelligence engine performs evaluation.

Responsibilities

- Resolve player identity
- Resolve competition level
- Resolve league
- Resolve conference
- Resolve division
- Resolve career stage
- Resolve years of experience
- Resolve seasons played
- Determine evaluation path
- Determine sample strength
- Determine evidence profile
- Identify missing context
- Produce context confidence

Outputs include:

```text
Competition Level

Career Stage

Evaluation Path

Evidence Profile

Sample Strength

Experience

Roster Status

Draft Status

Context Confidence
```

PlayerContextResolver does **not** evaluate football ability.

It prepares the environment for evaluation.

---

# Career Context

Career Context is now a permanent part of every canonical player record.

Purpose

Provide factual information describing the player's current football situation.

Examples

Competition

- NFL
- NCAA
- Future Leagues

Career

- Draft Prospect
- Rookie
- Veteran
- Free Agent
- Retired

Experience

- Years Played
- Seasons
- Previous Levels

Roster

- Active
- Practice Squad
- Starter
- Backup

Career Context contains facts.

It should never contain evaluations.

---

# Evaluation Path

One of the responsibilities of PlayerContextResolver is selecting the proper evaluation path.

Examples

```text
College Evaluation

↓

Prospect Models
```

```text
NFL Evaluation

↓

Professional Models
```

```text
Transition Evaluation

↓

Rookie Models
```

The framework should automatically determine which path is appropriate.

---

# Sample Strength

Every player does not have the same amount of evidence.

Examples

Draft Prospect

```text
Limited Sample
```

Veteran

```text
Very Strong Sample
```

The framework should expose sample strength so every intelligence engine can use it consistently.

---

# Evidence Profile

Evidence Profile describes the type of evidence available.

Examples

```text
College Development

College Starter

College Projection

Rookie Transition

Early Career NFL

Established NFL

Late Career NFL

Historical
```

Evidence Profile influences how football evidence is interpreted.

---

# Prospect Evidence Role

Prospect evidence changes as a player progresses through his career.

Examples

Draft Prospect

```text
Primary Evidence
```

NFL Rookie

```text
Strong Prior
```

Young Veteran

```text
Supporting Prior
```

Established Veteran

```text
Historical Context
```

This information prepares the framework for EvidenceTransitionEngine.

---

# IntelligenceResultContract

Primary File

```text
src/engines/contracts/IntelligenceResultContract.js
```

Purpose

Defines the standard output returned by every intelligence engine.

Every intelligence engine should eventually return the same structure.

Current Contract

```text
Domain

Available

Data State

Score

Confidence

Evidence Level

Player ID

Competition Level

Career Stage

Summary

Explanation

Evidence

Missing Evidence

Sources

Raw Data

Versions
```

A common contract allows every downstream component to consume intelligence consistently.

---

# Data States

The framework distinguishes between different evidence situations.

Current states include:

```text
Available

Unavailable

Unknown

Insufficient Sample

Not Applicable
```

Unknown should never be interpreted as average.

---

# Evidence Levels

Every intelligence result should communicate evidence quality.

Current levels

```text
None

Limited

Moderate

Strong

Very Strong
```

Evidence Level is different from confidence.

---

# Confidence

Confidence measures trust in the evaluation.

Confidence may depend on:

- Sample Size
- Data Freshness
- Source Agreement
- Competition Level
- Missing Information

Confidence is intended to become a standard output throughout the framework.

---

# EvidenceTransitionEngine

Status

Planned

Purpose

Controls how college evidence transitions into professional evidence.

Rather than abruptly replacing prospect evaluation with NFL evaluation, the framework gradually shifts the influence of each evidence source.

Conceptual progression

```text
Prospect

↓

Primary Evidence

↓

Rookie

↓

Strong Prior

↓

Young Veteran

↓

Supporting Prior

↓

Established Veteran

↓

Historical Context
```

Every intelligence engine will eventually rely on this transition.

---

# Shared Utilities

As the framework grows, additional shared utilities will become part of the Framework Core.

Examples include:

Identity Utilities

- Canonical IDs
- Alias resolution
- Duplicate prevention

Position Utilities

- Position normalization
- Position groups
- Hybrid positions

Season Utilities

- Active season
- Career season ordering
- Weighted recent seasons

Competition Utilities

- League normalization
- Conference mapping
- Competition tiers

These utilities prevent duplicated logic across multiple engines.

---

# Diagnostics

The Framework Core will eventually include diagnostic tools.

Examples

- Missing intelligence detection
- Invalid player records
- Duplicate identities
- Missing sources
- Missing context
- Benchmark comparisons
- Engine validation

Diagnostics should improve framework reliability without affecting player evaluation.

---

# Versioning

Every Framework Core component should support versioning.

Examples

```text
Framework Version

Resolver Version

Contract Version

Transition Version
```

Versioning allows models to evolve without breaking older evaluations.

---

# Framework Rules

The Framework Core should:

✓ Remain reusable

✓ Be product-independent

✓ Avoid football opinions

✓ Support every intelligence engine

✓ Provide shared infrastructure

✓ Eliminate duplicated logic

The Framework Core should never:

✗ Rank players

✗ Recommend draft picks

✗ Calculate fantasy value

✗ Determine trade value

✗ Apply team needs

Those responsibilities belong in higher architectural layers.

---

# Current Implementation Status

Implemented

- Canonical Career Context
- Database access for Career Context
- PlayerContextResolver
- IntelligenceResultContract
- Shared player context

In Progress

- Framework documentation
- Standardized intelligence outputs

Planned

- EvidenceTransitionEngine
- Shared diagnostics
- Shared confidence utilities
- Shared position normalization
- Shared season utilities
- Framework validation

---

# Long-Term Goal

The Framework Core should become the common language spoken by every football intelligence engine.

Every evaluation should begin with the same context, follow the same standards, produce the same contract, and be explainable regardless of the application consuming it.

By centralizing these responsibilities, the framework remains consistent, maintainable, scalable, and reusable across the entire LBHT football platform.