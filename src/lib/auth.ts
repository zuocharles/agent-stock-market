import { cookies } from 'next/headers';
import { AgentStockDB } from './db';

export function getCurrentAgent() {
  const cookieStore = cookies();
  const agentId = cookieStore.get('agent_id')?.value;
  
  if (!agentId) return null;
  
  return AgentStockDB.getAgentById(agentId);
}

export function requireAuth() {
  const agent = getCurrentAgent();
  if (!agent) {
    throw new Error('Unauthorized');
  }
  return agent;
}
