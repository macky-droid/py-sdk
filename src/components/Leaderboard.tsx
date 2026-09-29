import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Trade } from '../types';
import { fetchLeaderboard, fetchRecentTrades } from '../services/polymarketApi';
import { Trophy, TrendingUp, CheckCircle, Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchRecentTrades()])
      .then(([lb, tr]) => {
        setLeaderboard(lb);
        setTrades(tr);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-slate-100">Polymarket Leaderboard & Live Trades</h1>
        </div>
        <p className="text-sm text-slate-400">
          Rankings of the top-performing prediction market traders and real-time execution flow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leaderboard Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Top Profit Traders</h3>
            <span className="text-xs text-slate-400">Updated in real-time</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4 text-right">Profit / Loss</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold">
                      {entry.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 inline-flex items-center justify-center border border-amber-400/40">
                          1
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 inline-flex items-center justify-center border border-slate-300/40">
                          2
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 inline-flex items-center justify-center border border-amber-700/40">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono ml-2">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          {entry.name || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                          {entry.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">{entry.address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-400 text-sm">
                        +${(entry.pnl / 1_000_000).toFixed(2)}M
                      </span>
                      <div className="text-[10px] text-emerald-500 font-medium">+{entry.pnlPercent}%</div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                      ${(entry.volume / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                        {entry.winRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Trades Stream (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Trades Feed</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">Live CLOB</span>
          </div>

          <div className="p-4 divide-y divide-slate-800/80 space-y-3 overflow-y-auto max-h-[500px]">
            {trades.map((tr) => (
              <div key={tr.id} className="pt-3 first:pt-0 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      tr.side === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tr.side === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {tr.side} {tr.outcome}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tr.timestamp}
                  </span>
                </div>

                <p className="font-medium text-slate-200 text-xs leading-snug line-clamp-1 mb-1.5">
                  {tr.marketTitle}
                </p>

                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span>
                    {tr.size.toLocaleString()} shares @ <strong className="text-slate-200">${tr.price.toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-200 font-semibold">${tr.usdValue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
