# LBHT Football Intelligence Framework

# 07 – Decision Engines

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

Decision Engines consume football intelligence and position evaluations to solve specific football problems.

Unlike Intelligence Engines and Position Models, Decision Engines do not determine how good a player is.

Instead, they answer questions such as:

- Should this player be drafted?
- Which player best fits this team?
- What is this player's trade value?
- Who should start?
- Which player has the highest fantasy value?

Decision Engines apply football evaluation to a specific context.

---

# Philosophy

Decision Engines should never create football intelligence.

They consume intelligence that has already been produced by the framework.

This allows every football product to use the same player evaluation while making different decisions.

Example

```text
Player Quality

↓

Draft Engine

↓

Round 1 Recommendation
```

or

```text
Player Quality

↓

Fantasy Engine

↓

Fantasy Ranking
```

The player evaluation remains the same.

Only the decision changes.

---

# Decision Engine Workflow

Every Decision Engine should follow the same process.

```text
Player

↓

Player Context

↓

Intelligence Engines

↓

Position Model

↓

Decision Engine

↓

Application
```

Decision Engines should never bypass earlier layers.

---

# Responsibilities

Decision Engines are responsible for:

- Applying context
- Comparing alternatives
- Weighing priorities
- Solving football problems
- Producing recommendations
- Explaining recommendations

Decision Engines are **not** responsible for:

- Gathering football data
- Evaluating football ability
- Calculating player intelligence
- Managing database records

---

# Current Decision Engines

Current decision-focused components include:

- Team Context Engine
- Team Needs
- Player Roster Evaluation
- Draft Board logic
- Existing draft recommendations

These will gradually migrate into standardized Decision Engines.

---

# Planned Decision Engines

The framework is expected to include:

- Mock Draft Decision Engine
- Team Needs Engine
- Draft Board Engine
- Trade Value Engine
- Free Agency Engine
- Fantasy Engine
- Player Ranking Engine
- Position Ranking Engine
- Starting Lineup Engine
- Roster Construction Engine
- Salary Cap Decision Engine
- Dynasty Evaluation Engine
- Historical Comparison Engine

Each engine solves one football problem.

---

# Mock Draft Decision Engine

Purpose

Determine the best draft selection for a team.

Inputs

- Player Evaluation
- Team Needs
- Position Value
- Draft Capital
- Roster Construction
- Organizational Philosophy
- Future Needs

Outputs

- Draft Recommendation
- Alternative Recommendations
- Explanation
- Confidence

The engine should not evaluate player quality.

---

# Team Needs Engine

Purpose

Evaluate positional needs for a team.

Examples

- Immediate Needs
- Future Needs
- Long-Term Planning
- Depth Evaluation

The Team Needs Engine evaluates organizations.

It does not evaluate players.

---

# Trade Value Engine

Purpose

Estimate player trade value.

Inputs

- Player Quality
- Age
- Contract
- Position Value
- Durability
- Development
- Market Conditions

Outputs

- Trade Value
- Tier
- Suggested Compensation
- Confidence

Trade value is different from player quality.

---

# Free Agency Engine

Purpose

Evaluate free-agent opportunities.

Inputs

- Player Evaluation
- Contract Expectations
- Team Needs
- Age
- Durability
- Market Value

Outputs

- Signing Recommendation
- Contract Tier
- Fit
- Risk

---

# Fantasy Engine

Purpose

Evaluate fantasy football value.

Inputs

- Player Evaluation
- Usage
- Opportunity
- Offensive Environment
- Health
- Scoring Format

Outputs

- Fantasy Projection
- Weekly Projection
- Season Projection
- Rankings

Fantasy value is separate from football quality.

---

# Player Rankings Engine

Purpose

Rank players at a league-wide level.

Inputs

- Player Evaluation
- Position
- Confidence

Outputs

- Overall Rankings
- Position Rankings
- Tier Rankings

The Ranking Engine should consume evaluations rather than create them.

---

# Position Rankings Engine

Purpose

Rank players within a specific position.

Examples

Quarterbacks

Running Backs

Wide Receivers

Edge Rushers

Safeties

Each position uses the same evaluation framework.

---

# Team Context

The Team Context Engine provides organizational information.

Examples

- Current Needs
- Future Needs
- Organizational Priorities
- Depth
- Positional Strength

Team Context should influence decisions.

It should never change player quality.

---

# Team Need Is Not Player Quality

Example

```text
Player Quality

95
```

Team A

```text
Need

2
```

Team B

```text
Need

10
```

The player remains a 95-quality player.

Only the recommendation changes.

---

# Position Value

Decision Engines may consider positional value.

Examples

Quarterback

High

Running Back

Moderate

Kicker

Low

Position value should influence decisions.

It should not influence football ability.

---

# Organizational Philosophy

Future Decision Engines may consider organizational philosophy.

Examples

- Aggressive Rebuild
- Win Now
- Long-Term Development
- Best Player Available
- Premium Positions
- Scheme Preferences

These factors belong to Decision Engines.

They should never affect player intelligence.

---

# Multiple Correct Decisions

Different organizations may reach different conclusions using the same intelligence.

Example

Team A

Needs Quarterback

Recommendation

Quarterback

Team B

Needs Edge Rusher

Recommendation

Edge

The underlying player evaluations remain unchanged.

---

# Explainability

Every Decision Engine should explain why it made a recommendation.

Example

Recommendation

Round 1 Selection

Reasons

- Elite Player Quality
- High Team Need
- Premium Position
- Excellent Scheme Fit

Users should understand the decision.

---

# Confidence

Decision Engines should report confidence.

Confidence may depend on:

- Evaluation Confidence
- Team Information
- Data Completeness
- Organizational Certainty

Confidence should remain separate from recommendation.

---

# Product Independence

Each Decision Engine should solve one problem.

Examples

Mock Draft

↓

Draft Recommendation

Fantasy

↓

Fantasy Ranking

Trade

↓

Trade Value

Applications should be able to combine multiple Decision Engines.

---

# Relationship to Position Models

Decision Engines consume Position Models.

```text
Position Evaluation

↓

Decision Engine

↓

Recommendation
```

Position Models remain independent.

---

# Relationship to Applications

Applications consume Decision Engines.

Examples

Mock Draft Simulator

↓

Mock Draft Decision Engine

Website Rankings

↓

Player Ranking Engine

Fantasy Challenge

↓

Fantasy Engine

Applications should remain presentation layers.

---

# Current Implementation Status

Current

- Team Context
- Team Needs
- Player Roster Evaluation
- Draft Logic

Transitioning

- Draft recommendations
- Team evaluation
- Roster construction

Planned

- Mock Draft Decision Engine
- Trade Value Engine
- Fantasy Engine
- Free Agency Engine
- Ranking Engines
- Lineup Optimization
- Organizational Philosophy
- Multi-Team Decision Models

---

# Architectural Rules

Decision Engines should:

✓ Consume intelligence

✓ Consume evaluations

✓ Consider organizational context

✓ Produce explainable recommendations

✓ Report confidence

✓ Remain reusable

Decision Engines should never:

✗ Create football intelligence

✗ Modify player quality

✗ Retrieve raw football statistics

✗ Store database records

✗ Replace Position Models

---

# Long-Term Goal

Decision Engines should become the strategic reasoning layer of the LBHT Football Intelligence Framework.

Every football application should use these engines to solve specific football problems while relying on the same underlying player intelligence.

This allows the entire LBHT platform to remain consistent, transparent, explainable, and scalable as new products are developed.