import React, { useState, useEffect } from 'react';
import { Market } from './types';
import { fetchMarkets } from './services/polymarketApi';
import { Header } from './components/Header';
import { MarketCard } from './components/MarketCard';
import { MarketModal } from './components/MarketModal';
import { Leaderboard } from './components/Leaderboard';
import { TradeSimulator } from './components/TradeSimulator';
import { PortfolioTracker } from './components/PortfolioTracker';
import { ApiPlayground } from './components/ApiPlayground';
import { BtcBeatGame } from './components/BtcBeatGame';
import { WalletProvider } from './context/WalletContext';
import { Flame, ArrowUpDown, Filter, ShieldCheck, Cpu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'markets' | 'btc-beat' | 'leaderboard' | 'simulator' | 'portfolio' | 'sdk'>('markets');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'volume' | 'endDate'>('volume');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMarkets({ category: selectedCategory, query: searchQuery })
      .then(setMarkets)
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  // Sort markets
  const sortedMarkets = [...markets].sort((a, b) => {
    if (sortBy === 'volume') return b.volume - a.volume;
    if (sortBy === 'endDate') return (a.endDate || '').localeCompare(b.endDate || '');
    return 0;
  });

  return (
    <WalletProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          {activeTab === 'markets' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-slate-800 p-8 shadow-2xl">
                <div className="relative z-10 max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Real-time Decentralized Prediction Markets</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Polymarket Explorer & Python Trading Engine
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Track real-time probability contracts, inspect Central Limit Order Books (CLOB), simulate expected values, and test code snippets with the official Python SDK client.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('btc-beat')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                      <span>BTC 3M Beat (Live Ticks)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('simulator')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
                    >
                      Open Odds Calculator
                    </button>
                    <button
                      onClick={() => setActiveTab('sdk')}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    >
                      Python SDK Docs
                    </button>
                  </div>
                </div>
                <div className="absolute right-[-40px] top-[-40px] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100">
                    {selectedCategory === 'All' ? 'Trending Markets' : `${selectedCategory} Markets`}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {sortedMarkets.length}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <span className="text-slate-500 px-2 flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Sort:
                    </span>
                    <button
                      onClick={() => setSortBy('volume')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        sortBy === 'volume' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Volume
                    </button>
                    <button
                      onClick={() => setSortBy('endDate')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        sortBy === 'endDate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      End Date
                    </button>
                  </div>
                </div>
              </div>

              {/* Markets Grid */}
              {sortedMarkets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onSelect={setSelectedMarket}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-slate-300 font-medium">No markets found matching "{searchQuery}"</p>
                  <p className="text-xs text-slate-500">Try clearing the search query or selecting a different category.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'btc-beat' && <BtcBeatGame />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'simulator' && <TradeSimulator />}
          {activeTab === 'portfolio' && <PortfolioTracker />}
          {activeTab === 'sdk' && <ApiPlayground />}
        </main>

        {/* Market Modal */}
        {selectedMarket && (
          <MarketModal
            market={selectedMarket}
            onClose={() => setSelectedMarket(null)}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/60 mt-12 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Polygon Chain 137
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-4 h-4 text-blue-400" />
                CLOB Router v2 (0xe333...00Aa)
              </span>
              <span>•</span>
              <span>Gamma API</span>
            </div>

            <div className="flex items-center gap-3">
              <span>Package: <code className="text-slate-400 font-mono">polymarket-client</code></span>
              <span>•</span>
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                Polymarket.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}

export default App;
