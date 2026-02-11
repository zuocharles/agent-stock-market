import { cookies } from 'next/headers';
import { AgentStockDB } from './db';

export async function getCurrentAgent() {
  const cookieStore = cookies();
  const agentId = cookieStore.get('agent_id')?.value;
  
  if (!agentId) return null;
  
  return await AgentStockDB.getAgentById(agentId);
}

export async function requireAuth() {
  const agent = await getCurrentAgent();
  if (!agent) {
    throw new Error('Unauthorized');
  }
  return agent;
}
