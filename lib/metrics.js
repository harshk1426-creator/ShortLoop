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

export function successRateByGroup(rows, field, groups) {
  return groups.map((group) => {
    const subset = rows.filter((r) => r[field] === group);
    const successes = subset.filter((r) => r.Success === 'Yes').length;
    return { name: group, value: pctNum(successes, subset.length) };
  });
}

// Averages transformFn(row) across each month in allMonths. A month is
// plotted as null (a gap) when it's excluded by selectedMonths or has no
// rows, so line charts always show the full timeline with only the
// selected months' data visible.
export function monthlyAvgTrend(rows, allMonths, selectedMonths, transformFn) {
  return allMonths.map((month) => {
    const included = selectedMonths.length === 0 || selectedMonths.includes(month);
    const monthRows = rows.filter((r) => r.month === month);
    if (!included || monthRows.length === 0) {
      return { month, value: null };
    }
    const avg = monthRows.reduce((acc, r) => acc + transformFn(r), 0) / monthRows.length;
    return { month, value: avg };
  });
}
