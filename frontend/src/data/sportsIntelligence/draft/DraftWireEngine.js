const CONTRACT_VERSION = "SIE-DRAFT-WIRE-1.0.0";

export const DRAFT_WIRE_ITEM_TYPES = Object.freeze({
  BREAKING: "breaking",
  DRAFT_ALERT: "draft-alert",
  LEAGUE_INTEL: "league-intel",
  PROSPECT: "prospect",
  TEAM: "team",
  RUMOR: "rumor",
  QUOTE: "quote",
  MEDICAL: "medical",
  EVENT: "event",
  LBHT_PROMO: "lbht-promo",
  SPONSOR: "sponsor",
});

const ALLOWED_TYPES = new Set(Object.values(DRAFT_WIRE_ITEM_TYPES));

const TYPE_LABELS = Object.freeze({
  [DRAFT_WIRE_ITEM_TYPES.BREAKING]: "Breaking",
  [DRAFT_WIRE_ITEM_TYPES.DRAFT_ALERT]: "Draft Alert",
  [DRAFT_WIRE_ITEM_TYPES.LEAGUE_INTEL]: "League Intel",
  [DRAFT_WIRE_ITEM_TYPES.PROSPECT]: "Prospect Update",
  [DRAFT_WIRE_ITEM_TYPES.TEAM]: "Team Intel",
  [DRAFT_WIRE_ITEM_TYPES.RUMOR]: "Draft Rumor",
  [DRAFT_WIRE_ITEM_TYPES.QUOTE]: "Quote",
  [DRAFT_WIRE_ITEM_TYPES.MEDICAL]: "Medical",
  [DRAFT_WIRE_ITEM_TYPES.EVENT]: "Draft Event",
  [DRAFT_WIRE_ITEM_TYPES.LBHT_PROMO]: "LBHT",
  [DRAFT_WIRE_ITEM_TYPES.SPONSOR]: "Sponsor",
});

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeItem(item, index, sourceClassification) {
  const type = cleanText(item?.type).toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return null;

  const headline = cleanText(item?.headline || item?.message);
  if (!headline) return null;

  return {
    id: item?.id || `${sourceClassification}-${type}-${index}`,
    type,
    label: cleanText(item?.label) || TYPE_LABELS[type] || "Draft Wire",
    headline,
    detail: cleanText(item?.detail),
    attribution: cleanText(item?.attribution),
    href: cleanText(item?.href),
    sourceClassification,
    priority: Number.isFinite(Number(item?.priority)) ? Number(item.priority) : 50,
    commercial: type === DRAFT_WIRE_ITEM_TYPES.LBHT_PROMO || type === DRAFT_WIRE_ITEM_TYPES.SPONSOR,
  };
}

