import Select from "react-select";

const SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    backgroundColor: "#0f1d30",
    borderColor: state.isFocused ? "rgba(104, 202, 190, .78)" : "rgba(148, 163, 184, .28)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(104, 202, 190, .12)" : "none",
    borderRadius: 8,
    cursor: "pointer",
    ":hover": { borderColor: "rgba(104, 202, 190, .58)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 12px" }),
  singleValue: (base) => ({ ...base, color: "#f8fafc", fontWeight: 800 }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontWeight: 700 }),
  input: (base) => ({ ...base, color: "#f8fafc" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#68cabe" : "#94a3b8",
    ":hover": { color: "#68cabe" },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "rgba(148, 163, 184, .22)" }),
  menuPortal: (base) => ({ ...base, zIndex: 1200 }),
  menu: (base) => ({
    ...base,
    zIndex: 1200,
    overflow: "hidden",
    backgroundColor: "#13243a",
    border: "1px solid rgba(148, 163, 184, .26)",
    borderRadius: 8,
    boxShadow: "0 16px 40px rgba(0,0,0,.42)",
  }),
  menuList: (base) => ({ ...base, padding: 4, backgroundColor: "#13243a" }),
  option: (base, state) => ({
    ...base,
    padding: "10px 12px",
    borderRadius: 6,
    backgroundColor: state.isSelected
      ? "rgba(104, 202, 190, .22)"
      : state.isFocused
        ? "rgba(104, 202, 190, .10)"
        : "#13243a",
    color: state.isSelected ? "#8ee3d9" : "#f8fafc",
    fontWeight: state.isSelected ? 850 : 700,
    cursor: "pointer",
    ":active": { backgroundColor: "rgba(104, 202, 190, .18)" },
  }),
  noOptionsMessage: (base) => ({ ...base, color: "#94a3b8", padding: "12px" }),
};

function assetLabel(pick, draftYear) {
  if (!pick?.draft_pick) return "Draft asset";
  if (pick.isFuturePick) return `${Number(draftYear || 0) + 1} Round ${pick.draft_pick.round}`;
  return `Round ${pick.draft_pick.round} · Pick ${pick.draft_pick.pick_number}`;
}

function AssetList({ eyebrow, team, assets, selected, onToggle, draftYear }) {
  return (
    <section className="trade-next-column">
      <div className="trade-next-team-header">
        <span>{eyebrow}</span>
        <h3>{team?.name || "Select a team"}</h3>
        <small>{assets.length} tradable assets · {selected.length} selected</small>
      </div>
      <div className="trade-next-assets">
        {assets.length ? assets.map((pick) => {
          const active = selected.includes(pick.id);
          return (
            <button
              key={pick.id}
              type="button"
              className={active ? "trade-next-asset active" : "trade-next-asset"}
              onClick={() => onToggle(pick.id)}
            >
              <span>{pick.isFuturePick ? "Future Pick" : "Draft Pick"}</span>
              <strong>{assetLabel(pick, draftYear)}</strong>
              <em>{active ? "Included" : "Add to offer"}</em>
            </button>
          );
        }) : <p className="trade-next-empty">No tradable draft assets available for {team?.name || "this team"}.</p>}
      </div>
    </section>
  );
}

