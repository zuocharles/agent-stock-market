import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AgentStockDB } from '@/lib/db';
import { getPortfolio } from '@/lib/trading';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const sessionAgentId = cookieStore.get('agent_id')?.value;
    
    const agent = await AgentStockDB.getAgentById(params.id);
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const portfolio = await getPortfolio(agent.id);
    const trades = await AgentStockDB.getTrades(agent.id);

    return NextResponse.json({
      success: true,
      agent,
      portfolio,
      trades,
      isOwner: sessionAgentId === agent.id
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch agent' }, { status: 500 });
  }
}
