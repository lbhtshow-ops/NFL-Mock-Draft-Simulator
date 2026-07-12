# LBHT Football Intelligence Framework

# 05 – Intelligence Engines

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

Intelligence Engines are responsible for interpreting football evidence.

Each engine focuses on a single football domain and transforms factual information into football intelligence that can be reused throughout the LBHT platform.

Intelligence engines do **not** make football decisions.

They produce reusable intelligence.

---

# Philosophy

Each intelligence engine should answer one football question.

For example:

**Production Engine**

> "How productive has this player been?"

**Football IQ Engine**

> "How advanced is this player's football understanding?"

**Durability Engine**

> "How reliable has this player been from an availability standpoint?"

An intelligence engine should never answer:

> "Should Baltimore draft this player?"

That belongs to a decision engine.

---

# Current Intelligence Domains

The framework currently includes:

- Athletic Intelligence
- Player Traits
- Football IQ
- Production
- Scheme Fit
- Player Evaluation
- Recognition

The framework will continue expanding.

---

# Planned Intelligence Domains

Future intelligence domains include:

- Performance
- Durability
- Development
- Competition
- Translation
- Usage
- Contract Intelligence
- Market Intelligence
- Positional Value
- Leadership
- Character
- Availability
- Consistency
- Clutch Performance

Each domain should evaluate only its own area of expertise.

---

# Standard Workflow

Every intelligence engine should follow the same general process.

```text
Player

↓

Player Context

↓

Retrieve Evidence

↓

Interpret Evidence

↓

Generate Intelligence

↓

Return Standard Contract
```

The workflow should remain consistent across all domains.

---

# Player Context

Every intelligence engine should receive player context before evaluation.

Examples include:

- Competition Level
- Career Stage
- Experience
- Sample Strength
- Evaluation Path
- Prospect Evidence Role

Engines should avoid determining these independently.

PlayerContextResolver provides this information.

---

# Evidence Collection

Each intelligence engine gathers only the evidence relevant to its domain.

Example

Production Engine

Evidence

- Passing Yards
- EPA
- Success Rate
- Completion Percentage
- Touchdowns
- Turnovers

Football IQ Engine

Evidence

- Processing
- Recognition
- Decision Making
- Coverage Recognition
- Timing
- Anticipation

The evidence used should match the football question being answered.

---

# Evidence Interpretation

Facts alone do not produce intelligence.

The engine must interpret the evidence.

Example

Fact

```text
Completion Percentage

67%
```

Interpretation

```text
Above-average accuracy.
```

The framework separates evidence from interpretation.

---

# Competition Awareness

Every engine should understand where the player is competing.

Examples

NFL

College

Future Leagues

Different competition levels require different interpretation.

The architecture remains consistent.

The evidence model changes.

---

# Career Awareness

Every engine should understand the player's career stage.

Examples

College Development

Draft Prospect

Rookie

Young Veteran

Established Veteran

Late Career

Evidence should be interpreted differently at each stage.

---

# Prospect Transition

College evidence should remain available after a player enters the NFL.

Its importance changes over time.

Future versions will use:

```text
EvidenceTransitionEngine
```

to determine how prospect evidence influences professional evaluation.

Individual intelligence engines should not implement their own transition logic.

---

# Standard Output

Every intelligence engine should return the shared Intelligence Result Contract.

Standard outputs include:

- Domain
- Score
- Confidence
- Evidence Level
- Summary
- Explanation
- Sources
- Missing Evidence
- Data State
- Version Information

This allows every downstream component to consume intelligence consistently.

---

# Explainability

Every intelligence engine should explain its conclusions.

Instead of:

```text
Production Score

87
```

The engine should explain why.

Example

Positive Factors

- Elite Efficiency
- Strong Multi-Year Production
- Excellent Red Zone Performance

Limiting Factors

- Limited Sample Size
- Injury-Affected Season

Context

- First Year Starter

Explainability is a required feature of the framework.

---

# Missing Evidence

The framework distinguishes between:

Available

Unavailable

Unknown

Insufficient Sample

Not Applicable

Missing evidence should never become average evidence.

Every engine should report missing evidence explicitly.

---

# Confidence

Every intelligence engine should report confidence.

Confidence depends on factors such as:

- Sample Size
- Evidence Quality
- Source Reliability
- Competition Level
- Data Freshness
- Missing Information

Confidence should remain separate from score.

---

# Intelligence Independence

Each intelligence engine should operate independently.

Example

Production Engine

Should not require:

- Fantasy Football
- Team Needs
- Draft Position
- Trade Value

Likewise

Football IQ

Should not depend on:

- Contract Value
- Salary
- Team Situation

Each engine should remain reusable.

---

# Shared Responsibilities

All intelligence engines should:

✓ Consume Player Context

✓ Consume Framework Utilities

✓ Produce Standard Contracts

✓ Report Confidence

✓ Report Missing Evidence

✓ Explain Conclusions

✓ Be Product Independent

---

# Responsibilities by Domain

## Athletic Intelligence

Evaluates physical tools.

Examples

- Speed
- Explosion
- Agility
- Size
- Movement Skills

---

## Production Intelligence

Evaluates statistical output.

Examples

- Volume
- Efficiency
- Scoring
- Consistency

---

## Performance Intelligence

Evaluates quality of play.

Examples

- Efficiency
- Effectiveness
- Situational Performance

Performance is not the same as production.

---

## Football IQ

Evaluates mental processing.

Examples

- Recognition
- Decision Making
- Processing Speed
- Anticipation
- Awareness

---

## Scheme Fit

Evaluates compatibility.

Examples

- Offensive Systems
- Defensive Systems
- Positional Usage
- Role Flexibility

Scheme Fit should never become player quality.

---

## Recognition

Evaluates football recognition.

Examples

- Awards
- All-Pro
- Pro Bowl
- Heisman
- All-American
- Conference Awards

Recognition supports evaluation.

Recognition is not evaluation.

---

## Durability

Evaluates player availability.

Examples

- Games Missed
- Injury Frequency
- Recovery History

Durability is separate from football ability.

---

## Development

Evaluates player growth.

Examples

- Improvement Rate
- Technical Growth
- Age Curve
- Skill Progression

Development focuses on trajectory rather than current quality.

---

## Translation

Evaluates projected transition between competition levels.

Examples

College

↓

NFL

Translation should never overwrite established professional evidence.

---

# What Intelligence Engines Should Never Do

Intelligence engines should never:

✗ Recommend draft selections

✗ Rank fantasy players

✗ Calculate trade value

✗ Apply team needs

✗ Select starters

✗ Build depth charts

✗ Determine contract value

Those belong to decision engines.

---

# Relationship to Position Models

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

Quarterback Model
```

The intelligence engines do not know which position model will consume their output.

---

# Relationship to Applications

Applications consume decisions.

Applications should not directly evaluate intelligence.

Correct Flow

```text
Intelligence

↓

Position Model

↓

Decision Engine

↓

Application
```

---

# Current Implementation Status

Current

- Athletic Intelligence
- Football IQ
- Production
- Traits
- Scheme Fit
- Recognition

Transitioning

- Player Evaluation
- Existing Summary Objects

Planned

- Performance
- Durability
- Development
- Translation
- Competition
- Market Intelligence
- Contract Intelligence
- Positional Value

---

# Long-Term Goal

Every football intelligence domain should exist as an independent, reusable engine that produces standardized, explainable, confidence-based football intelligence.

The same intelligence should be capable of supporting every present and future football product built by LBHT without requiring duplicate evaluation logic.