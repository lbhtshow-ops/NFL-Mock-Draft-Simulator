import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";

function DetailGrid({ items = [] }) {
  return (
    <div className="scouting_report_stat_grid">
      {items.map((item) => (
        <div key={item.label} className="scouting_detail_item">
          <span>{item.label}</span>
          <strong>{item.value || "Pending"}</strong>
        </div>
      ))}
    </div>
  );
}

function ScoutingList({ items = [], fallback = "Pending" }) {
  return (
    <ul>
      {items.length > 0 ? (
        items.map((item) => <li key={item}>{item}</li>)
      ) : (
        <li>{fallback}</li>
      )}
    </ul>
  );
}

export default function ScoutingReport({ player }) {
  const prospectIntelligence = buildProspectIntelligence(player);

  const bio = prospectIntelligence?.profile?.bio || {};
  const evaluationSummary =
    prospectIntelligence?.intelligence?.evaluation || {};
  const evaluation = evaluationSummary?.data || {};

  const playerName = bio.name || player?.name || "Selected Prospect";
  const position = bio.position || player?.position || "Position";
  const school = bio.school || player?.college || "School";

  return (
    <div className="scouting_report_v2">
      <section className="scouting_report_hero intelligence_hero">
        <div className="scouting_report_label">Executive Scouting Report</div>

        <h3>
          {player
            ? `${playerName} profiles as a ${position} prospect from ${school}.`
            : "Select a prospect to view the scouting report."}
        </h3>

        <p>
          {evaluation.scoutingNotes ||
            evaluationSummary.summary ||
            "This workspace will provide an NFL-style written scouting report with strengths, weaknesses, projection, role, and long-term outlook."}
        </p>
      </section>

      <section className="scouting_report_grid intelligence_grid_two">
        <section className="scouting_report_card intelligence_card">
          <div className="scouting_report_label">Player Synopsis</div>

          <DetailGrid
            items={[
              { label: "Position", value: position },
              { label: "School", value: school },
              { label: "Height", value: bio.height || player?.height || "--" },
              { label: "Weight", value: bio.weight || player?.weight || "--" },
            ]}
          />
        </section>

        <section className="scouting_report_card intelligence_card">
          <div className="scouting_report_label">Draft Projection</div>

          <DetailGrid
            items={[
              { label: "Expected Range", value: evaluation.projection },
              { label: "Ceiling", value: evaluation.ceiling },
              { label: "Floor", value: evaluation.floor },
              { label: "Risk", value: evaluation.risk },
            ]}
          />
        </section>

        <section className="scouting_report_card scouting_list_card warning intelligence_card">
          <div className="scouting_report_label">Development Areas</div>

          <ScoutingList
            items={evaluation.weaknesses || []}
            fallback="Scouting Engine Pending"
          />
        </section>

        <section className="scouting_report_card scouting_list_card intelligence_card">
          <div className="scouting_report_label">Strengths</div>

          <ScoutingList
            items={evaluation.strengths || []}
            fallback="Scouting Engine Pending"
          />
        </section>
      </section>

      <section className="scouting_report_role_grid intelligence_grid_two">
        <section className="scouting_report_card intelligence_card">
          <div className="scouting_report_label">Immediate NFL Role</div>

          <p>
            {evaluation.readiness && evaluation.readiness !== "Unknown"
              ? `${evaluation.readiness}. Best early usage: ${
                  (evaluation.bestSchemeFits || [])[0] || "role pending"
                }.`
              : "Year-one role projection will appear here once the Scouting Engine evaluates player readiness, positional value, and scheme translation."}
          </p>
        </section>

        <section className="scouting_report_card intelligence_card">
          <div className="scouting_report_label">Long-Term Projection</div>

          <p>
            {evaluation.developmentProjection &&
            evaluation.developmentProjection !== "Unknown"
              ? `${evaluation.developmentProjection}. Ceiling outcome: ${
                  evaluation.ceiling || "Pending"
                }. Floor outcome: ${evaluation.floor || "Pending"}.`
              : "Long-term player outcome, ceiling case, floor case, and development timeline will appear here."}
          </p>
        </section>
      </section>
    </div>
  );
}