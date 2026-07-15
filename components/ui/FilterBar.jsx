'use client';

import { useEffect, useState } from 'react';
import { fmtMonth } from '@/lib/format';

export default function FilterBar({
  months = [],
  selected = [],
  onChange,
  onClear,
  statusText,
}) {
  const [pending, setPending] = useState(selected);

  useEffect(() => {
    setPending(selected);
  }, [selected]);

  function toggleMonth(month) {
    setPending((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  }

  function handleApply() {
    onChange?.(pending);
  }

  function handleClear() {
    setPending([]);
    onClear?.();
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-sl-card border border-sl-border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      style={{ backgroundColor: 'var(--sl-filterbar-bg)' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.07em] text-sl-muted">
          Period
        </span>
        <div className="flex flex-wrap gap-2">
          {months.map((month) => {
            const isSelected = pending.includes(month);
            return (
              <button
                key={month}
                type="button"
                onClick={() => toggleMonth(month)}
                aria-pressed={isSelected}
                className={`rounded-sl-pill border px-2.5 py-1 text-xs transition-colors ${
                  isSelected
                    ? 'border-sl-purple bg-sl-purple text-white'
                    : 'border-transparent bg-sl-purple-light text-sl-purple'
                }`}
              >
                {fmtMonth(month)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-sl-button bg-sl-purple px-4 py-2 text-xs font-semibold text-white"
        >
          Apply →
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-sl-button-secondary bg-sl-purple-light px-4 py-2 text-xs font-semibold text-sl-purple"
        >
          Clear
        </button>
        {statusText && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#059669] animate-pulse" aria-hidden="true" />
            <span className="whitespace-nowrap text-[11px] text-sl-muted">{statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
