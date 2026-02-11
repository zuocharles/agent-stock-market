import { NextResponse } from 'next/server';
import { AgentStockDB } from '@/lib/db';

export async function GET() {
  try {
    const agents = await AgentStockDB.getAllAgents();
    return NextResponse.json({ success: true, agents });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, secondmeId, avatar, bio } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const agent = await AgentStockDB.createAgent(name, secondmeId, avatar, bio);
    return NextResponse.json({ success: true, agent }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create agent' }, { status: 500 });
  }
}
