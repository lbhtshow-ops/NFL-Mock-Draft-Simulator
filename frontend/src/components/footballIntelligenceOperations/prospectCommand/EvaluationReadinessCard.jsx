export default function EvaluationReadinessCard({ readiness }) {
  const status = readiness?.status || "PENDING";
  const tone = status.toLowerCase().replaceAll(" ", "-");

  return (
    <section className="fio-command-card" aria-labelledby="fio-readiness-title">
      <h3 id="fio-readiness-title">Evaluation Readiness</h3>
      <div className={`fio-readiness-status fio-status--${tone}`}>
        <span>Status</span>
        <strong>{status}</strong>
      </div>
      {(readiness?.missingRequirements?.length > 0 ||
        readiness?.missingOptional?.length > 0) && (
        <div className="fio-readiness-details">
          {readiness.missingRequirements?.length > 0 && (
            <p>Missing requirements: {readiness.missingRequirements.join(", ")}</p>
          )}
          {readiness.missingOptional?.length > 0 && (
            <p>Missing optional: {readiness.missingOptional.join(", ")}</p>
          )}
        </div>
      )}
    </section>
  );
}
