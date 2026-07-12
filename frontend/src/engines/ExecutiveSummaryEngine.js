function formatLabel(label = "") {
  return label.replace(/([A-Z])/g, " $1").trim();
}

function getTopNumericItem(items = {}) {
  return Object.entries(items)
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => b[1] - a[1])[0];
}

function getAverageScore(scores = []) {
  const validScores = scores.filter((score) => typeof score === "number");

  if (validScores.length === 0) return null;

  return Math.round(
    validScores.reduce((total, score) => total + score, 0) / validScores.length
  );
}

function getRecommendation(projection = "", risk = "") {
  if (projection.includes("Top 5")) return "Draft";
  if (projection.includes("Top 10")) return "Draft";
  if (projection.includes("Top 15")) return "Draft";
  if (projection.includes("Round 1")) return "Draft";

  if (risk === "High") return "Monitor";

  return "Consider";
}

function getConfidenceLabel(confidenceScore) {
  if (typeof confidenceScore !== "number") return "Pending";

  return `${confidenceScore}%`;
}

export function buildExecutiveSummary(prospectIntelligence) {
  const evaluationSummary =
    prospectIntelligence?.intelligence?.evaluation || {};
  const evaluation = evaluationSummary?.data || {};

  const traitSummary = prospectIntelligence?.intelligence?.traits || {};
  const traits = traitSummary?.data?.traits || {};

  const athleticSummary = prospectIntelligence?.intelligence?.athletics || {};
  const athleticData = athleticSummary?.data || {};
  const athleticScores = athleticData?.scores || {};

  const footballIQSummary = prospectIntelligence?.intelligence?.footballIQ || {};
  const footballIQData = footballIQSummary?.data || {};
  const footballIQScores = footballIQData?.scores || {};

  const productionSummary = prospectIntelligence?.intelligence?.production || {};
  const productionData = productionSummary?.data || {};
  const productionScores = productionData?.productionScores || {};

  const schemeFitSummary = prospectIntelligence?.intelligence?.schemeFit || {};
  const schemeFitData = schemeFitSummary?.data || {};
  const schemeScore = schemeFitData?.versatility?.score || null;

  const topTrait = getTopNumericItem(traits);

  const intelligenceScore = getAverageScore([
    evaluation.overallGrade,
    athleticScores.overallAthleticScore,
    footballIQScores.overallFootballIQ,
    productionScores.overallProductionScore,
    schemeScore,
  ]);

  const confidenceScore = getAverageScore([
    evaluationSummary.confidence ? evaluationSummary.confidence * 100 : null,
    traitSummary.confidence ? traitSummary.confidence * 100 : null,
    athleticSummary.confidence ? athleticSummary.confidence * 100 : null,
    footballIQSummary.confidence ? footballIQSummary.confidence * 100 : null,
    productionSummary.confidence ? productionSummary.confidence * 100 : null,
    schemeFitSummary.confidence ? schemeFitSummary.confidence * 100 : null,
  ]);

  const projection = evaluation.projection || "Draftable Grade";
  const risk = evaluation.risk || "Pending";
  const recommendation = getRecommendation(projection, risk);

  const headline =
    projection !== "Draftable Grade"
      ? `${projection} Prospect`
      : "Draftable Prospect";

  const traitText = topTrait
    ? `His strongest current trait is ${formatLabel(topTrait[0])} with a score of ${topTrait[1]}.`
    : "The trait profile is still being finalized.";

  const athleticText = athleticScores.overallAthleticScore
    ? `Athletic profile checks in at ${athleticScores.overallAthleticScore}.`
    : "Athletic profile is still being finalized.";

  const footballIQText = footballIQScores.overallFootballIQ
    ? `Football IQ profile checks in at ${footballIQScores.overallFootballIQ}.`
    : "Football IQ profile is still being finalized.";

  const productionText = productionScores.overallProductionScore
    ? `Production profile checks in at ${productionScores.overallProductionScore}.`
    : "Production profile is still being finalized.";

  const schemeFitText = schemeScore
    ? `Scheme fit profile checks in at ${schemeScore}.`
    : "Scheme fit profile is still being finalized.";

  const summary =
    evaluation.executiveSummary ||
    evaluation.scoutingNotes ||
    evaluationSummary?.summary ||
    `${traitText} ${athleticText} ${footballIQText} ${productionText} ${schemeFitText}`;

  return {
    headline,
    recommendation,
    confidence: getConfidenceLabel(confidenceScore),
    risk,
    intelligenceScore,
    summary,
    supportingSignals: {
      topTrait: topTrait
        ? {
            label: formatLabel(topTrait[0]),
            value: topTrait[1],
          }
        : null,
      athleticScore: athleticScores.overallAthleticScore || null,
      footballIQScore: footballIQScores.overallFootballIQ || null,
      productionScore: productionScores.overallProductionScore || null,
      schemeFitScore: schemeScore,
    },
  };
}

export default {
  buildExecutiveSummary,
};