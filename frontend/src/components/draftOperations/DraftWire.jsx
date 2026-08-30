import { useEffect, useMemo, useState } from "react";

function WireItem({ item, compact = false }) {
  return (
    <article className={`draft-wire-item is-${item.type} ${item.commercial ? "is-commercial" : ""}`}>
      <span className="draft-wire-label">{item.label}</span>
      <div className="draft-wire-copy">
        <strong>{item.headline}</strong>
        {!compact && item.detail ? <small>{item.detail}</small> : null}
      </div>
      {!compact && item.attribution ? <em>{item.attribution}</em> : null}
    </article>
  );
}

export default function DraftWire({ feed }) {
  const items = useMemo(() => feed?.items || [], [feed?.items]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setActiveIndex((current) => (items.length ? current % items.length : 0));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || expanded) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [items.length, expanded]);

  if (!items.length) return null;

  const activeItem = items[activeIndex] || items[0];

  return (
    <section className={`draft-wire ${expanded ? "is-expanded" : ""}`} aria-label="Draft Wire">
      <div className="draft-wire-brand">
        <span className="draft-wire-live-dot" aria-hidden="true" />
        <strong>Draft Wire</strong>
        <small>Draft-only intelligence</small>
      </div>

      <button
        type="button"
        className="draft-wire-active"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse Draft Wire" : "Expand Draft Wire"}
      >
        <WireItem item={activeItem} compact />
        <span className="draft-wire-expand">{expanded ? "Close" : "More"}</span>
      </button>

      <div className="draft-wire-dots" aria-label={`${items.length} Draft Wire items`}>
        {items.slice(0, 8).map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeIndex ? "active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show Draft Wire item ${index + 1}`}
          />
        ))}
      </div>

      {expanded ? (
        <div className="draft-wire-drawer">
          <div className="draft-wire-drawer-header">
            <div>
              <span>Live intelligence feed</span>
              <strong>NFL Draft only</strong>
            </div>
            <small>Prospects · teams · trades · rumors · quotes · LBHT · sponsors</small>
          </div>
          <div className="draft-wire-feed">
            {items.map((item) => <WireItem key={item.id} item={item} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
