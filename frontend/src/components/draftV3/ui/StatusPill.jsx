import "./ui-library.css";

export default function StatusPill({
  children,
  color = "default",
}) {
  return (
    <span className={`status_pill status_pill--${color}`}>
      {children}
    </span>
  );
}