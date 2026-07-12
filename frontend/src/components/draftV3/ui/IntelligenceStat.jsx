export default function IntelligenceStat({ label, value = "Pending" }) {
  return (
    <div className="intelligence_stat">
      <span className="intelligence_stat_label">{label}</span>
      <strong className="intelligence_stat_value">{value || "Pending"}</strong>
    </div>
  );
}