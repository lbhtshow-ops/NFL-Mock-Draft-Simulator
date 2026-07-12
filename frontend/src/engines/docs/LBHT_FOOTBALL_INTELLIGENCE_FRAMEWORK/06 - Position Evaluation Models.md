# LBHT Football Intelligence Framework

# 06 – Position Evaluation Models

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

Position Evaluation Models combine multiple intelligence domains into a complete football evaluation for a specific position.

While Intelligence Engines evaluate individual football domains, Position Models answer a larger question:

> **How good is this player at playing his position?**

Position Models do not gather evidence.

They interpret intelligence.

---

# Philosophy

Every football position requires different evaluation criteria.

A quarterback should not be evaluated using the same model as a linebacker.

Likewise, an NFL quarterback should not be evaluated exactly the same way as a college quarterback.

The framework uses:

- Shared architecture
- Position-specific evaluation
- Competition-aware models
- Career-stage-aware models

---

# Position Model Workflow

Every Position Model follows the same process.

```text
Player

↓

Player Context

↓

Intelligence Domains

↓

Position Evaluation Model

↓

Football Evaluation

↓

Decision Engines
```

Position Models never retrieve raw football data directly.

They consume intelligence.

---

# Position Models Are Independent

Each position has its own evaluation model.

Current position groups include:

### Quarterback

### Running Back

### Wide Receiver

### Tight End

### Offensive Line

### Defensive Line

### Edge

### Linebacker

### Cornerback

### Safety

### Specialists

Every model evaluates different football responsibilities.

---

# Competition-Aware Models

Every position eventually supports multiple competition levels.

Examples

```text
NFL Quarterback

College Quarterback
```

```text
NFL Running Back

College Running Back
```

```text
NFL Cornerback

College Cornerback
```

The architecture remains consistent.

The evaluation logic changes.

---

# Shared Inputs

Every Position Model should receive the same categories of intelligence.

Examples

- Player Context
- Athletic Intelligence
- Production Intelligence
- Performance Intelligence
- Football IQ
- Traits
- Durability
- Development
- Recognition
- Scheme Fit
- Translation
- Confidence

Every model consumes the same language.

Each model weighs it differently.

---

# Shared Outputs

Every Position Model should produce consistent outputs.

Examples

- Overall Player Quality
- Current Ability
- Future Projection
- Development Curve
- Confidence
- Risk
- Strengths
- Weaknesses
- Positional Summary

Applications should not need to know which model produced the evaluation.

---

# Quarterback Model

Purpose

Evaluates quarterback play.

Examples of evaluation areas

- Accuracy
- Decision Making
- Processing
- Arm Talent
- Pocket Management
- Mobility
- Play Extension
- Leadership
- Ball Security
- Situational Performance

Quarterback evaluation should combine multiple intelligence domains rather than relying on statistics alone.

---

# Running Back Model

Purpose

Evaluates running back play.

Examples

- Vision
- Burst
- Contact Balance
- Elusiveness
- Receiving Ability
- Pass Protection
- Ball Security
- Short-Yardage Ability
- Explosive Play Ability

---

# Wide Receiver Model

Purpose

Evaluates receiver play.

Examples

- Route Running
- Separation
- Ball Skills
- Hands
- Catch Radius
- Yards After Catch
- Contested Catch Ability
- Release Package
- Football IQ

---

# Tight End Model

Purpose

Evaluates complete tight end play.

Examples

- Receiving
- Blocking
- Route Running
- Versatility
- Red Zone Value
- Football IQ
- Physicality

---

# Offensive Line Models

Purpose

Evaluate offensive line play.

Examples

- Pass Protection
- Run Blocking
- Anchor
- Balance
- Hand Usage
- Recovery
- Athletic Ability
- Technique
- Recognition

Individual weighting should vary by position.

Examples

- Left Tackle
- Right Tackle
- Guard
- Center

---

# Defensive Line Models

Purpose

Evaluate interior defensive linemen.

Examples

- Run Defense
- Pass Rush
- Power
- Leverage
- Hand Usage
- Block Shedding
- Gap Integrity
- Motor

---

# Edge Model

Purpose

Evaluate edge defenders.

Examples

- Pass Rush
- First Step
- Bend
- Closing Speed
- Run Defense
- Hand Technique
- Finishing Ability

---

# Linebacker Model

Purpose

Evaluate linebackers.

Examples

- Recognition
- Tackling
- Coverage
- Pursuit
- Blitz Ability
- Range
- Processing
- Leadership

---

# Cornerback Model

Purpose

Evaluate cornerbacks.

Examples

- Coverage
- Ball Skills
- Recovery Speed
- Press Technique
- Route Recognition
- Tackling
- Competitive Toughness

---

# Safety Model

Purpose

Evaluate safeties.

Examples

- Range
- Recognition
- Communication
- Coverage
- Tackling
- Versatility
- Football IQ

---

# Specialist Models

Examples

- Kicker
- Punter
- Long Snapper

Each receives its own evaluation criteria.

---

# Shared Evaluation Philosophy

Position Models should answer:

> How well does this player perform the responsibilities of his position?

They should not answer:

- Should this team draft him?
- Should he start?
- Is he a fantasy sleeper?

Those belong to decision engines.

---

# Context Awareness

Every Position Model should understand:

- Competition Level
- Career Stage
- Experience
- Evidence Profile
- Sample Strength

Examples

A rookie quarterback and a ten-year veteran may receive different interpretation even if they have similar statistical output.

---

# Confidence

Every Position Model should return confidence.

Confidence reflects:

- Evidence quality
- Sample size
- Data completeness
- Agreement between intelligence domains

Confidence is separate from player quality.

---

# Explainability

Every evaluation should explain itself.

Example

Positive Factors

- Elite Processing
- Strong Pocket Movement
- Excellent Decision Making

Negative Factors

- Limited Starting Experience
- Inconsistent Deep Accuracy

Context

- Rookie Season
- Limited NFL Sample

Users should understand why a player received a particular evaluation.

---

# Position Models Do Not Make Decisions

Position Models produce football evaluations.

They do not:

✗ Apply Team Needs

✗ Calculate Trade Value

✗ Recommend Draft Picks

✗ Produce Fantasy Rankings

✗ Calculate Contract Value

Those belong to Decision Engines.

---

# Relationship to Intelligence Engines

Position Models consume intelligence.

Example

```text
Athletic Intelligence

+

Production

+

Football IQ

+

Traits

+

Durability

↓

Quarterback Evaluation
```

Intelligence Engines remain independent.

---

# Relationship to Decision Engines

Decision Engines consume Position Models.

Example

```text
Quarterback Evaluation

↓

Mock Draft Engine

↓

Draft Recommendation
```

or

```text
Quarterback Evaluation

↓

Fantasy Engine

↓

Fantasy Projection
```

The Position Model should not know which application is consuming it.

---

# Current Implementation Status

Current

- Quarterback Evaluation Model
- Running Back Evaluation Model

Framework Added

- Player Context
- Shared Intelligence Contract

Planned

- Complete position library
- NFL and College versions
- Shared evaluation framework
- Unified outputs
- Benchmark testing
- Calibration tools

---

# Long-Term Goal

Every football position should have a dedicated evaluation model that consumes standardized intelligence, understands player context, produces explainable football evaluations, and remains completely independent of any specific football product.

The Position Evaluation Models should become the primary football evaluation layer used throughout the entire LBHT Football Intelligence Framework.