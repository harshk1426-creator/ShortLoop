const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function fmtMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[idx] ?? month} ${year}`;
}
