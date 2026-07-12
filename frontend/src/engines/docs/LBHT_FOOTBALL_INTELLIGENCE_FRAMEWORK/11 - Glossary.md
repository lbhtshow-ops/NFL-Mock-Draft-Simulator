# LBHT Football Intelligence Framework

# 11 – Glossary

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This glossary defines the standard terminology used throughout the LBHT Football Intelligence Framework.

Every major concept should have one official definition.

Developers should use these definitions consistently across the framework, documentation, and future applications.

---

# Application

A user-facing product that consumes the Football Intelligence Framework.

Examples

- Mock Draft Simulator
- Fantasy Football
- Player Rankings
- Trade Machine
- Team Comparison
- Website Modules

Applications present information.

Applications should not evaluate players.

---

# Analytics

Calculated measurements generated from football information.

Examples

- Athletic Score
- Production Score
- Overall Player Score

Analytics are measurable outputs.

They are not football decisions.

---

# Canonical Player

The single permanent identity representing a football player throughout his entire career.

A player should have only one canonical record regardless of competition level or application.

---

# Canonical Player Record

The permanent database record containing all known information about a player.

Current sections include:

- Identity
- Career Context
- Rankings
- Intelligence
- Analytics
- Scouting
- Character
- Medical
- Research
- Metadata

---

# Career Context

The factual description of a player's current football situation.

Examples include:

- Competition Level
- Career Stage
- Experience
- Current Team
- Draft Status
- Roster Status

Career Context describes where the player is.

It does not evaluate the player.

---

# Career Stage

The stage of a player's football career.

Examples

- High School
- College Development
- Draft Prospect
- Rookie
- Young Veteran
- Established Veteran
- Late Career
- Free Agent
- Retired

Career Stage influences evaluation.

---

# Competition Level

The level of football at which the player currently competes.

Examples

- High School
- NCAA
- NFL
- International
- Future Leagues

Competition Level determines which evidence models should be used.

---

# Confidence

A measurement describing how trustworthy an evaluation is.

Confidence is influenced by:

- Sample Size
- Evidence Quality
- Source Reliability
- Data Completeness
- Competition Level

Confidence is separate from player quality.

---

# Context

Information describing the environment in which a player should be evaluated.

Examples

- Competition Level
- Career Stage
- Experience
- Sample Strength
- Evaluation Path

Context is resolved before evaluation begins.

---

# Data State

The availability status of a particular intelligence domain.

Current values include:

- Available
- Unavailable
- Unknown
- Insufficient Sample
- Not Applicable

Unknown is not the same as average.

---

# Database

The permanent repository of football facts used throughout the framework.

The database stores information.

It does not evaluate football players.

---

# Decision

A recommendation produced by a Decision Engine.

Examples

- Draft Recommendation
- Trade Recommendation
- Fantasy Ranking
- Team Fit

Decisions consume intelligence.

They do not create intelligence.

---

# Decision Engine

A framework component that solves a football problem using player evaluations.

Examples

- Mock Draft Engine
- Trade Value Engine
- Fantasy Engine
- Team Needs Engine

Decision Engines are application-independent.

---

# Development Trajectory

An evaluation of how a player's performance is changing over time.

Examples

- Improving
- Stable
- Declining

Development Trajectory is separate from current player quality.

---

# Durability

An intelligence domain describing player availability and injury history.

Durability evaluates reliability.

It does not evaluate football ability.

---

# Evaluation

A football conclusion produced by combining intelligence.

Examples

- Player Quality
- Current Ability
- Future Projection
- Risk

Evaluation is separate from decisions.

---

# Evaluation Path

The evaluation strategy selected by the framework based on player context.

Examples

- College Evaluation
- Prospect Evaluation
- NFL Evaluation
- Rookie Transition

Evaluation Path is determined by PlayerContextResolver.

---

# Evidence

The football information used to support an evaluation.

Examples

- Statistics
- Film
- Awards
- Measurements
- Scouting
- Research

Evidence supports intelligence.

---

# Evidence Level

A description of the strength of available evidence.

Examples

- None
- Limited
- Moderate
- Strong
- Very Strong

Evidence Level is separate from confidence.

---

# Evidence Profile

A description of the types of evidence available for a player.

Examples

- Prospect
- Rookie
- Veteran
- Historical

Evidence Profile helps determine how information should be interpreted.

---

# EvidenceTransitionEngine

A planned Framework Core component responsible for determining how college evidence transitions into professional evidence over time.

