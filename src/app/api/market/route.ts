import { NextResponse } from 'next/server';
import { getAvailableStocks } from '@/lib/market';

export async function GET() {
  try {
    // Optionally refresh prices (would be done by cron in production)
    // await refreshAllStockPrices();
    
    const stocks = getAvailableStocks();
    return NextResponse.json({ success: true, stocks });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}
