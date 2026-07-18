import { formatHighlight } from "./evaluationSummaryFormatters.js";

function HighlightList({ title, items, limit, fallback }) {
  const displayed = Array.isArray(items) ? items.slice(0, limit) : [];

  return (
    <section className="fio-summary-highlight-group">
      <h3>{title}</h3>
      {displayed.length ? (
        <ul>
          {displayed.map((item, index) => (
            <li key={`${formatHighlight(item)}-${index}`}>{formatHighlight(item)}</li>
          ))}
        </ul>
      ) : (
        <p>{fallback}</p>
      )}
    </section>
  );
}

export default function EvaluationHighlights({ explanation = {}, conclusions = {} }) {
  return (
    <div className="fio-summary-highlights">
      <HighlightList
        title="Key Strengths"
        items={explanation.strengths}
        limit={3}
        fallback="No high-confidence strengths established."
      />
      <HighlightList
        title="Primary Concerns"
        items={explanation.concerns}
        limit={3}
        fallback="No primary concerns established."
      />
      <HighlightList
        title="Development Priorities"
        items={conclusions.developmentPriorities}
        limit={4}
        fallback="No development priorities established."
      />
      {Array.isArray(explanation.contextualFactors) &&
        explanation.contextualFactors.length > 0 && (
          <HighlightList
            title="Contextual Factors"
            items={explanation.contextualFactors}
            limit={2}
            fallback=""
          />
        )}
    </div>
  );
}
