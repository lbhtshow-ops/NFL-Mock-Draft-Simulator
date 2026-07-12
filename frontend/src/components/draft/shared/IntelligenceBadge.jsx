export default function IntelligenceBadge({ value = "Pending" }) {
  const normalized = String(value).toLowerCase();

  const badgeClass =
    normalized.includes("elite")
      ? "intelligence_badge elite"
      : normalized.includes("very good")
      ? "intelligence_badge very_good"
      : normalized.includes("average")
      ? "intelligence_badge average"
      : normalized.includes("developing")
      ? "intelligence_badge developing"
      : "intelligence_badge pending";

  return (
    <span className={badgeClass}>
      {value}
    </span>
  );
}