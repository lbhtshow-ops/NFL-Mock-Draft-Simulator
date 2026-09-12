// INT-2B.1 — 2026 32-team coaching / play-calling baseline.
// Baseline only: scheme labels are intentionally NOT inferred from coach names.
// Official-club enrichment is reserved for INT-2B.2+.

export const NFL_TEAM_IDENTITY_2026_BASELINE_VERSION = "FIE-NFL-TEAM-IDENTITY-2026-BASELINE-1.0.0";

export const nflTeamIdentity2026Baseline = Object.freeze({
  ARI: Object.freeze({
    team: "ARI", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Mike LaFleur", offensiveCoordinator: "Nathaniel Hackett", defensiveCoordinator: "Nick Rallis" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Mike LaFleur" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  ATL: Object.freeze({
    team: "ATL", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Kevin Stefanski", offensiveCoordinator: "Tommy Rees", defensiveCoordinator: "Jeff Ulbrich" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Tommy Rees" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  BAL: Object.freeze({
    team: "BAL", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Jesse Minter", offensiveCoordinator: "Declan Doyle", defensiveCoordinator: "Anthony Weaver" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Declan Doyle" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  BUF: Object.freeze({
    team: "BUF", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Joe Brady", offensiveCoordinator: "Pete Carmichael Jr.", defensiveCoordinator: "Jim Leonhard" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Joe Brady" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  CAR: Object.freeze({
    team: "CAR", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Dave Canales", offensiveCoordinator: "Brad Idzik", defensiveCoordinator: "Ejiro Evero" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Brad Idzik" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  CHI: Object.freeze({
    team: "CHI", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Ben Johnson", offensiveCoordinator: "Press Taylor", defensiveCoordinator: "Dennis Allen" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Ben Johnson" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  CIN: Object.freeze({
    team: "CIN", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Zac Taylor", offensiveCoordinator: "Dan Pitcher", defensiveCoordinator: "Al Golden" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Zac Taylor" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  CLE: Object.freeze({
    team: "CLE", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Todd Monken", offensiveCoordinator: "Travis Switzer", defensiveCoordinator: "Mike Rutenberg" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Todd Monken" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  DAL: Object.freeze({
    team: "DAL", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Brian Schottenheimer", offensiveCoordinator: "Klayton Adams", defensiveCoordinator: "Christian Parker" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Brian Schottenheimer" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  DEN: Object.freeze({
    team: "DEN", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Sean Payton", offensiveCoordinator: "Davis Webb", defensiveCoordinator: "Vance Joseph" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Davis Webb" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  DET: Object.freeze({
    team: "DET", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Dan Campbell", offensiveCoordinator: "Drew Petzing", defensiveCoordinator: "Kelvin Sheppard" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Drew Petzing" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  GB: Object.freeze({
    team: "GB", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Matt LaFleur", offensiveCoordinator: "Adam Stenavich", defensiveCoordinator: "Jonathan Gannon" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Matt LaFleur" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  HOU: Object.freeze({
    team: "HOU", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "DeMeco Ryans", offensiveCoordinator: "Nick Caley", defensiveCoordinator: "Matt Burke" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Nick Caley" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  IND: Object.freeze({
    team: "IND", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Shane Steichen", offensiveCoordinator: "Jim Bob Cooter", defensiveCoordinator: "Lou Anarumo" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Shane Steichen" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  JAX: Object.freeze({
    team: "JAX", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Liam Coen", offensiveCoordinator: "Grant Udinski", defensiveCoordinator: "Anthony Campanile" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Liam Coen" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  KC: Object.freeze({
    team: "KC", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Andy Reid", offensiveCoordinator: "Eric Bieniemy", defensiveCoordinator: "Steve Spagnuolo" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Andy Reid" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  LAC: Object.freeze({
    team: "LAC", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Jim Harbaugh", offensiveCoordinator: "Mike McDaniel", defensiveCoordinator: "Chris O'Leary" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Mike McDaniel" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  LAR: Object.freeze({
    team: "LAR", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Sean McVay", offensiveCoordinator: "Nate Scheelhaase", defensiveCoordinator: "Chris Shula" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Sean McVay" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  LV: Object.freeze({
    team: "LV", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Klint Kubiak", offensiveCoordinator: "Andrew Janocko", defensiveCoordinator: "Rob Leonard" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Klint Kubiak" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  MIA: Object.freeze({
    team: "MIA", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Jeff Hafley", offensiveCoordinator: "Bobby Slowik", defensiveCoordinator: "Sean Duggan" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Bobby Slowik" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  MIN: Object.freeze({
    team: "MIN", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Kevin O'Connell", offensiveCoordinator: "Wes Phillips", defensiveCoordinator: "Brian Flores" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Kevin O'Connell" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  NE: Object.freeze({
    team: "NE", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Mike Vrabel", offensiveCoordinator: "Josh McDaniels", defensiveCoordinator: "Zak Kuhr" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Josh McDaniels" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  NO: Object.freeze({
    team: "NO", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Kellen Moore", offensiveCoordinator: "Doug Nussmeier", defensiveCoordinator: "Brandon Staley" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Kellen Moore" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  NYG: Object.freeze({
    team: "NYG", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "John Harbaugh", offensiveCoordinator: "Matt Nagy", defensiveCoordinator: "Dennard Wilson" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Matt Nagy" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  NYJ: Object.freeze({
    team: "NYJ", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Aaron Glenn", offensiveCoordinator: "Frank Reich", defensiveCoordinator: "Brian Duker" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Frank Reich" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  PHI: Object.freeze({
    team: "PHI", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Nick Sirianni", offensiveCoordinator: "Sean Mannion", defensiveCoordinator: "Vic Fangio" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Sean Mannion" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  PIT: Object.freeze({
    team: "PIT", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Mike McCarthy", offensiveCoordinator: "Brian Angelichio", defensiveCoordinator: "Patrick Graham" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Mike McCarthy" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  SEA: Object.freeze({
    team: "SEA", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Mike Macdonald", offensiveCoordinator: "Brian Fleury", defensiveCoordinator: "Aden Durde" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Brian Fleury" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  SF: Object.freeze({
    team: "SF", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Kyle Shanahan", offensiveCoordinator: "Klay Kubiak", defensiveCoordinator: "Raheem Morris" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Kyle Shanahan" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  TB: Object.freeze({
    team: "TB", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Todd Bowles", offensiveCoordinator: "Zac Robinson", defensiveCoordinator: "Todd Bowles" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Zac Robinson" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  TEN: Object.freeze({
    team: "TEN", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Robert Saleh", offensiveCoordinator: "Brian Daboll", defensiveCoordinator: "Gus Bradley" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "Brian Daboll" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  }),
  WAS: Object.freeze({
    team: "WAS", season: 2026, asOf: "2026-09-05",
    observations: Object.freeze([
      Object.freeze({
        domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
        value: Object.freeze({ headCoach: "Dan Quinn", offensiveCoordinator: "David Blough", defensiveCoordinator: "Daronte Jones" }),
        classification: "FACT", tags: Object.freeze(["2026_COACHING_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.9, notes: "Baseline coaching structure; official-club enrichment follows in INT-2B.2+."
      }),
      Object.freeze({
        domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
        value: Object.freeze({ caller: "David Blough" }),
        classification: "FACT", tags: Object.freeze(["2026_PLAY_CALLER_BASELINE"]),
        sourceId: "ESPN-2026-COACHING-STAFFS", sourceType: "SECONDARY_REFERENCE",
        sourceLabel: "ESPN 2026 Current Coaching Staffs", sourceUri: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
        observedAt: "2026-09-05", verifiedAt: "2026-09-05", effectiveFrom: "2026-01-01", effectiveTo: null,
        confidence: 0.85, notes: "Baseline offensive play-caller; subject to official-club enrichment."
      })
    ])
  })
});

export const NFL_TEAM_IDENTITY_2026_BASELINE_TEAMS = Object.freeze(Object.keys(nflTeamIdentity2026Baseline));

export function getNFLTeamIdentity2026Baseline(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentity2026Baseline[key] || null;
}

export default nflTeamIdentity2026Baseline;
