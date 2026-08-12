import { createFootballIQProfile } from "./createFootballIQProfile.js";
import { prospectIds } from "../registry/prospectIds.js";

export const footballIQProfiles = {
  [prospectIds.ARCH_MANNING]: createFootballIQProfile({
    playerId: prospectIds.ARCH_MANNING,
    playerName: "Arch Manning",
    position: "QB",
    mentalProcessing: {
      processingSpeed: 94,
      playRecognition: 92,
      anticipation: 91,
      decisionMaking: 93,
      situationalAwareness: 92,
    },
    footballCharacter: {
      leadership: 95,
      communication: 91,
      coachability: 94,
      competitiveToughness: 92,
      discipline: 93,
    },
    scores: {
      processing: 93,
      instincts: 91,
      awareness: 92,
      leadership: 95,
      overallFootballIQ: 93,
    },
    strengths: [
      "Processes defensive rotations quickly",
      "Excellent pocket awareness",
      "Strong pre-snap recognition",
      "Natural field leadership",
    ],
    concerns: [
      "Can continue improving anticipation against complex NFL-style disguises",
      "Needs additional live-game experience",
    ],
    notes:
      "Advanced football intelligence for a young quarterback. Demonstrates excellent processing, leadership, and decision-making traits that project well to the professional level.",
    source: "LBHT Scouting",
    confidence: 0.88,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.CALEB_DOWNS]: createFootballIQProfile({
    playerId: prospectIds.CALEB_DOWNS,
    playerName: "Caleb Downs",
    position: "S",
    mentalProcessing: {
      processingSpeed: 97,
      playRecognition: 98,
      anticipation: 96,
      decisionMaking: 95,
      situationalAwareness: 97,
    },
    footballCharacter: {
      leadership: 91,
      communication: 95,
      coachability: 94,
      competitiveToughness: 93,
      discipline: 94,
    },
    scores: {
      processing: 97,
      instincts: 98,
      awareness: 97,
      leadership: 93,
      overallFootballIQ: 97,
    },
    strengths: [
      "Elite play recognition",
      "Outstanding route and coverage awareness",
      "Processes offensive concepts extremely quickly",
      "Excellent defensive communication profile",
    ],
    concerns: [
      "Can continue adding strength for heavy box usage",
    ],
    notes:
      "Elite football intelligence profile for a modern safety. Processes quickly, communicates well, and consistently arrives at the right place before the offense can exploit space.",
    source: "LBHT Research",
    confidence: 0.9,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.PETER_WOODS]: createFootballIQProfile({
    playerId: prospectIds.PETER_WOODS,
    playerName: "Peter Woods",
    position: "DL",
    mentalProcessing: {
      processingSpeed: 88,
      playRecognition: 91,
      anticipation: 86,
      decisionMaking: 89,
      situationalAwareness: 90,
    },
    footballCharacter: {
      leadership: 87,
      communication: 84,
      coachability: 93,
      competitiveToughness: 95,
      discipline: 90,
    },
    scores: {
      processing: 89,
      instincts: 90,
      awareness: 90,
      leadership: 88,
      overallFootballIQ: 90,
    },
    strengths: [
      "Recognizes blocking concepts quickly",
      "Excellent run-fit discipline",
      "High-effort competitor",
      "Coachable with consistent motor",
    ],
    concerns: [
      "Pass-rush counters still developing",
      "Can occasionally overcommit versus misdirection",
    ],
    notes:
      "High-level football intelligence with excellent processing versus the run. Displays strong instincts, awareness, and competitive toughness that project to an early NFL contributor.",
    source: "LBHT Scouting",
    confidence: 0.9,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.FRANCIS_MAUIGOA]: createFootballIQProfile({
    playerId: prospectIds.FRANCIS_MAUIGOA,
    playerName: "Francis Mauigoa",
    position: "OT",
    mentalProcessing: {
      processingSpeed: 91,
      playRecognition: 92,
      anticipation: 89,
      decisionMaking: 91,
      situationalAwareness: 90,
    },
    footballCharacter: {
      leadership: 90,
      communication: 88,
      coachability: 94,
      competitiveToughness: 94,
      discipline: 91,
    },
    scores: {
      processing: 91,
      instincts: 89,
      awareness: 90,
      leadership: 91,
      overallFootballIQ: 91,
    },
    strengths: [
      "Excellent pass protection recognition",
      "Patient versus blitz looks",
      "Very coachable",
      "High football maturity",
    ],
    concerns: ["Can improve anticipation against exotic NFL fronts"],
    notes:
      "Highly intelligent offensive tackle with advanced processing and excellent coaching responsiveness.",
    source: "LBHT Research",
    confidence: 0.9,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.LANORRIS_SELLERS]: createFootballIQProfile({
    playerId: prospectIds.LANORRIS_SELLERS,
    playerName: "LaNorris Sellers",
    position: "QB",
    mentalProcessing: {
      processingSpeed: 89,
      playRecognition: 88,
      anticipation: 90,
      decisionMaking: 88,
      situationalAwareness: 89,
    },
    footballCharacter: {
      leadership: 92,
      communication: 91,
      coachability: 92,
      competitiveToughness: 95,
      discipline: 90,
    },
    scores: {
      processing: 89,
      instincts: 89,
      awareness: 89,
      leadership: 92,
      overallFootballIQ: 90,
    },
    strengths: [
      "Natural leader",
      "Excellent competitive toughness",
      "Quick learner",
      "Poised under pressure",
    ],
    concerns: ["Still developing anticipation versus disguised coverages"],
    notes:
      "Developing quarterback with outstanding leadership and rapidly improving field vision.",
    source: "LBHT Research",
    confidence: 0.89,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.KADYN_PROCTOR]: createFootballIQProfile({
    playerId: prospectIds.KADYN_PROCTOR,
    playerName: "Kadyn Proctor",
    position: "OT",
    mentalProcessing: {
      processingSpeed: 89,
      playRecognition: 90,
      anticipation: 88,
      decisionMaking: 90,
      situationalAwareness: 89,
    },
    footballCharacter: {
      leadership: 88,
      communication: 86,
      coachability: 92,
      competitiveToughness: 93,
      discipline: 89,
    },
    scores: {
      processing: 89,
      instincts: 88,
      awareness: 89,
      leadership: 89,
      overallFootballIQ: 89,
    },
    strengths: [
      "Excellent understanding of leverage",
      "Strong blitz recognition",
      "Responds well to coaching",
    ],
    concerns: ["Needs more consistency recognizing late defensive movement"],
    notes:
      "Smart offensive tackle with very good recognition skills and strong developmental upside.",
    source: "LBHT Research",
    confidence: 0.88,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.TJ_PARKER]: createFootballIQProfile({
    playerId: prospectIds.TJ_PARKER,
    playerName: "T.J. Parker",
    position: "EDGE",
    mentalProcessing: {
      processingSpeed: 90,
      playRecognition: 89,
      anticipation: 88,
      decisionMaking: 89,
      situationalAwareness: 90,
    },
    footballCharacter: {
      leadership: 86,
      communication: 85,
      coachability: 91,
      competitiveToughness: 94,
      discipline: 88,
    },
    scores: {
      processing: 90,
      instincts: 89,
      awareness: 89,
      leadership: 87,
      overallFootballIQ: 89,
    },
    strengths: [
      "Recognizes pass sets quickly",
      "High-motor decision making",
      "Good awareness of pocket depth",
      "Competitive finisher",
    ],
    concerns: [
      "Can continue improving counter sequencing",
      "Run-fit discipline can still become more consistent",
    ],
    notes:
      "Strong football intelligence profile for an explosive edge defender. Wins with quick recognition, urgency, and developing pass-rush planning.",
    source: "LBHT Research",
    confidence: 0.83,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.RUEBEN_BAIN]: createFootballIQProfile({
    playerId: prospectIds.RUEBEN_BAIN,
    playerName: "Rueben Bain Jr.",
    position: "EDGE",
    mentalProcessing: {
      processingSpeed: 89,
      playRecognition: 91,
      anticipation: 89,
      decisionMaking: 90,
      situationalAwareness: 90,
    },
    footballCharacter: {
      leadership: 87,
      communication: 86,
      coachability: 91,
      competitiveToughness: 94,
      discipline: 90,
    },
    scores: {
      processing: 89,
      instincts: 90,
      awareness: 90,
      leadership: 88,
      overallFootballIQ: 90,
    },
    strengths: [
      "Understands run fits well",
      "Processes blocking schemes quickly",
      "Disciplined edge presence",
      "Strong competitive toughness",
    ],
    concerns: [
      "Can continue expanding pass-rush plan variety",
    ],
    notes:
      "Reliable football intelligence profile with strong awareness, run-game understanding, and physical discipline.",
    source: "LBHT Research",
    confidence: 0.82,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.JEREMIYAH_LOVE]: createFootballIQProfile({
    playerId: prospectIds.JEREMIYAH_LOVE,
    playerName: "Jeremiyah Love",
    position: "RB",
    mentalProcessing: {
      processingSpeed: 90,
      playRecognition: 88,
      anticipation: 90,
      decisionMaking: 89,
      situationalAwareness: 88,
    },
    footballCharacter: {
      leadership: 84,
      communication: 84,
      coachability: 90,
      competitiveToughness: 92,
      discipline: 88,
    },
    scores: {
      processing: 90,
      instincts: 91,
      awareness: 88,
      leadership: 85,
      overallFootballIQ: 89,
    },
    strengths: [
      "Good run-lane anticipation",
      "Understands space well",
      "Quick processor in the open field",
      "Shows useful third-down awareness",
    ],
    concerns: [
      "Pass protection recognition can continue improving",
      "Running back positional role may require more third-down refinement",
    ],
    notes:
      "Smart, instinctive running back with strong spatial awareness and explosive decision-making in the open field.",
    source: "LBHT Research",
    confidence: 0.8,
    lastUpdated: "2026-07-03",
  }),

  [prospectIds.CALEB_LOMU]: createFootballIQProfile({
    playerId: prospectIds.CALEB_LOMU,
    playerName: "Caleb Lomu",
    position: "OT",
    mentalProcessing: {
      processingSpeed: 88,
      playRecognition: 89,
      anticipation: 87,
      decisionMaking: 88,
      situationalAwareness: 88,
    },
    footballCharacter: {
      leadership: 83,
      communication: 85,
      coachability: 90,
      competitiveToughness: 90,
      discipline: 88,
    },
    scores: {
      processing: 88,
      instincts: 87,
      awareness: 88,
      leadership: 84,
      overallFootballIQ: 88,
    },
    strengths: [
      "Good pass-set awareness",
      "Processes edge speed well",
      "Coachable developmental profile",
      "Good recovery awareness",
    ],
    concerns: [
      "Can improve consistency versus complex pressure looks",
      "Needs more reps against high-end pass-rush counters",
    ],
    notes:
      "Developing offensive tackle with good awareness, recovery intelligence, and pass-protection processing upside.",
    source: "LBHT Research",
    confidence: 0.78,
    lastUpdated: "2026-07-03",
  }),
};

export default footballIQProfiles;
