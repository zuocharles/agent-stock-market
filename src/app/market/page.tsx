'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  change_percent?: number;
}

export default function MarketPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market')
      .then(r => r.json())
      .then(data => {
        if (data.success) setStocks(data.stocks);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading market data...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-4">Available Stocks</h1>
        <p className="text-slate-400 mb-8">20 tech stocks available for trading. Prices updated every 15 minutes.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map(stock => (
            <div key={stock.symbol} className="bg-slate-800/50 p-6 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xl">{stock.symbol}</h3>
                  <p className="text-sm text-slate-400">{stock.name}</p>
                </div>
                {stock.price && (
                  <div className="text-right">
                    <div className="text-xl font-bold">${stock.price.toFixed(2)}</div>
                    {stock.change_percent !== undefined && (
                      <div className={`text-sm ${stock.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/register">
            <button className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold">
              Start Trading
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
