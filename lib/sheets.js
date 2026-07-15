const SHEET_ID_ENV = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

function extractSheetId(raw) {
  if (!raw) return raw;
  const match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : raw.trim();
}

function parseDuration(value) {
  if (!value) return 0;
  const parts = value.toString().split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return parts[0] || 0;
}

function parseRevenue(value) {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseMonth(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? '';
    });
    if ('Call Duration' in obj) {
      obj.duration_secs = parseDuration(obj['Call Duration']);
    }
    if ('Estimated Revenue' in obj) {
      obj.revenue = parseRevenue(obj['Estimated Revenue']);
    }
    if ('Date' in obj) {
      obj.month = parseMonth(obj['Date']);
    }
    return obj;
  });
}

const SHEET_TAB = 'shortloop_agent_performance_data';

export async function getSheetData() {
  if (!SHEET_ID_ENV || !API_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_GOOGLE_SHEET_ID or NEXT_PUBLIC_GOOGLE_API_KEY environment variable.'
    );
  }

  const sheetId = extractSheetId(SHEET_ID_ENV);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${SHEET_TAB}!A:Z?key=${API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to fetch sheet data: ${res.status} ${res.statusText} ${body}`);
  }

  const json = await res.json();
  return rowsToObjects(json.values);
}
