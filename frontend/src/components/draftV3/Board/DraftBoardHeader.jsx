export default function DraftBoardHeader({ searchTerm, onSearchChange }) {
  return (
    <div className="draft_board_header">
      <div>
        <p className="draft_section_label">BIG BOARD</p>

        <h2 className="draft_board_title">Available Prospects</h2>

        <p className="draft_board_subtitle">
          Scouting grades, tiers, projections, and draft actions.
        </p>
      </div>

      <div className="draft_board_search_wrap">
        <input
          className="draft_search"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search prospects..."
        />
      </div>
    </div>
  );
}