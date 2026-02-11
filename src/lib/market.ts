import { AgentStockDB } from './db';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';

// Popular stocks for the competition
export const AVAILABLE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'ROKU', name: 'Roku Inc.' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'ZM', name: 'Zoom Video Communications' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
];

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // Check cache first (refresh every 15 minutes)
    const cached = await AgentStockDB.getStock(symbol);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 15 * 60 * 1000) { // 15 minutes
        return {
          symbol: cached.symbol,
          price: cached.price,
          change: cached.change,
          changePercent: cached.change_percent,
          volume: 0,
          lastUpdated: cached.updated_at
        };
      }
    }

    // Fetch from Polygon.io
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Polygon API error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      // Polygon returns: o (open), h (high), l (low), c (close), v (volume), vw (vwap)
      const price = result.c;
      const open = result.o;
      const change = price - open;
      const changePercent = (change / open) * 100;
      const volume = result.v;

      // Cache the result
      await AgentStockDB.cacheStock(symbol, price, change, changePercent);

      return {
        symbol,
        price,
        change,
        changePercent,
        volume,
        lastUpdated: new Date().toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

export async function refreshAllStockPrices(): Promise<void> {
  for (const stock of AVAILABLE_STOCKS) {
    await fetchStockQuote(stock.symbol);
    // Small delay to respect rate limits (5 calls/minute = 1 call every 12 seconds)
    await new Promise(resolve => setTimeout(resolve, 12000));
  }
}

export async function getAvailableStocks(): Promise<Array<{ symbol: string; name: string; price?: number; change?: number; change_percent?: number }>> {
  const stocks = await AgentStockDB.getAllStocks();
  return AVAILABLE_STOCKS.map(stock => {
    const cached = stocks.find(s => s.symbol === stock.symbol);
    return {
      ...stock,
      price: cached?.price,
      change: cached?.change,
      change_percent: cached?.change_percent
    };
  });
}
