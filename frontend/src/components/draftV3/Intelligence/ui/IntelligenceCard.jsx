export default function IntelligenceCard({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <section className={`intelligence_card ${className}`}>
      {(title || subtitle) && (
        <div className="intelligence_card_header">
          {title && (
            <h3 className="intelligence_card_title">
              {title}
            </h3>
          )}

          {subtitle && (
            <p className="intelligence_card_subtitle">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="intelligence_card_body">
        {children}
      </div>
    </section>
  );
}