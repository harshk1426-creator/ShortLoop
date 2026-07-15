import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sl-bg flex flex-col font-sans">
      <header className="h-[60px] bg-sl-purple flex items-center px-6 shrink-0">
        <span className="text-base font-bold tracking-tight text-white">ShortLoop</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
        <div
          className="text-[96px] font-bold leading-none"
          style={{ color: 'var(--sl-purple)' }}
        >
          404
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-semibold text-sl-text">Page not found</p>
          <p className="text-sm text-sl-muted max-w-xs">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href="/internal"
            className="rounded-sl-button bg-sl-purple px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Internal Dashboard
          </Link>
          <Link
            href="/dealership"
            className="rounded-sl-button-secondary border border-sl-border px-5 py-2.5 text-sm font-semibold text-sl-text hover:bg-sl-purple-light transition-colors"
          >
            Dealership Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
