import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Agent {
  id: string;
  name: string;
  secondme_id?: string;
  avatar?: string;
  bio?: string;
  cash: number;
  total_value: number;
  created_at: string;
}

export interface Position {
  id: string;
  agent_id: string;
  symbol: string;
  shares: number;
  avg_cost: number;
  created_at: string;
}

export interface Trade {
  id: string;
  agent_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  rationale?: string;
  created_at: string;
}

export interface StockCache {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  updated_at: string;
}

export class AgentStockDB {
  // Agent CRUD
  static async createAgent(name: string, secondmeId?: string, avatar?: string, bio?: string): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .insert([{ name, secondme_id: secondmeId, avatar, bio, cash: 100000, total_value: 100000 }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAgentById(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  static async getAgentBySecondMeId(secondmeId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('secondme_id', secondmeId)
      .single();
    
    if (error) return null;
    return data;
  }

  static async getAllAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('total_value', { ascending: false });
    
    if (error) return [];
    return data || [];
  }

  static async updateAgentValue(id: string, cash: number, totalValue: number): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .update({ cash, total_value: totalValue })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Positions
  static async getPositions(agentId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('agent_id', agentId);
    
    if (error) return [];
    return data || [];
  }

  static async getPosition(agentId: string, symbol: string): Promise<Position | null> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('symbol', symbol)
      .single();
    
    if (error) return null;
    return data;
  }

  static async createPosition(agentId: string, symbol: string, shares: number, avgCost: number): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .insert([{ agent_id: agentId, symbol, shares, avg_cost: avgCost }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePosition(id: string, shares: number): Promise<void> {
    if (shares <= 0) {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('positions')
        .update({ shares })
        .eq('id', id);
      if (error) throw error;
    }
  }

  static async updatePositionWithCost(id: string, shares: number, avgCost: number): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .update({ shares, avg_cost: avgCost })
      .eq('id', id);
    if (error) throw error;
  }

  // Trades
  static async createTrade(agentId: string, symbol: string, type: 'buy' | 'sell', shares: number, price: number, rationale?: string): Promise<Trade> {
    const total = shares * price;
    const { data, error } = await supabase
      .from('trades')
      .insert([{ agent_id: agentId, symbol, type, shares, price, total, rationale }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTrades(agentId: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  }

  static async getRecentTrades(limit: number = 20): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*, agents(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return data || [];
  }

  // Stock cache
  static async cacheStock(symbol: string, price: number, change: number, changePercent: number): Promise<void> {
    const { error } = await supabase
      .from('stock_cache')
      .upsert([{ symbol, price, change, change_percent: changePercent, updated_at: new Date().toISOString() }]);
    
    if (error) throw error;
  }

  static async getStock(symbol: string): Promise<StockCache | null> {
    const { data, error } = await supabase
      .from('stock_cache')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (error) return null;
    return data;
  }

  static async getAllStocks(): Promise<StockCache[]> {
    const { data, error } = await supabase
      .from('stock_cache')
      .select('*')
      .order('symbol');
    
    if (error) return [];
    return data || [];
  }

  // Calculate portfolio value
  static async calculatePortfolioValue(agentId: string): Promise<{ cash: number; positionsValue: number; total: number }> {
    const agent = await this.getAgentById(agentId);
    if (!agent) return { cash: 0, positionsValue: 0, total: 0 };

    const positions = await this.getPositions(agentId);
    let positionsValue = 0;

    for (const pos of positions) {
      const stock = await this.getStock(pos.symbol);
      if (stock) {
        positionsValue += pos.shares * stock.price;
      }
    }

    return {
      cash: agent.cash,
      positionsValue,
      total: agent.cash + positionsValue
    };
  }

  // Leaderboard
  static async getLeaderboard(): Promise<Array<Agent & { positionsValue: number }>> {
    const agents = await this.getAllAgents();
    const results = await Promise.all(
      agents.map(async (agent) => {
        const calc = await this.calculatePortfolioValue(agent.id);
        return { ...agent, positionsValue: calc.positionsValue };
      })
    );
    return results;
  }
}
