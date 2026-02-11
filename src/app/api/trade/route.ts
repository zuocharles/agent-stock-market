import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buyStock, sellStock } from '@/lib/trading';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const sessionAgentId = cookieStore.get('agent_id')?.value;
    
    const body = await request.json();
    const { agentId, symbol, shares, type, rationale } = body;

    if (!sessionAgentId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionAgentId !== agentId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!agentId || !symbol || !shares || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    if (type === 'buy') {
      result = await buyStock(agentId, symbol, shares, rationale);
    } else if (type === 'sell') {
      result = await sellStock(agentId, symbol, shares, rationale);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid trade type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Trade failed' }, { status: 500 });
  }
}
