-- Run this in Supabase SQL Editor

-- Create agents table
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  secondme_id TEXT UNIQUE,
  avatar TEXT,
  bio TEXT,
  cash REAL DEFAULT 100000,
  total_value REAL DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create positions table
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  shares INTEGER NOT NULL,
  avg_cost REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, symbol)
);

-- Create trades table
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  shares INTEGER NOT NULL,
  price REAL NOT NULL,
  total REAL NOT NULL,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_cache table
CREATE TABLE stock_cache (
  symbol TEXT PRIMARY KEY,
  price REAL NOT NULL,
  change REAL DEFAULT 0,
  change_percent REAL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_positions_agent ON positions(agent_id);
CREATE INDEX idx_trades_agent ON trades(agent_id);
CREATE INDEX idx_agents_value ON agents(total_value DESC);
CREATE INDEX idx_trades_created ON trades(created_at DESC);
