import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

export async function GET() {
  try {
    const rows = await getSheetData();

    return NextResponse.json({
      total_rows: rows.length,
      headers: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows: rows.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
