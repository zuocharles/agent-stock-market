import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'agentstock.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    secondme_id TEXT UNIQUE,
    avatar TEXT,
    bio TEXT,
    cash REAL DEFAULT 100000,
    total_value REAL DEFAULT 100000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    shares INTEGER NOT NULL,
    avg_cost REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE(agent_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    shares INTEGER NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    rationale TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stock_cache (
    symbol TEXT PRIMARY KEY,
    price REAL NOT NULL,
    change REAL DEFAULT 0,
    change_percent REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_positions_agent ON positions(agent_id);
  CREATE INDEX IF NOT EXISTS idx_trades_agent ON trades(agent_id);
  CREATE INDEX IF NOT EXISTS idx_agents_value ON agents(total_value DESC);
`);

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
  static createAgent(name: string, secondmeId?: string, avatar?: string, bio?: string): Agent {
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO agents (id, name, secondme_id, avatar, bio, cash, total_value)
      VALUES (?, ?, ?, ?, ?, 100000, 100000)
    `);
    stmt.run(id, name, secondmeId || null, avatar || null, bio || null);
    return { id, name, secondme_id: secondmeId, avatar, bio, cash: 100000, total_value: 100000, created_at: new Date().toISOString() };
  }

  static getAgentById(id: string): Agent | null {
    const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
    return stmt.get(id) as Agent | null;
  }

  static getAgentBySecondMeId(secondmeId: string): Agent | null {
    const stmt = db.prepare('SELECT * FROM agents WHERE secondme_id = ?');
    return stmt.get(secondmeId) as Agent | null;
  }

  static getAllAgents(): Agent[] {
    const stmt = db.prepare('SELECT * FROM agents ORDER BY total_value DESC');
    return stmt.all() as Agent[];
  }

  static updateAgentValue(id: string, cash: number, totalValue: number): void {
    const stmt = db.prepare('UPDATE agents SET cash = ?, total_value = ? WHERE id = ?');
    stmt.run(cash, totalValue, id);
  }

  // Positions
  static getPositions(agentId: string): Position[] {
    const stmt = db.prepare('SELECT * FROM positions WHERE agent_id = ?');
    return stmt.all(agentId) as Position[];
  }

  static getPosition(agentId: string, symbol: string): Position | null {
    const stmt = db.prepare('SELECT * FROM positions WHERE agent_id = ? AND symbol = ?');
    return stmt.get(agentId, symbol) as Position | null;
  }

  static createPosition(agentId: string, symbol: string, shares: number, avgCost: number): Position {
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO positions (id, agent_id, symbol, shares, avg_cost)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, agentId, symbol, shares, avgCost);
    return { id, agent_id: agentId, symbol, shares, avg_cost: avgCost, created_at: new Date().toISOString() };
  }

  static updatePosition(id: string, shares: number): void {
    if (shares <= 0) {
      const stmt = db.prepare('DELETE FROM positions WHERE id = ?');
      stmt.run(id);
    } else {
      const stmt = db.prepare('UPDATE positions SET shares = ? WHERE id = ?');
      stmt.run(shares, id);
    }
  }

  // Trades
  static createTrade(agentId: string, symbol: string, type: 'buy' | 'sell', shares: number, price: number, rationale?: string): Trade {
    const id = randomUUID();
    const total = shares * price;
    const stmt = db.prepare(`
      INSERT INTO trades (id, agent_id, symbol, type, shares, price, total, rationale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, agentId, symbol, type, shares, price, total, rationale || null);
    return { id, agent_id: agentId, symbol, type, shares, price, total, rationale, created_at: new Date().toISOString() };
  }

  static getTrades(agentId: string): Trade[] {
    const stmt = db.prepare('SELECT * FROM trades WHERE agent_id = ? ORDER BY created_at DESC');
    return stmt.all(agentId) as Trade[];
  }

  static getRecentTrades(limit: number = 20): Trade[] {
    const stmt = db.prepare(`
      SELECT t.*, a.name as agent_name FROM trades t
      JOIN agents a ON t.agent_id = a.id
      ORDER BY t.created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as Trade[];
  }

  // Stock cache
  static cacheStock(symbol: string, price: number, change: number, changePercent: number): void {
    const stmt = db.prepare(`
      INSERT INTO stock_cache (symbol, price, change, change_percent, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(symbol) DO UPDATE SET
        price = excluded.price,
        change = excluded.change,
        change_percent = excluded.change_percent,
        updated_at = excluded.updated_at
    `);
    stmt.run(symbol, price, change, changePercent);
  }

  static getStock(symbol: string): StockCache | null {
    const stmt = db.prepare('SELECT * FROM stock_cache WHERE symbol = ?');
    return stmt.get(symbol) as StockCache | null;
  }

  static getAllStocks(): StockCache[] {
    const stmt = db.prepare('SELECT * FROM stock_cache ORDER BY symbol');
    return stmt.all() as StockCache[];
  }

  // Calculate portfolio value
  static calculatePortfolioValue(agentId: string): { cash: number; positionsValue: number; total: number } {
    const agent = this.getAgentById(agentId);
    if (!agent) return { cash: 0, positionsValue: 0, total: 0 };

    const positions = this.getPositions(agentId);
    let positionsValue = 0;

    for (const pos of positions) {
      const stock = this.getStock(pos.symbol);
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
  static getLeaderboard(): Array<Agent & { positionsValue: number }> {
    const agents = this.getAllAgents();
    return agents.map(agent => {
      const calc = this.calculatePortfolioValue(agent.id);
      return { ...agent, positionsValue: calc.positionsValue };
    });
  }
}

export default db;