Its purpose is to gradually reduce the influence of prospect evaluation as NFL evidence grows.

---

# Explainability

The ability of the framework to explain why an evaluation or recommendation was produced.

Every major evaluation should be explainable.

---

# Facts

Objective football information collected by the framework.

Examples

- Height
- Weight
- Age
- Statistics
- Awards
- Team
- Position

Facts are stored in the database.

Facts are not opinions.

---

# Football Intelligence Framework

The complete architecture responsible for producing reusable football intelligence across every LBHT football application.

---

# Football Intelligence Database

The permanent repository of football information used throughout the framework.

It serves as the single source of truth for player information.

---

# Football Intelligence Service

The service responsible for assembling complete football intelligence profiles by coordinating database records, context, and intelligence engines.

---

# Framework Core

The shared infrastructure supporting every intelligence engine.

Examples

- PlayerContextResolver
- IntelligenceResultContract
- EvidenceTransitionEngine

---

# Identity

Permanent identifying information describing a player.

Examples

- Name
- Position
- Height
- Weight
- School

Identity describes who the player is.

---

# Intelligence

Football knowledge produced by interpreting evidence.

Examples

- Athletic Intelligence
- Production Intelligence
- Football IQ
- Recognition
- Scheme Fit

Intelligence explains football evidence.

---

# Intelligence Engine

A framework component responsible for evaluating one football domain.

Each intelligence engine focuses on one area of expertise.

---

# IntelligenceResultContract

The standardized structure returned by every intelligence engine.

Its purpose is to ensure consistency across the framework.

---

# Metadata

Information describing a record rather than the player.

Examples

- Confidence
- Sources
- Version
- Created Date
- Updated Date

---

# Player Context

The complete football environment surrounding a player.

Player Context combines:

- Career Context
- Competition Level
- Sample Strength
- Evaluation Path
- Evidence Profile

---

# PlayerContextResolver

The Framework Core component responsible for determining player context before evaluation begins.

---

# Position Model

A framework component responsible for evaluating players at a specific football position.

Examples

- Quarterback Evaluation Model
- Running Back Evaluation Model
- Cornerback Evaluation Model

Position Models consume intelligence.

---

# Product

A user-facing application built using the Football Intelligence Framework.

Products consume framework outputs.

---

# Projection

An estimate of a player's future football ability.

Projection is separate from current player quality.

---

# Prospect

A player who has not yet entered the NFL.

Prospects are evaluated primarily using college evidence.

---

# Prospect Evidence

Football evidence collected before a player enters the NFL.

Prospect Evidence remains part of the player's permanent history.

---

# Resolver

A framework component responsible for locating and assembling information.

Resolvers prepare data.

They do not evaluate football ability.

---

# Risk

An evaluation describing uncertainty surrounding future player performance.

Examples

- Injury Risk
- Development Risk
- Projection Risk

Risk is separate from confidence.

---

# Sample Strength

A description of how much usable evidence exists for a player.

Examples

- Limited
- Moderate
- Strong

Sample Strength influences confidence.

---

# Scouting

Qualitative football observations collected through film study or research.

Examples

- Strengths
- Weaknesses
- Player Comparisons
- Notes

---

# Service Layer

The architectural layer responsible for coordinating framework components.

Examples

- FootballIntelligenceService

The Service Layer assembles information.

It should not contain product-specific logic.

---

# Source of Truth

The authoritative location for a specific piece of information.

Within the framework, the Football Intelligence Database serves as the source of truth for football facts.

---

# Team Context

Information describing an NFL organization's roster and strategic situation.

Examples

- Current Needs
- Future Needs
- Organizational Priorities

Team Context influences decisions.

It does not change player quality.

---

# Team Need

An organizational requirement for a particular position.

Team Need is evaluated independently of player quality.

---

# Translation

An intelligence domain describing how successfully football ability is expected to transfer between competition levels.

Examples

- College to NFL
- Lower Division to FBS

Translation supports projection.

---

# Version

A unique identifier representing the evolution of framework components.

Examples

- Framework Version
- Engine Version
- Model Version
- Contract Version

Versioning supports long-term maintenance.

---

# Working Definition of the Framework

The **LBHT Football Intelligence Framework** is a modular, reusable, explainable football intelligence platform that transforms football facts into standardized intelligence, combines that intelligence into position-specific evaluations, and supports multiple football applications through independent decision engines.

---

# Guiding Principle

> **One Player. One Framework. One Source of Truth. Unlimited Football Applications.**