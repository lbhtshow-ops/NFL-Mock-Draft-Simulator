const COVERAGE_LABELS = {
  production: "Production",
  footballIQ: "Football IQ",
  playerTraits: "Player Traits",
  athleticIntelligence: "Athletic Intelligence",
  schemeFit: "Scheme Fit",
};

export default function IntelligenceCoverageCard({ coverage, isRunning = false }) {
  return (
    <section className="fio-command-card" aria-labelledby="fio-coverage-title">
      <h3 id="fio-coverage-title">Intelligence Coverage</h3>
      <div className="fio-command-rows">
        {Object.entries(COVERAGE_LABELS).map(([key, label]) => {
          const status = isRunning ? "RUNNING" : coverage?.[key] || "PENDING";
          const tone = status.toLowerCase();
          return (
            <div className="fio-command-row" key={key}>
              <span>{label}</span>
              <strong className={`fio-status--${tone}`}>{status}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
