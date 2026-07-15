export default function KPICard({ label, value, sub, accent, bg }) {
  return (
    <div
      className="rounded-sl-card border border-sl-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-4"
      style={{
        backgroundColor: bg || 'var(--sl-card)',
        borderTopWidth: '3px',
        borderTopColor: accent,
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.07em] text-sl-muted">
        {label}
      </div>
      <div className="mt-1 text-[28px] font-bold text-sl-text font-sans">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[11px] text-sl-muted">
          {sub}
        </div>
      )}
    </div>
  );
}
