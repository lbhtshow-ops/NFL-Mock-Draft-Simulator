# LBHT Football Intelligence Framework

# 01 – Vision and Core Principles

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

The LBHT Football Intelligence Framework is the central intelligence platform that powers every football product developed by LBHT.

It is designed to evaluate football players throughout their entire careers while producing consistent, explainable, and reusable intelligence.

The framework is **not** a Mock Draft Simulator.

The Mock Draft Simulator is the first application built on top of the framework.

Future applications include:

- Mock Draft Simulator
- NFL Roster Evaluation
- Team Needs
- Player Rankings
- Position Rankings
- Player Comparison
- Trade Value
- Free Agency Evaluation
- Fantasy Football
- Weekly Fantasy Challenge
- Website Intelligence
- Sports Analytics
- Future Football Applications

The framework should become the single source of football intelligence across the entire LBHT platform.

---

# Core Vision

The framework exists to answer one question:

> **How good is this football player, why, and how confident are we?**

Everything else is built from that answer.

---

# Core Philosophy

The framework follows one consistent pipeline.

```text
Facts
        ↓
Intelligence
        ↓
Evaluation
        ↓
Decision
```

Every layer has a different responsibility.

---

# Facts

Facts are objective information.

Examples include:

- Height
- Weight
- Age
- Position
- School
- NFL Team
- Games Played
- Passing Yards
- Tackles
- EPA
- Snap Counts
- Awards
- Draft Position
- Contract
- Injury History

Facts should never contain opinions.

---

# Intelligence

Intelligence interprets facts.

Examples include:

- Athletic Intelligence
- Production Intelligence
- Performance Intelligence
- Football IQ
- Recognition
- Durability
- Development
- Scheme Fit
- Competition
- Translation

Intelligence explains what the facts mean.

---

# Evaluation

Evaluation combines intelligence into football conclusions.

Examples include:

- Player Quality
- Ceiling
- Floor
- Development Trajectory
- Current Performance
- Career Baseline
- Risk
- Confidence

Evaluation should remain independent of team situations.

---

# Decisions

Decisions are application-specific.

Examples include:

- Draft Recommendation
- Team Fit
- Trade Value
- Fantasy Value
- Roster Value
- Player Rankings

Decision engines consume intelligence.

They do not create intelligence.

---

# One Player

Every football player should have one permanent identity.

The framework should never create separate players simply because someone changes leagues.

Instead, one player progresses through football.

```text
Youth Football

↓

High School

↓

College Development

↓

College Starter

↓

Draft Prospect

↓

NFL Rookie

↓

Young NFL Player

↓

Established Veteran

↓

Late Career

↓

Free Agent

↓

Retired
```

The player never changes.

Only the available evidence changes.

---

# One Architecture

College players and NFL players should use the same architecture.

They should **not** use identical evaluation formulas.

Examples:

```text
College Production

↓

Prospect Evaluation
```

versus

```text
NFL Production

↓

NFL Evaluation
```

The architecture stays consistent.

The evidence changes.

---

# Context Before Evaluation

No player should be evaluated until the framework understands who the player is.

The framework must first determine:

- Identity
- Position
- Competition Level
- Career Stage
- Experience
- Sample Size
- Draft Status
- Active Team
- Roster Status

This responsibility belongs to:

```text
PlayerContextResolver
```

Everything else builds on that result.

---

# Facts and Opinions Stay Separate

Facts never become opinions automatically.

Example:

Fact

```text
Player missed 7 games.
```

Fact.

Not evaluation.

Evaluation

```text
Availability Risk:
High
```

That is an evaluation.

Those are different concepts.

---

# Performance Is Not Production

Performance answers:

> How well did the player perform?

Production answers:

> How much did the player produce?

A player can have:

- High production
- Average efficiency

or

- Elite efficiency
- Low production

Those are different football questions.

The framework should preserve both.

---

# Quality Is Not Availability

A player can be:

```text
Elite Player

High Injury Risk
```

Both can be true.

Injuries should affect availability.

They should not automatically erase demonstrated football ability.

---

# Projection Is Not Quality

A player can have:

High Projection

without

High Current Quality.

Likewise,

an established veteran may have

Elite Current Quality

with

Little remaining projection.

The framework keeps those concepts separate.

---

# Missing Data Is Not Average Data

Unknown information should never be treated as average information.

The framework distinguishes:

- Available
- Unavailable
- Unknown
- Insufficient Sample
- Not Applicable

Those are all different situations.

---

# Confidence Matters

Every important evaluation should include confidence.

Example:

```text
Player Quality

91

Confidence

0.93
```

Confidence depends on:

- Sample Size
- Evidence Quality
- Data Freshness
- Source Agreement
- Competition Level

Confidence should never be hidden.

---

# Prospect Evidence Never Disappears

College evidence becomes part of the player's permanent history.

Its influence changes over time.

```text
College Prospect

↓

Primary Evidence

↓

NFL Rookie

↓

Strong Prior

↓

Young NFL Player

↓

Supporting Prior

↓

Established Veteran

↓

Historical Context
```

Prospect evaluation should transition naturally into professional evaluation.

---

# Intelligence Is Reusable

Intelligence engines should never be built for one product.

One intelligence profile should support:

- Draft Simulator
- Fantasy
- Rankings
- Trade Value
- Articles
- Comparisons
- Team Building
- Future Applications

Build once.

Reuse everywhere.

---

# Explainability

Every important score should be explainable.

Instead of:

```text
Player Quality

88
```

The framework should be able to explain:

Positive Factors

- Elite Processing
- Strong Production
- Excellent Pocket Movement

Negative Factors

- Injury History
- Limited Starting Experience

Context

- Small Sample Size

The framework should never become a black box.

---

# Separation of Responsibilities

Every component has one job.

Database

Stores information.

Context

Determines player situation.

Intelligence Engines

Interpret evidence.

Position Models

Evaluate football ability.

Decision Engines

Make application-specific recommendations.

Applications

Present information to users.

Each layer builds on the previous one.

---

# Long-Term Goal

The long-term goal is to create one football intelligence platform capable of evaluating any football player at any stage of his career.

The framework should provide:

- Consistent evaluations
- Explainable conclusions
- Reusable intelligence
- Transparent confidence
- Product-independent architecture

Every football application developed by LBHT should rely on this framework instead of creating its own evaluation system.

---

# Guiding Principle

> **Build the intelligence once. Reuse it everywhere.**