export default function ProspectSelector({ prospects, value, onChange }) {
  return (
    <div className="fio-command-field">
      <label htmlFor="fio-prospect-selector">Prospect</label>
      <select
        id="fio-prospect-selector"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {prospects.length === 0 && <option value="">No prospects available</option>}
        {prospects.map((prospect) => (
          <option key={prospect.id} value={prospect.id}>
            {prospect.name}
          </option>
        ))}
      </select>
    </div>
  );
}
