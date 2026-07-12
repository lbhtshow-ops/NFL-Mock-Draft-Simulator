import "./ui-library.css";

export default function MetricTile({
  label,
  value,
  subtitle,
  color = "default",
}) {
  return (
    <div className={`metric_tile metric_tile--${color}`}>
      <span className="metric_tile_label">{label}</span>

      <strong className="metric_tile_value">
        {value}
      </strong>

      {subtitle && (
        <small className="metric_tile_subtitle">
          {subtitle}
        </small>
      )}
    </div>
  );
}