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

export function successRateWithShare(rows, field, groups) {
  const total = rows.length;
  return groups.map((group) => {
    const subset = rows.filter((r) => r[field] === group);
    const successes = subset.filter((r) => r.Success === 'Yes').length;
    return {
      name: group,
      successRate: pctNum(successes, subset.length),
      callShare: pctNum(subset.length, total),
      totalCalls: subset.length,
    };
  });
}

export function computeKPITrend(rows, allMonths, selected, metricFn, higherIsBetter) {
  let currentRows, priorRows;

  if (selected.length > 0) {
    const sortedSelected = [...selected].sort();
    const firstIdx = allMonths.indexOf(sortedSelected[0]);
    const priorStart = Math.max(0, firstIdx - sortedSelected.length);
    const priorMonthSet = new Set(allMonths.slice(priorStart, firstIdx));
    const selectedSet = new Set(selected);
    currentRows = rows.filter((r) => selectedSet.has(r.month));
    priorRows = rows.filter((r) => priorMonthSet.has(r.month));
  } else {
    const rowMonths = [...new Set(rows.map((r) => r.month).filter(Boolean))].sort();
    const half = Math.floor(rowMonths.length / 2);
    if (half === 0) return null;
    const firstHalfSet = new Set(rowMonths.slice(0, half));
    const secondHalfSet = new Set(rowMonths.slice(half));
    priorRows = rows.filter((r) => firstHalfSet.has(r.month));
    currentRows = rows.filter((r) => secondHalfSet.has(r.month));
  }

  if (!currentRows.length || !priorRows.length) return null;

  const current = metricFn(currentRows);
  const prior = metricFn(priorRows);
  const delta = current - prior;

  if (Math.abs(delta) < 0.05) return null;

  return { delta, isImprovement: higherIsBetter ? delta > 0 : delta < 0 };
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
