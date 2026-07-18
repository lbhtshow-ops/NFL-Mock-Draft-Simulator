const POSITION_OPTIONS = ["QB"];

export default function PositionSelector({ value, onChange }) {
  return (
    <div className="fio-command-field">
      <label htmlFor="fio-position-selector">Position</label>
      <select
        id="fio-position-selector"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {POSITION_OPTIONS.map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </select>
    </div>
  );
}
