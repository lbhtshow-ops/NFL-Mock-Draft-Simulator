const ITEMS = [
  ["included", "Included", "Applied to the authoritative aggregation."],
  ["excluded", "Excluded", "Not included by authoritative aggregation metadata."],
  ["required", "Required", "Required component for this position model."],
  ["critical", "Critical", "Critical component for model availability."],
  ["unavailable", "Unavailable", "No available component result."],
];

export default function ComponentBreakdownLegend() {
  return (
    <div className="fio-component-legend" aria-label="Component status legend">
      {ITEMS.map(([tone, label, description]) => (
        <span key={tone} title={description}>
          <i className={`fio-component-legend__marker fio-component-legend__marker--${tone}`} />
          <strong>{label}</strong>
        </span>
      ))}
    </div>
  );
}
