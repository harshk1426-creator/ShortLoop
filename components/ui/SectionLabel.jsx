export default function SectionLabel({ children }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] text-sl-muted">
        {children}
      </span>
      <span className="h-px flex-1 bg-sl-border" aria-hidden="true" />
    </div>
  );
}
