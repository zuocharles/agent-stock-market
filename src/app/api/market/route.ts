import { NextResponse } from 'next/server';
import { getAvailableStocks } from '@/lib/market';

export async function GET() {
  try {
    const stocks = await getAvailableStocks();
    return NextResponse.json({ success: true, stocks });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}
