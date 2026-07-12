export default function MetricTile({
  label,
  value,
}) {
  return (
    <div className="metric_tile">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}