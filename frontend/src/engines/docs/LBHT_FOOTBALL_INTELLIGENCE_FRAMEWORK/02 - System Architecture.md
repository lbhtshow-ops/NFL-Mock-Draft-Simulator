# LBHT Football Intelligence Framework

# 02 – System Architecture

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This document describes the overall architecture of the LBHT Football Intelligence Framework.

It defines how information moves through the system, where responsibilities belong, and how each layer interacts with the others.

Every future feature should fit into one of the architectural layers described in this document.

---

# High-Level Architecture

```text
                    Football Data Sources
                             │
                             ▼
              Football Intelligence Database
                             │
                             ▼
                   Resolver & Service Layer
                             │
                             ▼
                    Framework Core Layer
                             │
                             ▼
                  Football Intelligence Engines
                             │
                             ▼
                  Position Evaluation Models
                             │
                             ▼
                     Decision Engine Layer
                             │
                             ▼
                     Applications & Products
```

The architecture is intentionally layered.

Each layer has a single responsibility.

---

# Layer 1 – Football Data Sources

The framework consumes football information from multiple sources.

Examples include:

- NFLVerse
- College statistics
- Combine measurements
- Team rosters
- Injury reports
- Awards
- Depth charts
- Scouting reports
- Manual LBHT research
- Future APIs

These sources provide raw information.

They do not evaluate players.

---

# Layer 2 – Football Intelligence Database

Location

```text
src/data/footballIntelligence/
```

Purpose

The Football Intelligence Database is the permanent source of truth for player information.

Responsibilities

- Canonical player records
- Identity
- Career context
- Rankings
- Intelligence profiles
- Analytics
- Scouting
- Character
- Medical
- Research
- Metadata
- Team information
- Coach information
- Executive information

The database stores information.

It should never perform football evaluation.

---

# Layer 3 – Resolver & Service Layer

Primary Components

- FootballIntelligenceResolver
- FootballIntelligenceService
- FootballIntelligenceDatabaseManager

Purpose

This layer prepares information for the framework.

Responsibilities

- Resolve player identity
- Retrieve database records
- Assemble player profiles
- Preserve compatibility
- Expose database information
- Prepare engine inputs

This layer connects the database to the framework.

It should not contain football evaluation logic.

---

# Layer 4 – Framework Core

Purpose

The Framework Core provides shared services used by every intelligence engine.

Current Components

```text
PlayerContextResolver

IntelligenceResultContract
```

Future Components

```text
EvidenceTransitionEngine

SeasonContextResolver

CompetitionContextResolver

Shared Position Utilities

Shared Diagnostics

Shared Confidence Utilities
```

The Framework Core should never become product-specific.

Every football application should be able to reuse it.

---

# Layer 5 – Football Intelligence Engines

Purpose

Each intelligence engine evaluates one football domain.

Current Engines

- Athletic Intelligence
- Production
- Football IQ
- Scheme Fit
- Player Traits
- Player Evaluation
- Recognition

Future Engines

- Performance
- Development
- Durability
- Competition
- Translation
- Contract Intelligence
- Market Intelligence
- Positional Value

Each engine should answer one football question.

Example

Production Engine

Question:

> "How productive has this player been?"

Not:

> "Should Baltimore draft him?"

---

# Layer 6 – Position Evaluation Models

Purpose

Position models combine multiple intelligence domains into football evaluations.

Examples

Quarterback

Running Back

Wide Receiver

Offensive Line

Defensive Line

Edge

Linebacker

Cornerback

Safety

Specialists

Future Structure

```text
NFL Quarterback

Prospect Quarterback

NFL Running Back

Prospect Running Back

...
```

Each model consumes standardized intelligence.

Each model produces football evaluation.

---

# Layer 7 – Decision Engines

Purpose

Decision engines apply player evaluation to a specific football problem.

Examples

- Mock Draft
- Team Needs
- Trade Value
- Fantasy
- Player Rankings
- Position Rankings
- Free Agency
- Roster Evaluation

Decision engines should never create intelligence.

They consume intelligence.

---

# Layer 8 – Applications

Applications are the user-facing products.

Examples

- Mock Draft Simulator
- Website
- Team Rankings
- Fantasy Challenge
- Draft Board
- Comparison Tool
- Future Mobile App

Applications display results.

Applications should avoid performing football evaluation.

---

# Information Flow

The framework processes information in one direction.

```text
Data

↓

Database

↓

Resolver

↓

Framework Core

↓

Intelligence Engines

↓

Position Models

↓

Decision Engines

↓

Applications
```

Information should not skip layers.

---

# Canonical Player Flow

Every player follows one permanent path.

```text
Player

↓

Canonical Player Record

↓

Player Resolver

↓

Player Context Resolver

↓

Intelligence Engines

↓

Position Model

↓

Decision Engine

↓

Application
```

The same player record should support every product.

---

# Database First

The database owns facts.

Examples

Identity

Career Context

Research

Medical

Character

Metadata

Applications should never become the permanent owner of football information.

---

# Context Before Intelligence

Every intelligence engine should receive player context before evaluation.

Context includes:

- Competition Level
- Career Stage
- Experience
- Sample Strength
- Evaluation Path

Context determines how evidence is interpreted.

---

# Intelligence Before Decisions

Every decision engine consumes intelligence.

Example

```text
Player Quality

↓

Team Need

↓

Draft Recommendation
```

Not

```text
Team Need

↓

Player Quality
```

Team need should never change player quality.

---

# Separation of Responsibilities

## Database

Stores information.

---

## Resolver

Finds information.

---

## Framework Core

Provides shared infrastructure.

---

## Intelligence Engines

Interpret evidence.

---

## Position Models

Evaluate football ability.

---

## Decision Engines

Solve football problems.

---

## Applications

Display information.

---

# Dependency Direction

The architecture should follow this dependency order.

```text
Applications

↓

Decision Engines

↓

Position Models

↓

Intelligence Engines

↓

Framework Core

↓

Resolver

↓

Database
```

Lower layers should never depend on higher layers.

For example

The database should never know about:

- Fantasy Football
- Team Needs
- Draft Rankings

---

# Current Architecture Status

## Implemented

- Football Intelligence Database
- Database Manager
- Player Resolver
- Football Intelligence Service
- Player Context Resolver
- Intelligence Result Contract
- Existing Intelligence Engines
- Position Models
- Team Context Engine

---

## In Progress

- Evidence Transition Engine
- Shared diagnostics
- Unified intelligence outputs
- Shared position normalization

---

## Planned

- Competition-aware models
- Season weighting
- Translation intelligence
- Multi-season evidence
- Confidence framework
- Development engine
- Durability engine
- Performance engine

---

# Architectural Rules

1. Every component has one responsibility.

2. Facts remain separate from intelligence.

3. Intelligence remains separate from evaluation.

4. Evaluation remains separate from decisions.

5. Products consume intelligence rather than creating it.

6. One player has one permanent identity.

7. Context comes before evaluation.

8. Intelligence should be reusable across every LBHT football product.

9. Lower layers should never depend on higher layers.

10. New features should fit naturally into the existing architecture before new layers are created.

---

# Long-Term Architecture Goal

The long-term goal is to build a football platform where every application uses the same intelligence foundation.

Whether the user is viewing:

- a mock draft,
- a player comparison,
- a fantasy recommendation,
- a trade proposal,
- or a team ranking,

the underlying player intelligence should always come from the same framework.

This ensures consistency, explainability, maintainability, and long-term scalability across the entire LBHT platform.