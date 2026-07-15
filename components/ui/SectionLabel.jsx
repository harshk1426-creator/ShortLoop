export default function SectionLabel({ children }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span style={{ color: '#673D7D', fontSize: 10, lineHeight: 1 }} aria-hidden="true">■</span>
      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] text-sl-muted">
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: 'linear-gradient(to right, rgba(103,61,125,0.6), transparent)' }}
        aria-hidden="true"
      />
    </div>
  );
}
