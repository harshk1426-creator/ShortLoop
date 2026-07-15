export default function ChartCard({ eyebrow, title, children }) {
  return (
    <div className="bg-sl-card rounded-sl-card border border-sl-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-[22px]">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.07em] text-sl-purple">
          {eyebrow}
        </div>
      )}
      {title && (
        <div className="mt-1 text-sm font-semibold text-sl-text">
          {title}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
