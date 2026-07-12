// src/engines/ExplainabilityEngine.js

function getScore(value) {
  return typeof value === "number" ? value : null;
}

function addScoreReason({
  reasons,
  label,
  score,
  eliteThreshold = 92,
  strongThreshold = 88,
  eliteText,
  strongText,
}) {
  if (score === null) return;

  if (score >= eliteThreshold) {
    reasons.push(eliteText);
  } else if (score >= strongThreshold) {
    reasons.push(strongText);
  }
}

export function explainDraftDecision({
  player,
  team,
  evaluation,
  fit,
  prospectIntelligence,
}) {
  const reasons = [];

  const intelligence = prospectIntelligence?.intelligence || {};

  const evaluationData = intelligence?.evaluation?.data || evaluation || {};
  const athleticScores = intelligence?.athletics?.data?.scores || {};
  const footballIQScores = intelligence?.footballIQ?.data?.scores || {};
  const productionScores =
    intelligence?.production?.data?.productionScores || {};
  const schemeFit = intelligence?.schemeFit?.data?.versatility || {};

  const overallGrade = getScore(
    evaluationData.overallGrade || evaluationData.grade
  );

  const athleticScore = getScore(athleticScores.overallAthleticScore);
  const footballIQScore = getScore(footballIQScores.overallFootballIQ);
  const productionScore = getScore(productionScores.overallProductionScore);
  const schemeFitScore = getScore(schemeFit.score);

  if (overallGrade !== null) {
    if (overallGrade >= 94) {
      reasons.push("Elite overall prospect grade.");
    } else if (overallGrade >= 90) {
      reasons.push("First-round caliber overall grade.");
    } else if (overallGrade >= 85) {
      reasons.push("Strong draftable prospect grade.");
    }
  }

  addScoreReason({
    reasons,
    label: "Athletic",
    score: athleticScore,
    eliteText: "Elite athletic profile supports the selection.",
    strongText: "Strong athletic profile adds value.",
  });

  addScoreReason({
    reasons,
    label: "Football IQ",
    score: footballIQScore,
    eliteText: "Elite football IQ improves projection confidence.",
    strongText: "Strong football IQ supports NFL translation.",
  });

  addScoreReason({
    reasons,
    label: "Production",
    score: productionScore,
    eliteText: "Elite production profile validates the grade.",
    strongText: "Strong production profile supports the evaluation.",
  });

  addScoreReason({
    reasons,
    label: "Scheme Fit",
    score: schemeFitScore,
    eliteText: "Excellent scheme fit for the projected NFL role.",
    strongText: "Positive scheme fit supports the decision.",
  });

  if (fit?.needMultiplier >= 1.3) {
    reasons.push("Addresses a major roster need.");
  } else if (fit?.needMultiplier >= 1.15) {
    reasons.push("Improves an important position.");
  }

  if (fit?.currentNeedMultiplier >= 1.14) {
    reasons.push("Matches current team context.");
  }

  if (fit?.positionPreferenceMultiplier >= 1.1) {
    reasons.push("Strong organizational fit.");
  }

  if (fit?.archetypeMultiplier > 1) {
    reasons.push("Fits the team's preferred player archetype.");
  }

  if (fit?.duplicatePositionMultiplier < 1) {
    reasons.push("Position overlap reduced the value slightly.");
  }

  if (reasons.length === 0) {
    reasons.push("Best overall value available.");
  }

  return {
    team: team?.name || "Unknown Team",
    player: player?.name || "Unknown Player",
    position: player?.position || "Unknown Position",
    confidence: calculateConfidence({
      evaluation: evaluationData,
      fit,
      athleticScore,
      footballIQScore,
      productionScore,
      schemeFitScore,
    }),
    reasons,
  };
}

function calculateConfidence({
  evaluation,
  fit,
  athleticScore,
  footballIQScore,
  productionScore,
  schemeFitScore,
}) {
  let confidence = 68;

  const overallGrade = evaluation?.overallGrade || evaluation?.grade;

  if (overallGrade) {
    confidence += Math.min(14, Math.max(0, overallGrade - 82));
  }

  [athleticScore, footballIQScore, productionScore, schemeFitScore].forEach(
    (score) => {
      if (typeof score !== "number") return;

      if (score >= 92) confidence += 3;
      else if (score >= 88) confidence += 2;
    }
  );

  if (fit?.needMultiplier >= 1.3) confidence += 5;
  if (fit?.currentNeedMultiplier >= 1.14) confidence += 4;
  if (fit?.positionPreferenceMultiplier >= 1.1) confidence += 3;
  if (fit?.archetypeMultiplier > 1) confidence += 2;

  return Math.min(99, Math.round(confidence));
}