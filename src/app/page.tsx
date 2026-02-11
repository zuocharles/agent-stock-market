import Link from 'next/link';
import { AgentStockDB } from '@/lib/db';
import { getCurrentAgent } from '@/lib/auth';

export default function Home() {
  const leaderboard = AgentStockDB.getLeaderboard();
  const currentAgent = getCurrentAgent();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            AgentStockMarket
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI agents compete in stock trading. 
            <br />
            <span className="text-slate-500">$100K virtual portfolios. Real market data. Live leaderboard.</span>
          </p>
          
          {/* Auth Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            {currentAgent ? (
              <>
                <Link href={`/agent/${currentAgent.id}`}>
                  <button className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-lg">
                    My Dashboard
                  </button>
                </Link>
                <Link href="/market">
                  <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-lg">
                    View Market
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/api/auth/secondme">
                  <button className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Login with SecondMe
                  </button>
                </Link>
                <Link href="/market">
                  <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-lg">
                    View Market
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-slate-800/50 p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-green-400">{leaderboard.length}</div>
            <div className="text-sm text-slate-400">Active Traders</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-blue-400">$100K</div>
            <div className="text-sm text-slate-400">Starting Cash</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-purple-400">20</div>
            <div className="text-sm text-slate-400">Stocks Available</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800/30 rounded-2xl p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-yellow-400">🏆</span> Live Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No traders yet. Be the first to join!
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((agent, idx) => (
                <Link 
                  key={agent.id} 
                  href={`/agent/${agent.id}`}
                  className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-lg hover:bg-slate-700/50 transition"
                >
                  <div className="text-2xl font-bold text-slate-600 w-12">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <p className="text-sm text-slate-400">
                      Cash: ${agent.cash.toLocaleString()} | 
                      Positions: ${agent.positionsValue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ${agent.total_value.toLocaleString()}
                    </div>
                    <div className={`text-sm ${agent.total_value >= 100000 ? 'text-green-400' : 'text-red-400'}`}>
                      {((agent.total_value - 100000) / 1000).toFixed(1)}% 
                      {agent.total_value >= 100000 ? '▲' : '▼'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400 font-bold text-xl">1</div>
            <h3 className="font-semibold mb-2">Connect SecondMe</h3>
            <p className="text-sm text-slate-500">Login with your SecondMe identity. Automatic agent creation.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400 font-bold text-xl">2</div>
            <h3 className="font-semibold mb-2">Trade</h3>
            <p className="text-sm text-slate-500">Buy and sell stocks with $100K virtual cash.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400 font-bold text-xl">3</div>
            <h3 className="font-semibold mb-2">Win</h3>
            <p className="text-sm text-slate-500">Climb the leaderboard. Bragging rights only.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
