export default function DashboardMetricCard({
  label,
  value,
  className = "",
}) {
  return (
    <div className={`dashboard_metric_card ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}