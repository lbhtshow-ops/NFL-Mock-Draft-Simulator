function IdentityRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="fio-command-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ProspectIdentityCard({ prospect }) {
  return (
    <section className="fio-command-card" aria-labelledby="fio-identity-title">
      <h3 id="fio-identity-title">Player Identity</h3>
      {prospect ? (
        <div className="fio-command-rows">
          <IdentityRow label="Player ID" value={prospect.id} />
          <IdentityRow label="School" value={prospect.school} />
          <IdentityRow label="Position" value={prospect.position} />
          <IdentityRow label="Draft Class" value={prospect.draftClass} />
        </div>
      ) : (
        <p className="fio-command-empty">Select a prospect to view identity.</p>
      )}
    </section>
  );
}
