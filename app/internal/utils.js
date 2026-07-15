export function pctNum(successes, total) {
  if (!total) return 0;
  return (successes / total) * 100;
}

export function fmtSecs(seconds) {
  const total = Math.round(seconds || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtRevenue(number) {
  const n = number || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}
