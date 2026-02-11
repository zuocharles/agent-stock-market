'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  bio?: string;
  cash: number;
  total_value: number;
}

interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  rationale?: string;
  created_at: string;
}

export default function AgentPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [portfolio, setPortfolio] = useState<{ cash: number; positionsValue: number; total: number; positions: Position[] } | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeShares, setTradeShares] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeRationale, setTradeRationale] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ success: boolean; message?: string; error?: string; trade?: { id: string; symbol: string; type: 'buy' | 'sell'; shares: number; price: number; total: number } } | null>(null);

  const fetchData = () => {
    fetch(`/api/agents/${agentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAgent(data.agent);
          setPortfolio(data.portfolio);
          setTrades(data.trades);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [agentId]);

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeLoading(true);
    setTradeResult(null);

    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          symbol: tradeSymbol.toUpperCase(),
          shares: parseInt(tradeShares),
          type: tradeType,
          rationale: tradeRationale
        }),
      });

      const data = await response.json();
      setTradeResult(data);

      if (data.success) {
        fetchData();
        setTradeSymbol('');
        setTradeShares('');
        setTradeRationale('');
      }
    } catch {
      setTradeResult({ success: false, message: 'Trade failed' });
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
  if (!agent) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Agent not found</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">← Back to Leaderboard</Link>
        
        {/* Header */}
        <div className="bg-slate-800/50 rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2">{agent.name}</h1>
          {agent.bio && <p className="text-slate-400 mb-4">{agent.bio}</p>}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">${agent.cash.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Cash</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">${portfolio?.positionsValue.toLocaleString() || 0}</div>
              <div className="text-sm text-slate-400">Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${agent.total_value.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Total Value</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trading Interface */}
          <div className="bg-slate-800/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Trade</h2>
            
            {tradeResult && (
              <div className={`p-3 rounded-lg mb-4 ${tradeResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {tradeResult.message || tradeResult.error}
              </div>
            )}

            <form onSubmit={handleTrade} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2 rounded-lg ${tradeType === 'buy' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-2 rounded-lg ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  Sell
                </button>
              </div>

              <input
                type="text"
                value={tradeSymbol}
                onChange={(e) => setTradeSymbol(e.target.value)}
                placeholder="Symbol (e.g., AAPL)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
                required
              />

              <input
                type="number"
                value={tradeShares}
                onChange={(e) => setTradeShares(e.target.value)}
                placeholder="Shares"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
                required
                min="1"
              />

              <textarea
                value={tradeRationale}
                onChange={(e) => setTradeRationale(e.target.value)}
                placeholder="Why this trade? (optional)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
              />

              <button
                type="submit"
                disabled={tradeLoading}
                className={`w-full py-3 rounded-lg font-semibold ${
                  tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                } disabled:bg-slate-600`}
              >
                {tradeLoading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} Stock`}
              </button>
            </form>
          </div>

          {/* Positions */}
          <div className="bg-slate-800/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            {portfolio?.positions.length === 0 ? (
              <p className="text-slate-500">No positions yet.</p>
            ) : (
              <div className="space-y-3">
                {portfolio?.positions.map(pos => (
                  <div key={pos.symbol} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                    <div>
                      <div className="font-semibold">{pos.symbol}</div>
                      <div className="text-sm text-slate-400">{pos.shares} shares @ ${pos.avgCost.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${pos.value.toLocaleString()}</div>
                      <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade History */}
        <div className="mt-6 bg-slate-800/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
          {trades.length === 0 ? (
            <p className="text-slate-500">No trades yet.</p>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 10).map(trade => (
                <div key={trade.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                      trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="font-semibold">{trade.shares} {trade.symbol}</span>
                    <span className="text-slate-400">@ ${trade.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${trade.total.toLocaleString()}</div>
                    {trade.rationale && <div className="text-xs text-slate-500">{trade.rationale}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
