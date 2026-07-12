import "./ui-library.css";

export default function InfoRow({
  label,
  value,
  accent = false,
}) {
  return (
    <div className="info_row">
      <span className="info_row_label">
        {label}
      </span>

      <strong
        className={`info_row_value ${
          accent ? "info_row_value--accent" : ""
        }`}
      >
        {value}
      </strong>
    </div>
  );
}