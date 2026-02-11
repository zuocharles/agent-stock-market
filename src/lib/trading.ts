import { AgentStockDB } from './db';
import { fetchStockQuote } from './market';

const MIN_TRADE_AMOUNT = 1000; // Minimum $1,000 per trade

export interface TradeResult {
  success: boolean;
  message: string;
  trade?: {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    total: number;
  };
}

export async function buyStock(
  agentId: string, 
  symbol: string, 
  shares: number,
  rationale?: string
): Promise<TradeResult> {
  // Validate inputs
  if (!symbol || shares <= 0) {
    return { success: false, message: 'Invalid symbol or shares' };
  }

  // Get agent
  const agent = AgentStockDB.getAgentById(agentId);
  if (!agent) {
    return { success: false, message: 'Agent not found' };
  }

  // Get stock price
  const quote = await fetchStockQuote(symbol);
  if (!quote) {
    return { success: false, message: 'Unable to fetch stock price' };
  }

  // Calculate total cost
  const totalCost = shares * quote.price;

  // Check minimum trade amount
  if (totalCost < MIN_TRADE_AMOUNT) {
    return { 
      success: false, 
      message: `Trade must be at least $${MIN_TRADE_AMOUNT.toLocaleString()}` 
    };
  }

  // Check if agent has enough cash
  if (agent.cash < totalCost) {
    return { 
      success: false, 
      message: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${agent.cash.toFixed(2)}` 
    };
  }

  // Execute trade
  const trade = AgentStockDB.createTrade(agentId, symbol, 'buy', shares, quote.price, rationale);

  // Update or create position
  const existingPosition = AgentStockDB.getPosition(agentId, symbol);
  if (existingPosition) {
    const newShares = existingPosition.shares + shares;
    const _newAvgCost = ((existingPosition.shares * existingPosition.avg_cost) + totalCost) / newShares;
    AgentStockDB.updatePosition(existingPosition.id, newShares);
    // TODO: Update avg cost properly - currently not storing updated avg cost
  } else {
    AgentStockDB.createPosition(agentId, symbol, shares, quote.price);
  }

  // Update agent cash
  const newCash = agent.cash - totalCost;
  const portfolio = AgentStockDB.calculatePortfolioValue(agentId);
  AgentStockDB.updateAgentValue(agentId, newCash, portfolio.total);

  return {
    success: true,
    message: `Bought ${shares} shares of ${symbol} at $${quote.price.toFixed(2)}`,
    trade: {
      id: trade.id,
      symbol: trade.symbol,
      type: 'buy',
      shares: trade.shares,
      price: trade.price,
      total: trade.total
    }
  };
}

export async function sellStock(
  agentId: string, 
  symbol: string, 
  shares: number,
  rationale?: string
): Promise<TradeResult> {
  // Validate inputs
  if (!symbol || shares <= 0) {
    return { success: false, message: 'Invalid symbol or shares' };
  }

  // Get agent
  const agent = AgentStockDB.getAgentById(agentId);
  if (!agent) {
    return { success: false, message: 'Agent not found' };
  }

  // Check position
  const position = AgentStockDB.getPosition(agentId, symbol);
  if (!position || position.shares < shares) {
    return { success: false, message: `Insufficient shares. Own ${position?.shares || 0}, want to sell ${shares}` };
  }

  // Get stock price
  const quote = await fetchStockQuote(symbol);
  if (!quote) {
    return { success: false, message: 'Unable to fetch stock price' };
  }

  // Calculate proceeds
  const totalProceeds = shares * quote.price;

  // Execute trade
  const trade = AgentStockDB.createTrade(agentId, symbol, 'sell', shares, quote.price, rationale);

  // Update position
  const newShares = position.shares - shares;
  AgentStockDB.updatePosition(position.id, newShares);

  // Update agent cash
  const newCash = agent.cash + totalProceeds;
  const portfolio = AgentStockDB.calculatePortfolioValue(agentId);
  AgentStockDB.updateAgentValue(agentId, newCash, portfolio.total);

  return {
    success: true,
    message: `Sold ${shares} shares of ${symbol} at $${quote.price.toFixed(2)}`,
    trade: {
      id: trade.id,
      symbol: trade.symbol,
      type: 'sell',
      shares: trade.shares,
      price: trade.price,
      total: trade.total
    }
  };
}

export function getPortfolio(agentId: string): {
  cash: number;
  positionsValue: number;
  total: number;
  positions: Array<{
    symbol: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    pnl: number;
    pnlPercent: number;
  }>;
} {
  const agent = AgentStockDB.getAgentById(agentId);
  if (!agent) {
    return { cash: 0, positionsValue: 0, total: 0, positions: [] };
  }

  const positions = AgentStockDB.getPositions(agentId);
  const stocks = AgentStockDB.getAllStocks();

  let positionsValue = 0;
  const enrichedPositions = positions.map(pos => {
    const stock = stocks.find(s => s.symbol === pos.symbol);
    const currentPrice = stock?.price || pos.avg_cost;
    const value = pos.shares * currentPrice;
    const cost = pos.shares * pos.avg_cost;
    const pnl = value - cost;
    const pnlPercent = (pnl / cost) * 100;
    positionsValue += value;

    return {
      symbol: pos.symbol,
      shares: pos.shares,
      avgCost: pos.avg_cost,
      currentPrice,
      value,
      pnl,
      pnlPercent
    };
  });

  return {
    cash: agent.cash,
    positionsValue,
    total: agent.cash + positionsValue,
    positions: enrichedPositions
  };
}
