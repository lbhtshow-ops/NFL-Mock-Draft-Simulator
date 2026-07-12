import "./intelligence-indicator.css";

export default function IntelligenceIndicator({
  value = 0,
  label,
  max = 100,
  inverse = false,
  size = "md",
  showValue = true,
  showScale = true,
}) {
  const safeMax = max || 100;
  const rawScore = Number(value) || 0;
  const percentage = Math.max(0, Math.min(100, (rawScore / safeMax) * 100));

  const getScoreColor = (score) => {
  if (score >= 95) return "#16a34a"; // Elite Green
  if (score >= 90) return "#22c55e"; // Green
  if (score >= 85) return "#86efac"; // Light Green
  if (score >= 80) return "#a3e635"; // Yellow-Green
  if (score >= 70) return "#facc15"; // Gold
  if (score >= 60) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

const getInverseColor = (score) => {
  if (score >= 90) return "#ef4444"; // Critical Need
  if (score >= 80) return "#f97316"; // High Need
  if (score >= 70) return "#facc15"; // Moderate Need
  if (score >= 60) return "#a3e635"; // Low Need
  return "#22c55e"; // Minimal Need
};

  const indicatorColor = inverse
    ? getInverseColor(percentage)
    : getScoreColor(percentage);

  return (
    <div
      className={`intelligence_indicator intelligence_indicator_${size}`}
      style={{ "--indicator-color": indicatorColor }}
    >
      <div className="intelligence_meter_track">
        <div
          className="intelligence_meter_fill"
          style={{ width: `${percentage}%` }}
        >
          {showValue && <span>{rawScore}</span>}
        </div>
      </div>

      {showScale && (
        <small>
          {label ?? `${rawScore}/${safeMax}`}
        </small>
      )}
    </div>
  );
}