function buildRuntimeItems({ draft, currentTeam, currentPick, cpuDecision, fieApplicationContext, queueCount = 0 }) {
  const items = [];
  const pick = currentPick?.draft_pick;
  const teamName = currentTeam?.name;

  if (teamName && pick?.pick_number) {
    items.push({
      id: `on-clock-${currentPick?.id || pick.pick_number}`,
      type: DRAFT_WIRE_ITEM_TYPES.TEAM,
      priority: 20,
      headline: `${teamName} is on the clock at Pick ${pick.pick_number}.`,
      detail: `Round ${pick.round || 1} · ${draft?.year || 2027} NFL Draft simulation`,
    });
  }

  if (cpuDecision?.available && cpuDecision?.recommendation?.name) {
    const recommendation = cpuDecision.recommendation;
    items.push({
      id: `decision-${currentPick?.id || recommendation.playerId || recommendation.name}`,
      type: DRAFT_WIRE_ITEM_TYPES.LEAGUE_INTEL,
      priority: 25,
      headline: `${recommendation.name} leads ${teamName || "the current team"}'s Draft Intelligence board.`,
      detail: Number.isFinite(recommendation.confidence)
        ? `Decision confidence ${recommendation.confidence}% · ${recommendation.position || "Prospect"}`
        : `${recommendation.position || "Prospect"} · Draft Intelligence decision support`,
    });
  }

  const canonicalFIE = fieApplicationContext?.application?.fie?.teamIntelligence || null;
  if (canonicalFIE?.teamAbbreviation) {
    const evidencePercent = Number.isFinite(canonicalFIE.evidenceCompleteness)
      ? Math.round(canonicalFIE.evidenceCompleteness * 100)
      : null;
    const strength = canonicalFIE.overallStrength ?? "Model pending";
    items.push({
      id: `canonical-fie-${currentPick?.id || canonicalFIE.teamAbbreviation}`,
      type: DRAFT_WIRE_ITEM_TYPES.TEAM,
      priority: 30,
      label: "Canonical FIE",
      headline: `${canonicalFIE.teamAbbreviation} team intelligence: ${canonicalFIE.state || "UNAVAILABLE"}.`,
      detail: `Team strength ${strength} · Evidence ${evidencePercent === null ? "pending" : `${evidencePercent}%`} · ${canonicalFIE.summary || "Canonical team context available."}`,
      attribution: "LBHT Football Intelligence Engine",
    });
  }

  if (queueCount > 0) {
    items.push({
      id: `queue-${queueCount}`,
      type: DRAFT_WIRE_ITEM_TYPES.DRAFT_ALERT,
      priority: 60,
      headline: `${queueCount} ${queueCount === 1 ? "prospect is" : "prospects are"} currently prioritized in your Draft Queue.`,
    });
  }

  return items;
}

const DEFAULT_LBHT_PROMOS = Object.freeze([
  {
    id: "lbht-draft-room",
    type: DRAFT_WIRE_ITEM_TYPES.LBHT_PROMO,
    priority: 80,
    headline: "LBHT Draft Room · Build your board. Run your war room. Make the pick.",
  },
]);

/**
 * Draft Wire is a presentation output of Sports / Draft Intelligence.
 * It does not calculate football grades, team needs, rankings, trade values, or decisions.
 * External items must already be draft-relevant and are filtered to the governed item taxonomy.
 */
export function resolveDraftWireItems({
  draft,
  currentTeam,
  currentPick,
  cpuDecision,
  fieApplicationContext = null,
  queueCount = 0,
  externalItems = [],
  commercialItems = [],
  includeLbhtPromos = true,
} = {}) {
  const runtimeItems = buildRuntimeItems({ draft, currentTeam, currentPick, cpuDecision, fieApplicationContext, queueCount });
  const candidates = [
    ...runtimeItems.map((item) => ({ item, source: "DRAFT_INTELLIGENCE_RUNTIME" })),
    ...externalItems.map((item) => ({ item, source: "DRAFT_RELEVANT_EXTERNAL_FEED" })),
    ...(includeLbhtPromos ? DEFAULT_LBHT_PROMOS : []).map((item) => ({ item, source: "LBHT_PROMOTION" })),
    ...commercialItems.map((item) => ({ item, source: "COMMERCIAL_INVENTORY" })),
  ];

  const items = candidates
    .map(({ item, source }, index) => normalizeItem(item, index, source))
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);

  return {
    available: items.length > 0,
    contractVersion: CONTRACT_VERSION,
    capability: "DRAFT_WIRE_PRESENTATION",
    items,
    policy: {
      scope: "NFL_DRAFT_ONLY",
      allowedTypes: [...ALLOWED_TYPES],
      generalSportsNewsAllowed: false,
      commercialInventoryAllowed: true,
      footballEvaluationCalculatedHere: false,
      canonicalFIEContextPassedThrough: Boolean(fieApplicationContext),
      canonicalFIEReasoningRecomputedHere: false,
    },
  };
}

export default { resolveDraftWireItems, DRAFT_WIRE_ITEM_TYPES };
