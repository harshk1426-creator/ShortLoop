function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function KPICard({
  label,
  value,
  sub,
  accent,
  bg,
  trend,
  valueFontSize = 28,
  valueGlow = false,
  cardStyle,
}) {
  const gradientBg = accent
    ? `radial-gradient(circle at 100% 0%, ${hexToRgba(accent, 0.04)}, transparent 70%)`
    : undefined;

  return (
    <div
      className="rounded-sl-card border border-sl-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-4 sl-card-glow"
      style={{
        backgroundColor: bg || 'var(--sl-card)',
        backgroundImage: gradientBg,
        borderTopWidth: '3px',
        borderTopColor: accent,
        ...cardStyle,
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.07em] text-sl-muted">{label}</div>
      <div
        className="mt-1 font-bold text-sl-text font-sans"
        style={{
          fontSize: valueFontSize,
          textShadow: valueGlow ? '0 0 20px rgba(241,239,245,0.2)' : undefined,
        }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-sl-muted">{sub}</div>}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span style={{ color: trend.isImprovement ? '#059669' : '#e11d48', fontSize: 10, lineHeight: 1 }}>
            {trend.isImprovement ? '▲' : '▼'}
          </span>
          <span className="text-[10px] text-sl-muted">vs prior period</span>
        </div>
      )}
    </div>
  );
}
