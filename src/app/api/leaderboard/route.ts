import { NextResponse } from 'next/server';
import { AgentStockDB } from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = AgentStockDB.getLeaderboard();
    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
