const positions = [
  "All",
  "QB",
  "RB",
  "WR",
  "TE",
  "OT",
  "IOL",
  "EDGE",
  "DL",
  "LB",
  "CB",
  "S",
];

const sortOptions = [
  { value: "grade-desc", label: "Grade ↓" },
  { value: "grade-asc", label: "Grade ↑" },
  { value: "player-asc", label: "Player A-Z" },
  { value: "player-desc", label: "Player Z-A" },
  { value: "rank-asc", label: "Rank" },
];

export default function DraftBoardFilters({
  positionFilter,
  onPositionChange,
  schoolFilter,
  onSchoolChange,
  schools = ["All"],
  tierFilter,
  onTierChange,
  tiers = ["All"],
  sortOption,
  onSortChange,
  onClearFilters,
}) {
  return (
    <div className="draft_board_filters">
      <div className="draft_board_filters_group">
      <select
        className="draft_filter_button"
        value={positionFilter}
        onChange={(event) => onPositionChange(event.target.value)}
      >
        {positions.map((position) => (
          <option key={position} value={position}>
            {position === "All" ? "All Positions" : position}
          </option>
        ))}
      </select>

      <select
        className="draft_filter_button"
        value={schoolFilter}
        onChange={(event) => onSchoolChange(event.target.value)}
      >
        {schools.map((school) => (
          <option key={school} value={school}>
            {school === "All" ? "All Schools" : school}
          </option>
        ))}
      </select>

      <select
        className="draft_filter_button"
        value={tierFilter}
        onChange={(event) => onTierChange(event.target.value)}
      >
        {tiers.map((tier) => (
          <option key={tier} value={tier}>
            {tier === "All" ? "All Tiers" : tier}
          </option>
        ))}
      </select>

      <select
        className="draft_filter_button"
        value={sortOption}
        onChange={(event) => onSortChange(event.target.value)}
      >
        {sortOptions.map((sort) => (
          <option key={sort.value} value={sort.value}>
            Sort: {sort.label}
          </option>
        ))}
      </select>
</div>

      <button
        className="draft_filter_clear"
        type="button"
        onClick={onClearFilters}
      >
        Clear
      </button>
    </div>
  );
}