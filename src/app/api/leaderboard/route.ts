import { NextResponse } from 'next/server';
import { AgentStockDB } from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = await AgentStockDB.getLeaderboard();
    return NextResponse.json({ success: true, leaderboard });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
