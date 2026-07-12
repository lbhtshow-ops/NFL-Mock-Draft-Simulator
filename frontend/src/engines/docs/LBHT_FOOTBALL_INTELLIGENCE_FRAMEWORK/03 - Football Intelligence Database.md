# LBHT Football Intelligence Framework

# 03 – Football Intelligence Database

**Framework Version:** 1.0.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

The Football Intelligence Database is the permanent source of truth for all football information used throughout the LBHT platform.

Its purpose is to collect, organize, and preserve football knowledge in a structured format that every engine, model, and application can consume.

The database stores information.

It does **not** evaluate football players.

---

# Design Philosophy

The Football Intelligence Database is built around one fundamental idea:

> **Every football player should have one permanent, canonical record.**

Everything known about a player is attached to that record throughout the player's football career.

The framework should never create completely different player records simply because the player changes leagues or career stages.

Instead, the record grows over time.

---

# Primary Responsibilities

The database is responsible for:

- Canonical player identity
- Career information
- Football intelligence profiles
- Analytics
- Scouting
- Medical history
- Character information
- Research
- Metadata
- Team information
- Coach information
- Executive information
- Historical information

The database is **not** responsible for evaluating football players.

---

# Database Philosophy

The database should answer questions like:

- Who is this player?
- What team does he play for?
- What position does he play?
- What awards has he won?
- What injuries has he suffered?
- What statistics has he accumulated?
- What research has been collected?

It should **not** answer:

- Is he elite?
- Should Baltimore draft him?
- Is he worth a first-round pick?
- Should he start?

Those belong elsewhere.

---

# Canonical Player Record

Every player is represented by one canonical record.

Current structure:

```text
playerId

identity

careerContext

rankings

intelligence

analytics

scouting

character

medical

research

metadata
```

This record is intended to remain stable throughout the player's career.

---

# Identity

Purpose

Stores permanent identifying information.

Examples

- Player Name
- Position
- School
- Class
- Birth Date
- Age
- Height
- Weight
- Arm Length
- Hand Size
- Wingspan

Identity describes who the player is.

Identity should not contain evaluations.

---

# Career Context

Purpose

Stores factual information about where the player currently is in his football career.

Examples

Competition

- League
- Level
- Conference
- Division

Career

- Career Stage
- Experience
- Active Season

Current Team

- Team ID
- Team Name
- Abbreviation

Draft

- Draft Class
- Draft Status
- Draft Year
- Draft Round
- Overall Pick

Roster

- Rookie
- Starter
- Status

History

- Previous Levels
- Seasons Played

Career Context describes the player's current football situation.

It does not evaluate it.

---

# Rankings

Purpose

Stores rankings received from trusted sources.

Examples

- Overall Rank
- Position Rank
- Consensus Rank
- Tier
- Projection

Rankings are information.

They are not the framework's own evaluation.

---

# Intelligence

Purpose

Stores intelligence generated or collected by the framework.

Current domains include:

- Traits
- Evaluation
- Athletics
- Football IQ
- Scheme Fit
- Production
- Consensus
- Recommendations

Future domains include:

- Recognition
- Durability
- Development
- Competition
- Translation
- Usage
- Performance
- Market Value
- Contract Intelligence

Intelligence is stored separately so it can be reused across multiple products.

---

# Analytics

Purpose

Stores calculated metrics.

Examples

- Athletic Score
- Production Score
- Football IQ Score
- Scheme Fit Score
- Overall Player Score

Analytics should contain measurable outputs rather than football decisions.

---

# Scouting

Purpose

Stores football scouting information.

Examples

- Summary
- Strengths
- Weaknesses
- Ceiling
- Floor
- Comparison
- Notes

Scouting provides qualitative football observations.

---

# Character

Purpose

Stores non-physical football characteristics.

Examples

- Leadership
- Competitiveness
- Coachability
- Work Ethic
- Communication
- Discipline

Character information should remain separate from football ability.

---

# Medical

Purpose

Stores health-related football information.

Examples

- Durability
- Injury History
- Availability
- Risk Level
- Notes

Medical information should support evaluation.

It should not replace evaluation.

---

# Research

Purpose

Stores supporting football research.

Examples

- Internal Notes
- External Sources
- Review Dates
- Research History

Research provides traceability for future work.

---

# Metadata

Purpose

Tracks information about the record itself.

Examples

- Confidence
- Sources
- Record Version
- Framework Version
- Data Version
- Created Date
- Updated Date
- Status

Metadata describes the record.

It does not describe the player.

---

# Database Manager

Primary File

```text
FootballIntelligenceDatabaseManager.js
```

Purpose

Provides controlled access to the Football Intelligence Database.

Current responsibilities include:

- Retrieve player records
- Retrieve identity
- Retrieve career context
- Retrieve intelligence
- Retrieve analytics
- Retrieve scouting
- Retrieve character
- Retrieve medical
- Retrieve research
- Retrieve metadata
- Build player dossiers

The Database Manager should never perform football evaluation.

---

# Registry Layer

Purpose

Maintains canonical player identities.

Current responsibilities

- Canonical IDs
- Prospect resolution
- Identity mapping
- Duplicate prevention

Current files include:

```text
prospectIds

prospects

resolveProspect
```

The registry currently focuses on prospects.

Future versions should support all football players.

---

# Resolver Layer

Primary File

```text
FootballIntelligenceResolver.js
```

Purpose

Resolves an incoming player into the canonical player record.

Responsibilities

- Resolve identity
- Retrieve player record
- Preserve career context
- Assemble record sections

The resolver prepares data.

It does not evaluate football ability.

---

# Service Layer

Primary File

```text
FootballIntelligenceService.js
```

Purpose

Builds the unified football intelligence profile.

Responsibilities

- Resolve players
- Prepare engine inputs
- Retrieve stored intelligence
- Call intelligence engines
- Return one assembled player profile

The service coordinates information.

It should not contain product-specific logic.

---

# Supporting Data

The Football Intelligence Database will continue expanding.

Examples include:

- Team Database
- Coach Database
- Executive Database
- Team Context
- Depth Charts
- Draft Capital
- NFL Rosters
- College Teams
- Awards
- Historical Seasons
- Injury Database
- Salary Information
- Future Contract Data

All supporting information should remain connected to the same architecture.

---

# Source Hierarchy

The framework should always know where information originated.

Examples

```text
NFLVerse

↓

Official NFL Data

↓

College Statistics

↓

LBHT Research

↓

Manual Review
```

Every important record should eventually track:

- Source
- Date Collected
- Last Verified
- Confidence

---

# Database Rules

The database should:

✓ Store facts

✓ Preserve history

✓ Maintain one player identity

✓ Support versioning

✓ Track sources

✓ Remain reusable

The database should never:

✗ Decide draft value

✗ Rank fantasy players

✗ Determine trade value

✗ Recommend free agents

✗ Recommend draft selections

Those belong in higher layers.

---

# Future Growth

The database is expected to expand into a complete football knowledge platform.

Future additions include:

- Historical player database
- Historical team database
- Historical coaching database
- Historical draft database
- Multi-season profiles
- Career progression tracking
- Contract history
- Team philosophy profiles
- Scheme databases
- League-wide benchmarking
- Cross-era normalization

The architecture should support expansion without redesigning the database.

---

# Long-Term Goal

The Football Intelligence Database should become the permanent football memory of the LBHT platform.

Every football product should retrieve information from this database instead of creating independent copies of player information.

The database exists to preserve facts.

The framework exists to interpret those facts.

Together, they form the foundation of every football application built by LBHT.