import Link from 'next/link';

export default function Topbar({ variant = 'internal', dealerName }) {
  const isDealership = variant === 'dealership';
  const badgeLabel = isDealership ? 'Dealership View' : 'Internal';
  const switchHref = isDealership ? '/internal' : '/dealership';
  const switchLabel = isDealership ? 'Internal View' : 'Dealership View';

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between bg-sl-purple px-6 text-white">
      <div className="flex items-center gap-3">
        <span className="text-base font-bold tracking-tight font-sans">
          ShortLoop
        </span>
        <span className="rounded-sl-pill bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-white">
          {badgeLabel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isDealership && dealerName && (
          <span className="text-sm text-white/70">{dealerName}</span>
        )}
        <Link
          href={switchHref}
          className="rounded-sl-pill border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          {switchLabel} →
        </Link>
      </div>
    </header>
  );
}