export default function TradeOperationsCenter({
  draft,
  tradeTeam,
  tradePartner,
  yourTeamOptions,
  partnerOptions,
  yourAssets,
  partnerAssets,
  selectedYourAssets,
  selectedPartnerAssets,
  evaluation,
  onSelectYourTeam,
  onSelectPartner,
  onToggleYourAsset,
  onTogglePartnerAsset,
  onSubmit,
  onCancel,
}) {
  const difference = Number.isFinite(evaluation?.percentDifference)
    ? `${evaluation.percentDifference.toFixed(1)}%`
    : "--";

  const yourTeamValue = yourTeamOptions.find((option) => option.team?.id === tradeTeam?.id) || null;
  const partnerValue = partnerOptions.find((option) => option.team?.id === tradePartner?.id) || null;
  const hasYourTeam = Boolean(tradeTeam);
  const hasPartner = Boolean(tradePartner);

  return (
    <div className="trade-next-overlay" role="dialog" aria-modal="true" aria-label="Trade Operations Center">
      <div className="trade-next-shell">
        <header className="trade-next-header">
          <div>
            <span className="next-kicker">Trade Intelligence · Market Value Workspace</span>
            <h2>Trade Operations Center</h2>
            <p>Select your front office and a trade partner, choose draft assets, then review the current market-value evaluation.</p>
          </div>
          <button type="button" className="trade-next-close" onClick={onCancel}>Close</button>
        </header>

        <div className="trade-next-selectors">
          <label className="trade-next-selector-card">
            <span>Your Front Office</span>
            <Select
              aria-label="Your Front Office"
              options={yourTeamOptions}
              value={yourTeamValue}
              onChange={onSelectYourTeam}
              placeholder="Select your team"
              styles={SELECT_STYLES}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              noOptionsMessage={() => "No user-controlled teams available"}
            />
            <small>{hasYourTeam ? `${tradeTeam.name} assets are shown below.` : "Choose a team you control in this draft."}</small>
          </label>

          <div className="trade-next-versus" aria-hidden="true">⇄</div>

          <label className="trade-next-selector-card">
            <span>Trade Partner</span>
            <Select
              aria-label="Trade Partner"
              options={partnerOptions}
              value={partnerValue}
              onChange={onSelectPartner}
              placeholder="Select trade partner"
              styles={SELECT_STYLES}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              noOptionsMessage={() => "No eligible trade partners available"}
            />
            <small>{hasPartner ? `${tradePartner.name} assets are shown below.` : "Choose the NFL team you want to negotiate with."}</small>
          </label>
        </div>

        <div className="trade-next-summary" aria-label="Trade setup summary">
          <div><span>Your team</span><strong>{tradeTeam?.name || "Not selected"}</strong></div>
          <div><span>Trade partner</span><strong>{tradePartner?.name || "Not selected"}</strong></div>
          <div><span>Assets selected</span><strong>{selectedYourAssets.length} ⇄ {selectedPartnerAssets.length}</strong></div>
          <div><span>Evaluation</span><strong>{evaluation?.verdict || "Pending"}</strong></div>
        </div>

        <div className="trade-next-grid">
          <AssetList
            eyebrow="Your Front Office"
            team={tradeTeam}
            assets={yourAssets}
            selected={selectedYourAssets}
            onToggle={onToggleYourAsset}
            draftYear={draft?.year}
          />

          <section className="trade-next-intelligence">
            <span className="next-kicker">Decision Support</span>
            <h3>Trade Evaluation</h3>
            <div className="trade-next-verdict">
              <span>Current Verdict</span>
              <strong>{evaluation?.verdict || "Build an offer"}</strong>
            </div>
            <dl>
              <div><dt>Your Value</dt><dd>{evaluation?.userGivesValue?.toFixed?.(0) ?? "--"}</dd></div>
              <div><dt>Partner Value</dt><dd>{evaluation?.cpuGivesValue?.toFixed?.(0) ?? "--"}</dd></div>
              <div><dt>Value Difference</dt><dd>{difference}</dd></div>
              <div><dt>CPU Decision</dt><dd>{evaluation ? (evaluation.acceptedByCpu ? "Would accept" : "Would reject") : "Pending"}</dd></div>
            </dl>
            <div className="trade-next-intel-note">
              <strong>Current model</strong>
              <p>Market-value logic only. Draft Intelligence, team context, scarcity, leverage, and organizational philosophy will be connected in the Trade Intelligence sprint.</p>
            </div>
          </section>

          <AssetList
            eyebrow="Trade Partner"
            team={tradePartner}
            assets={partnerAssets}
            selected={selectedPartnerAssets}
            onToggle={onTogglePartnerAsset}
            draftYear={draft?.year}
          />
        </div>

        <footer className="trade-next-footer">
          <div className="trade-next-footer-copy">
            <strong>{evaluation ? evaluation.verdict : "Select assets from both teams"}</strong>
            <span>{evaluation ? `Market value difference: ${difference}` : "No trade is submitted until you confirm the proposal."}</span>
          </div>
          <div className="trade-next-footer-actions">
            <button type="button" className="trade-next-secondary" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className="trade-next-primary"
              onClick={onSubmit}
              disabled={!hasYourTeam || !hasPartner || !selectedYourAssets.length || !selectedPartnerAssets.length}
            >
              Submit Trade Proposal
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
